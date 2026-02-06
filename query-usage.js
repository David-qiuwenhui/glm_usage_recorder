#!/usr/bin/env node

/**
 * Usage query script.
 * Determines whether to call the Z.ai or ZHIPU endpoint based on ANTHROPIC_BASE_URL
 * and authenticates with ANTHROPIC_AUTH_TOKEN.
 */

import https from "https";

// Read environment variables
const baseUrl =
  process.env.ANTHROPIC_BASE_URL || "https://open.bigmodel.cn/api/anthropic";
const authToken =
  process.env.ANTHROPIC_AUTH_TOKEN ||
  "cfd7afd415aa433581b5d079bca1e46a.wgr8oGHYHEVKjY78";

if (!authToken) {
  console.error("Error: ANTHROPIC_AUTH_TOKEN is not set");
  console.error("");
  console.error("Set the environment variable and retry:");
  console.error('  export ANTHROPIC_AUTH_TOKEN="your-token-here"');
  process.exit(1);
}

// Validate ANTHROPIC_BASE_URL
if (!baseUrl) {
  console.error("Error: ANTHROPIC_BASE_URL is not set");
  console.error("");
  console.error("Set the environment variable and retry:");
  console.error('  export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"');
  console.error("  or");
  console.error(
    '  export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"',
  );
  process.exit(1);
}

// Determine which platform to use
let platform;
let modelUsageUrl;
let toolUsageUrl;
let quotaLimitUrl;

// Extract the base domain from ANTHROPIC_BASE_URL
const parsedBaseUrl = new URL(baseUrl);
const baseDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

if (baseUrl.includes("api.z.ai")) {
  platform = "ZAI";
  modelUsageUrl = `${baseDomain}/api/monitor/usage/model-usage`;
  toolUsageUrl = `${baseDomain}/api/monitor/usage/tool-usage`;
  quotaLimitUrl = `${baseDomain}/api/monitor/usage/quota/limit`;
} else if (
  baseUrl.includes("open.bigmodel.cn") ||
  baseUrl.includes("dev.bigmodel.cn")
) {
  platform = "ZHIPU";
  modelUsageUrl = `${baseDomain}/api/monitor/usage/model-usage`;
  toolUsageUrl = `${baseDomain}/api/monitor/usage/tool-usage`;
  quotaLimitUrl = `${baseDomain}/api/monitor/usage/quota/limit`;
} else {
  console.error("Error: Unrecognized ANTHROPIC_BASE_URL:", baseUrl);
  console.error("");
  console.error("Supported values:");
  console.error("  - https://api.z.ai/api/anthropic");
  console.error("  - https://open.bigmodel.cn/api/anthropic");
  process.exit(1);
}

console.log(`Platform: ${platform}`);
console.log("");
// Time window: from yesterday at the current hour (HH:00:00) to today at the current hour end (HH:59:59).
const now = new Date();
const startDate = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 1,
  now.getHours(),
  0,
  0,
  0,
);
const endDate = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  now.getHours(),
  59,
  59,
  999,
);

// Format dates as yyyy-MM-dd HH:mm:ss
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const startTime = formatDateTime(startDate);
const endtime = formatDateTime(endDate);

