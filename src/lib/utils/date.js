/**
 * @file 日期工具函数
 * @description 提供日期格式化和时间窗口计算功能
 */

/**
 * 格式化日期时间为 API 要求的格式
 * @param {Date} date - 要格式化的日期对象
 * @returns {string} 格式化后的日期时间字符串 "yyyy-MM-dd HH:mm:ss"
 * @example
 * formatDateTime(new Date("2026-02-03T15:30:00"))
 * // => "2026-02-03 15:30:00"
 */
export function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取查询时间窗口（24 小时滚动窗口）
 * @description 从昨天当前小时到现在今天当前小时结束
 * @example 当前时间 2026-02-03 15:30
 * - startTime: 2026-02-02 15:00:00
 * - endTime: 2026-02-03 15:59:59
 * @returns {{ startTime: string, endTime: string, queryParams: string }}
 */
export function getTimeWindow() {
  const now = new Date();

  // 查询起始时间（昨天当前小时的整点）
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    now.getHours(),
    0,
    0,
    0
  );

  // 查询结束时间（今天当前小时的最后一秒）
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    59,
    59,
    999
  );

  const startTime = formatDateTime(startDate);
  const endTime = formatDateTime(endDate);
  const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;

  return { startTime, endTime, queryParams };
}
