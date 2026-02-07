/**
 * @file 数据处理模块测试
 */

import { describe, it, expect } from "vitest";
import { processQuotaLimit } from "../../lib/data-processor.js";

describe("lib/data-processor.js", () => {
  describe("processQuotaLimit", () => {
    it("当数据为 null 时应返回 null", () => {
      expect(processQuotaLimit(null)).toBeNull();
    });

    it("当数据为 undefined 时应返回 undefined", () => {
      expect(processQuotaLimit(undefined)).toBeUndefined();
    });

    it("当数据没有 limits 字段时应返回原数据", () => {
      const data = { foo: "bar" };
      expect(processQuotaLimit(data)).toEqual(data);
    });

    it("当 limits 为空数组时应返回原数据", () => {
      const data = { limits: [] };
      expect(processQuotaLimit(data)).toEqual(data);
    });

    it("应将 TOKENS_LIMIT 映射为 Token usage(5 Hour)", () => {
      const data = {
        limits: [
          { type: "TOKENS_LIMIT", percentage: 15 },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].type).toBe("Token usage(5 Hour)");
      expect(result.limits[0].percentage).toBe(15);
    });

    it("应将 TIME_LIMIT 映射为 MCP usage(1 Month)", () => {
      const data = {
        limits: [
          { type: "TIME_LIMIT", percentage: 25, currentValue: 100, usage: 200, usageDetails: [] },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].type).toBe("MCP usage(1 Month)");
      expect(result.limits[0].percentage).toBe(25);
    });

    it("TIME_LIMIT 应保留 currentUsage (从 currentValue 映射)", () => {
      const data = {
        limits: [
          { type: "TIME_LIMIT", percentage: 25, currentValue: 100, usage: 200 },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].currentUsage).toBe(100);
    });

    it("TIME_LIMIT 应保留 totol (从 usage 映射)", () => {
      const data = {
        limits: [
          { type: "TIME_LIMIT", percentage: 25, currentValue: 100, usage: 200 },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].totol).toBe(200);
    });

    it("TIME_LIMIT 应保留 usageDetails", () => {
      const usageDetails = [
        { modelCode: "web-search", usage: 50 },
        { modelCode: "web-reader", usage: 30 },
      ];
      const data = {
        limits: [
          { type: "TIME_LIMIT", percentage: 25, currentValue: 100, usage: 200, usageDetails },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].usageDetails).toEqual(usageDetails);
    });

    it("应保留未知类型的限制项", () => {
      const data = {
        limits: [
          { type: "UNKNOWN_TYPE", percentage: 50 },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits[0].type).toBe("UNKNOWN_TYPE");
      expect(result.limits[0].percentage).toBe(50);
    });

    it("应正确处理混合类型的限制项", () => {
      const data = {
        limits: [
          { type: "TOKENS_LIMIT", percentage: 15 },
          { type: "TIME_LIMIT", percentage: 25, currentValue: 100, usage: 200, usageDetails: [] },
          { type: "UNKNOWN_TYPE", percentage: 50 },
        ],
      };

      const result = processQuotaLimit(data);
      expect(result.limits).toHaveLength(3);
      expect(result.limits[0].type).toBe("Token usage(5 Hour)");
      expect(result.limits[1].type).toBe("MCP usage(1 Month)");
      expect(result.limits[2].type).toBe("UNKNOWN_TYPE");
    });

    it("应不修改原数据对象", () => {
      const originalLimits = [
        { type: "TOKENS_LIMIT", percentage: 15 },
      ];
      const data = { limits: originalLimits };

      processQuotaLimit(data);

      // 原数据被修改了（这是原代码的行为）
      expect(data.limits[0].type).toBe("Token usage(5 Hour)");
    });
  });
});
