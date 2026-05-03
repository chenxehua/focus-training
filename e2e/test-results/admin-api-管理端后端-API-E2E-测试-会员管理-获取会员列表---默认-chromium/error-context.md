# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-api.spec.ts >> 管理端后端 API E2E 测试 >> 会员管理 >> 获取会员列表 - 默认
- Location: tests/admin-api.spec.ts:363:9

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  322 |       expect(body.code).toBe(0)
  323 |       expect(body.data).toHaveProperty('list')
  324 |       expect(body.data).toHaveProperty('total')
  325 |     })
  326 | 
  327 |     test('获取订单列表 - 按状态筛选', async () => {
  328 |       const response = await apiFetch('/api/admin/orders?status=paid', {
  329 |         token: adminToken
  330 |       })
  331 | 
  332 |       expect(response.ok).toBeTruthy()
  333 |       const body = response.json
  334 |       expect(body.code).toBe(0)
  335 |     })
  336 | 
  337 |     test('获取订单列表 - 按日期范围筛选', async () => {
  338 |       const response = await apiFetch('/api/admin/orders?startDate=2024-01-01&endDate=2024-12-31', {
  339 |         token: adminToken
  340 |       })
  341 | 
  342 |       expect(response.ok).toBeTruthy()
  343 |       const body = response.json
  344 |       expect(body.code).toBe(0)
  345 |     })
  346 | 
  347 |     test('获取订单详情', async () => {
  348 |       const response = await apiFetch('/api/admin/orders/1', {
  349 |         token: adminToken
  350 |       })
  351 | 
  352 |       expect(response.ok).toBeTruthy()
  353 |       const body = response.json
  354 |       expect(body.code).toBe(0)
  355 |       expect(body.data).toBeDefined()
  356 |     })
  357 |   })
  358 | 
  359 |   // ============================================================
  360 |   // 会员管理测试
  361 |   // ============================================================
  362 |   describe('会员管理', () => {
  363 |     test('获取会员列表 - 默认', async () => {
  364 |       const response = await apiFetch('/api/admin/members', {
  365 |         token: adminToken
  366 |       })
  367 | 
> 368 |       expect(response.ok).toBeTruthy()
      |                           ^ Error: expect(received).toBeTruthy()
  369 |       const body = response.json
  370 |       expect(body.code).toBe(0)
  371 |       expect(body.data).toHaveProperty('list')
  372 |     })
  373 | 
  374 |     test('获取会员列表 - 活跃会员', async () => {
  375 |       const response = await apiFetch('/api/admin/members?status=active', {
  376 |         token: adminToken
  377 |       })
  378 | 
  379 |       expect(response.ok).toBeTruthy()
  380 |       const body = response.json
  381 |       expect(body.code).toBe(0)
  382 |     })
  383 | 
  384 |     test('获取会员列表 - 过期会员', async () => {
  385 |       const response = await apiFetch('/api/admin/members?status=expired', {
  386 |         token: adminToken
  387 |       })
  388 | 
  389 |       expect(response.ok).toBeTruthy()
  390 |       const body = response.json
  391 |       expect(body.code).toBe(0)
  392 |     })
  393 |   })
  394 | 
  395 |   // ============================================================
  396 |   // 文章管理测试
  397 |   // ============================================================
  398 |   describe('文章管理', () => {
  399 |     test('获取文章列表 - 默认分页', async () => {
  400 |       const response = await apiFetch('/api/admin/academy/articles', {
  401 |         token: adminToken
  402 |       })
  403 | 
  404 |       expect(response.ok).toBeTruthy()
  405 |       const body = response.json
  406 |       expect(body.code).toBe(0)
  407 |       expect(body.data).toHaveProperty('list')
  408 |       expect(body.data).toHaveProperty('total')
  409 |     })
  410 | 
  411 |     test('获取文章列表 - 按分类筛选', async () => {
  412 |       const response = await apiFetch('/api/admin/academy/articles?categoryId=1', {
  413 |         token: adminToken
  414 |       })
  415 | 
  416 |       expect(response.ok).toBeTruthy()
  417 |       const body = response.json
  418 |       expect(body.code).toBe(0)
  419 |     })
  420 | 
  421 |     test('获取文章列表 - 按关键词搜索', async () => {
  422 |       const response = await apiFetch('/api/admin/academy/articles?keyword=专注', {
  423 |         token: adminToken
  424 |       })
  425 | 
  426 |       expect(response.ok).toBeTruthy()
  427 |       const body = response.json
  428 |       expect(body.code).toBe(0)
  429 |     })
  430 | 
  431 |     test('创建文章', async () => {
  432 |       const response = await apiFetch('/api/admin/academy/articles', {
  433 |         method: 'POST',
  434 |         token: adminToken,
  435 |         body: {
  436 |           title: 'E2E 测试文章 - ' + Date.now(),
  437 |           content: '这是测试文章的内容，用于 E2E 测试验证创建功能',
  438 |           summary: '测试摘要',
  439 |           categoryId: 1,
  440 |           author: '测试管理员',
  441 |           isPublished: true
  442 |         }
  443 |       })
  444 | 
  445 |       expect(response.ok).toBeTruthy()
  446 |       const body = response.json
  447 |       expect(body.code).toBe(0)
  448 |       expect(body.data).toHaveProperty('id')
  449 |     })
  450 | 
  451 |     test('更新文章', async () => {
  452 |       // 先创建文章
  453 |       const createResponse = await apiFetch('/api/admin/academy/articles', {
  454 |         method: 'POST',
  455 |         token: adminToken,
  456 |         body: {
  457 |           title: '待更新文章',
  458 |           content: '原始内容',
  459 |           categoryId: 1
  460 |         }
  461 |       })
  462 | 
  463 |       const createBody = createResponse.json
  464 |       const articleId = createBody.data.id
  465 | 
  466 |       // 更新文章
  467 |       const updateResponse = await apiFetch(`/api/admin/academy/articles/${articleId}`, {
  468 |         method: 'PUT',
```