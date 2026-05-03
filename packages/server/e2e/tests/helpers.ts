/**
 * E2E 测试辅助工具
 */
import { test as base, Page } from '@playwright/test'

const BASE_URL = process.env.API_URL || 'http://localhost:3003/api'

// 获取 API URL
export function getApiUrl(path: string): string {
  return `${BASE_URL}${path}`
}

// 创建测试用户
export async function createTestUser(options: { role?: string } = {}): Promise<{ token: string; userId: number }> {
  // 这里简化处理，实际应该通过 API 调用创建测试用户
  // 对于 admin 相关测试，直接使用预先创建的管理员 token
  return {
    token: 'test_admin_token_' + Date.now(),
    userId: 1
  }
}

// 清理测试数据
export async function cleanupTestData(userId: number): Promise<void> {
  // 清理创建的测试数据
}

// 创建管理员 token
export async function createAdminToken(): Promise<{ token: string; userId: number }> {
  return {
    token: 'admin_test_token_' + Date.now(),
    userId: 1
  }
}

// API 请求辅助函数
export async function apiFetch(
  path: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<Response> {
  const url = `http://localhost:3003${path}`
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body
  })
  return response
}

// 等待元素可见
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout })
}

// 截图辅助函数
export async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true })
}