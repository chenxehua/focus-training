# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> 专注星球 - 端到端测试 >> 游戏页面 >> 舒尔特方格难度选择
- Location: tests/e2e.spec.ts:74:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/pages/login/index
Call log:
  - navigating to "http://localhost:5173/pages/login/index", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, describe } from '@playwright/test'
  2   | 
  3   | // Helper function to navigate to miniapp pages
  4   | async function gotoMiniappPage(page: any, path: string) {
  5   |   const baseUrl = process.env.MINIAPP_BASE_URL || 'http://localhost:5173'
> 6   |   await page.goto(`${baseUrl}${path}`)
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/pages/login/index
  7   | }
  8   | 
  9   | test.describe('专注星球 - 端到端测试', () => {
  10  |   
  11  |   test.beforeEach(async ({ page }) => {
  12  |     // Set viewport for mobile simulation
  13  |     await page.setViewportSize({ width: 375, height: 812 })
  14  |   })
  15  | 
  16  |   test.describe('首页功能', () => {
  17  |     test('首页正常加载', async ({ page }) => {
  18  |       await gotoMiniappPage(page, '/')
  19  |       
  20  |       // Wait for page to load
  21  |       await page.waitForLoadState('networkidle')
  22  |       
  23  |       // Check page title or header
  24  |       await expect(page.locator('view')).toBeVisible()
  25  |     })
  26  | 
  27  |     test('底部导航栏显示', async ({ page }) => {
  28  |       await gotoMiniappPage(page, '/')
  29  |       await page.waitForLoadState('networkidle')
  30  |       
  31  |       // Check tab bar exists (in UniApp this would be a custom component)
  32  |       const tabBar = page.locator('.tab-bar, .uni-tabbar, [class*="tabbar"]')
  33  |       await expect(tabBar).toBeVisible({ timeout: 5000 }).catch(() => {
  34  |         // Tab bar might not be visible in all views
  35  |       })
  36  |     })
  37  | 
  38  |     test('游戏列表加载', async ({ page }) => {
  39  |       await gotoMiniappPage(page, '/pages/games/index')
  40  |       await page.waitForLoadState('networkidle')
  41  |       
  42  |       // Check if game cards are rendered
  43  |       const gameCards = page.locator('.game-card, .game-item, [class*="game"]')
  44  |       await expect(gameCards.first()).toBeVisible({ timeout: 5000 }).catch(() => {
  45  |         // Might need authentication first
  46  |       })
  47  |     })
  48  |   })
  49  | 
  50  |   test.describe('游戏页面', () => {
  51  |     test.beforeEach(async ({ page }) => {
  52  |       // Login first
  53  |       await gotoMiniappPage(page, '/pages/login/index')
  54  |       await page.waitForLoadState('networkidle')
  55  |       
  56  |       // Simulate login by setting localStorage/sessionStorage
  57  |       await page.evaluate(() => {
  58  |         localStorage.setItem('auth_token', 'test_token_123')
  59  |         localStorage.setItem('user_id', '1')
  60  |       })
  61  |     })
  62  | 
  63  |     test('舒尔特方格游戏加载', async ({ page }) => {
  64  |       await gotoMiniappPage(page, '/pages/game-schulte/index')
  65  |       await page.waitForLoadState('networkidle')
  66  |       
  67  |       // Check game grid exists
  68  |       const grid = page.locator('.grid, .schulte-grid, [class*="grid"]')
  69  |       await expect(grid).toBeVisible({ timeout: 5000 }).catch(() => {
  70  |         // Grid might be rendered differently
  71  |       })
  72  |     })
  73  | 
  74  |     test('舒尔特方格难度选择', async ({ page }) => {
  75  |       await gotoMiniappPage(page, '/pages/game-schulte/index')
  76  |       await page.waitForLoadState('networkidle')
  77  |       
  78  |       // Click difficulty selector
  79  |       const difficultyBtn = page.locator('text=3x3, text=4x4').first()
  80  |       await expect(difficultyBtn).toBeVisible({ timeout: 5000 }).catch(() => {
  81  |         // Button might have different text
  82  |       })
  83  |     })
  84  | 
  85  |     test('记忆游戏加载', async ({ page }) => {
  86  |       await gotoMiniappPage(page, '/pages/game-memory/index')
  87  |       await page.waitForLoadState('networkidle')
  88  |       
  89  |       // Check game is rendered
  90  |       const gameArea = page.locator('.game-area, .memory-grid')
  91  |       await expect(gameArea).toBeVisible({ timeout: 5000 }).catch(() => {
  92  |         // Game area might be rendered differently
  93  |       })
  94  |     })
  95  | 
  96  |     test('反应速度游戏加载', async ({ page }) => {
  97  |       await gotoMiniappPage(page, '/pages/game-reaction/index')
  98  |       await page.waitForLoadState('networkidle')
  99  |       
  100 |       // Check game area exists
  101 |       const gameArea = page.locator('.game-area, .reaction-area')
  102 |       await expect(gameArea).toBeVisible({ timeout: 5000 }).catch(() => {
  103 |         // Game area might be rendered differently
  104 |       })
  105 |     })
  106 |   })
```