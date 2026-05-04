#!/bin/bash

# ===========================================
# 🚀 一键自动化配置脚本
# ===========================================

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🎯 专注星球小程序 - 自动化配置工具${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 步骤 1: 检查环境
echo -e "${YELLOW}📋 步骤 1: 检查环境...${NC}"

# 检查开发者工具
if pgrep -x "wechatdevtools" > /dev/null; then
    echo -e "${GREEN}   ✅ 微信开发者工具已运行${NC}"
else
    echo -e "${RED}   ❌ 微信开发者工具未运行${NC}"
    echo "   请先启动微信开发者工具"
    exit 1
fi

# 检查端口
if lsof -i :21065 | grep -q LISTEN; then
    echo -e "${GREEN}   ✅ 端口 21065 已监听${NC}"
else
    echo -e "${RED}   ❌ 端口 21065 未监听${NC}"
    echo "   将在配置后自动检查"
fi

# 步骤 2: 打开项目
echo ""
echo -e "${YELLOW}📋 步骤 2: 打开项目...${NC}"

PROJECT_DIR="/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin"

if [ -d "$PROJECT_DIR" ]; then
    echo "   正在打开项目..."
    open "$PROJECT_DIR"
    echo -e "${GREEN}   ✅ 项目已打开${NC}"
else
    echo -e "${RED}   ❌ 项目目录不存在${NC}"
    echo "   请先构建项目: cd packages/miniapp && npm run dev"
    exit 1
fi

# 步骤 3: 等待加载
echo ""
echo -e "${YELLOW}📋 步骤 3: 等待项目加载...${NC}"
echo "   请在开发者工具中确认:"
echo "   - 项目已成功导入"
echo "   - 模拟器显示小程序界面"
echo "   - 底部 TabBar 可见"
echo ""
echo -e "${YELLOW}   等待 15 秒...${NC}"
sleep 15

# 步骤 4: 配置指南
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📝 需要您在开发者工具中完成以下操作:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}   操作 1: 开启服务端口${NC}"
echo "   1. 点击菜单: 工具 → 设置 (⌘+,)"
echo "   2. 选择: 安全设置"
echo "   3. ✅ 勾选: 开启服务端口"
echo "   4. 确认端口号: 21065"
echo "   5. 点击: 确定"
echo ""
echo -e "${YELLOW}   操作 2: 开启自动化功能${NC}"
echo "   1. 点击菜单: 工具 → 自动化 (⌘⇧A)"
echo "   2. 点击: 开启自动化 按钮"
echo "   3. 确认状态: 已连接"
echo ""

# 步骤 5: 验证配置
echo -e "${YELLOW}📋 步骤 4: 验证配置...${NC}"
echo ""

# 等待用户操作
read -p "   完成以上操作后，按 Enter 继续验证..." -t 120

# 检查端口
echo ""
echo "   检查端口 21065..."
if lsof -i :21065 | grep -q LISTEN; then
    echo -e "${GREEN}   ✅ 端口已监听${NC}"
    PORT_OK=1
else
    echo -e "${RED}   ❌ 端口未监听${NC}"
    PORT_OK=0
fi

# 检查 WebSocket
echo ""
echo "   测试 WebSocket 连接..."
RESPONSE=$(curl -i -N \
  --header "Upgrade: websocket" \
  --header "Connection: Upgrade" \
  --header "Sec-WebSocket-Key: test" \
  --header "Sec-WebSocket-Version: 13" \
  http://127.0.0.1:21065 \
  2>&1 | head -3)

if echo "$RESPONSE" | grep -q "101"; then
    echo -e "${GREEN}   ✅ WebSocket 连接成功!${NC}"
    WS_OK=1
else
    STATUS_CODE=$(echo "$RESPONSE" | grep "HTTP" | awk '{print $2}')
    echo -e "${RED}   ❌ WebSocket 连接失败 (状态码: $STATUS_CODE)${NC}"
    WS_OK=0
fi

# 步骤 6: 结果
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 配置结果${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $PORT_OK -eq 1 ] && [ $WS_OK -eq 1 ]; then
    echo -e "${GREEN}   🎉 恭喜! 配置全部成功!${NC}"
    echo ""
    
    # 运行测试
    echo -e "${YELLOW}   正在运行页面覆盖率测试...${NC}"
    echo ""
    
    cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
    npm run test:pages
    
else
    echo -e "${RED}   ⚠️  配置未完成${NC}"
    echo ""
    echo "   请检查:"
    echo "   1. 服务端口是否已开启"
    echo "   2. 自动化功能是否已启用"
    echo "   3. 项目是否已完全加载"
    echo ""
    echo "   参考文档:"
    echo "   - WECHAT_AUTOMATION_GUIDE.md (详细图文指南)"
    echo "   - QUICK_REFERENCE.md (快速参考)"
    echo ""
    echo "   或运行诊断:"
    echo "   - cd packages/miniapp && node scripts/quick-test.js"
    echo ""
fi

echo ""
