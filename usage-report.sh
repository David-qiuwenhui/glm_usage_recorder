#!/bin/zsh

# GLM 使用情况报告生成脚本

QUERY_SCRIPT="$HOME/.claude/plugins/cache/zai-coding-plugins/glm-plan-usage/0.0.1/skills/usage-query-skill/scripts/query-usage.mjs"
PARSE_SCRIPT="./usage/parse-usage.mjs"

# 1. 执行 query-usage.mjs 并捕获输出
RAW_DATA=$(node "$QUERY_SCRIPT" 2>&1)

# 2. 将结果传给 parse-usage.mjs
node "$PARSE_SCRIPT" "$RAW_DATA"
