/**
 * @file 日期工具函数测试
 */

import { describe, it, expect } from "vitest";
import { formatDateTime, getTimeWindow } from "../../../lib/utils/date.js";

describe("utils/date.js", () => {
  describe("formatDateTime", () => {
    it("应正确格式化日期时间", () => {
      const date = new Date("2026-02-03T15:30:45");
      expect(formatDateTime(date)).toBe("2026-02-03 15:30:45");
    });

    it("应正确处理个位数月份、日期、小时、分钟、秒", () => {
      const date = new Date("2026-01-02T03:04:05");
      expect(formatDateTime(date)).toBe("2026-01-02 03:04:05");
    });

    it("应正确处理午夜时间", () => {
      const date = new Date("2026-02-03T00:00:00");
      expect(formatDateTime(date)).toBe("2026-02-03 00:00:00");
    });

    it("应正确处理一天结束时间", () => {
      const date = new Date("2026-02-03T23:59:59");
      expect(formatDateTime(date)).toBe("2026-02-03 23:59:59");
    });
  });

  describe("getTimeWindow", () => {
    it("应返回包含 startTime, endTime, queryParams 的对象", () => {
      const result = getTimeWindow();
      expect(result).toHaveProperty("startTime");
      expect(result).toHaveProperty("endTime");
      expect(result).toHaveProperty("queryParams");
    });

    it("startTime 应为昨天当前小时的整点", () => {
      const now = new Date("2026-02-03T15:30:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.startTime).toBe("2026-02-02 15:00:00");

      global.Date = originalDate;
    });

    it("endTime 应为今天当前小时的最后一秒", () => {
      const now = new Date("2026-02-03T15:30:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.endTime).toBe("2026-02-03 15:59:59");

      global.Date = originalDate;
    });

    it("queryParams 应包含正确的时间参数", () => {
      const now = new Date("2026-02-03T15:30:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.queryParams).toContain(
        "startTime=2026-02-02%2015%3A00%3A00",
      );
      expect(result.queryParams).toContain("endTime=2026-02-03%2015%3A59%3A59");

      global.Date = originalDate;
    });

    it("应正确处理午夜时间窗口", () => {
      const now = new Date("2026-02-03T00:00:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.startTime).toBe("2026-02-02 00:00:00");
      expect(result.endTime).toBe("2026-02-03 00:59:59");

      global.Date = originalDate;
    });

    it("应正确处理跨月情况", () => {
      const now = new Date("2026-03-01T02:00:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.startTime).toBe("2026-02-28 02:00:00");
      expect(result.endTime).toBe("2026-03-01 02:59:59");

      global.Date = originalDate;
    });

    it("应正确处理跨年情况", () => {
      const now = new Date("2026-01-01T03:00:00");
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) return now;
          return super(...args);
        }
      };

      const result = getTimeWindow();
      expect(result.startTime).toBe("2025-12-31 03:00:00");
      expect(result.endTime).toBe("2026-01-01 03:59:59");

      global.Date = originalDate;
    });
  });
});
