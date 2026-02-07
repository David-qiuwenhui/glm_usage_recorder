/**
 * @file 配置模块
 * @description 环境变量验证和平台配置
 */

/**
 * 验证必要的环境变量是否已设置
 * @throws {Error} 当缺少必要的环境变量时抛出错误
 */
export function validateEnv() {
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
  const baseUrl = process.env.ANTHROPIC_BASE_URL;

  if (!authToken) {
    throw new Error(
      'ANTHROPIC_AUTH_TOKEN is not set. 请设置环境变量: export ANTHROPIC_AUTH_TOKEN="your-token"'
    );
  }

  if (!baseUrl) {
    throw new Error(
      'ANTHROPIC_BASE_URL is not set. 请设置环境变量: export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"'
    );
  }
}

/**
 * 获取平台配置
 * @param {string} baseUrl - API 基础 URL
 * @returns {{ platform: string, modelUsageUrl: string, toolUsageUrl: string, quotaLimitUrl: string }}
 * @throws {Error} 当无法识别的平台 URL 时抛出错误
 * @description
 * - ZAI: api.z.ai
 * - ZHIPU: open.bigmodel.cn | dev.bigmodel.cn
 */
export function getPlatformConfig(baseUrl) {
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
    throw new Error(
      `Unrecognized ANTHROPIC_BASE_URL: ${baseUrl}. 支持的平台: https://api.z.ai 或 https://open.bigmodel.cn`
    );
  }

  return { platform, modelUsageUrl, toolUsageUrl, quotaLimitUrl };
}
