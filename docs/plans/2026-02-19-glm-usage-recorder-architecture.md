# GLM Usage Recorder 架构图生成任务

**任务日期**: 2026-02-19
**执行者**: Claude (GLM-4.7)
**任务类型**: 架构可视化

---

## 📋 任务背景

GLM Usage Recorder 是一个模块化的 Node.js CLI 工具，用于查询和生成 GLM Coding Plan 使用情况报告。项目经过模块化重构后，需要一张清晰的架构图来：

- 可视化展示项目的逻辑执行流程
- 帮助团队成员和贡献者快速理解项目结构
- 明确模块之间的依赖关系和数据流向

---

## 🎯 任务目标

1. **生成 Excalidraw 架构图**: 创建一个可在 https://excalidraw.com 中打开和编辑的架构图
2. **展示完整数据流**: 从入口层到输出层的完整执行流程
3. **清晰的模块关系**: 使用颜色编码区分不同层级和组件类型
4. **包含关键信息**: 执行流程、API 调用、模块依赖关系

---

## 📐 架构设计规划

### 图表结构

采用**左至右数据流**布局，分为五个主要层级：

```
┌────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│   入口层    │ -> │  初始化层   │ -> │  数据获取层   │ -> │  处理层     │ -> │  输出层    │
│  Entry     │    │  Init       │    │  Data Fetch  │    │  Processing │    │  Output    │
└────────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └────────────┘
```

### 颜色编码方案

| 层级        | 边框颜色          | 背景颜色          | 用途                     |
| ----------- | ----------------- | ----------------- | ------------------------ |
| 入口/初始化 | #EA580C / #D97706 | #FFEDD5 / #FEF3C7 | Shell 脚本、主程序、配置 |
| API/数据    | #4F46E5 / #059669 | #E0E7FF / #D1FAE5 | API 客户端、API 调用     |
| 处理        | #DB2777           | #FCE7F3           | 数据处理、报告生成       |
| 输出        | #16A34A           | #DCFCE7           | 控制台输出               |
| 外部依赖    | #DC2626 / #7C3AED | #FEE2E2 / #EDE9FE | API 服务器、环境变量     |

### 关键组件

#### Zone 1: 入口层

- `usage-report.sh` - Shell 包装器
- `get-usage-report.js` - 主入口脚本

#### Zone 2: 初始化层

- `validateEnv()` - 环境变量验证
- `getPlatformConfig()` - 平台配置 (ZHIPU/ZAI)
- `getTimeWindow()` - 时间窗口计算
- `new ApiClient()` - API 客户端初始化

#### Zone 3: 数据获取层

- 三路并行 API 调用:
  - Model Usage API (`/api/monitor/usage/model-usage`)
  - Tool Usage API (`/api/monitor/usage/tool-usage`)
  - Quota Limit API (`/api/monitor/usage/quota/limit`)

#### Zone 4: 处理层

- `processQuotaLimit()` - 配额数据处理
- `generateReport()` - 报告生成
- 辅助函数: `extractJson()`, `generateTimeDistribution()`, `generateMcpDetails()`

#### Zone 5: 输出层

- Console 输出 (iMessage 友好格式)

#### Zone 6: 外部依赖

- GLM API 服务器
- 环境变量

---

## 🔧 执行步骤

### 1. 项目分析

**执行的文件读取**:

- `src/usage/get-usage-report.js` - 主入口，了解完整执行流程
- `usage-report.sh` - Shell 包装器
- `src/lib/config.js` - 环境验证和平台配置
- `src/lib/api-client.js` - API 交互逻辑
- `src/lib/data-processor.js` - 数据处理逻辑
- `src/lib/report-generator.js` - 报告格式化模式
- `src/lib/utils/date.js` - 时间工具函数
- `src/lib/utils/format.js` - 格式化工具函数

**关键发现**:

- 项目采用清晰的分层架构
- 支持 ZAI 和 ZHIPU 两个平台
- 使用三路并行 API 调用提高效率
- 报告输出格式针对 iMessage 优化

