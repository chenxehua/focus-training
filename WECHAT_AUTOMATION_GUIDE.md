# 微信开发者工具自动化配置完整指南

## 📊 当前状态

### ✅ 已确认正常
- 微信开发者工具: **运行中** (进程数: 1)
- 自动化端口: **47748 已监听**
- 项目构建: **已完成**

### ❌ 需要配置
- **自动化服务**: 未启用 (返回 404)
- **项目加载**: 需要在开发者工具中打开

---

## 🎯 问题诊断

### 诊断结果
```
🔍 测试 HTTP 连接...
状态码: 404
⚠️ 收到 404 响应 - 这通常表示自动化服务未启用

🔍 测试 WebSocket 连接...
❌ WebSocket 连接失败: Unexpected server response: 404

可能的原因:
1. 开发者工具未开启自动化功能
2. 项目未在模拟器中加载
3. 自动化端口配置错误
```

---

## 🚀 配置步骤 (图文版)

### 步骤 1: 打开开发者工具

**方法 1**: 通过终端打开项目
```bash
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin
```

**方法 2**: 手动打开
1. 启动微信开发者工具
2. 点击 **"导入项目"**
3. 选择路径: `packages/miniapp`
4. AppID: `wx003bb69f003c24b9`
5. 点击 **确定**

---

### 步骤 2: 等待项目加载

**在模拟器中确认**:
- ✅ 页面完全显示（不是加载中）
- ✅ 控制台无红色错误
- ✅ 底部TabBar可见（首页、家长报告、个人中心）

**常见等待时间**:
- 首次编译: 30-60 秒
- 热更新: 5-10 秒

---

### 步骤 3: 开启服务端口

#### 3.1 打开设置
```
方法 1: 菜单栏 → 工具 → 设置
方法 2: 快捷键 Cmd + ,
方法 3: 点击右上角设置图标
```

#### 3.2 进入安全设置
在设置窗口中:
1. 点击左侧菜单 **"安全设置"** 或 **"安全"** 标签
2. 找到 **"服务端口"** 选项

#### 3.3 开启端口
```
选项: ☐ 开启服务端口
操作: ☑️ 勾选 "开启服务端口"

确认端口号显示为: 47748
```

#### 3.4 保存设置
- 点击 **"确定"** 或 **"应用"**
- 等待设置生效

---

### 步骤 4: 开启自动化功能

#### 4.1 打开自动化面板
```
方法 1: 菜单栏 → 工具 → 自动化
方法 2: 快捷键 Cmd + Shift + A
方法 3: 点击左侧边栏的 "自动化" 图标
```

#### 4.2 启用自动化
在自动化面板中:
1. 找到 **"自动化"** 开关
2. 点击 **"开启自动化"** 或 **"启用"** 按钮
3. 等待状态更新

#### 4.3 确认状态
应该显示:
```
状态: ✅ 已连接 / Connected
端口: ws://127.0.0.1:47748
```

---

### 步骤 5: 重新运行诊断

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 运行诊断脚本
node scripts/quick-test.js
```

**预期结果**:
```
✅ 微信开发者工具正在运行
✅ 端口 47748 正在监听
✅ WebSocket 连接成功!

📊 诊断结果
✅ 所有检查通过! 可以运行自动化测试
```

---

## 🔍 详细配置位置

### macOS 系统 (当前使用)

#### 菜单路径
```
微信开发者工具
├── 工具 (Tools)
│   ├── 自动化 (Automation)     ← 点击这里
│   ├── 设置 (Settings)        ← 设置端口
│   └── 编译 (Compile)
└── 视图 (View)
    ├── 模拟器 (Simulator)
    └── 调试器 (Debugger)
```

#### 设置位置
```
工具 → 设置 → 安全设置 → 开启服务端口
工具 → 设置 → 安全设置 → 端口号: 47748
```

#### 自动化位置
```
工具 → 自动化 → 开启自动化按钮
```

---

## 💡 常见问题解答

### Q1: 端口已开启但仍然返回 404?

**A**: 服务端口和自动化端口是不同的!
- **服务端口** (Settings → 安全设置): 允许外部访问
- **自动化端口**: 需要额外开启自动化功能

**解决**:
1. 确认服务端口开启
2. 点击 **工具 → 自动化**
3. 点击 **开启自动化** 按钮

---

### Q2: 项目已打开但自动化连接失败?

**A**: 可能是以下原因:

1. **项目未完全加载**
   - 等待模拟器显示完整页面
   - 检查控制台无错误

2. **需要切换页面**
   - 在模拟器中点击任意 TabBar 页面
   - 触发页面导航

3. **自动化服务未响应**
   - 重启开发者工具
   - 重新打开项目

---

### Q3: 如何确认自动化已启用?

**A**: 检查以下任一条件:

1. **UI 状态**: 自动化面板显示 "已连接"
2. **网络请求**: WebSocket 连接成功 (101 协议切换)
3. **控制台日志**: 无 "自动化未启用" 错误

**快速检查命令**:
```bash
# 方法 1: WebSocket 测试
curl -i -N \
  --header "Upgrade: websocket" \
  --header "Connection: Upgrade" \
  http://127.0.0.1:47748

