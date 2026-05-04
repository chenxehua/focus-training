# 🚀 微信开发者工具自动化 - 快速参考卡

## ⚡ 30秒配置

### 步骤 1: 打开项目 (10秒)
```bash
open /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin
```

### 步骤 2: 配置端口 (15秒)
1. 工具 → 设置 (Cmd+,)
2. 安全设置
3. ✅ 开启服务端口
4. ✅ 确定

### 步骤 3: 开启自动化 (5秒)
1. 工具 → 自动化 (Cmd+Shift+A)
2. 点击 "开启自动化"
3. 确认状态: 已连接

---

## ✅ 快速验证

```bash
# 诊断连接
cd packages/miniapp && node scripts/quick-test.js

# 期望输出: ✅ 所有检查通过!

# 运行测试
npm run test:pages
```

---

## 📁 关键路径

| 用途 | 路径 |
|------|------|
| **项目源码** | `packages/miniapp/src` |
| **构建输出** | `packages/miniapp/dist/dev/mp-weixin` |
| **测试脚本** | `packages/miniapp/scripts/` |
| **页面文件** | `packages/miniapp/src/pages/` |

---

## 🔧 常用命令

```bash
# 诊断
node scripts/quick-test.js

# 构建
npm run dev

# 测试
npm run test:pages              # 所有页面
npm run test:pages:tabbar       # TabBar
npm run test:pages:nav          # 导航
npm run test:pages:games        # 游戏

# 验证
node scripts/verify-pages.js
```

---

## 🎯 预期结果

```
✅ 29/29 页面文件存在
✅ WebSocket 连接成功
✅ 自动化测试全部通过
```

---

## ⚠️ 常见问题

| 问题 | 解决 |
|------|------|
| 返回 404 | 工具 → 自动化 → 开启自动化 |
| 端口未监听 | 工具 → 设置 → 安全 → 开启服务端口 |
| 连接超时 | 等待30秒后再试 |
| 权限不足 | 系统偏好设置 → 安全性 → 允许访问 |

---

## 📚 完整文档

- `AUTOMATION_SETUP_SUMMARY.md` - 完整配置指南
- `WECHAT_AUTOMATION_GUIDE.md` - 详细图文指南
- `TEST_RESULTS.md` - 测试结果报告

---

**配置时间**: 5-10 分钟
**自动化端口**: 21065
**微信AppID**: wx003bb69f003c24b9
