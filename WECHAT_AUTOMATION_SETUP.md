# 微信开发者工具自动化端口配置指南

## 📋 前置条件

### ✅ 已确认状态
- 微信开发者工具: **正在运行** (PID: 57153)
- 自动化端口: **47748 已监听**
- Node.js 环境: **已安装**
- 项目依赖: **已安装** (miniprogram-automator)

### ❌ 当前问题
自动化连接失败，错误信息:
```
Failed connecting to ws://127.0.0.1:47748, 
check if target project window is opened with automation enabled
```

---

## 🔧 配置步骤

### 步骤 1: 确保项目已构建

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 开发模式构建
npm run dev

# 或生产模式构建
npm run build
```

**验证构建成功**:
```bash
ls -lh dist/dev/mp-weixin/
```

应该看到包含以下文件:
- `app.js`
- `app.json`
- `app.wxss`
- `pages/` 目录

### 步骤 2: 打开项目在开发者工具中

#### 方法 A: 通过命令行打开
```bash
# 打开项目
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin
```

#### 方法 B: 手动打开
1. 打开微信开发者工具
2. 点击 **"导入项目"**
3. 选择目录: `/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp`
4. AppID: `wx003bb69f003c24b9`
5. 点击 **"确定"**

### 步骤 3: 开启自动化端口

#### 在开发者工具中配置:

1. **打开项目设置**
   - 点击顶部菜单: **工具** → **设置**
   - 或使用快捷键: `Cmd + ,`

2. **进入安全设置**
   - 在左侧菜单选择: **安全设置**
   - 或直接访问: **安全** 标签页

3. **开启服务端口**
   - ✅ 勾选 **"开启服务端口"**
   - 确认端口号显示为: `47748`

4. **保存设置**
   - 点击 **"确定"** 或 **"应用"**

### 步骤 4: 启用项目自动化功能

#### 在开发者工具中:

1. **打开自动化面板**
   - 点击顶部菜单: **工具** → **自动化**
   - 或使用快捷键: `Cmd + Shift + A`

2. **开启自动化**
   - 点击 **"开启自动化"** 按钮
   - 等待状态变为: **"已连接"**

3. **确认端口**
   - 检查是否连接到: `ws://127.0.0.1:47748`
   - 状态应该显示: **"已连接"** 或 **"Connected"**

### 步骤 5: 等待项目完全加载

**在模拟器中**:
1. 确保项目完全编译完成
2. 查看控制台无错误
3. 模拟器显示小程序界面
4. 页面加载完成（不要停留在加载页面）

---

## 🧪 验证配置

### 方法 1: 使用脚本验证

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 运行页面验证（不需要开发者工具）
node scripts/verify-pages.js

# 运行自动化连接测试
node scripts/test-automator.js --check
```

### 方法 2: WebSocket 连接测试

```bash
# 测试 WebSocket 连接
curl -i -N \
  --header "Upgrade: websocket" \
  --header "Connection: Upgrade" \
  --header "Sec-WebSocket-Key: test" \
  --header "Sec-WebSocket-Version: 13" \
  http://127.0.0.1:47748
```

**预期响应**: HTTP 101 Switching Protocols

### 方法 3: 运行完整测试

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 测试所有页面
npm run test:pages

# 或分别测试
npm run test:pages:tabbar   # TabBar 页面
npm run test:pages:nav      # 导航页面
npm run test:pages:games    # 游戏页面
```

---

## 📊 预期结果

### ✅ 配置成功
```
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
专注星球小程序 - 页面覆盖率测试
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯

🔌 正在连接开发者工具...
✅ 连接成功!

📍 [1/29] 测试: 首页 (pages/index/index)
   ✅ 页面加载成功 (1234ms)
   📊 元素数量: 42
   📸 截图: pages-index-index-1234567890.png
...
```

### ❌ 配置失败
```
🔌 正在连接开发者工具...
❌ 连接失败!
   请确保:
   1. 微信开发者工具已启动
   2. 已开启自动化端口
   3. 项目已在模拟器中打开
```

---

## 🔍 常见问题排查

### 问题 1: 端口未监听

**检查**:
```bash
lsof -i :47748
```

**解决方案**:
1. 重启微信开发者工具
2. 在设置中重新开启服务端口
3. 检查是否有防火墙阻止

### 问题 2: 连接被拒绝

**检查**:
```bash
# 查看详细错误
curl -v http://127.0.0.1:47748 2>&1 | head -20
```

**解决方案**:
1. 确保项目在开发者工具中完全加载
2. 尝试点击模拟器中的页面切换
3. 检查自动化状态是否为"已连接"

### 问题 3: 连接超时

**检查**:
```bash
# 测试网络延迟
ping 127.0.0.1
```

**解决方案**:
1. 关闭其他占用资源的程序
2. 等待项目完全编译完成
3. 增加超时时间（在测试脚本中修改 timeout 值）

### 问题 4: 项目未打开

**检查**:
- 开发者工具中是否显示项目界面
- 模拟器中是否有小程序内容

**解决方案**:
1. 重新导入项目
2. 确保项目路径正确
3. 点击"编译"按钮重新编译

---

## 📝 配置检查清单

在运行测试前，请确认以下所有项目都已完成:

- [ ] 项目已构建 (npm run dev 或 npm run build)
- [ ] 项目已在开发者工具中打开
- [ ] 开发者工具已开启服务端口 (47748)
- [ ] 自动化功能已启用
- [ ] 项目在模拟器中完全加载
- [ ] 无编译错误
- [ ] 端口已确认监听: `lsof -i :47748`

---

## 🚀 快速测试命令

### 一键配置并测试

```bash
#!/bin/bash

echo "🔧 开始配置微信开发者工具自动化..."

# 1. 构建项目
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
echo "📦 正在构建项目..."
npm run build

# 2. 打开项目
echo "📂 正在打开项目..."
open dist/dev/mp-weixin

# 3. 等待加载
echo "⏳ 等待项目加载 (30秒)..."
sleep 30

# 4. 检查端口
echo "🔌 检查端口状态..."
lsof -i :47748

# 5. 运行测试
echo "🧪 运行自动化测试..."
npm run test:pages

echo "✅ 配置完成!"
```

---

## 📞 获取帮助

如果配置过程中遇到问题:

1. **查看日志**: 开发者工具控制台
2. **检查网络**: 确认 localhost 可访问
3. **重启工具**: 有时重启可以解决连接问题
4. **查看文档**: [miniprogram-automator 官方文档](https://www.npmjs.com/package/miniprogram-automator)

---

**配置完成时间**: $(date '+%Y年%m月%d日 %H:%M:%S')
