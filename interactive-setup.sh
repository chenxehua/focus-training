#!/bin/bash

# ===========================================
# 🎯 交互式自动化配置向导
# ===========================================

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 清除屏幕
clear

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║   🎯 微信开发者工具自动化 - 交互式配置向导            ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 函数定义
pause() {
    echo ""
    read -p "按 Enter 键继续..." -t 60
}

check_port() {
    if lsof -i :21065 | grep -q LISTEN; then
        echo -e "${GREEN}   ✅ 端口 21065 已监听${NC}"
        return 0
    else
        echo -e "${RED}   ❌ 端口 21065 未监听${NC}"
        return 1
    fi
}

check_websocket() {
    RESPONSE=$(curl -i -N \
      --header "Upgrade: websocket" \
      --header "Connection: Upgrade" \
      --header "Sec-WebSocket-Key: test" \
      --header "Sec-WebSocket-Version: 13" \
      http://127.0.0.1:21065 \
      2>&1 | head -3)
    
    if echo "$RESPONSE" | grep -q "101"; then
        echo -e "${GREEN}   ✅ WebSocket 连接成功!${NC}"
        return 0
    else
        echo -e "${RED}   ❌ WebSocket 连接失败 (状态码: $(echo "$RESPONSE" | grep "HTTP" | awk '{print $2}'))"
        return 1
    fi
}

# ===========================================
# 步骤 1: 欢迎和检查
# ===========================================
echo -e "${YELLOW}📋 步骤 1: 环境检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "正在检查环境..."

# 检查开发者工具
if pgrep -x "wechatdevtools" > /dev/null; then
    echo -e "${GREEN}   ✅ 微信开发者工具已运行${NC}"
else
    echo -e "${RED}   ❌ 微信开发者工具未运行${NC}"
    echo ""
    echo "请先启动微信开发者工具"
    exit 1
fi

# 检查端口
check_port
PORT_STATUS=$?

echo ""
pause

# ===========================================
# 步骤 2: 打开项目
# ===========================================
clear
echo -e "${YELLOW}📋 步骤 2: 打开项目${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "现在将在微信开发者工具中打开项目..."
echo ""

# 打开项目
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin

echo -e "${GREEN}✅ 项目已打开!${NC}"
echo ""
echo "请在开发者工具中确认:"
echo "  1. 项目已成功导入"
echo "  2. 模拟器显示小程序界面"
echo "  3. 底部 TabBar 可见 (首页、家长报告、个人中心)"
echo "  4. 无编译错误"
echo ""
echo "⏳ 等待 10 秒让项目加载..."
sleep 10

echo ""
pause

# ===========================================
# 步骤 3: 开启服务端口
# ===========================================
clear
echo -e "${YELLOW}📋 步骤 3: 开启服务端口${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "现在需要开启服务端口..."
echo ""
echo "请在微信开发者工具中执行以下操作:"
echo ""
echo -e "${CYAN}步骤 3.1: 打开设置${NC}"
echo "   方法 1: 点击菜单 工具 → 设置"
echo "   方法 2: 按快捷键 ⌘ + , (Cmd + ,)"
echo ""
pause

echo ""
echo -e "${CYAN}步骤 3.2: 进入安全设置${NC}"
echo "   在设置窗口中:"
echo "   - 点击左侧菜单 '安全设置' 或 '安全' 标签"
echo ""
pause

echo ""
echo -e "${CYAN}步骤 3.3: 开启服务端口${NC}"
echo "   找到 '服务端口' 选项:"
echo "   - ✅ 勾选 '开启服务端口'"
echo "   - 确认端口号显示为: ${GREEN}21065${NC}"
echo ""
pause

echo ""
echo -e "${CYAN}步骤 3.4: 保存设置${NC}"
echo "   点击 '确定' 或 '应用' 按钮"
echo ""

pause

echo ""
echo "⏳ 等待配置生效..."
sleep 2

# 检查端口
echo ""
echo "正在验证端口配置..."
if check_port; then
    echo -e "${GREEN}✅ 服务端口配置成功!${NC}"
else
    echo -e "${RED}❌ 服务端口配置失败，请重试${NC}"
fi

pause

# ===========================================
# 步骤 4: 开启自动化
# ===========================================
clear
echo -e "${YELLOW}📋 步骤 4: 开启自动化功能${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "现在需要开启自动化功能..."
echo ""
echo "请在微信开发者工具中执行以下操作:"
echo ""
echo -e "${CYAN}步骤 4.1: 打开自动化面板${NC}"
echo "   方法 1: 点击菜单 工具 → 自动化"
echo "   方法 2: 按快捷键 ⌘⇧ + A (Cmd + Shift + A)"
echo ""
pause

echo ""
echo -e "${CYAN}步骤 4.2: 启用自动化${NC}"
echo "   在自动化面板中:"
echo "   - 找到 '自动化' 开关"
echo "   - 点击 '开启自动化' 或 '启用' 按钮"
echo "   - 等待状态更新"
echo ""
pause

echo ""
echo -e "${CYAN}步骤 4.3: 确认状态${NC}"
echo "   应该显示:"
echo "   - 状态: ${GREEN}已连接${NC} 或 ${GREEN}Connected${NC}"
echo "   - 端口: ws://127.0.0.1:21065"
echo ""

pause

echo "⏳ 等待自动化服务启动..."
sleep 3

echo ""
echo "正在验证自动化连接..."
if check_websocket; then
    echo -e "${GREEN}✅ 自动化配置成功!${NC}"
    AUTOMATION_SUCCESS=1
else
    echo -e "${RED}❌ 自动化连接失败${NC}"
    AUTOMATION_SUCCESS=0
fi

pause

# ===========================================
# 步骤 5: 验证配置
# ===========================================
clear
echo -e "${YELLOW}📋 步骤 5: 最终验证${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "正在运行完整诊断..."
echo ""

# 检查端口
echo "1️⃣ 端口状态:"
check_port
PORT_OK=$?

echo ""

# 检查 WebSocket
echo "2️⃣ WebSocket 连接:"
check_websocket
WS_OK=$?

echo ""

# 总体结果
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $PORT_OK -eq 0 ] && [ $WS_OK -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜! 配置全部成功!${NC}"
    echo ""
    echo "现在可以运行自动化测试了!"
    echo ""
    
    pause
    
    # ===========================================
    # 步骤 6: 运行测试
    # ===========================================
    clear
    echo -e "${YELLOW}📋 步骤 6: 运行自动化测试${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "正在运行页面覆盖率测试..."
    echo ""
    
    cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
    npm run test:pages
    
else
    echo -e "${RED}⚠️  配置未完成${NC}"
    echo ""
    echo "请检查以下步骤:"
    echo "  1. 服务端口是否已开启"
    echo "  2. 自动化功能是否已启用"
    echo "  3. 项目是否已完全加载"
    echo ""
    echo "或者查看详细文档:"
    echo "  cat WECHAT_AUTOMATION_GUIDE.md"
    echo ""
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  配置向导结束${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
