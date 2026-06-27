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

# ── 4. 准备图标 ──
echo "▸ 准备应用图标..."
cd ..

# 检查是否已有有效 .icns（比如用户自己放了一个）
if file src-tauri/icons/icon.icns 2>/dev/null | grep -q "Mac OS X icon"; then
  echo "  ✅ 已有有效 .icns 图标"
else
  # 尝试用 macOS 工具从源码 logo 生成 .icns
  if command -v sips &>/dev/null && command -v iconutil &>/dev/null; then
    # 优先用项目自带的 SVG 转 PNG
    SVG_SRC="frontend/public/whale.svg"
    ICONSET=src-tauri/icons.iconset
    rm -rf "$ICONSET" src-tauri/icons/icon.icns 2>/dev/null
    mkdir -p "$ICONSET"

    SUCCESS=true
    for size in 16 32 128 256 512; do
      sips -s format png -z $size $size "$SVG_SRC" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null 2>&1 || SUCCESS=false
      if [ "$SUCCESS" = "false" ]; then break; fi
      if [ $size -le 256 ]; then
        double=$((size * 2))
        sips -s format png -z $double $double "$SVG_SRC" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null 2>&1 || true
      fi
    done

    if [ "$SUCCESS" = "true" ] && [ -f "$ICONSET/icon_16x16.png" ]; then
      iconutil -c icns "$ICONSET" -o src-tauri/icons/icon.icns 2>/dev/null || SUCCESS=false
      rm -rf "$ICONSET"
    fi

    if [ "$SUCCESS" = "true" ] && [ -f src-tauri/icons/icon.icns ]; then
      echo "  ✅ .icns 图标已生成"
    else
      echo "  ⚠ 图标生成跳过（Tauri 将使用默认图标）"
      rm -rf "$ICONSET" src-tauri/icons/icon.icns 2>/dev/null
    fi
  else
    echo "  ⚠ sips/iconutil 不可用，跳过图标生成"
    rm -f src-tauri/icons/icon.icns 2>/dev/null
  fi
fi

# 移除无效的占位图标文件（避免 Tauri 报错）
for f in src-tauri/icons/*.png src-tauri/icons/*.icns src-tauri/icons/*.ico; do
  if [ -f "$f" ]; then
    # 检查文件是否有效（至少 100 bytes）
    size=$(wc -c < "$f" 2>/dev/null || echo 0)
    if [ "$size" -lt 100 ]; then
      echo "  ⚠ 移除无效图标: $f"
      rm -f "$f"
    fi
  fi
done

echo ""

# ── 5. 构建 Tauri macOS 应用 ──
echo "▸ 构建 Tauri macOS 应用 (Intel x86_64)..."
npm run tauri build -- --target x86_64-apple-darwin
echo ""

# ── 6. 输出路径 ──
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
echo "  3. 首次打开: 右键 → 打开（绕过 Gatekeeper）"
echo ""
