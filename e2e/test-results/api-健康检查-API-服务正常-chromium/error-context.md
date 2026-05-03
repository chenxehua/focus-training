# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> 健康检查 >> API 服务正常
- Location: tests/api.spec.ts:37:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | /**
  2   |  * FocusKids API E2E 测试
  3   |  * 使用 fetch API 直接测试后端接口
  4   |  */
  5   | import { test, expect, describe } from '@playwright/test'
  6   | 
  7   | const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'
  8   | 
  9   | // Helper function for API calls
  10  | async function apiFetch(path: string, options: {
  11  |   method?: string
  12  |   body?: Record<string, unknown>
  13  |   token?: string
  14  | } = {}) {
  15  |   const { method = 'GET', body, token } = options
  16  |   const headers: Record<string, string> = {
  17  |     'Content-Type': 'application/json',
  18  |   }
  19  |   if (token) {
  20  |     headers['Authorization'] = `Bearer ${token}`
  21  |   }
  22  |   
  23  |   const response = await fetch(`${API_BASE}${path}`, {
  24  |     method,
  25  |     headers,
  26  |     body: body ? JSON.stringify(body) : undefined,
  27  |   })
  28  |   
  29  |   return {
  30  |     status: response.status,
  31  |     ok: response.ok,
  32  |     json: await response.json(),
  33  |   }
  34  | }
  35  | 
  36  | describe('健康检查', () => {
  37  |   test('API 服务正常', async () => {
  38  |     const response = await apiFetch('/api/health')
> 39  |     expect(response.ok).toBeTruthy()
      |                         ^ Error: expect(received).toBeTruthy()
  40  |     const body = response.json
  41  |     expect(body.status).toBe('ok')
  42  |   })
  43  | })
  44  | 
  45  | describe('认证系统 API', () => {
  46  |   let authToken: string
  47  |   let userId: number
  48  | 
  49  |   test('微信登录 - 新用户创建', async () => {
  50  |     // 等待rate limit重置
  51  |     await new Promise(resolve => setTimeout(resolve, 2000))
  52  |     const response = await apiFetch('/api/auth/wx-login', {
  53  |       method: 'POST',
  54  |       body: {
  55  |         code: `test_code_new_${Date.now()}`,
  56  |         nickname: '测试用户',
  57  |         avatar: 'https://example.com/avatar.png'
  58  |       }
  59  |     })
  60  | 
  61  |     // 支持rate limit 429或其他状态码
  62  |     expect([200, 400, 401, 429, 500]).toContain(response.status)
  63  |     const body = response.json
  64  |     
  65  |     // 429表示rate limit，应该跳过此测试
  66  |     if (response.status === 429) {
  67  |       test.skip()
  68  |       return
  69  |     }
  70  |     
  71  |     if (body.code === 0) {
  72  |       expect(body.data).toHaveProperty('token')
  73  |       expect(body.data).toHaveProperty('userId')
  74  |       authToken = body.data.token
  75  |       userId = body.data.userId
  76  |     }
  77  |   })
  78  | 
  79  |   test('微信登录 - 已有用户', async () => {
  80  |     await new Promise(resolve => setTimeout(resolve, 2000))
  81  |     const response = await apiFetch('/api/auth/wx-login', {
  82  |       method: 'POST',
  83  |       body: { code: 'test_code_existing_12345' }
  84  |     })
  85  | 
  86  |     expect([200, 400, 401, 429, 500]).toContain(response.status)
  87  |     const body = response.json
  88  |     if (response.status === 429) {
  89  |       test.skip()
  90  |       return
  91  |     }
  92  |   })
  93  | 
  94  |   test('微信登录 - 缺少code参数', async () => {
  95  |     await new Promise(resolve => setTimeout(resolve, 2000))
  96  |     const response = await apiFetch('/api/auth/wx-login', {
  97  |       method: 'POST',
  98  |       body: {}
  99  |     })
  100 | 
  101 |     // 应该返回错误响应，支持429
  102 |     expect([200, 400, 401, 429, 500]).toContain(response.status)
  103 |     if (response.status === 429) {
  104 |       test.skip()
  105 |       return
  106 |     }
  107 |     const body = response.json
  108 |     expect(body).toHaveProperty('code')
  109 |     expect(body.code).not.toBe(0)
  110 |   })
  111 | })
  112 | 
  113 | describe('游戏管理 API', () => {
  114 |   test('获取游戏列表', async () => {
  115 |     const response = await apiFetch('/api/game/list')
  116 | 
  117 |     expect(response.ok).toBeTruthy()
  118 |     const body = response.json
  119 |     expect(body.code).toBe(0)
  120 |     expect(Array.isArray(body.data)).toBe(true)
  121 |     expect(body.data.length).toBeGreaterThan(0)
  122 |     
  123 |     // 验证游戏数据结构
  124 |     const firstGame = body.data[0]
  125 |     expect(firstGame).toHaveProperty('id')
  126 |     expect(firstGame).toHaveProperty('gameCode')
  127 |     expect(firstGame).toHaveProperty('gameName')
  128 |   })
  129 | 
  130 |   test('获取游戏详情 - 按游戏代码', async () => {
  131 |     // 游戏详情需要登录
  132 |     const response = await apiFetch('/api/game/schulte')
  133 | 
  134 |     expect([200, 401, 500]).toContain(response.status)
  135 |     const body = response.json
  136 |     expect(body).toHaveProperty('code')
  137 |   })
  138 | 
  139 |   test('获取游戏详情 - 不存在的游戏', async () => {
```