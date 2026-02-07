/**
 * @file API 客户端模块
 * @description 封装 HTTPS 请求功能
 */

import https from "https";

/**
 * API 客户端类
 * @description 封装 GLM API 的 HTTPS 请求
 */
export class ApiClient {
  /**
   * 创建 API 客户端实例
   * @param {string} authToken - API 认证令牌
   * @param {string} queryParams - URL 查询参数字符串
   */
  constructor(authToken, queryParams) {
    this.authToken = authToken;
    this.queryParams = queryParams;
  }

  /**
   * 发起 HTTPS GET 请求
   * @param {string} url - 请求的完整 URL
   * @param {string} label - 数据标签（用于日志和错误信息）
   * @param {boolean} [appendQueryParams=true] - 是否附加时间查询参数
   * @param {Function|null} [postProcessor=null] - 响应数据的后处理函数
   * @returns {Promise<Object>} 解析后的 JSON 数据
   * @throws {Error} 当 HTTP 状态码非 200 或请求失败时抛出错误
   */
  request(url, label, appendQueryParams = true, postProcessor = null) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + (appendQueryParams ? this.queryParams : ""),
        method: "GET",
        headers: {
          Authorization: this.authToken,
          "Accept-Language": "en-US,en",
          "Content-Type": "application/json",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`[${label}] HTTP ${res.statusCode}\n${data}`));
          }

          try {
            const json = JSON.parse(data);
            let outputData = json.data || json;
            // 应用后处理器（如果有）
            if (postProcessor && json.data) {
              outputData = postProcessor(json.data);
            }
            resolve(outputData);
          } catch (error) {
            reject(new Error(`[${label}] Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on("error", reject);
      req.end();
    });
  }
}