### 2. 目录结构创建

```bash
mkdir -p docs/plan
```

### 3. Excalidraw JSON 生成

创建包含以下元素的架构图：

- 60 个图形元素（矩形、文本、箭头）
- 画布尺寸: 1920x1080
- Excalidraw version 2 格式

**文件信息**:

- 大小: 47KB
- 行数: 1944 行
- 位置: `docs/diagrams/glm-usage-recorder-architecture.excalidraw`

### 4. Git 提交

```bash
git add docs/plan/glm-usage-recorder-architecture.excalidraw
git commit -m "docs(architecture): 添加 GLM Usage Recorder Excalidraw 架构图"
git push
```

---

## 📊 最终产物

### 架构图特性

✅ **五层架构可视化**

- ① 入口层 (Shell 脚本 + 主程序)
- ② 初始化层 (环境验证、平台配置、时间窗口)
- ③ API 层 (API 客户端 + 三路并行调用)
- ④ 处理层 (数据处理 + 报告生成)
- ⑤ 输出层 (控制台输出)

✅ **颜色编码系统**: 每层使用不同的颜色方案便于识别

✅ **执行流程箭头**: 清晰展示从左到右的数据流向

✅ **外部依赖标识**: GLM API Server 和环境变量用特殊颜色标记

✅ **模块依赖树**: 底部显示完整的模块依赖关系图

✅ **图例说明**: 包含执行流程、数据流、依赖关系和异步操作的图例

### 文件位置

```
docs/
├── diagrams/
│   └── glm-usage-recorder-architecture.excalidraw
└── plans/
    └── 2024-02-19-glm-usage-recorder-architecture.md (本文件)
```

---

## 💡 技术洞察

### 1. 项目架构分析完成

**模块化分层架构**: 项目采用清晰的分层设计，从入口层到输出层共5层，每层职责单一明确。

**数据流模式**: 数据从环境变量和API获取，经过处理层转换，最终由生成器输出为iMessage友好格式。

**平台配置系统**: 支持多平台配置（ZAI/ZHIPU），通过URL自动检测平台类型并返回相应的API端点。

### 2. Excalidraw 图表设计

**文件结构**: 生成的 Excalidraw JSON 文件包含 1944 行，约 47KB，包含 60 个元素（矩形、文本、箭头）。

**视觉设计**: 使用了 5 种颜色编码方案区分不同层级，便于快速识别和理解。

**可扩展性**: 该架构图可在 Excalidraw.com 中直接打开和编辑，支持实时协作和版本控制。

---

## 📁 目录结构说明

### docs/ 目录组织

```
docs/
├── plans/           # 📝 任务规划文档
│   └── YYYY-MM-DD-task-name.md
└── diagrams/        # 🎨 任务产物（图表、架构图等）
    └── artifact-name.excalidraw
```

**命名规范**:

- `plans/` 目录: 使用 `YYYY-MM-DD-task-name.md` 格式
- `diagrams/` 目录: 使用描述性的 artifact 名称

**用途说明**:

- **plans/** 存放任务规划、执行总结等 Markdown 文档（思考过程）
- **diagrams/** 存放可视化的产物（输出结果）

这样的结构让**规划（思考）**和**产物（输出）**清晰分离，便于：

- 追溯任务决策过程
- 理解产物设计意图
- 后续维护和迭代

---

## ✅ 任务完成状态

- [x] 分析项目结构和关键文件
- [x] 设计架构图布局和颜色方案
- [x] 生成 Excalidraw JSON 文件
- [x] 验证文件格式和内容
- [x] 提交到 Git 仓库
- [x] 推送到远程仓库
- [x] 创建任务总结文档
- [x] 调整目录结构

---

## 🔗 相关资源

- **Excalidraw**: https://excalidraw.com
- **项目仓库**: https://github.com/David-qiuwenhui/glm_usage_recorder
- **架构图位置**: `docs/diagrams/glm-usage-recorder-architecture.excalidraw`

---

**任务状态**: ✅ 完成
**提交哈希**: `81c2122`
