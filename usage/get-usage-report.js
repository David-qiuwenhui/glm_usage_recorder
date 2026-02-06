#!/usr/bin/env node

/**
 * @file GLM 使用情况报告生成器
 * @description 查询 GLM API 获取使用数据，并生成适合 iMessage 的格式化报告
 * @author GLM Usage Recorder
 * @version 1.0.0
 */

import https from "https";

// ============ 数据查询模块 ============

/** @type {string} API 基础 URL，默认使用智谱 AI */
const baseUrl =
  process.env.ANTHROPIC_BASE_URL || "https://open.bigmodel.cn/api/anthropic";

/** @type {string} API 认证令牌 */
const authToken =
  process.env.ANTHROPIC_AUTH_TOKEN ||
  "cfd7afd415aa433581b5d079bca1e46a.wgr8oGHYHEVKjY78";

// ============ 环境变量验证 ============

/**
 * 验证必要的环境变量是否已设置
 * @throws {Error} 当缺少必要的环境变量时退出程序
 */
if (!authToken) {
  console.error("Error: ANTHROPIC_AUTH_TOKEN is not set");
  console.error('请设置环境变量: export ANTHROPIC_AUTH_TOKEN="your-token"');
  process.exit(1);
}

if (!baseUrl) {
  console.error("Error: ANTHROPIC_BASE_URL is not set");
  console.error(
    '请设置环境变量: export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"',
  );
  process.exit(1);
}

// ============ 平台配置 ============

/**
 * 解析 API 基础 URL，确定平台类型和对应的接口地址
 * @type {URL}
 */
const parsedBaseUrl = new URL(baseUrl);
/** @type {string} 提取的域名（包含协议） */
const baseDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

/** @type {string} 平台标识：ZAI | ZHIPU */
let platform;
/** @type {string} 模型使用统计接口 URL */
let modelUsageUrl;
/** @type {string} 工具使用统计接口 URL */
let toolUsageUrl;
/** @type {string} 配额限制接口 URL */
let quotaLimitUrl;

/**
 * 根据 BASE_URL 初始化平台配置
 * - ZAI: api.z.ai
 * - ZHIPU: open.bigmodel.cn | dev.bigmodel.cn
 */
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
  console.error("支持的平台: https://api.z.ai 或 https://open.bigmodel.cn");
  process.exit(1);
}

// ============ 时间窗口配置 ============

/**
 * 查询时间窗口：从昨天当前小时到现在今天当前小时结束
 * @example 当前时间 2026-02-03 15:30
 * - startTime: 2026-02-02 15:00:00
 * - endTime: 2026-02-03 15:59:59
 */
const now = new Date();
/** @type {Date} 查询起始时间（昨天当前小时的整点） */
const startDate = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 1,
  now.getHours(),
  0,
  0,
  0,
);
/** @type {Date} 查询结束时间（今天当前小时的最后一秒） */
const endDate = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  now.getHours(),
  59,
  59,
  999,
);

