# 微信小程序自动化发布

使用 `miniprogram-ci` 实现小程序的自动化上传和预览。

## 前置准备

### 1. 安装依赖
```bash
cd packages/miniapp
npm install miniprogram-ci
```

### 2. 获取私钥
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发管理」→「开发设置」
3. 找到「小程序代码上传密钥」，点击「重置」
4. 下载私钥文件，保存为 `packages/miniapp/private.wx003bb69f003c24b9.key`

### 3. 开启上传权限
在微信公众平台开启「使用本地上传密钥上传代码」

## 使用方法

### 构建 + 上传
```bash
# 1. 构建小程序
npm run build

# 2. 上传
npm run upload
```

### 预览
```bash
npm run preview
```

### 环境变量配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| CI_PRIVATE_KEY_PATH | `private.wx003bb69f003c24b9.key` | 私钥路径 |
| CI_APP_ID | project.config.json 中的 appid | 小程序 AppID |
| CI_VERSION | `1.0.0` | 版本号 |
| CI_DESC | `自动化构建上传` | 版本描述 |

### 使用示例
```bash
# 自定义版本号
CI_VERSION=1.2.0 npm run upload

# 自定义描述
CI_DESC="修复登录问题" npm run upload

# 使用自定义私钥
CI_PRIVATE_KEY_PATH=/path/to/key.key npm run upload
```

## CI/CD 集成

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Mini Program

on:
  push:
    branches: [main]
    paths:
      - 'packages/miniapp/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build mini program
        run: npm run build --workspace=packages/miniapp
        
      - name: Upload to WeChat
        run: npm run upload --workspace=packages/miniapp
        env:
          CI_PRIVATE_KEY_PATH: ${{ secrets.WX_PRIVATE_KEY }}
          CI_VERSION: ${{ github.run_number }}
```

在 GitHub Settings 中添加 `WX_PRIVATE_KEY` secret。

## 注意事项

1. **安全问题**：私钥不要提交到代码仓库，添加到 `.gitignore`
2. **版本号**：微信小程序版本号不能重复
3. **审核**：上传后需要在后台提交审核才能发布
4. **频率限制**：每日上传次数有限制，合理规划发布流程

---

# 微信小程序自动化测试

使用 `miniprogram-automator` 连接微信开发者工具进行 UI 自动化测试。

## 前置准备

1. **安装微信开发者工具** [下载链接](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. **开启自动化端口**
   ```
   微信开发者工具 → 设置 → 安全设置 → 开启"服务端口"
   ```
3. **启动项目**
   ```bash
   cd packages/miniapp
   npm run dev
   ```

## 测试命令

| 命令 | 说明 |
|------|------|
| `npm run test:mp` | 运行小程序 UI 测试 |
| `npm run test:games` | 运行所有游戏测试 |
| `npm run test:pages` | 测试 29 个页面覆盖 |
| `npm run test:all` | 运行 API 测试 + UI 测试 |

### 页面覆盖率测试

```bash
# 测试所有 29 个页面
node scripts/test-pages.js

# 按类别测试
node scripts/test-pages.js tabbar        # TabBar 页面 (3个)
node scripts/test-pages.js navigation   # 导航页面 (16个)
node scripts/test-pages.js games        # 游戏页面 (10个)
```

### 单独运行

```bash
# API 测试
npx playwright test --project=api

# UI 测试 (需连接开发者工具)
node scripts/test-automator.js

# 游戏测试
node scripts/test-games.js
```

## 测试脚本说明

### 1. test-automator.js - 通用 UI 测试
- 首页功能测试
- 页面导航测试
- 游戏列表测试
- 个人中心测试
- 家长界面测试

### 2. test-games.js - 游戏专项测试
针对每款游戏的独立测试

### 3. test-pages.js - 页面覆盖率测试 (29个页面)
- **TabBar 页面** (3个): 首页、家长报告、个人中心
- **导航页面** (16个): 登录、游戏广场、成就、评估、会员、推荐、家长学院、文章、问答、学校管理
- **游戏页面** (10个): 舒尔特、听声辨数、图案记忆、视觉追踪、反应速度、节奏点击、听觉记忆、迷宫寻路、快速分类、追踪目标

### 3. upload.js - 代码上传

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WS_ENDPOINT` | `ws://127.0.0.1:21065` | 开发者工具 WebSocket 地址 |
| `API_BASE_URL` | `http://localhost:3000` | API 服务器地址 |

## 测试结果

测试报告和截图保存在：
- `test-results/screenshots/` - 截图
- `test-results/reports/` - JSON 报告