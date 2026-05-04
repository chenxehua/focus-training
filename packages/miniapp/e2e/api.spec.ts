/**
 * API 测试用例
 * 测试后端 API 接口
 */
import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('API 测试示例', () => {
  
  test('健康检查接口', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('微信登录接口', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/wx-login`, {
      data: {
        code: 'test-code',
      },
    });
    
    // 即使失败也应该返回 JSON
    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('获取用户信息 (未授权)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/user/info`);
    
    // 未登录应该返回 401
    expect(response.status()).toBe(401);
  });

  test('获取儿童列表 (未授权)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/user/children`);
    expect(response.status()).toBe(401);
  });

  test('获取游戏记录 (未授权)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/game/records`);
    expect(response.status()).toBe(401);
  });

});