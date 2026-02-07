#!/usr/bin/env node

/**
 * @file GLM 使用情况报告生成器
 * @description 查询 GLM API 获取使用数据，并生成适合 iMessage 的格式化报告
 * @author GLM Usage Recorder
 * @version 2.0.0
 */

import { validateEnv, getPlatformConfig } from "../lib/config.js";
import { getTimeWindow } from "../lib/utils/date.js";
import { ApiClient } from "../lib/api-client.js";
import { processQuotaLimit } from "../lib/data-processor.js";
import { generateReport } from "../lib/report-generator.js";

/**
 * 主执行函数
 * @description 1. 查询 API 获取原始数据 2. 解析并生成报告 3. 输出到控制台
 * @async
 */
async function main() {
  // 验证环境变量
  validateEnv();

  // 获取平台配置
  const config = getPlatformConfig(process.env.ANTHROPIC_BASE_URL);

  // 获取时间窗口
  const { startTime, endTime, queryParams } = getTimeWindow();

  // 创建 API 客户端
  const client = new ApiClient(process.env.ANTHROPIC_AUTH_TOKEN, queryParams);

  // 查询数据
  const modelUsage = await client.request(config.modelUsageUrl, "Model usage");
  const toolUsage = await client.request(config.toolUsageUrl, "Tool usage");
  const quotaLimits = await client.request(
    config.quotaLimitUrl,
    "Quota limit",
    false,
    processQuotaLimit,
  );

  // 生成报告
  const rawData = `Platform: ${config.platform}\n\nModel usage data:\n${JSON.stringify(modelUsage)}\n\nTool usage data:\n${JSON.stringify(toolUsage)}\n\nQuota limit data:\n${JSON.stringify(quotaLimits)}`;

  const report = generateReport(rawData);
  console.log(report);
}

// 执行主函数，捕获错误
main().catch((error) => {
  console.error("执行失败:", error.message);
  process.exit(1);
});