// Properly encode query parameters
const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endtime)}`;

const processQuotaLimit = (data) => {
  if (!data || !data.limits) return data;

  data.limits = data.limits.map((item) => {
    if (item.type === "TOKENS_LIMIT") {
      return {
        type: "Token usage(5 Hour)",
        percentage: item.percentage,
      };
    }
    if (item.type === "TIME_LIMIT") {
      return {
        type: "MCP usage(1 Month)",
        percentage: item.percentage,
        currentUsage: item.currentValue,
        totol: item.usage,
        usageDetails: item.usageDetails,
      };
    }
    return item;
  });
  return data;
};

const queryUsage = (
  apiUrl,
  label,
  appendQueryParams = true,
  postProcessor = null,
) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(apiUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + (appendQueryParams ? queryParams : ""),
      method: "GET",
      headers: {
        Authorization: authToken,
        "Accept-Language": "en-US,en",
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`[${label}] HTTP ${res.statusCode}\n${data}`),
          );
        }

        console.log(`${label} data:`);
        console.log("");

        try {
          const json = JSON.parse(data);
          let outputData = json.data || json;
          if (postProcessor && json.data) {
            outputData = postProcessor(json.data);
          }
          console.log(JSON.stringify(outputData));
        } catch (e) {
          console.log("Response body:");
          console.log(data);
        }

        console.log("");
        resolve();
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};

const run = async () => {
  await queryUsage(modelUsageUrl, "Model usage");
  await queryUsage(toolUsageUrl, "Tool usage");
  await queryUsage(quotaLimitUrl, "Quota limit", false, processQuotaLimit);
};

run().catch((error) => {
  console.error("Request failed:", error.message);
  process.exit(1);
});

/**
 * 解析 GLM 使用数据并生成 Markdown 报告
 * @param {string} inputText - 原始输入文本
 * @returns {string} Markdown 报告
 */
function parseUsageData(inputText) {
  // 提取完整的 JSON 对象（处理嵌套）
  function extractJson(text, startKey) {
    const startIdx = text.indexOf(startKey);
    if (startIdx === -1) return null;

    const braceStart = text.indexOf("{", startIdx);
    if (braceStart === -1) return null;

    let depth = 0;
    let braceEnd = -1;

    for (let i = braceStart; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }

    if (braceEnd === -1) return null;
    return JSON.parse(text.slice(braceStart, braceEnd + 1));
  }

  // 提取平台
  const platformMatch = inputText.match(/Platform:\s*(\w+)/);
  const platform = platformMatch ? platformMatch[1] : "Unknown";

  // 提取各部分 JSON
  const modelUsage = extractJson(inputText, "Model usage data:") || {};
  const toolUsage = extractJson(inputText, "Tool usage data:") || {};
  const quotaLimits = extractJson(inputText, "Quota limit data:") || {
    limits: [],
  };

  // 格式化数字
  const fmt = (n) =>
    n == null ? "-" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 平台名称映射
  const platformNames = {
    ZHIPU: "ZHIPU (智谱 AI)",
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
  };

  // 时间分布
  const timeDist = (modelUsage.x_time || [])
    .map((t, i) => {
      const calls = modelUsage.modelCallCount?.[i];
      const tokens = modelUsage.tokensUsage?.[i];
      return calls != null
        ? `- ${t} - ${calls} 次调用，${fmt(tokens)} Tokens`
        : null;
    })
    .filter(Boolean)
    .join("\n");

  // MCP 详情
  const mcpLimit = quotaLimits.limits?.find((l) => l.type.includes("MCP"));
  const mcpDetails =
    mcpLimit?.usageDetails
      ?.map((d) => `- ${d.modelCode}: ${d.usage} 次`)
      .join("\n") || "";

  // 生成 Markdown
  return `GLM Coding Plan 使用情况查询结果

### 平台

**${platformNames[platform] || platform}**

---

### 模型使用统计

| 时间范围 | 模型调用次数 | Token 使用量 |
|---------|-------------|-------------|
| **总计** | **${fmt(modelUsage.totalUsage?.totalModelCallCount || 0)} 次** | **${fmt(modelUsage.totalUsage?.totalTokensUsage || 0)} Tokens** |

**时间分布：**

${timeDist || "暂无数据"}

---

### 工具使用统计

| 工具类型 | 使用次数 |
|---------|---------|
| 网络搜索 | ${fmt(toolUsage.totalUsage?.totalNetworkSearchCount || 0)} 次 |
| Web Reader MCP | ${fmt(toolUsage.totalUsage?.totalWebReadMcpCount || 0)} 次 |
| Zread MCP | ${fmt(toolUsage.totalUsage?.totalZreadMcpCount || 0)} 次 |
| **总工具调用** | **${fmt(toolUsage.totalUsage?.totalSearchMcpCount || 0)} 次** |

---

### 配额限制情况

| 限制类型 | 已用百分比 | 详情 |
|---------|-----------|------|
${quotaLimits.limits
  ?.map((l) => {
    const detail =
      l.currentUsage != null && l.totol != null
        ? `${l.currentUsage}/${l.totol} 次`
        : "-";
    return `| ${l.type} | ${l.percentage}% | ${detail} |`;
  })
  .join("\n")}

${mcpDetails ? `**MCP 工具详细使用：**\n\n${mcpDetails}` : ""}
`;
}
