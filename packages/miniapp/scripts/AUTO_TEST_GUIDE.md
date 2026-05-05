# 专注星球 - 自动化测试与自动修复系统

## 📋 概述

本系统为「专注星球」微信小程序提供完整的自动化测试与自动修复能力，覆盖：
- ✅ API 接口测试
- ✅ 页面 UI 自动化测试
- ✅ 小程序自动化 (miniprogram-automator)
- ✅ 自动问题诊断与修复

---

## 🚀 快速开始

### 1. 运行所有测试
```bash
cd packages/miniapp
node scripts/auto-test-fix.js
```

### 2. 仅运行 API 测试
```bash
node scripts/auto-test-fix.js --api
```

### 3. 仅运行 UI 测试
```bash
node scripts/auto-test-fix.js --ui
```

### 4. 自动修复问题
```bash
node scripts/auto-test-fix.js --fix
```

### 5. 跳过自动修复
```bash
node scripts/auto-test-fix.js --no-fix
```

---

## 📁 测试文件

| 文件 | 用途 |
|------|------|
| `auto-test-fix.js` | 主测试入口，自动诊断与修复 |
| `test-automator.js` | 小程序自动化测试 |
| `test-games.js` | 游戏专项测试 |
| `test-pages.js` | 页面导航测试 |
| `verify-pages.js` | 页面验证工具 |

---

## 🔧 测试报告

测试报告保存在：
```
packages/miniapp/test-results/reports/
```

---

## 📊 Playwright E2E 测试

### 运行 Playwright 测试
```bash
# 在项目根目录
npm run e2e:api        # API 测试
npm run e2e:login      # 登录流程测试
npm run e2e:home        # 首页测试
npm run e2e:all        # 所有测试
npm run e2e:headed     # 有头模式 (显示浏览器)
npm run e2e:ui         # UI 模式

# 查看报告
npm run e2e:report
```

### Playwright 配置文件
- `e2e/playwright.config.ts` - API 测试配置
- `e2e/playwright.config.wechat.ts` - 微信小程序测试配置

---

## 🎯 测试覆盖

### API 测试
- ✅ 健康检查 `/api/health`
- ✅ 游戏列表 `/api/game/list`
- ✅ 认证接口 `/api/auth/wx-login`
- ✅ 用户信息 `/api/user/info`
- ✅ 家长学院 `/api/academy/*`

### 页面测试
- ✅ 登录页 `pages/login/index`
- ✅ 首页 `pages/index/index`
- ✅ 游戏列表 `pages/games/games`
- ✅ 个人中心 `pages/profile/profile`
- ✅ 家长界面 `pages/parent/parent`

---

## 🔍 自动修复能力

系统自动检测并修复以下问题：

| 问题类型 | 修复方案 |
|---------|---------|
| Rate limit 限制 | 调整限流阈值 |
| API 配置缺失 | 创建 .env 配置文件 |
| 数据库连接失败 | 提示配置检查 |
| 服务未启动 | 提示启动服务 |

---

## 📝 常用命令

```bash
# 启动后端服务
npm run dev:server

# 启动小程序开发构建
npm run dev:miniapp

# 微信开发者工具自动化连接
node scripts/test-automator.js

# 运行 Playwright 测试 (需要后端服务运行)
npx playwright test
```

---

## ⚠️ 注意事项

1. **后端服务必须运行** - API 测试需要 `npm run dev:server`
2. **微信开发者工具** - UI 自动化需要开启自动化端口 (47748)
3. **Rate limit** - 测试时注意限流，可使用 `--no-fix` 跳过修复

---

## 📄 测试结果示例

```
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
   专注星球 - 自动化测试与修复系统
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯

📘 开始诊断问题...
✅ ✅ 后端服务正常
✅ ✅ 数据库连接正常

========== API 测试 ==========
📘 测试: API 健康检查
📘 测试: 游戏列表 API
   找到 9 个游戏
📘 测试: 认证 API (缺少参数)

==================================================
📊 测试报告
==================================================
⏱️  总耗时: 0.38s
📝 总测试数: 3
✅ 通过: 3
❌ 失败: 0
🔧 修复数: 0
📈 通过率: 100.0%
==================================================
```