#!/bin/bash
# WeChat Developer Tools Automation Setup Script
# 微信开发者工具自动化配置脚本

set -e

echo "=========================================="
echo "  微信小程序自动化测试配置向导"
echo "=========================================="
echo ""

# 检查端口状态
echo "📡 检查服务端口状态..."
if lsof -i :21065 | grep -q LISTEN; then
    echo "  ✅ 端口21065已开启"
else
    echo "  ❌ 端口21065未开启"
    echo ""
    echo "请在微信开发者工具中开启服务端口:"
    echo "  设置 → 安全设置 → 开启服务端口"
    exit 1
fi

# 检查进程
echo ""
echo "🔍 检查微信开发者工具进程..."
if pgrep -x "wechatdevtools" > /dev/null 2 || pgrep -x "wechatwebdevtools" > /dev/null; then
    echo "  ✅ 微信开发者工具正在运行"
else
    echo "  ⚠️  未检测到微信开发者工具进程"
fi

# 测试HTTP连接
echo ""
echo "🌐 测试HTTP连接..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:21065/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
    echo "  ✅ HTTP服务正常 (状态码: $HTTP_STATUS)"
else
    echo "  ❌ HTTP服务异常 (状态码: $HTTP_STATUS)"
fi

# 测试WebSocket连接
echo ""
echo "🔌 测试WebSocket连接..."
if command -v wscat > /dev/null 2>&1; then
    if timeout 3 wscat -c ws://127.0.0.1:21065 2>/dev/null | head -1 > /dev/null; then
        echo "  ✅ WebSocket连接成功"
    else
        echo "  ⚠️  WebSocket连接失败 (自动化功能可能未启用)"
    fi
else
    echo "  ⚠️  未安装wscat，跳过WebSocket测试"
    echo "     安装命令: npm install -g wscat"
fi

echo ""
echo "=========================================="
echo "  配置检查完成"
echo "=========================================="
echo ""

# 检查项目是否已打开
echo "📂 检查项目状态..."
PROJECT_PATH="${PWD}/packages/miniapp/dist/dev/mp-weixin"
if [ -d "$PROJECT_PATH" ]; then
    echo "  ✅ 项目目录存在: $PROJECT_PATH"
else
    echo "  ❌ 项目目录不存在，请先编译项目"
fi

echo ""
echo "=========================================="
echo "  下一步操作指引"
echo "=========================================="
echo ""
echo "1️⃣  在微信开发者工具中打开项目:"
echo "    $PROJECT_PATH"
echo ""
echo "2️⃣  启用自动化功能:"
echo "    菜单 → 工具 → 自动化 → 开启自动化"
echo ""
echo "3️⃣  运行测试:"
echo "    npm run test:pages"
echo ""
echo "=========================================="