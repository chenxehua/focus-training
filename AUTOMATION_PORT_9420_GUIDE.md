# 自动化端口 9420 配置指南

## 📋 当前状态

**自动化端口**: 9420 (已配置)
**微信开发者工具**: ✅ 已运行 (9个进程)
**端口监听状态**: ❌ 未监听 9420
**自动化状态**: ❌ 未启用

---

## 🔧 启用自动化端口的步骤

### 方案一: 通过微信开发者工具界面启用

1. **打开微信开发者工具**
   ```
   open -a "WeChat DevTools"
   ```
   或点击 Dock 栏的微信开发者工具图标

2. **打开项目**
   - 点击「导入项目」
   - 选择路径: `packages/miniapp/dist/dev/mp-weixin`
   - AppID: `wx003bb69f003c24b9`

3. **等待项目完全加载**
   - 确认模拟器中已显示小程序界面

4. **开启自动化端口**
   - 方式 A: 点击顶部菜单 **工具 → 自动化 → 开启自动化**
   - 方式 B: 点击顶部菜单 **工具 → 自动化 → 开启自动化测试**
   - 方式 C: **设置 → 安全设置 → 开启服务端口**

5. **确认端口号**
   - 打开 **设置 → 安全设置**
   - 查看当前自动化端口是否为 9420
   - 如果不是,点击修改设置为 9420

6. **验证端口监听**
   ```bash
   lsof -i :9420 -sTCP:LISTEN
   ```
   如果输出类似以下内容,说明端口已启用:
   ```
   COMMAND   PID   USER   FD   TYPE   DEVICE  SIZE/OFF  NODE NAME
   wechatdevt 2436 czh   24u  IPv4   0x...   0t0       TCP *:9420 (LISTEN)
   ```

---

### 方案二: 使用自动化脚本启用

运行提供的自动化配置脚本:

```bash
# 方法 1: 使用配置脚本
./configure-now.sh

# 方法 2: 使用快速测试脚本
cd packages/miniapp
node scripts/quick-test.js
```

---

## ▶️ 启动自动化测试

### 前置检查

```bash
# 1. 检查开发者工具进程
ps aux | grep wechatwebdevtools | grep -v grep

# 2. 检查端口 9420 监听状态
lsof -i :9420 -sTCP:LISTEN

# 3. 检查项目是否加载
ls packages/miniapp/dist/dev/mp-weixin
```

### 运行测试

端口 9420 启用后,运行以下命令:

```bash
# 方法 1: 使用诊断工具
node diagnose-automation.js

# 方法 2: 使用自动化测试
cd packages/miniapp
node scripts/test-automator.js

# 方法 3: 运行页面测试
npm run test:pages

# 方法 4: 运行完整测试套件
npm run test:auto
```

---

## ⚠️ 常见问题

### Q1: 端口 9420 已启用但仍然连接失败

**检查项**:
1. 确认端口号完全匹配 (9420)
2. 确认项目已在模拟器中加载
3. 尝试重新打开项目
4. 重启微信开发者工具

```bash
# 诊断连接
curl http://127.0.0.1:9420/
```

### Q2: 找不到自动化选项

**位置**:
- Mac: 顶部菜单栏 → 工具 → 自动化
- 或: 设置 → 安全设置 → 服务端口

### Q3: 端口被占用

```bash
# 检查哪个进程占用端口
lsof -i :9420

# 结束占用进程
kill -9 <PID>
```

### Q4: 项目编译失败

```bash
# 重新编译小程序
cd packages/miniapp
npm run dev
```

---

## 📊 测试验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 开发者工具进程 | ✅ | 9个进程正在运行 |
| 端口 9420 监听 | ❌ | 需要手动启用 |
| HTTP 连接 | ❌ | 端口未响应 |
| WebSocket 连接 | ❌ | 无法连接 |

---

## 🎯 下一步行动

1. 打开微信开发者工具
2. 打开项目 `packages/miniapp/dist/dev/mp-weixin`
3. 等待项目完全加载
4. 开启自动化端口 (设置为 9420)
5. 运行验证命令:
   ```bash
   node diagnose-automation.js
   ```
6. 运行自动化测试:
   ```bash
   cd packages/miniapp && npm run test:pages
   ```

---

**配置完成时间**: 待完成
**自动化端口**: 9420
**项目路径**: packages/miniapp/dist/dev/mp-weixin