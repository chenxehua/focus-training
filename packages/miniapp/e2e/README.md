# 微信小程序自动化测试指南

## 一、环境准备

### 1. 安装依赖

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp
npm install
```

### 2. 安装微信开发者工具

- 下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- macOS 安装: `brew install --cask wechatwebdevtools`

### 3. 安装 miniprogram-automator

```bash
npm install miniprogram-automator --save-dev
```

---

## 二、配置开发者工具

### 1. 开启自动化端口

1. 打开微信开发者工具
2. 点击顶部菜单 **设置** → **安全设置**
3. 勾选 **开启服务端口**
4. 确认

### 2. 添加项目

1. 点击 **+** 添加项目
2. 项目目录: `packages/miniapp/dist/dev/mp-weixin`
3. AppID: 你的小程序AppID
4. 项目名称: `focus-training`
5. 点击 **确定**

### 3. 获取AppID

在 `.env` 文件中设置:
```bash
MINIAPP_ID=wx1234567890abcdef
```

---

## 三、运行测试

### 方式1: 使用 Playwright 配置运行

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 运行所有测试
npx playwright test --config e2e/playwright.config.wechat.ts

# 运行特定测试
npx playwright test e2e/miniprogram.spec.ts --config e2e/playwright.config.wechat.ts

# 带UI运行
npx playwright test e2e/miniprogram.spec.ts --config e2e/playwright.config.wechat.ts --ui
```

### 方式2: 直接连接开发者工具

```bash
# 设置环境变量
export DEVTOOLS_WS=ws://127.0.0.1:9420
export MINIAPP_ID=wx1234567890abcdef
export API_BASE_URL=http://localhost:3000

# 运行测试
npx playwright test e2e/miniprogram.spec.ts
```

### 方式3: 在开发者工具中运行

1. 打开开发者工具
2. 菜单栏: **工具** → **自动化** → **打开自动化测试面板**
3. 导入测试脚本 `e2e/miniprogram.spec.ts`
4. 点击 **运行**

---

## 四、测试覆盖

### 已覆盖页面 (21个)

| 模块 | 页面 | 测试用例数 |
|------|------|------------|
| 登录 | pages/login/index | 15+ |
| 首页 | pages/index/index | 10+ |
| 游戏列表 | pages/games/index | 12+ |
| 舒尔特方格 | pages/game-schulte/index | 15+ |
| 听觉记忆 | pages/game-audio/index | 8+ |
| 视觉追踪 | pages/game-tracking/index | 5+ |
| 迷宫游戏 | pages/game-maze/index | 5+ |
| 反应速度 | pages/game-reaction/index | 5+ |
| 个人中心 | pages/profile/index | 12+ |
| 成就系统 | pages/achievement/index | 8+ |
| 会员中心 | pages/membership/index | 8+ |
| 家长学院 | pages/academy/* | 15+ |
| 学校管理 | pages/school/* | 15+ |
| 评估报告 | pages/assessment/index | 8+ |
| 推荐系统 | pages/recommendation/index | 8+ |

### 已测试API接口

- 认证系统: 微信登录、手机号登录、验证码发送
- 用户管理: 获取/更新用户信息、孩子管理
- 游戏系统: 游戏列表、游戏详情、游戏记录提交
- 成就系统: 成就列表、成就进度
- 会员系统: 会员状态、套餐列表
- 报告系统: 今日数据、周报
- 评估系统: 能力维度、能力趋势
- 推荐系统: 用户画像、游戏推荐
- 家长学院: 分类、文章、问答
- 学校管理: 仪表盘、教师、班级、学生

---

## 五、常用命令

```bash
cd /Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp

# 启动开发服务器 (需要先启动后端)
npm run dev:server

# 编译小程序
npm run dev

# 运行所有E2E测试
npm run test:e2e

# 运行特定模块测试
npm run test:e2e:login      # 登录模块
npm run test:e2e:home       # 首页模块
npm run test:e2e:games      # 游戏模块
npm run test:e2e:profile    # 个人中心
npm run test:e2e:academy    # 家长学院

# 带UI运行
npm run test:e2e:ui

# 查看测试报告
npm run test:report
```

---

## 六、调试技巧

### 1. 查看页面结构

```typescript
// 在测试中添加
const page = await miniProgram.currentPage()
const data = await page.data()
console.log('页面数据:', data)

// 获取元素
const elements = await page.locator('.class-name').all()
console.log('元素列表:', elements)
```

### 2. 截图

```typescript
// 自动截图已配置，失败时自动保存
// 手动截图
await page.screenshot({ path: 'debug.png' })
```

### 3. 录制操作

```bash
# 使用开发者工具录制
# 工具 → 自动化 → 录制操作 → 保存为 .test.js
```

### 4. 跳过测试

```typescript
test.skip('暂时跳过', async () => {
  // 测试代码
})
```

---

## 七、常见问题

### Q1: 连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:9420
```

**解决**:
1. 确保开发者工具已启动
2. 检查安全设置中是否开启了服务端口
3. 尝试重启开发者工具

### Q2: AppID不匹配

```
Error: appId not match
```

**解决**:
1. 确保 `MINIAPP_ID` 环境变量设置正确
2. 在开发者工具中打开正确的项目

### Q3: 页面元素找不到

```
Error: element not found
```

**解决**:
1. 检查页面路径是否正确
2. 等待页面加载完成 `await wait(1000)`
3. 使用更精确的选择器

### Q4: API测试失败

```
Error: connect ECONNREFUSED localhost:3000
```

**解决**:
1. 启动后端服务器: `npm run dev:server`
2. 检查 `API_BASE_URL` 环境变量

---

## 八、测试报告

运行完成后:

```bash
# HTML报告
npx playwright show-report

# 或直接打开
open playwright-report/index.html
```

报告包含:
- 测试通过/失败统计
- 各模块覆盖率
- 失败测试的截图和日志
- 耗时分析

---

## 九、CI/CD集成

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start backend
        run: npm run dev:server &
      
      - name: Run E2E tests
        run: npx playwright test --config e2e/playwright.config.wechat.ts
```

---

## 十、联系方式

如有问题，请联系:
- 项目负责人: @czh
- 技术支持: focus-training@example.com