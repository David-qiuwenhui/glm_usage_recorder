#!/bin/zsh

# GLM 使用情况报告生成脚本

# 设置环境变量
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-cfd7afd415aa433581b5d079bca1e46a.wgr8oGHYHEVKjY78}"
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://open.bigmodel.cn/api/anthropic}"

# 执行报告脚本
node /Users/qiuwenhui/Documents/validate_claude_code/glm_usage_recorder/src/usage/get-usage-report.js