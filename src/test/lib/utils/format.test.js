/**
 * @file 格式化工具函数测试
 */

import { describe, it, expect } from "vitest";
import { formatNumber, PLATFORM_NAMES } from "../../../lib/utils/format.js";

describe("utils/format.js", () => {
  describe("formatNumber", () => {
    it("应为 null 返回 '-'", () => {
      expect(formatNumber(null)).toBe("-");
    });

    it("应为 undefined 返回 '-'", () => {
      expect(formatNumber(undefined)).toBe("-");
    });

    it("应正确格式化小数字", () => {
      expect(formatNumber(123)).toBe("123");
    });

    it("应正确添加千位分隔符", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("应正确格式化大数字", () => {
      expect(formatNumber(1234567890)).toBe("1,234,567,890");
    });

    it("应正确处理零", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("应正确处理恰好 1000 的数字", () => {
      expect(formatNumber(1000)).toBe("1,000");
    });

    it("应正确处理带多个千位分隔符的数字", () => {
      expect(formatNumber(1000000000)).toBe("1,000,000,000");
    });
  });

  describe("PLATFORM_NAMES", () => {
    it("应包含所有平台映射", () => {
      expect(PLATFORM_NAMES).toHaveProperty("ZHIPU");
      expect(PLATFORM_NAMES).toHaveProperty("ZAI");
      expect(PLATFORM_NAMES).toHaveProperty("OPENAI");
      expect(PLATFORM_NAMES).toHaveProperty("ANTHROPIC");
    });

    it("ZHIPU 应映射为 ZHIPU (智谱 AI)", () => {
      expect(PLATFORM_NAMES.ZHIPU).toBe("ZHIPU (智谱 AI)");
    });

    it("ZAI 应映射为 ZAI", () => {
      expect(PLATFORM_NAMES.ZAI).toBe("ZAI");
    });

    it("OPENAI 应映射为 OpenAI", () => {
      expect(PLATFORM_NAMES.OPENAI).toBe("OpenAI");
    });

    it("ANTHROPIC 应映射为 Anthropic", () => {
      expect(PLATFORM_NAMES.ANTHROPIC).toBe("Anthropic");
    });
  });
});