# 期望: HTTP/1.1 101 Switching Protocols

# 方法 2: 运行诊断脚本
cd packages/miniapp
node scripts/quick-test.js

# 期望: ✅ 所有检查通过!
```

---

### Q4: 项目路径是什么?

**A**: 
```
项目根目录:
/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

源代码:
/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/src

构建输出 (在开发者工具中打开这个):
/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin
```

---

### Q5: 可以使用命令行打开项目吗?

**A**: 可以! 使用以下命令:

```bash
# 打开项目
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin

# 如果需要指定 AppID
open "wechatdevtools://openproject?project=/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin&appid=wx003bb69f003c24b9"
```

---

## 🧪 完整测试流程

### 快速验证 (推荐)

```bash
# 1. 打开项目
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin

# 2. 等待加载完成 (30秒)
sleep 30

# 3. 运行诊断
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
node scripts/quick-test.js

# 4. 如果成功，运行测试
npm run test:pages
```

### 一键配置 (最简单)

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training

# 运行自动化配置脚本
./setup-automation.sh
```

脚本将自动:
1. 检查环境
2. 打开项目
3. 等待加载
4. 验证连接
5. 运行测试

---

## 📝 配置检查清单

在运行自动化测试前，请逐一确认:

- [ ] **开发者工具已启动**
  ```bash
  pgrep -x "wechatdevtools"
  ```

- [ ] **项目已打开并加载**
  - 模拟器显示小程序界面
  - 底部 TabBar 可见
  - 无编译错误

- [ ] **服务端口已开启**
  - 菜单: 工具 → 设置 → 安全设置
  - 勾选: 开启服务端口
  - 端口号: 47748

- [ ] **自动化功能已启用**
  - 菜单: 工具 → 自动化
  - 点击: 开启自动化按钮
  - 状态: 已连接

- [ ] **端口已监听**
  ```bash
  lsof -i :47748 | grep LISTEN
  ```

- [ ] **WebSocket 连接成功**
  ```bash
  node scripts/quick-test.js
  ```

---

## 🎉 成功标志

### 诊断脚本输出
```
✅ 微信开发者工具正在运行
✅ 端口 47748 正在监听
✅ WebSocket 连接成功!

📊 诊断结果
✅ 所有检查通过! 可以运行自动化测试
```

### 自动化测试输出
```
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
专注星球小程序 - 页面覆盖率测试
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯

🔌 正在连接开发者工具...
✅ 连接成功!

📍 [1/29] 测试: 首页 (pages/index/index)
   ✅ 页面加载成功 (1234ms)
```

---

## 🚨 紧急情况处理

### 情况 1: 开发者工具崩溃

**症状**: 工具无响应或闪退

**解决**:
1. 强制退出: `killall wechatdevtools`
2. 重新启动
3. 重新打开项目

---

### 情况 2: 端口被占用

**症状**: `Address already in use`

**解决**:
1. 检查占用进程: `lsof -i :47748`
2. 结束占用进程: `kill -9 <PID>`
3. 或更改端口（在开发者工具设置中）

---

### 情况 3: 项目编译失败

**症状**: 控制台显示红色错误

**解决**:
1. 检查 `src` 目录语法错误
2. 清理构建: `rm -rf dist`
3. 重新编译: `npm run dev`
4. 查看详细错误日志

---

### 情况 4: 权限不足

**症状**: `Operation not permitted`

**解决**:
1. 打开 **系统偏好设置**
2. 进入 **安全性与隐私**
3. 允许 **微信开发者工具** 的辅助功能权限

---

## 📞 获取帮助

如果配置完成后仍然无法连接:

1. **运行完整诊断**
   ```bash
   cd packages/miniapp
   node scripts/quick-test.js
   ```

2. **查看详细日志**
   ```bash
   # 实时监控端口
   lsof -i :47748 -r
   
   # 查看开发者工具日志
   open ~/Library/Logs/
   ```

3. **重启所有服务**
   ```bash
   # 停止开发者工具
   killall wechatdevtools
   
   # 等待 5 秒
   sleep 5
   
   # 重新打开
   open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin
   ```

4. **检查网络设置**
   ```bash
   # 确保 localhost 可用
   ping 127.0.0.1
   
   # 检查防火墙
   sudo system_profiler SPNetworkDataType
   ```

---

## 📚 相关资源

- **配置指南**: `WECHAT_AUTOMATION_SETUP.md`
- **测试脚本**: `packages/miniapp/scripts/quick-test.js`
- **自动化配置脚本**: `setup-automation.sh`
- **测试命令文档**: `TESTING_SUMMARY.md`

---

**文档更新时间**: $(date '+%Y年%m月%d日 %H:%M:%S')
**微信 AppID**: wx003bb69f003c24b9
**自动化端口**: 47748
**项目路径**: /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
