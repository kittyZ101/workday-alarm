#!/usr/bin/env bash
# 在 Mac 上重新签名快捷指令（iOS 要求签名后才能导入）。
# 改完 scripts/shortcut.raw.shortcut 后运行本脚本，会把签名版写入 public/shortcut.shortcut。
set -e
cd "$(dirname "$0")/.."
OUT="$(mktemp -t signed).shortcut"
shortcuts sign --mode anyone --input scripts/shortcut.raw.shortcut --output "$OUT"
cp "$OUT" public/shortcut.shortcut
echo "已签名并写入 public/shortcut.shortcut"
