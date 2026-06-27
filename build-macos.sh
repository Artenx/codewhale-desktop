#!/bin/bash
# ═══════════════════════════════════════════════════════════
# CodeWhale Desktop — macOS Intel 构建脚本
# 在 MacBook Pro (Intel, macOS 12.4+) 上运行此脚本
# ═══════════════════════════════════════════════════════════
set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║  CodeWhale Desktop — macOS Build (Intel x86_64) ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. 环境检查 ──
echo "▸ 检查环境..."

if ! command -v node &>/dev/null; then
  echo "❌ Node.js 未安装。请先安装:"
  echo "   brew install node@20"
  echo "   或从 https://nodejs.org 下载"
  exit 1
fi

if ! command -v cargo &>/dev/null; then
  echo "❌ Rust 未安装。请先安装:"
  echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

if ! command -v xcodebuild &>/dev/null; then
  echo "❌ Xcode Command Line Tools 未安装:"
  echo "   xcode-select --install"
  exit 1
fi

NODE_VER=$(node --version)
RUST_VER=$(rustc --version)
echo "  Node: $NODE_VER"
echo "  Rust: $RUST_VER"
echo "  macOS: $(sw_vers -productVersion)"
echo "  Arch: $(uname -m)"
echo ""

# ── 2. 安装前端依赖 ──
echo "▸ 安装前端依赖..."
cd frontend
npm install
echo "  ✅ 前端依赖安装完成"
echo ""

# ── 3. 构建前端 ──
echo "▸ 构建前端..."
npm run build
echo "  ✅ 前端构建完成"
echo ""

# ── 4. 生成 macOS 图标 ──
echo "▸ 生成 .icns 图标..."
ICONSET=src-tauri/icons/icon.iconset
mkdir -p "$ICONSET"
for size in 16 32 64 128 256 512; do
  sips -z $size $size src-tauri/icons/256x256.png --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  if [ $size -le 256 ]; then
    sips -z $((size*2)) $((size*2)) src-tauri/icons/256x256.png --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null 2>&1 || true
  fi
done
sips -z 512 512 src-tauri/icons/256x256.png --out "$ICONSET/icon_256x256@2x.png" >/dev/null 2>&1 || true
iconutil -c icns "$ICONSET" -o src-tauri/icons/icon.icns
rm -rf "$ICONSET"
echo "  ✅ .icns 图标生成完成"
echo ""

# ── 5. 构建 Tauri macOS 应用 ──
echo "▸ 构建 Tauri macOS 应用 (Intel x86_64)..."
cd ..
npm run tauri build -- --target x86_64-apple-darwin
echo ""

# ── 5. 输出路径 ──
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ 构建完成!                                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "产物位置:"
echo "  DMG:  src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/"
echo "  APP:  src-tauri/target/x86_64-apple-darwin/release/bundle/macos/"
echo ""
echo "安装方式:"
echo "  1. 打开 .dmg 文件"
echo "  2. 拖拽 CodeWhale Desktop 到 Applications"
echo "  3. 首次打开需要: 系统偏好设置 → 安全性与隐私 → 仍要打开"
echo ""
