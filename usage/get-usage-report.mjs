#!/usr/bin/env node

/**
 * GLM 使用情况报告生成器
 * 1. 查询接口获取原始数据
 * 2. 解析并生成 Markdown 报告
 */

import https from "https";

// ============ 数据查询模块 ============

const baseUrl =
  process.env.ANTHROPIC_BASE_URL || "https://open.bigmodel.cn/api/anthropic";
const authToken =
  process.env.ANTHROPIC_AUTH_TOKEN ||
  "cfd7afd415aa433581b5d079bca1e46a.wgr8oGHYHEVKjY78";

if (!authToken) {
  console.error("Error: ANTHROPIC_AUTH_TOKEN is not set");
  process.exit(1);
}

if (!baseUrl) {
  console.error("Error: ANTHROPIC_BASE_URL is not set");
  process.exit(1);
}

// 判断平台
const parsedBaseUrl = new URL(baseUrl);
const baseDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

let platform;
let modelUsageUrl;
let toolUsageUrl;
let quotaLimitUrl;

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
  process.exit(1);
}

// 时间窗口：从昨天当前小时到现在
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
const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endtime)}`;

const processQuotaLimit = (data) => {
  if (!data || !data.limits) return data;
  data.limits = data.limits.map((item) => {
    if (item.type === "TOKENS_LIMIT") {
      return { type: "Token usage(5 Hour)", percentage: item.percentage };
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

// 收集输出数据的缓冲区
let outputBuffer = "";

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

        outputBuffer += `${label} data:\n\n`;

        try {
          const json = JSON.parse(data);
          let outputData = json.data || json;
          if (postProcessor && json.data) {
            outputData = postProcessor(json.data);
          }
          outputBuffer += JSON.stringify(outputData);
        } catch {
          outputBuffer += "Response body:\n" + data;
        }

        outputBuffer += "\n\n";
        resolve();
      });
    });

    req.on("error", reject);
    req.end();
  });
};

const fetchData = async () => {
  outputBuffer = `Platform: ${platform}\n\n`;
  await queryUsage(modelUsageUrl, "Model usage");
  await queryUsage(toolUsageUrl, "Tool usage");
  await queryUsage(quotaLimitUrl, "Quota limit", false, processQuotaLimit);
  return outputBuffer;
};

// ============ 数据解析模块 ============

function parseUsageData(inputText) {
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

  const platformMatch = inputText.match(/Platform:\s*(\w+)/);
  const platform = platformMatch ? platformMatch[1] : "Unknown";

  const modelUsage = extractJson(inputText, "Model usage data:") || {};
  const toolUsage = extractJson(inputText, "Tool usage data:") || {};
  const quotaLimits = extractJson(inputText, "Quota limit data:") || {
    limits: [],
  };

  const fmt = (n) =>
    n == null ? "-" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const platformNames = {
    ZHIPU: "ZHIPU (智谱 AI)",
    ZAI: "ZAI",
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
  };

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

  const mcpLimit = quotaLimits.limits?.find((l) => l.type.includes("MCP"));
  const mcpDetails =
    mcpLimit?.usageDetails
      ?.map((d) => `- ${d.modelCode}: ${d.usage} 次`)
      .join("\n") || "";

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

// ============ 主执行流程 ============

async function main() {
  const rawData = await fetchData();
  const report = parseUsageData(rawData);
  console.log(report);
}

main().catch((error) => {
  console.error("执行失败:", error.message);
  process.exit(1);
});
