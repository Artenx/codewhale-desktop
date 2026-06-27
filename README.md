# CodeWhale Desktop

基于 [CodeWhale](https://github.com/Hmbown/CodeWhale) 的 macOS 桌面客户端。

## 技术栈

- **后端**: Tauri 2 + Rust
- **前端**: React 19 + TypeScript + Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router v7
- **图标**: Lucide React

## 功能特性

### 对话 (Chat)
- 流式对话，实时显示响应
- 工具调用可视化（状态、输入、输出、耗时）
- 思维链显示
- 上下文压缩 (Compact)
- 线程分叉 (Fork)

### 会话管理 (Sessions)
- 线程创建、恢复、分叉
- 保存/加载会话
- 跨会话持久化

### 任务管理 (Tasks)
- 后台持久任务
- Checklist 进度跟踪
- 任务取消

### 工具管理 (Tools)
- 33+ 内置工具浏览
- 按分类筛选（文件、Shell、Git、Web、测试等）
- 搜索功能

### 全部配置前台化 (Settings)
- **模型提供商**: DeepSeek、OpenRouter、Anthropic、OpenAI、Ollama、vLLM 等 25+ provider
- **MCP 服务器**: 添加/删除 Model Context Protocol 服务器
- **Hooks**: 工具调用前/后钩子，支持 glob 匹配
- **沙箱安全**: macOS Seatbelt、Linux Landlock、Bubblewrap、seccomp
- **技能管理**: Skills 目录配置
- **通用设置**: 工作目录、语言、主题、最大轮次、YOLO 模式

## 架构

```
┌─────────────────────────────────────────────┐
│           Tauri Window (macOS)              │
│  ┌────────────────────────────────────────┐ │
│  │       React Frontend (WebView)         │ │
│  │  Chat │ Sessions │ Tasks │ Tools │ ... │ │
│  └────────────┬───────────────────────────┘ │
│               │ Tauri IPC                   │
│  ┌────────────┴───────────────────────────┐ │
│  │       Rust Backend (Tauri)             │ │
│  │  Config │ Engine Bridge │ API Client   │ │
│  └────────────┬───────────────────────────┘ │
└───────────────┼─────────────────────────────┘
                │ HTTP/SSE
┌───────────────┴─────────────────────────────┐
│         codewhale Runtime API               │
│    (codewhale serve --http 127.0.0.1:18789) │
│  40+ HTTP/SSE endpoints                     │
│  15 Rust crates                             │
│  33+ tools                                  │
│  25+ providers                              │
└─────────────────────────────────────────────┘
```

## 开发

```bash
# 安装前端依赖
cd frontend && npm install

# 开发模式
npm run tauri dev

# 构建 macOS 应用
npm run tauri build
```

## 前置要求

- Node.js 18+
- Rust 1.88+
- codewhale CLI (用于 Runtime API)
- Xcode Command Line Tools (macOS)

## 配置

**所有配置都在应用内界面完成**，无需手动编辑任何配置文件。

配置通过 Tauri IPC 命令保存到应用状态，可在设置页面随时修改。
