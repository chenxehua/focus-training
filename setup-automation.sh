#!/bin/bash

# ========================================
# 专注星球小程序 - 自动化端口配置脚本
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp"
DIST_DIR="$PROJECT_DIR/dist/dev/mp-weixin"

echo ""
echo -e "${BLUE}🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧${NC}"
echo -e "${BLUE}  专注星球小程序 - 自动化配置工具${NC}"
echo -e "${BLUE}🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧${NC}"
echo ""

# ========================================
# 步骤 1: 检查环境
# ========================================
echo -e "${YELLOW}步骤 1: 检查环境...${NC}"

# 检查微信开发者工具
if pgrep -x "wechatdevtools" > /dev/null; then
    echo -e "${GREEN}✅ 微信开发者工具已启动${NC}"
else
    echo -e "${RED}❌ 微信开发者工具未启动${NC}"
    echo "请先启动微信开发者工具"
    exit 1
fi

# 检查端口
if lsof -i :47748 | grep -q LISTEN; then
    echo -e "${GREEN}✅ 自动化端口 (47748) 已开启${NC}"
else
    echo -e "${RED}❌ 自动化端口 (47748) 未监听${NC}"
    echo "请在开发者工具中: 设置 → 安全设置 → 开启服务端口"
    exit 1
fi

# 检查项目构建
if [ -d "$DIST_DIR" ]; then
    echo -e "${GREEN}✅ 项目已构建${NC}"
else
    echo -e "${RED}❌ 项目未构建${NC}"
    echo "正在构建项目..."
    cd "$PROJECT_DIR"
    npm run build
fi

echo ""

# ========================================
# 步骤 2: 打开项目
# ========================================
echo -e "${YELLOW}步骤 2: 打开项目...${NC}"

if [ -d "$DIST_DIR" ]; then
    echo "正在打开项目: $DIST_DIR"
    open "$DIST_DIR"
    echo -e "${GREEN}✅ 项目已在开发者工具中打开${NC}"
else
    echo -e "${RED}❌ 项目目录不存在${NC}"
    exit 1
fi

echo ""

# ========================================
# 步骤 3: 等待加载
# ========================================
echo -e "${YELLOW}步骤 3: 等待项目加载...${NC}"
echo "请在开发者工具中确认:"
echo "  1. 项目已完全编译"
echo "  2. 模拟器中显示小程序界面"
echo "  3. 无编译错误"
echo ""
echo -e "${YELLOW}⏳ 等待 20 秒...${NC}"
sleep 20

echo ""

# ========================================
# 步骤 4: 验证连接
# ========================================
echo -e "${YELLOW}步骤 4: 验证连接...${NC}"

# 测试 WebSocket 连接
echo "正在测试 WebSocket 连接..."

RESPONSE=$(curl -i -N \
  --header "Upgrade: websocket" \
  --header "Connection: Upgrade" \
  --header "Sec-WebSocket-Key: test" \
  --header "Sec-WebSocket-Version: 13" \
  http://127.0.0.1:47748 \
  2>&1 | head -3)

if echo "$RESPONSE" | grep -q "101"; then
    echo -e "${GREEN}✅ WebSocket 连接成功!${NC}"
    echo "连接协议: HTTP/1.1 101 Switching Protocols"
else
    echo -e "${YELLOW}⚠️  WebSocket 连接响应异常${NC}"
    echo "但端口已监听，继续尝试运行测试..."
fi

echo ""

# ========================================
# 步骤 5: 运行测试
# ========================================
echo -e "${YELLOW}步骤 5: 运行页面自动化测试...${NC}"

cd "$PROJECT_DIR"

# 询问是否运行测试
echo ""
read -p "是否运行页面自动化测试? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}开始运行测试...${NC}"
    echo ""
    
    # 运行页面验证
    node scripts/verify-pages.js
    
    echo ""
    echo -e "${BLUE}开始运行自动化测试...${NC}"
    
    # 运行页面自动化测试
    npm run test:pages
    
    echo ""
    echo -e "${GREEN}✅ 测试完成!${NC}"
else
    echo ""
    echo -e "${YELLOW}跳过测试${NC}"
    echo "你可以稍后手动运行:"
    echo "  cd $PROJECT_DIR"
    echo "  npm run test:pages"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  配置完成!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📝 详细配置指南请查看:"
echo "  WECHAT_AUTOMATION_SETUP.md"
echo ""
echo "🔧 可用的测试命令:"
echo "  cd $PROJECT_DIR"
echo "  npm run test:pages          # 测试所有页面"
echo "  npm run test:pages:tabbar   # TabBar 页面"
echo "  npm run test:pages:nav      # 导航页面"
echo "  npm run test:pages:games    # 游戏页面"
echo ""

# ========================================
# 成功提示
# ========================================
echo -e "${GREEN}🎉 恭喜! 自动化环境已配置完成!${NC}"
echo ""
echo "如果测试仍然失败，请检查:"
echo "  1. 开发者工具中是否开启了自动化功能 (工具 → 自动化)"
echo "  2. 项目是否在模拟器中完全加载"
echo "  3. 是否有编译错误"
echo ""

exit 0
