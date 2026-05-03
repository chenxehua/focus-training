# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-api.spec.ts >> 管理端后端 API E2E 测试 >> 问题管理 >> 获取问题列表 - 已回复
- Location: tests/admin-api.spec.ts:533:9

# Error details

```
TypeError: Cannot read properties of null (reading 'token')
```

# Test source

```ts
  1   | /**
  2   |  * 管理端 E2E 测试
  3   |  * 
  4   |  * 测试覆盖：
  5   |  * 1. 登录功能
  6   |  * 2. 仪表盘页面
  7   |  * 3. 用户管理
  8   |  * 4. 儿童管理
  9   |  * 5. 订单管理
  10  |  * 6. 会员管理
  11  |  * 7. 文章管理
  12  |  * 8. 问答管理
  13  |  * 9. 游戏配置
  14  |  * 10. 数据分析
  15  |  */
  16  | import { test, expect, describe } from '@playwright/test'
  17  | 
  18  | const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'
  19  | 
  20  | // Helper function for API calls
  21  | async function apiFetch(path: string, options: {
  22  |   method?: string
  23  |   body?: Record<string, unknown>
  24  |   token?: string
  25  | } = {}) {
  26  |   const { method = 'GET', body, token } = options
  27  |   const headers: Record<string, string> = {
  28  |     'Content-Type': 'application/json',
  29  |   }
  30  |   if (token) {
  31  |     headers['Authorization'] = `Bearer ${token}`
  32  |   }
  33  |   
  34  |   const response = await fetch(`${API_BASE}${path}`, {
  35  |     method,
  36  |     headers,
  37  |     body: body ? JSON.stringify(body) : undefined,
  38  |   })
  39  |   
  40  |   return {
  41  |     status: response.status,
  42  |     ok: response.ok,
  43  |     json: await response.json(),
  44  |   }
  45  | }
  46  | 
  47  | // 管理员凭证
  48  | const ADMIN_CREDENTIALS = {
  49  |   username: 'admin',
  50  |   password: 'admin123'
  51  | }
  52  | 
  53  | // 创建管理员 token（通过直接登录）
  54  | async function getAdminToken(): Promise<string> {
  55  |   const response = await apiFetch('/api/auth/admin-login', {
  56  |     method: 'POST',
  57  |     body: ADMIN_CREDENTIALS
  58  |   })
> 59  |   return response.json.data.token
      |                             ^ TypeError: Cannot read properties of null (reading 'token')
  60  | }
  61  | 
  62  | describe('管理端登录功能测试', () => {
  63  |   test('管理员登录成功', async () => {
  64  |     const response = await apiFetch('/api/auth/admin-login', {
  65  |       method: 'POST',
  66  |       body: ADMIN_CREDENTIALS
  67  |     })
  68  | 
  69  |     expect(response.ok).toBeTruthy()
  70  |     const body = response.json
  71  |     expect(body.code).toBe(0)
  72  |     expect(body.data).toHaveProperty('token')
  73  |     expect(body.data).toHaveProperty('user')
  74  |     expect(body.data.user.username).toBe('admin')
  75  |   })
  76  | 
  77  |   test('管理员登录失败 - 错误密码', async () => {
  78  |     const response = await apiFetch('/api/auth/admin-login', {
  79  |       method: 'POST',
  80  |       body: {
  81  |         username: 'admin',
  82  |         password: 'wrong_password'
  83  |       }
  84  |     })
  85  | 
  86  |     expect(response.status).toBe(401)
  87  |     const body = response.json
  88  |     expect(body.code).toBe(1)  // 后端返回 code=1 表示业务错误
  89  |   })
  90  | 
  91  |   test('管理员登录失败 - 用户不存在', async () => {
  92  |     const response = await apiFetch('/api/auth/admin-login', {
  93  |       method: 'POST',
  94  |       body: {
  95  |         username: 'nonexistent',
  96  |         password: 'anypassword'
  97  |       }
  98  |     })
  99  | 
  100 |     expect(response.status).toBe(401)
  101 |     const body = response.json
  102 |     expect(body.code).toBe(1)
  103 |   })
  104 | 
  105 |   test('管理员登录失败 - 缺少参数', async () => {
  106 |     const response = await apiFetch('/api/auth/admin-login', {
  107 |       method: 'POST',
  108 |       body: {
  109 |         username: 'admin'
  110 |       }
  111 |     })
  112 | 
  113 |     expect(response.status).toBe(400)
  114 |   })
  115 | 
  116 |   test('获取管理员信息', async () => {
  117 |     const loginResponse = await apiFetch('/api/auth/admin-login', {
  118 |       method: 'POST',
  119 |       body: ADMIN_CREDENTIALS
  120 |     })
  121 | 
  122 |     const token = loginResponse.json.data.token
  123 | 
  124 |     const infoResponse = await apiFetch('/api/auth/admin-info', {
  125 |       token
  126 |     })
  127 | 
  128 |     expect(infoResponse.ok).toBeTruthy()
  129 |     const infoBody = infoResponse.json
  130 |     expect(infoBody.code).toBe(0)
  131 |     expect(infoBody.data).toHaveProperty('username')
  132 |     expect(infoBody.data).toHaveProperty('nickname')
  133 |   })
  134 | })
  135 | 
  136 | describe('管理端后端 API E2E 测试', () => {
  137 |   let adminToken: string
  138 | 
  139 |   test.beforeAll(async () => {
  140 |     adminToken = await getAdminToken()
  141 |   })
  142 | 
  143 |   // ============================================================
  144 |   // 仪表盘测试
  145 |   // ============================================================
  146 |   describe('仪表盘', () => {
  147 |     test('获取仪表盘数据 - 包含统计数据', async () => {
  148 |       const response = await apiFetch('/api/admin/dashboard', {
  149 |         token: adminToken
  150 |       })
  151 | 
  152 |       expect(response.ok).toBeTruthy()
  153 |       const body = response.json
  154 |       expect(body.code).toBe(0)
  155 |       expect(body.data).toHaveProperty('stats')
  156 |       expect(body.data.stats).toHaveProperty('totalUsers')
  157 |       expect(body.data.stats).toHaveProperty('totalChildren')
  158 |       expect(body.data.stats).toHaveProperty('todayTraining')
  159 |       expect(body.data.stats).toHaveProperty('monthOrders')
```