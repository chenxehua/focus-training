# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-api.spec.ts >> 管理端后端 API E2E 测试 >> 用户管理 >> 获取用户列表 - 按关键词搜索
- Location: tests/admin-api.spec.ts:216:9

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  160 |       expect(body.data.stats).toHaveProperty('monthAmount')
  161 |       expect(body.data.stats).toHaveProperty('activeMembers')
  162 |     })
  163 | 
  164 |     test('获取仪表盘数据 - 包含用户趋势', async () => {
  165 |       const response = await apiFetch('/api/admin/dashboard', {
  166 |         token: adminToken
  167 |       })
  168 | 
  169 |       expect(response.ok).toBeTruthy()
  170 |       const body = response.json
  171 |       expect(body.data).toHaveProperty('userTrend')
  172 |       expect(Array.isArray(body.data.userTrend)).toBeTruthy()
  173 |     })
  174 | 
  175 |     test('获取仪表盘数据 - 包含游戏使用排行', async () => {
  176 |       const response = await apiFetch('/api/admin/dashboard', {
  177 |         token: adminToken
  178 |       })
  179 | 
  180 |       expect(response.ok).toBeTruthy()
  181 |       const body = response.json
  182 |       expect(body.data).toHaveProperty('gameUsage')
  183 |       expect(Array.isArray(body.data.gameUsage)).toBeTruthy()
  184 |     })
  185 |   })
  186 | 
  187 |   // ============================================================
  188 |   // 用户管理测试
  189 |   // ============================================================
  190 |   describe('用户管理', () => {
  191 |     test('获取用户列表 - 默认分页', async () => {
  192 |       const response = await apiFetch('/api/admin/users', {
  193 |         token: adminToken
  194 |       })
  195 | 
  196 |       expect(response.ok).toBeTruthy()
  197 |       const body = response.json
  198 |       expect(body.code).toBe(0)
  199 |       expect(body.data).toHaveProperty('list')
  200 |       expect(body.data).toHaveProperty('total')
  201 |       expect(body.data).toHaveProperty('page')
  202 |       expect(body.data).toHaveProperty('pageSize')
  203 |     })
  204 | 
  205 |     test('获取用户列表 - 自定义分页', async () => {
  206 |       const response = await apiFetch('/api/admin/users?page=1&pageSize=10', {
  207 |         token: adminToken
  208 |       })
  209 | 
  210 |       expect(response.ok).toBeTruthy()
  211 |       const body = response.json
  212 |       expect(body.data.page).toBe(1)
  213 |       expect(body.data.pageSize).toBe(10)
  214 |     })
  215 | 
  216 |     test('获取用户列表 - 按关键词搜索', async () => {
  217 |       const response = await apiFetch('/api/admin/users?keyword=test', {
  218 |         token: adminToken
  219 |       })
  220 | 
> 221 |       expect(response.ok).toBeTruthy()
      |                           ^ Error: expect(received).toBeTruthy()
  222 |       const body = response.json
  223 |       expect(body.code).toBe(0)
  224 |     })
  225 | 
  226 |     test('获取用户列表 - 按状态筛选', async () => {
  227 |       const response = await apiFetch('/api/admin/users?status=1', {
  228 |         token: adminToken
  229 |       })
  230 | 
  231 |       expect(response.ok).toBeTruthy()
  232 |       const body = response.json
  233 |       expect(body.code).toBe(0)
  234 |     })
  235 | 
  236 |     test('获取用户详情', async () => {
  237 |       const response = await apiFetch('/api/admin/users/1', {
  238 |         token: adminToken
  239 |       })
  240 | 
  241 |       expect(response.ok).toBeTruthy()
  242 |       const body = response.json
  243 |       expect(body.code).toBe(0)
  244 |       expect(body.data).toHaveProperty('user')
  245 |       expect(body.data).toHaveProperty('children')
  246 |       expect(body.data).toHaveProperty('orderStats')
  247 |     })
  248 | 
  249 |     test('更新用户状态 - 启用', async () => {
  250 |       const response = await apiFetch('/api/admin/users/1/status', {
  251 |         method: 'PUT',
  252 |         token: adminToken,
  253 |         body: { status: 1 }
  254 |       })
  255 | 
  256 |       expect(response.ok).toBeTruthy()
  257 |       const body = response.json
  258 |       expect(body.code).toBe(0)
  259 |     })
  260 | 
  261 |     test('更新用户状态 - 禁用', async () => {
  262 |       const response = await apiFetch('/api/admin/users/1/status', {
  263 |         method: 'PUT',
  264 |         token: adminToken,
  265 |         body: { status: 0 }
  266 |       })
  267 | 
  268 |       expect(response.ok).toBeTruthy()
  269 |       const body = response.json
  270 |       expect(body.code).toBe(0)
  271 |     })
  272 |   })
  273 | 
  274 |   // ============================================================
  275 |   // 儿童管理测试
  276 |   // ============================================================
  277 |   describe('儿童管理', () => {
  278 |     test('获取儿童列表 - 默认分页', async () => {
  279 |       const response = await apiFetch('/api/admin/children', {
  280 |         token: adminToken
  281 |       })
  282 | 
  283 |       expect(response.ok).toBeTruthy()
  284 |       const body = response.json
  285 |       expect(body.code).toBe(0)
  286 |       expect(body.data).toHaveProperty('list')
  287 |       expect(body.data).toHaveProperty('total')
  288 |     })
  289 | 
  290 |     test('获取儿童列表 - 按年龄段筛选', async () => {
  291 |       const response = await apiFetch('/api/admin/children?ageGroup=4-6', {
  292 |         token: adminToken
  293 |       })
  294 | 
  295 |       expect(response.ok).toBeTruthy()
  296 |       const body = response.json
  297 |       expect(body.code).toBe(0)
  298 |     })
  299 | 
  300 |     test('获取儿童列表 - 按关键词搜索', async () => {
  301 |       const response = await apiFetch('/api/admin/children?keyword=小', {
  302 |         token: adminToken
  303 |       })
  304 | 
  305 |       expect(response.ok).toBeTruthy()
  306 |       const body = response.json
  307 |       expect(body.code).toBe(0)
  308 |     })
  309 |   })
  310 | 
  311 |   // ============================================================
  312 |   // 订单管理测试
  313 |   // ============================================================
  314 |   describe('订单管理', () => {
  315 |     test('获取订单列表 - 默认分页', async () => {
  316 |       const response = await apiFetch('/api/admin/orders', {
  317 |         token: adminToken
  318 |       })
  319 | 
  320 |       expect(response.ok).toBeTruthy()
  321 |       const body = response.json
```