/**
 * @file 报告生成器模块
 * @description 解析 GLM 使用数据并生成 iMessage 格式报告
 */

import { formatNumber, PLATFORM_NAMES } from "./utils/format.js";

/**
 * 从文本中提取完整的 JSON 对象（支持嵌套）
 * @param {string} text - 源文本
 * @param {string} startKey - 查找的起始键名
 * @returns {Object|null} 解析后的 JSON 对象，失败返回 null
 * @description 通过括号深度匹配来正确提取嵌套的 JSON
 */
export function extractJson(text, startKey) {
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

/**
 * 生成时间分布文本
 * @param {Object} modelUsage - 模型使用数据
 * @returns {string} 时间分布文本
 */
export function generateTimeDistribution(modelUsage) {
  return (modelUsage.x_time || [])
    .map((t, i) => {
      const calls = modelUsage.modelCallCount?.[i];
      const tokens = modelUsage.tokensUsage?.[i];
      return calls != null
        ? `- ${t} - ${calls} 次调用，${formatNumber(tokens)} Tokens`
        : null;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * 生成 MCP 工具详情文本
 * @param {Object} quotaLimits - 配额限制数据
 * @returns {string} MCP 工具使用详情列表
 */
export function generateMcpDetails(quotaLimits) {
  const mcpLimit = quotaLimits.limits?.find((l) => l.type.includes("MCP"));
  return (
    mcpLimit?.usageDetails
      ?.map((d) => `- ${d.modelCode}: ${d.usage} 次`)
      .join("\n") || ""
  );
}

/**
 * 解析 GLM 使用数据并生成 iMessage 格式报告
 * @param {string} rawData - API 返回的原始文本数据
 * @returns {string} 格式化后的报告字符串（支持 Markdown 粗体）
 */
export function generateReport(rawData) {
  // 提取各部分数据
  const platformMatch = rawData.match(/Platform:\s*(\w+)/);
  const platform = platformMatch ? platformMatch[1] : "Unknown";

  const modelUsage = extractJson(rawData, "Model usage data:") || {};
  const toolUsage = extractJson(rawData, "Tool usage data:") || {};
  const quotaLimits = extractJson(rawData, "Quota limit data:") || {
    limits: [],
  };

  // 生成时间分布列表
  const timeDist = generateTimeDistribution(modelUsage);

  // 生成 MCP 工具详情
  const mcpDetails = generateMcpDetails(quotaLimits);

  // 生成配额限制列表
  const quotaList = quotaLimits.limits
    ?.map((l) => {
      const detail =
        l.currentUsage != null && l.totol != null
          ? `(${l.currentUsage}/${l.totol})`
          : "";
      return `• ${l.type}: ${l.percentage}% ${detail}`;
    })
    .join("\n");

  // 生成 iMessage 格式报告
  return `📊 **GLM Coding Plan 使用情况**

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 **平台**
${PLATFORM_NAMES[platform] || platform}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **模型使用**
📞 调用：${formatNumber(modelUsage.totalUsage?.totalModelCallCount || 0)} 次
💎 Token：${formatNumber(modelUsage.totalUsage?.totalTokensUsage || 0)}

${
  timeDist
    ? `📅 近期活跃时段：
${timeDist}`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 **工具使用**
🔍 网络搜索 ${formatNumber(toolUsage.totalUsage?.totalNetworkSearchCount || 0)}
📖 Web Reader ${formatNumber(toolUsage.totalUsage?.totalWebReadMcpCount || 0)}
📚 Zread ${formatNumber(toolUsage.totalUsage?.totalZreadMcpCount || 0)}
🔢 **总计 ${formatNumber(toolUsage.totalUsage?.totalSearchMcpCount || 0)} 次**

━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **配额限制**
${quotaList}

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
