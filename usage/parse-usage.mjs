
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

// 从命令行参数获取输入数据
const inputData = process.argv[2];

if (!inputData) {
  console.error("用法: node parse-usage.mjs \"<原始数据>\"");
  process.exit(1);
}

console.log(parseUsageData(inputData));
