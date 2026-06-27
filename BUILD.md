# CodeWhale Desktop macOS 构建指南

## 方案一：GitHub Actions（推荐，免费）

### 第 1 步：创建 GitHub 仓库

1. 打开 https://github.com/new
2. Repository name: `codewhale-desktop`
3. 选择 **Public**（公开 = 免费无限构建额度）
4. 点击 Create repository

### 第 2 步：上传代码

在解压后的 codewhale-desktop 目录中执行：

```bash
cd codewhale-desktop

# 初始化 git
git init
git add .
git commit -m "initial commit"

# 关联远程仓库（替换成你的用户名）
git remote add origin https://github.com/你的用户名/codewhale-desktop.git
git branch -M main
git push -u origin main
```

### 第 3 步：触发构建

代码推送后，GitHub Actions 会自动运行。你也可以手动触发：

1. 打开仓库页面 → Actions 标签
2. 左侧选择 "Build macOS App"
3. 点击 "Run workflow" → "Run workflow"
4. 等待 10-15 分钟

### 第 4 步：下载安装包

构建完成后：

1. 进入 Actions → 点击最新的 workflow run
2. 页面底部 **Artifacts** 区域
3. 下载 `codewhale-desktop-macos-intel`
4. 解压得到 `.dmg` 安装包

### 第 5 步：安装使用

1. 双击 `.dmg` 文件
2. 拖拽 `CodeWhale Desktop` 到 `Applications`
3. 首次打开：右键 → 打开（绕过 Gatekeeper）

---

## 方案二：本地构建

如果你不想用 GitHub，直接在 MacBook 上构建：

```bash
# 前置条件（只需一次）
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 构建
cd codewhale-desktop
chmod +x build-macos.sh
./build-macos.sh
```

产物在 `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/`