/**
 * 格式化日期时间为 API 要求的格式
 * @param {Date} date - 要格式化的日期对象
 * @returns {string} 格式化后的日期时间字符串 "yyyy-MM-dd HH:mm:ss"
 * @example
 * formatDateTime(new Date("2026-02-03T15:30:00"))
 * // => "2026-02-03 15:30:00"
 */
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/** @type {string} 格式化后的起始时间 */
const startTime = formatDateTime(startDate);
/** @type {string} 格式化后的结束时间 */
const endtime = formatDateTime(endDate);
/** @type {string} URL 查询参数字符串 */
const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endtime)}`;

// ============ 数据处理函数 ============

/**
 * 处理配额限制数据，将 API 返回的类型映射为可读的中文描述
 * @param {Object} data - API 返回的配额限制数据
 * @param {Array} data.limits - 限制项数组
 * @returns {Object} 处理后的配额限制数据
 * @description 映射规则：
 * - TOKENS_LIMIT -> Token usage(5 Hour)
 * - TIME_LIMIT -> MCP usage(1 Month)
 */
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

/** @type {string} 输出数据缓冲区，用于收集 API 响应 */
let outputBuffer = "";

/**
 * 发起 HTTPS 请求查询使用数据
 * @param {string} apiUrl - 请求的完整 URL
 * @param {string} label - 数据标签（用于日志和错误信息）
 * @param {boolean} [appendQueryParams=true] - 是否附加时间查询参数
 * @param {Function|null} [postProcessor=null] - 响应数据的后处理函数
 * @returns {Promise<void>} 请求完成后解析
 * @throws {Error} 当 HTTP 状态码非 200 或请求失败时抛出错误
 *
 * @example
 * await queryUsage(modelUsageUrl, "Model usage", true, null);
 */
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
          // 应用后处理器（如果有）
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

/**
 * 依次查询所有使用数据接口
 * @returns {Promise<string>} 包含所有原始数据的字符串
 * @description 查询顺序：
 * 1. 模型使用统计
 * 2. 工具使用统计
 * 3. 配额限制情况
 */
const fetchData = async () => {
  outputBuffer = `Platform: ${platform}\n\n`;
  await queryUsage(modelUsageUrl, "Model usage");
  await queryUsage(toolUsageUrl, "Tool usage");
  await queryUsage(quotaLimitUrl, "Quota limit", false, processQuotaLimit);
  return outputBuffer;
};

// ============ 数据解析模块 ============

/**
 * 解析 GLM 使用数据并生成 iMessage 格式报告
 * @param {string} inputText - API 返回的原始文本数据
 * @returns {string} 格式化后的报告字符串（支持 Markdown 粗体）
 *
 * @example
 * const rawData = "Platform: ZHIPU\n\nModel usage data:\n{...}";
 * const report = parseUsageData(rawData);
 * console.log(report); // iMessage 可读的格式化报告
 */
function parseUsageData(inputText) {
  /**
   * 从文本中提取完整的 JSON 对象（支持嵌套）
   * @param {string} text - 源文本
   * @param {string} startKey - 查找的起始键名
   * @returns {Object|null} 解析后的 JSON 对象，失败返回 null
   * @description 通过括号深度匹配来正确提取嵌套的 JSON
   */
  function extractJson(text, startKey) {
    const startIdx = text.indexOf(startKey);
    if (startIdx === -1) return null;

    const braceStart = text.indexOf("{", startIdx);
    if (braceStart === -1) return null;

    // 通过括号深度匹配找到完整的 JSON 对象
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

  // ============ 提取各部分数据 ============

  /** @type {string} 平台标识 */
  const platformMatch = inputText.match(/Platform:\s*(\w+)/);
  const platform = platformMatch ? platformMatch[1] : "Unknown";

  /** @type {Object} 模型使用数据 */
  const modelUsage = extractJson(inputText, "Model usage data:") || {};
  /** @type {Object} 工具使用数据 */
  const toolUsage = extractJson(inputText, "Tool usage data:") || {};
  /** @type {Object} 配额限制数据 */
  const quotaLimits = extractJson(inputText, "Quota limit data:") || {
    limits: [],
  };

  // ============ 格式化工具函数 ============

  /**
   * 格式化数字（添加千位分隔符）
   * @param {number|null|undefined} n - 要格式化的数字
   * @returns {string} 格式化后的字符串，null/undefined 返回 "-"
   * @example
   * fmt(1234567) // => "1,234,567"
   * fmt(null)    // => "-"
   */
  const fmt = (n) =>
    n == null ? "-" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /**
   * 平台名称映射表（代码 -> 友好名称）
   * @type {Record<string, string>}
   */
  const platformNames = {
    ZHIPU: "ZHIPU (智谱 AI)",
    ZAI: "ZAI",
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
  };

  // ============ 生成时间分布列表 ============

  /**
   * 生成时间分布文本
   * @type {string}
   * @description 只显示有调用数据的时间点
   */
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

  // ============ 生成 MCP 工具详情 ============

  /**
   * 查找 MCP 配额限制项
   * @type {Object|undefined}
   */
  const mcpLimit = quotaLimits.limits?.find((l) => l.type.includes("MCP"));

  /**
   * 生成 MCP 工具使用详情列表
   * @type {string}
   */
  const mcpDetails =
    mcpLimit?.usageDetails
      ?.map((d) => `- ${d.modelCode}: ${d.usage} 次`)
      .join("\n") || "";

  // ============ 生成 iMessage 格式报告 ============

  return `📊 **GLM Coding Plan 使用情况**

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 **平台**
${platformNames[platform] || platform}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **模型使用**
📞 调用：${fmt(modelUsage.totalUsage?.totalModelCallCount || 0)} 次
💎 Token：${fmt(modelUsage.totalUsage?.totalTokensUsage || 0)}

${
  timeDist
    ? `📅 近期活跃时段：
${timeDist}`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 **工具使用**
🔍 网络搜索 ${fmt(toolUsage.totalUsage?.totalNetworkSearchCount || 0)}
📖 Web Reader ${fmt(toolUsage.totalUsage?.totalWebReadMcpCount || 0)}
📚 Zread ${fmt(toolUsage.totalUsage?.totalZreadMcpCount || 0)}
🔢 **总计 ${fmt(toolUsage.totalUsage?.totalSearchMcpCount || 0)} 次**

━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **配额限制**
${quotaLimits.limits
  ?.map((l) => {
    const detail =
      l.currentUsage != null && l.totol != null
        ? `(${l.currentUsage}/${l.totol})`
        : "";
    return `• ${l.type}: ${l.percentage}% ${detail}`;
  })
  .join("\n")}

${
  mcpDetails
    ? `📋 **MCP 详情**
${mcpDetails}`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}
`;
}

// ============ 主执行流程 ============

/**
 * 主执行函数
 * @description 1. 查询 API 获取原始数据 2. 解析并生成报告 3. 输出到控制台
 * @async
 */
async function main() {
  const rawData = await fetchData();
  const report = parseUsageData(rawData);
  console.log(report);
}

// 执行主函数，捕获错误
main().catch((error) => {
  console.error("执行失败:", error.message);
  process.exit(1);
});
