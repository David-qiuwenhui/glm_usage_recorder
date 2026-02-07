/**
 * @file 数据处理模块
 * @description 处理 API 返回的数据
 */

/**
 * 处理配额限制数据，将 API 返回的类型映射为可读的中文描述
 * @param {Object} data - API 返回的配额限制数据
 * @param {Array} data.limits - 限制项数组
 * @returns {Object} 处理后的配额限制数据
 * @description 映射规则：
 * - TOKENS_LIMIT -> Token usage(5 Hour)
 * - TIME_LIMIT -> MCP usage(1 Month)
 */
export function processQuotaLimit(data) {
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
}
