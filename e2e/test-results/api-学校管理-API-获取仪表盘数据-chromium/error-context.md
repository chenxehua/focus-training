# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> 学校管理 API >> 获取仪表盘数据
- Location: tests/api.spec.ts:510:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 429
Received array: [200, 400, 401, 500]
```

# Test source

```ts
  415 | 
  416 |     expect([200, 400, 401, 500]).toContain(response.status)
  417 |     const body = response.json
  418 |     expect(body).toHaveProperty('code')
  419 |   })
  420 | })
  421 | 
  422 | describe('推荐系统 API', () => {
  423 |   let authToken: string
  424 | 
  425 |   test.beforeAll(async () => {
  426 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  427 |       method: 'POST',
  428 |       body: { code: `test_rec_${Date.now()}` }
  429 |     })
  430 |     const loginBody = loginRes.json
  431 |     if (loginBody.code === 0) {
  432 |       authToken = loginBody.data.token
  433 |     }
  434 |   })
  435 | 
  436 |   test('获取用户画像', async () => {
  437 |     if (!authToken) {
  438 |       test.skip()
  439 |       return
  440 |     }
  441 |     
  442 |     const response = await apiFetch('/api/recommendation/profile?childId=1', {
  443 |       token: authToken
  444 |     })
  445 | 
  446 |     expect([200, 400, 401, 500]).toContain(response.status)
  447 |     const body = response.json
  448 |     expect(body).toHaveProperty('code')
  449 |   })
  450 | 
  451 |   test('获取游戏推荐', async () => {
  452 |     if (!authToken) {
  453 |       test.skip()
  454 |       return
  455 |     }
  456 |     
  457 |     const response = await apiFetch('/api/recommendation/games?childId=1', {
  458 |       token: authToken
  459 |     })
  460 | 
  461 |     expect([200, 400, 401, 500]).toContain(response.status)
  462 |     const body = response.json
  463 |     expect(body).toHaveProperty('code')
  464 |   })
  465 | })
  466 | 
  467 | describe('家长学院 API', () => {
  468 |   test('获取分类列表', async () => {
  469 |     const response = await apiFetch('/api/academy/categories')
  470 |     
  471 |     // 即使没有数据也应该有响应
  472 |     expect([200, 404, 500]).toContain(response.status)
  473 |     const body = response.json
  474 |     expect(body).toHaveProperty('code')
  475 |   })
  476 | 
  477 |   test('获取文章列表', async () => {
  478 |     const response = await apiFetch('/api/academy/articles')
  479 |     
  480 |     expect([200, 404, 500]).toContain(response.status)
  481 |     const body = response.json
  482 |     expect(body).toHaveProperty('code')
  483 |   })
  484 | })
  485 | 
  486 | describe('学校管理 API', () => {
  487 |   let authToken: string
  488 | 
  489 |   test.beforeAll(async () => {
  490 |     const loginRes = await apiFetch('/api/auth/wx-login', {
  491 |       method: 'POST',
  492 |       body: { code: `test_school_${Date.now()}` }
  493 |     })
  494 |     const loginBody = loginRes.json
  495 |     if (loginBody.code === 0) {
  496 |       authToken = loginBody.data.token
  497 |     }
  498 |   })
  499 | 
  500 |   test('获取学校列表', async () => {
  501 |     const response = await apiFetch('/api/school/schools', {
  502 |       token: authToken
  503 |     })
  504 | 
  505 |     expect([200, 401, 500]).toContain(response.status)
  506 |     const body = response.json
  507 |     expect(body).toHaveProperty('code')
  508 |   })
  509 | 
  510 |   test('获取仪表盘数据', async () => {
  511 |     const response = await apiFetch('/api/school/dashboard?schoolId=1', {
  512 |       token: authToken
  513 |     })
  514 | 
> 515 |     expect([200, 400, 401, 500]).toContain(response.status)
      |                                  ^ Error: expect(received).toContain(expected) // indexOf
  516 |     const body = response.json
  517 |     expect(body).toHaveProperty('code')
  518 |   })
  519 | })
  520 | 
  521 | describe('API 错误处理', () => {
  522 |   test('无效的认证令牌', async () => {
  523 |     const response = await apiFetch('/api/user/info?userId=1', {
  524 |       token: 'invalid_token'
  525 |     })
  526 | 
  527 |     expect([401, 403, 500]).toContain(response.status)
  528 |     const body = response.json
  529 |     expect(body.code).toBeDefined()
  530 |     expect(body.code).not.toBe(0)
  531 |   })
  532 | 
  533 |   test('缺少必要参数', async () => {
  534 |     const response = await apiFetch('/api/game/record', {
  535 |       method: 'POST',
  536 |       body: { gameId: 'schulte' }
  537 |     })
  538 | 
  539 |     expect([400, 401, 500]).toContain(response.status)
  540 |   })
  541 | 
  542 |   test('无效的游戏代码', async () => {
  543 |     // 游戏详情需要登录，未登录返回401
  544 |     const response = await apiFetch('/api/game/invalid-game-code-12345')
  545 | 
  546 |     expect([401, 404, 500]).toContain(response.status)
  547 |   })
  548 | })
```