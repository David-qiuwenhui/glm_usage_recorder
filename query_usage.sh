#!/bin/bash

# 配置参数
MAX_RETRIES=3
TIMEOUT_SECONDS=120

# 使用完整路径
CLAUDE_CMD="/Users/qiuwenhui/.nvm/versions/node/v20.19.5/bin/claude"
COMMAND="$CLAUDE_CMD -p \"/glm-plan-usage:usage-query\""

# 检查输出是否有效
is_valid_output() {
    local output="$1"

    # 输出为空
    if [ -z "$output" ]; then
        return 1
    fi

    # 检查是否包含真正的错误信息（排除"失败请求"等正常字段）
    if echo "$output" | grep -qiE "^(ERROR|错误|查询失败|抱歉|不可用|agent not found|技能未|系统错误)"; then
        return 1
    fi

    # 检查是否包含有效的输出标识
    if ! echo "$output" | grep -qE "(使用概况|剩余额度|总请求次数|账户地址|平台)"; then
        return 1
    fi

    return 0
}

# 执行命令（带超时）
run_command() {
    local output
    local exit_code

    # 使用 timeout 命令，超时后返回 124
    output=$(timeout "$TIMEOUT_SECONDS" $COMMAND 2>&1)
    exit_code=$?

    if [ $exit_code -eq 124 ]; then
        echo "ERROR: 命令执行超时（超过 ${TIMEOUT_SECONDS} 秒）" >&2
        return 1
    fi

    if [ $exit_code -ne 0 ]; then
        echo "ERROR: 命令执行失败，退出码: $exit_code" >&2
        return 1
    fi

    # 检查输出是否有效
    if ! is_valid_output "$output"; then
        echo "ERROR: 输出结果无效或包含错误信息" >&2
        return 1
    fi

    echo "$output"
    return 0
}

# 主流程
echo "========================================"
echo "开始查询 AI 大模型使用用量"
echo "最大重试次数: $MAX_RETRIES"
echo "超时时间: ${TIMEOUT_SECONDS} 秒"
echo "========================================"
echo

for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "[第 $i/$MAX_RETRIES 次尝试] $(date '+%Y-%m-%d %H:%M:%S')"

    result=$(run_command)

    if [ $? -eq 0 ]; then
        echo
        echo "✓ 查询成功！输出结果："
        echo "========================================"
        echo "$result"
        echo "========================================"
        exit 0
    else
        echo "✗ 本次尝试失败"

        if [ $i -lt $MAX_RETRIES ]; then
            wait_time=5
            echo "等待 ${wait_time} 秒后重试..."
            sleep $wait_time
            echo
        fi
    fi
done

echo
echo "========================================"
echo "✗ 已达到最大重试次数 ($MAX_RETRIES)，查询失败"
echo "========================================"
exit 1
