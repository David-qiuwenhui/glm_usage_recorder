# 📊 GLM Usage Reporter

> 🔍 一款用于查询和生成 **GLM Coding Plan** 使用情况报告的命令行工具

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ 功能特性

- 🤖 **自动查询** - 从 API 获取实时使用数据
- 📈 **数据统计** - 模型调用次数、Token 使用量统计
- 🔧 **工具追踪** - MCP 工具使用情况监控
- ⚠️ **配额监控** - 实时查看配额限制和使用百分比
- 📋 **时间分布** - 按小时展示使用趋势（24小时滚动窗口）
- 💬 **iMessage 格式** - 生成适合即时通讯的精简报告

---

## 🚀 快速开始

### 📦 前置要求

- Node.js >= 18.0.0

### 🔑 环境变量配置

设置以下环境变量：

```bash
# API 认证令牌
export ANTHROPIC_AUTH_TOKEN="your-auth-token"

# API 基础 URL
# 智谱 AI
export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
# 或 Z.ai
# export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
```

### 🎯 使用方式

#### 方式一：直接执行脚本

```bash
# 生成使用情况报告
node src/usage/get-usage-report.js

# 或添加执行权限后运行
chmod +x src/usage/get-usage-report.js
./src/usage/get-usage-report.js
```

#### 方式二：使用 Shell 脚本

```bash
# 运行报告生成脚本
./usage-report.sh

# 或使用 zsh 显式执行
zsh usage-report.sh
```

---

## 📊 输出示例

运行后将生成 iMessage 友好的精简格式报告：

```text
📊 **GLM Coding Plan 使用情况**

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 **平台**
ZHIPU (智谱 AI)

━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **模型使用**
📞 调用：431 次
💎 Token：5,703,744

📅 近期活跃时段：
- 2026-02-01 23:00 - 157 次调用，1,957,006 Tokens
- 2026-02-02 00:00 - 172 次调用，2,591,300 Tokens
- 2026-02-02 22:00 - 102 次调用，1,155,438 Tokens

━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 **工具使用**
🔍 网络搜索 0
📖 Web Reader 0
📚 Zread 4
🔢 **总计 4 次**

━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **配额限制**
• Token usage(5 Hour): 6%
• MCP usage(1 Month): 8% (8/100)

📋 **MCP 详情**
- mcp__zread__read_file: 8 次

━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 2026/2/3 15:30:00
```

---

## 📁 项目结构

```
glm_usage_recorder/
├── src/                            # 📂 源代码目录
│   └── usage/                      # 📊 使用情况模块
│       ├── get-usage-report.js     # 🔄 主报告生成脚本（含数据查询和解析）
│       ├── input.txt               # 📄 原始数据示例
│       ├── target.md               # 📋 目标输出格式参考
│       └── output.md               # 📝 解析结果输出
├── skills/                         # 🛠️ Claude Code 技能目录
│   └── connect/                    # 🔌 连接相关技能
├── usage-report.sh                 # 🐚 Shell 报告脚本
├── package.json                    # 📦 项目配置
└── README.md                       # 📖 项目文档
```

---

## 🔧 模块说明

### `src/usage/get-usage-report.js`

主报告生成脚本，整合了数据查询和解析功能：

- 🔌 **数据查询模块** - 通过 HTTPS 请求获取 API 数据
- 🧩 **数据解析模块** - 解析 JSON 数据并生成 iMessage 格式报告
- ⏰ **时间窗口** - 24 小时滚动窗口（昨天当前小时至今）

**核心函数：**

| 函数名 | 功能描述 |
| ------ | -------- |
| `fetchData()` | 依次查询模型使用、工具使用、配额限制三个接口 |
| `parseUsageData()` | 解析 API 原始数据，生成 iMessage 格式报告 |
| `queryUsage()` | 通用的 HTTPS 请求封装 |

### `usage-report.sh`

ZSH 包装脚本，用于快速执行报告生成：

```bash
#!/bin/zsh
node /Users/qiuwenhui/Documents/validate_claude_code/glm_usage_recorder/src/usage/get-usage-report.js
```

---

## 🛠️ 开发

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 测试完整流程
./usage-report.sh

# 或直接运行
node src/usage/get-usage-report.js
```

---

## 📝 许可证

[MIT](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## ⏰ 定时任务配置

可使用 macOS LaunchAgents 设置定时执行：

```bash
# 定时任务文件位置
~/Library/LaunchAgents/com.user.run-shortcut.plist

# 启动定时任务
launchctl load ~/Library/LaunchAgents/com.user.run-shortcut.plist

# 验证是否成功
launchctl list | grep com.user.run-shortcut

# 立即手动触发测试
launchctl start com.user.run-shortcut

# 停止定时任务
launchctl unload ~/Library/LaunchAgents/com.user.run-shortcut.plist
```

---

<p align="center">
  <sub>Built with ❤️ for GLM Coding Plan</sub>
</p>
