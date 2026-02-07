/**
 * @file 报告生成器模块测试
 */

import { describe, it, expect } from "vitest";
import {
  extractJson,
  generateTimeDistribution,
  generateMcpDetails,
  generateReport,
} from "../../lib/report-generator.js";

describe("lib/report-generator.js", () => {
  describe("extractJson", () => {
    it("应从文本中提取简单的 JSON 对象", () => {
      const text = 'Some text\nModel usage data:\n{"count": 100}\nMore text';
      const result = extractJson(text, "Model usage data:");
      expect(result).toEqual({ count: 100 });
    });

    it("应从文本中提取嵌套的 JSON 对象", () => {
      const text = 'Model usage data:\n{"outer": {"inner": {"value": 123}}}\nTool usage data:';
      const result = extractJson(text, "Model usage data:");
      expect(result).toEqual({ outer: { inner: { value: 123 } } });
    });

    it("应正确处理包含数组的 JSON", () => {
      const text = 'Model usage data:\n{"items": [1, 2, 3], "name": "test"}';
      const result = extractJson(text, "Model usage data:");
      expect(result).toEqual({ items: [1, 2, 3], name: "test" });
    });

    it("应正确处理包含嵌套对象的数组", () => {
      const text = 'Quota limit data:\n{"limits": [{"type": "A", "value": 1}, {"type": "B", "value": 2}]}';
      const result = extractJson(text, "Quota limit data:");
      expect(result).toEqual({
        limits: [
          { type: "A", value: 1 },
          { type: "B", value: 2 },
        ],
      });
    });

    it("当找不到 startKey 时应返回 null", () => {
      const text = "Some text\n{\"key\": \"value\"}";
      const result = extractJson(text, "Missing key:");
      expect(result).toBeNull();
    });

    it("当找不到 { 时应返回 null", () => {
      const text = "Model usage data:\nNo JSON here";
      const result = extractJson(text, "Model usage data:");
      expect(result).toBeNull();
    });

    it("当括号不匹配时应返回 null", () => {
      const text = "Model usage data:\n{\"key\": \"value\"";
      const result = extractJson(text, "Model usage data:");
      expect(result).toBeNull();
    });
  });

  describe("generateTimeDistribution", () => {
    it("应生成正确的时间分布文本", () => {
      const modelUsage = {
        x_time: ["2026-02-03 10:00", "2026-02-03 11:00", "2026-02-03 12:00"],
        modelCallCount: [5, 0, 3],
        tokensUsage: [10000, null, 6000],
      };
      const result = generateTimeDistribution(modelUsage);
      expect(result).toBe("- 2026-02-03 10:00 - 5 次调用，10,000 Tokens\n- 2026-02-03 11:00 - 0 次调用，- Tokens\n- 2026-02-03 12:00 - 3 次调用，6,000 Tokens");
    });

    it("当 x_time 为空数组时应返回空字符串", () => {
      const modelUsage = { x_time: [] };
      const result = generateTimeDistribution(modelUsage);
      expect(result).toBe("");
    });

    it("当 x_time 不存在时应返回空字符串", () => {
      const modelUsage = {};
      const result = generateTimeDistribution(modelUsage);
      expect(result).toBe("");
    });

    it("应过滤掉没有调用数据的时间点", () => {
      const modelUsage = {
        x_time: ["10:00", "11:00", "12:00"],
        modelCallCount: [null, 5, null],
        tokensUsage: [null, 5000, null],
      };
      const result = generateTimeDistribution(modelUsage);
      expect(result).toBe("- 11:00 - 5 次调用，5,000 Tokens");
    });

    it("当所有时间点都没有数据时应返回空字符串", () => {
      const modelUsage = {
        x_time: ["10:00", "11:00"],
        modelCallCount: [null, null],
        tokensUsage: [null, null],
      };
      const result = generateTimeDistribution(modelUsage);
      expect(result).toBe("");
    });
  });

  describe("generateMcpDetails", () => {
    it("应生成 MCP 工具详情列表", () => {
      const quotaLimits = {
        limits: [
          {
            type: "MCP usage(1 Month)",
            percentage: 25,
            usageDetails: [
              { modelCode: "web-search", usage: 100 },
              { modelCode: "web-reader", usage: 50 },
            ],
          },
        ],
      };
      const result = generateMcpDetails(quotaLimits);
      expect(result).toBe("- web-search: 100 次\n- web-reader: 50 次");
    });

    it("当没有 MCP 配额限制时应返回空字符串", () => {
      const quotaLimits = {
        limits: [
          { type: "Token usage(5 Hour)", percentage: 15 },
        ],
      };
      const result = generateMcpDetails(quotaLimits);
      expect(result).toBe("");
    });

    it("当 usageDetails 为空时应返回空字符串", () => {
      const quotaLimits = {
        limits: [
          {
            type: "MCP usage(1 Month)",
            percentage: 25,
            usageDetails: [],
          },
        ],
      };
      const result = generateMcpDetails(quotaLimits);
      expect(result).toBe("");
    });

    it("当 limits 为空数组时应返回空字符串", () => {
      const quotaLimits = { limits: [] };
      const result = generateMcpDetails(quotaLimits);
      expect(result).toBe("");
    });

    it("当 limits 不存在时应返回空字符串", () => {
      const quotaLimits = {};
      const result = generateMcpDetails(quotaLimits);
      expect(result).toBe("");
    });
  });

  describe("generateReport", () => {
    const now = new Date("2026-02-03T15:30:00");

    it("应生成完整的 iMessage 格式报告", () => {
      const rawData = `Platform: ZHIPU

Model usage data:
{"totalUsage": {"totalModelCallCount": 1234, "totalTokensUsage": 5678900}, "x_time": ["2026-02-03 10:00", "2026-02-03 11:00"], "modelCallCount": [10, 5], "tokensUsage": [100000, 50000]}

Tool usage data:
{"totalUsage": {"totalNetworkSearchCount": 100, "totalWebReadMcpCount": 50, "totalZreadMcpCount": 25, "totalSearchMcpCount": 175}}

Quota limit data:
{"limits": [{"type": "Token usage(5 Hour)", "percentage": 15}, {"type": "MCP usage(1 Month)", "percentage": 25, "currentUsage": 100, "totol": 200, "usageDetails": [{"modelCode": "web-search", "usage": 50}, {"modelCode": "web-reader", "usage": 30}]}]}
`;

      const result = generateReport(rawData);

      expect(result).toContain("📊 **GLM Coding Plan 使用情况**");
      expect(result).toContain("🏢 **平台**");
      expect(result).toContain("ZHIPU (智谱 AI)");
      expect(result).toContain("🤖 **模型使用**");
      expect(result).toContain("1,234 次");
      expect(result).toContain("5,678,900");
      expect(result).toContain("🔧 **工具使用**");
      expect(result).toContain("100");
      expect(result).toContain("⚠️ **配额限制**");
    });

    it("当平台未知时应显示 UNKNOWN", () => {
      const rawData = "Platform: UNKNOWN\n\nModel usage data:\n{}\n\nTool usage data:\n{}\n\nQuota limit data:\n{}";
      const result = generateReport(rawData);
      expect(result).toContain("UNKNOWN");
    });

    it("当没有时间分布数据时应不显示活跃时段", () => {
      const rawData = `Platform: ZHIPU

Model usage data:
{"totalUsage": {"totalModelCallCount": 100, "totalTokensUsage": 50000}}

Tool usage data:
{"totalUsage": {}}

Quota limit data:
{"limits": []}
`;

      const result = generateReport(rawData);
      expect(result).not.toContain("📅 近期活跃时段");
    });

    it("当没有 MCP 详情时应不显示 MCP 详情部分", () => {
      const rawData = `Platform: ZHIPU

Model usage data:
{"totalUsage": {}}

Tool usage data:
{"totalUsage": {}}

Quota limit data:
{"limits": [{"type": "Token usage(5 Hour)", "percentage": 15}]}
`;

      const result = generateReport(rawData);
      expect(result).not.toContain("📋 **MCP 详情**");
    });

    it("应包含当前时间戳", () => {
      const rawData = `Platform: ZHIPU

Model usage data:
{}

Tool usage data:
{}

Quota limit data:
{}
`;

      const result = generateReport(rawData);
      expect(result).toMatch(/📅 \d{4}\/\d{1,2}\/\d{1,2}/);
    });

    it("应正确处理 ZAI 平台", () => {
      const rawData = `Platform: ZAI

Model usage data:
{}

Tool usage data:
{}

Quota limit data:
{}
`;

      const result = generateReport(rawData);
      expect(result).toContain("ZAI");
    });

    it("应正确显示配额限制详情", () => {
      const rawData = `Platform: ZHIPU

Model usage data:
{}

Tool usage data:
{}

Quota limit data:
{"limits": [{"type": "MCP usage(1 Month)", "percentage": 25, "currentUsage": 100, "totol": 200}]}
`;

      const result = generateReport(rawData);
      expect(result).toContain("(100/200)");
    });
  });
});
