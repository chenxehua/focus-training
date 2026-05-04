/**
 * Playwright 配置文件 - 微信小程序自动化测试
 * 
 * 使用说明:
 * 1. 确保微信开发者工具已启动
 * 2. 在开发者工具中开启自动化端口: 设置 → 安全设置 → 开启服务端口
 * 3. 运行测试: npx playwright test --config playwright.config.wechat.ts
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // 测试文件目录
  testDir: './e2e',
  
  // 测试文件匹配模式
  testMatch: /.*\.spec\.ts/,
  
  // 并行测试配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // 全局测试配置
  use: {
    // 基础URL (用于API测试)
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    
    // 开发者工具 WebSocket 地址
    devtoolsWsEndpoint: `ws://127.0.0.1:${process.env.DEVTOOLS_PORT || 21065}`,
    
    // 小程序AppID
    miniappId: process.env.MINIAPP_ID || 'wx1234567890abcdef',
    
    // 全局超时
    timeout: 30000,
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 跟踪配置
    trace: 'on-first-retry',
  },

  // 项目配置
  projects: [
    // ======== API 测试项目 ========
    {
      name: 'API Tests',
      testMatch: /.*api\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 微信小程序自动化测试项目 ========
    {
      name: 'Miniprogram - iPhone 14',
      testMatch: /.*miniprogram\.spec\.ts/,
      use: {
        ...devices['iPhone 14'],
      },
    },

    // ======== 登录模块测试 ========
    {
      name: 'Login Tests',
      testMatch: /.*login.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 首页模块测试 ========
    {
      name: 'Home Tests',
      testMatch: /.*index-home.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 个人中心测试 ========
    {
      name: 'Profile Tests',
      testMatch: /.*profile.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 家长学院测试 ========
    {
      name: 'Academy Tests',
      testMatch: /.*academy.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 学校管理测试 ========
    {
      name: 'School Tests',
      testMatch: /.*school.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },

    // ======== 游戏测试 ========
    {
      name: 'Game Tests',
      testMatch: /.*game.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    },
  ],
})