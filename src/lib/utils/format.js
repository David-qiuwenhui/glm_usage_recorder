/**
 * @file 格式化工具函数
 * @description 提供数字格式化和平台名称映射功能
 */

/**
 * 格式化数字（添加千位分隔符）
 * @param {number|null|undefined} n - 要格式化的数字
 * @returns {string} 格式化后的字符串，null/undefined 返回 "-"
 * @example
 * formatNumber(1234567) // => "1,234,567"
 * formatNumber(null)    // => "-"
 */
export function formatNumber(n) {
  return n == null ? "-" : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 平台名称映射表（代码 -> 友好名称）
 * @type {Record<string, string>}
 */
export const PLATFORM_NAMES = {
  ZHIPU: "ZHIPU (智谱 AI)",
  ZAI: "ZAI",
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
};
