/**
 * @file 配置模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv, getPlatformConfig } from "../../lib/config.js";

describe("lib/config.js", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("当环境变量都设置成功时应不抛出错误", () => {
      process.env.ANTHROPIC_AUTH_TOKEN = "test-token";
      process.env.ANTHROPIC_BASE_URL = "https://open.bigmodel.cn/api/anthropic";

      expect(() => validateEnv()).not.toThrow();
    });

    it("当 ANTHROPIC_AUTH_TOKEN 未设置时应抛出错误", () => {
      process.env.ANTHROPIC_AUTH_TOKEN = "";
      process.env.ANTHROPIC_BASE_URL = "https://open.bigmodel.cn/api/anthropic";

      expect(() => validateEnv()).toThrow("ANTHROPIC_AUTH_TOKEN is not set");
    });

    it("当 ANTHROPIC_AUTH_TOKEN 为 null 时应抛出错误", () => {
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      process.env.ANTHROPIC_BASE_URL = "https://open.bigmodel.cn/api/anthropic";

      expect(() => validateEnv()).toThrow("ANTHROPIC_AUTH_TOKEN is not set");
    });

    it("当 ANTHROPIC_BASE_URL 未设置时应抛出错误", () => {
      process.env.ANTHROPIC_AUTH_TOKEN = "test-token";
      process.env.ANTHROPIC_BASE_URL = "";

      expect(() => validateEnv()).toThrow("ANTHROPIC_BASE_URL is not set");
    });

    it("当 ANTHROPIC_BASE_URL 为 null 时应抛出错误", () => {
      process.env.ANTHROPIC_AUTH_TOKEN = "test-token";
      delete process.env.ANTHROPIC_BASE_URL;

      expect(() => validateEnv()).toThrow("ANTHROPIC_BASE_URL is not set");
    });
  });

  describe("getPlatformConfig", () => {
    it("应正确识别 ZAI 平台", () => {
      const baseUrl = "https://api.z.ai/anthropic";
      const config = getPlatformConfig(baseUrl);

      expect(config.platform).toBe("ZAI");
      expect(config.modelUsageUrl).toBe(
        "https://api.z.ai/api/monitor/usage/model-usage",
      );
      expect(config.toolUsageUrl).toBe(
        "https://api.z.ai/api/monitor/usage/tool-usage",
      );
      expect(config.quotaLimitUrl).toBe(
        "https://api.z.ai/api/monitor/usage/quota/limit",
      );
    });

    it("应正确识别 ZHIPU 平台 (open.bigmodel.cn)", () => {
      const baseUrl = "https://open.bigmodel.cn/api/anthropic";
      const config = getPlatformConfig(baseUrl);

      expect(config.platform).toBe("ZHIPU");
      expect(config.modelUsageUrl).toBe(
        "https://open.bigmodel.cn/api/monitor/usage/model-usage",
      );
      expect(config.toolUsageUrl).toBe(
        "https://open.bigmodel.cn/api/monitor/usage/tool-usage",
      );
      expect(config.quotaLimitUrl).toBe(
        "https://open.bigmodel.cn/api/monitor/usage/quota/limit",
      );
    });

    it("应正确识别 ZHIPU 平台 (dev.bigmodel.cn)", () => {
      const baseUrl = "https://dev.bigmodel.cn/api/anthropic";
      const config = getPlatformConfig(baseUrl);

      expect(config.platform).toBe("ZHIPU");
      expect(config.modelUsageUrl).toBe(
        "https://dev.bigmodel.cn/api/monitor/usage/model-usage",
      );
      expect(config.toolUsageUrl).toBe(
        "https://dev.bigmodel.cn/api/monitor/usage/tool-usage",
      );
      expect(config.quotaLimitUrl).toBe(
        "https://dev.bigmodel.cn/api/monitor/usage/quota/limit",
      );
    });

    it("对于无法识别的 URL 应抛出错误", () => {
      const baseUrl = "https://unknown-platform.com/api";

      expect(() => getPlatformConfig(baseUrl)).toThrow(
        "Unrecognized ANTHROPIC_BASE_URL",
      );
    });

    it("对于无法识别的 URL 错误消息应包含支持的平台", () => {
      const baseUrl = "https://unknown-platform.com/api";

      try {
        getPlatformConfig(baseUrl);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("https://api.z.ai");
        expect(error.message).toContain("https://open.bigmodel.cn");
      }
    });

    it("应正确处理带端口的 URL", () => {
      const baseUrl = "https://api.z.ai:8443/anthropic";
      const config = getPlatformConfig(baseUrl);

      expect(config.platform).toBe("ZAI");
      expect(config.modelUsageUrl).toContain("api.z.ai:8443");
    });

    it("应正确处理带路径的 URL", () => {
      const baseUrl = "https://open.bigmodel.cn/v1/api/anthropic";
      const config = getPlatformConfig(baseUrl);

      expect(config.platform).toBe("ZHIPU");
      expect(config.modelUsageUrl).not.toContain("/v1");
    });
  });
});
