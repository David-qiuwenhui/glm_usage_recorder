/**
 * @file API 客户端模块测试
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ApiClient } from "../../lib/api-client.js";
import nock from "nock";

describe("lib/api-client.js", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("ApiClient", () => {
    describe("constructor", () => {
      it("应正确存储 authToken 和 queryParams", () => {
        const client = new ApiClient("test-token", "?start=2023-01-01");
        expect(client.authToken).toBe("test-token");
        expect(client.queryParams).toBe("?start=2023-01-01");
      });
    });

    describe("request", () => {
      it("应成功发起 GET 请求并返回解析的 JSON", async () => {
        const mockData = { data: { count: 100 } };

        nock("https://api.example.com")
          .get("/api/test")
          .query({ start: "2023-01-01" })
          .reply(200, JSON.stringify(mockData));

        const client = new ApiClient("Bearer token", "?start=2023-01-01");
        const result = await client.request("https://api.example.com/api/test", "Test API");

        expect(result).toEqual({ count: 100 });
      });

      it("应正确添加 Authorization header", async () => {
        const scope = nock("https://api.example.com", {
          reqheaders: {
            authorization: "my-secret-token",
          },
        })
          .get("/api/test")
          .reply(200, JSON.stringify({ data: {} }));

        const client = new ApiClient("my-secret-token", "");
        await client.request("https://api.example.com/api/test", "Test API");

        expect(scope.isDone()).toBe(true);
      });

      it("应正确添加其他必需 headers", async () => {
        const scope = nock("https://api.example.com", {
          reqheaders: {
            "accept-language": "en-US,en",
            "content-type": "application/json",
          },
        })
          .get("/api/test")
          .reply(200, JSON.stringify({ data: {} }));

        const client = new ApiClient("token", "");
        await client.request("https://api.example.com/api/test", "Test API");

        expect(scope.isDone()).toBe(true);
      });

      it("当 appendQueryParams 为 false 时不附加查询参数", async () => {
        const scope = nock("https://api.example.com")
          .get("/api/test")
          .reply(200, JSON.stringify({ data: {} }));

        const client = new ApiClient("token", "?extra=param");
        await client.request("https://api.example.com/api/test", "Test API", false);

        expect(scope.isDone()).toBe(true);
      });

      it("应应用后处理函数到 data 字段", async () => {
        const mockData = { data: { value: 10 } };

        nock("https://api.example.com")
          .get("/api/test")
          .reply(200, JSON.stringify(mockData));

        const postProcessor = (data) => ({ value: data.value * 2 });

        const client = new ApiClient("token", "");
        const result = await client.request(
          "https://api.example.com/api/test",
          "Test API",
          false,
          postProcessor
        );

        expect(result).toEqual({ value: 20 });
      });

      it("当没有 data 字段时应返回完整的 JSON", async () => {
        const mockData = { count: 100 };

        nock("https://api.example.com")
          .get("/api/test")
          .reply(200, JSON.stringify(mockData));

        const client = new ApiClient("token", "");
        const result = await client.request("https://api.example.com/api/test", "Test API", false);

        expect(result).toEqual({ count: 100 });
      });

      it("当状态码非 200 时应抛出错误", async () => {
        nock("https://api.example.com")
          .get("/api/test")
          .reply(401, "Unauthorized");

        const client = new ApiClient("token", "");

        await expect(
          client.request("https://api.example.com/api/test", "Test API")
        ).rejects.toThrow("Test API");
      });

      it("错误消息应包含状态码", async () => {
        nock("https://api.example.com")
          .get("/api/test")
          .reply(404, "Not Found");

        const client = new ApiClient("token", "");

        await expect(
          client.request("https://api.example.com/api/test", "Test API")
        ).rejects.toThrow("HTTP 404");
      });

      it("当 JSON 解析失败时应抛出错误", async () => {
        nock("https://api.example.com")
          .get("/api/test")
          .reply(200, "invalid json");

        const client = new ApiClient("token", "");

        await expect(
          client.request("https://api.example.com/api/test", "Test API")
        ).rejects.toThrow("Failed to parse response");
      });

      it("当网络错误时应抛出错误", async () => {
        nock("https://api.example.com")
          .get("/api/test")
          .replyWithError("Network error");

        const client = new ApiClient("token", "");

        await expect(
          client.request("https://api.example.com/api/test", "Test API")
        ).rejects.toThrow();
      });

      it("应正确处理带有嵌套 data 的响应", async () => {
        const mockData = {
          data: {
            limits: [
              { type: "TOKENS_LIMIT", percentage: 10 },
              { type: "TIME_LIMIT", percentage: 5 },
            ],
          },
        };

        nock("https://api.example.com")
          .get("/api/test")
          .reply(200, JSON.stringify(mockData));

        const postProcessor = (data) => {
          data.limits = data.limits.map((l) => ({
            type: l.type === "TOKENS_LIMIT" ? "Token usage(5 Hour)" : l.type,
            percentage: l.percentage,
          }));
          return data;
        };

        const client = new ApiClient("token", "");
        const result = await client.request(
          "https://api.example.com/api/test",
          "Test API",
          false,
          postProcessor
        );

        expect(result.limits[0].type).toBe("Token usage(5 Hour)");
      });
    });
  });
});
