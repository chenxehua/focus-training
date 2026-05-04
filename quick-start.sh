#!/bin/bash

# ===========================================
# 🚀 微信开发者工具自动化 - 快速启动
# ===========================================

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  微信开发者工具自动化 - 快速启动${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查 1: 开发者工具是否运行
echo -e "${YELLOW}1. 检查开发者工具...${NC}"
if pgrep -x "wechatdevtools" > /dev/null; then
    echo -e "${GREEN}   ✅ 已运行${NC}"
else
    echo -e "${RED}   ❌ 未运行${NC}"
    echo ""
    echo -e "${YELLOW}   请先启动微信开发者工具，然后重新运行此脚本${NC}"
    exit 1
fi

# 检查 2: 端口是否监听
echo -e "${YELLOW}2. 检查端口 21065...${NC}"
if lsof -i :21065 | grep -q LISTEN; then
    echo -e "${GREEN}   ✅ 端口已监听${NC}"
else
    echo -e "${RED}   ❌ 端口未监听${NC}"
    echo ""
    echo -e "${YELLOW}   请在开发者工具中: 设置 → 安全设置 → 开启服务端口${NC}"
    exit 1
fi

# 检查 3: 项目是否构建
echo -e "${YELLOW}3. 检查项目构建...${NC}"
PROJECT_DIR="/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp"
DIST_DIR="$PROJECT_DIR/dist/dev/mp-weixin"

if [ -d "$DIST_DIR" ]; then
    echo -e "${GREEN}   ✅ 已构建${NC}"
else
    echo -e "${YELLOW}   ⚠️ 未构建，开始构建...${NC}"
    cd "$PROJECT_DIR"
    npm run dev > /dev/null 2>&1 &
    sleep 5
    echo -e "${GREEN}   ✅ 正在构建...${NC}"
fi

# 提示用户操作
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  需要您在开发者工具中完成以下操作:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}步骤 1:${NC} 打开项目"
echo "     在开发者工具中导入:"
echo "     $PROJECT_DIR"
echo ""
echo -e "${YELLOW}步骤 2:${NC} 等待加载"
echo "     确认模拟器中显示小程序界面"
echo "     (底部应有3个TabBar: 首页、家长报告、个人中心)"
echo ""
echo -e "${YELLOW}步骤 3:${NC} 开启自动化"
echo "     点击菜单: 工具 → 自动化"
echo "     点击: 开启自动化 按钮"
echo "     确认状态显示: 已连接"
echo ""
echo -e "${YELLOW}步骤 4:${NC} 保存项目"
echo "     点击: 保存 (Cmd+S)"
echo ""

# 询问
read -p "完成以上步骤后，按 Enter 继续测试..." -t 60

# 运行诊断
echo ""
echo -e "${YELLOW}5. 运行诊断测试...${NC}"
cd "$PROJECT_DIR"
node scripts/quick-test.js

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ 配置成功!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}运行测试命令:${NC}"
    echo "  cd $PROJECT_DIR"
    echo "  npm run test:pages"
    echo ""
    
    # 询问是否运行测试
    read -p "是否立即运行页面自动化测试? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}开始测试...${NC}"
        npm run test:pages
    fi
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ❌ 配置未完成${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "请查看详细指南: WECHAT_AUTOMATION_GUIDE.md"
    echo ""
fi

echo ""
