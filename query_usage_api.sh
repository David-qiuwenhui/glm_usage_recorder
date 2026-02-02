#!/bin/bash

# =====================================================
# GLM Coding Plan 使用量查询脚本
# =====================================================

# ==================== 配置区域 ====================

# API Token（请填写你的 GLM API Token）
API_TOKEN="YOUR_API_TOKEN_HERE"

# API 端点（智谱清言 API 地址，根据实际情况调整）
# 可能的端点：
# - https://open.bigmodel.cn/api/paas/v4/user/info
# - https://open.bigmodel.cn/api/paas/v4/usage
# - https://maas-api.cn-beijing.volces.com/api/v1/usage
API_ENDPOINT="https://open.bigmodel.cn/api/paas/v4/user/info"

# 重试配置
MAX_RETRIES=3
TIMEOUT_SECONDS=120

# ==================== 脚本逻辑 ====================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查配置
check_config() {
    if [ "$API_TOKEN" = "YOUR_API_TOKEN_HERE" ]; then
        echo -e "${RED}错误: 请先配置 API_TOKEN${NC}"
        echo "请编辑脚本，将 YOUR_API_TOKEN_HERE 替换为你的实际 API Token"
        exit 1
    fi
}

# 检查输出是否有效
is_valid_output() {
    local output="$1"

    # 输出为空
    if [ -z "$output" ]; then
        return 1
    fi

    # 检查是否包含错误信息
    if echo "$output" | grep -qiE "^(ERROR|error|错误|查询失败| unauthorized |401|403|404|500)"; then
        return 1
    fi

    # 检查是否包含有效的数据标识
    if ! echo "$output" | grep -qiE "(剩余|额度|usage|balance|total|请求|request|success|fail)"; then
        return 1
    fi

    return 0
}

# 格式化输出（处理 JSON 或文本）
format_output() {
    local raw_output="$1"

    # 尝试解析 JSON 格式
    if command -v jq &> /dev/null; then
        echo "$raw_output" | jq '.' 2>/dev/null || echo "$raw_output"
    else
        echo "$raw_output"
    fi
}

# 执行 API 查询
run_query() {
    local response
    local http_code

    # 执行 API 请求
    response=$(curl -s -w "\n%{http_code}" \
        --max-time "$TIMEOUT_SECONDS" \
        --connect-timeout 30 \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_ENDPOINT" 2>&1)

    local exit_code=$?

    # 检查 curl 是否执行成功
    if [ $exit_code -ne 0 ]; then
        echo "ERROR: curl 执行失败，退出码: $exit_code"
        return 1
    fi

    # 分离 HTTP 状态码和响应体
    http_code=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')

    # 检查 HTTP 状态码
    if [ "$http_code" != "200" ]; then
        echo "ERROR: HTTP 请求失败，状态码: $http_code"
        echo "响应内容: $response"
        return 1
    fi

    # 检查输出是否有效
    if ! is_valid_output "$response"; then
        echo "ERROR: 输出结果无效"
        echo "响应内容: $response"
        return 1
    fi

    echo "$response"
    return 0
}

# 主流程
main() {
    echo "========================================"
    echo "GLM Coding Plan 使用量查询"
    echo "========================================"
    echo "API 端点: $API_ENDPOINT"
    echo "最大重试次数: $MAX_RETRIES"
    echo "超时时间: ${TIMEOUT_SECONDS} 秒"
    echo "========================================"
    echo

    # 检查配置
    check_config

    # 检查依赖
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}错误: 未找到 curl 命令${NC}"
        echo "请先安装 curl: brew install curl"
        exit 1
    fi

    # 执行查询（带重试）
    for ((i=1; i<=MAX_RETRIES; i++)); do
        echo -e "[第 $i/$MAX_RETRIES 次尝试] $(date '+%Y-%m-%d %H:%M:%S')"

        result=$(run_query)
        query_exit_code=$?

        if [ $query_exit_code -eq 0 ]; then
            echo
            echo -e "${GREEN}✓ 查询成功！${NC}"
            echo "========================================"
            format_output "$result"
            echo "========================================"
            exit 0
        else
            echo -e "${RED}✗ $result${NC}"

            if [ $i -lt $MAX_RETRIES ]; then
                wait_time=5
                echo -e "${YELLOW}等待 ${wait_time} 秒后重试...${NC}"
                sleep $wait_time
                echo
            fi
        fi
    done

    echo
    echo "========================================"
    echo -e "${RED}✗ 已达到最大重试次数 ($MAX_RETRIES)，查询失败${NC}"
    echo "========================================"
    echo
    echo "可能的原因："
    echo "1. API Token 不正确或已过期"
    echo "2. API 端点 URL 不正确"
    echo "3. 网络连接问题"
    echo "4. API 服务暂时不可用"
    echo
    echo "请检查脚本配置并重试"
    exit 1
}

# 执行主流程
main
