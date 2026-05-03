# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-api.spec.ts >> 管理端后端 API E2E 测试 >> 问题管理 >> 获取问题列表 - 待回复
- Location: tests/admin-api.spec.ts:523:9

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  469 |         token: adminToken,
  470 |         body: {
  471 |           title: 'E2E 测试更新后的标题',
  472 |           content: '更新后的内容'
  473 |         }
  474 |       })
  475 | 
  476 |       expect(updateResponse.ok).toBeTruthy()
  477 |       const updateBody = updateResponse.json
  478 |       expect(updateBody.code).toBe(0)
  479 |     })
  480 | 
  481 |     test('删除文章', async () => {
  482 |       // 先创建文章
  483 |       const createResponse = await apiFetch('/api/admin/academy/articles', {
  484 |         method: 'POST',
  485 |         token: adminToken,
  486 |         body: {
  487 |           title: '待删除文章',
  488 |           content: '内容',
  489 |           categoryId: 1
  490 |         }
  491 |       })
  492 | 
  493 |       const createBody = createResponse.json
  494 |       const articleId = createBody.data.id
  495 | 
  496 |       // 删除文章
  497 |       const deleteResponse = await apiFetch(`/api/admin/academy/articles/${articleId}`, {
  498 |         method: 'DELETE',
  499 |         token: adminToken
  500 |       })
  501 | 
  502 |       expect(deleteResponse.ok).toBeTruthy()
  503 |       const deleteBody = deleteResponse.json
  504 |       expect(deleteBody.code).toBe(0)
  505 |     })
  506 |   })
  507 | 
  508 |   // ============================================================
  509 |   // 问题管理测试
  510 |   // ============================================================
  511 |   describe('问题管理', () => {
  512 |     test('获取问题列表 - 默认', async () => {
  513 |       const response = await apiFetch('/api/admin/academy/questions', {
  514 |         token: adminToken
  515 |       })
  516 | 
  517 |       expect(response.ok).toBeTruthy()
  518 |       const body = response.json
  519 |       expect(body.code).toBe(0)
  520 |       expect(body.data).toHaveProperty('list')
  521 |     })
  522 | 
  523 |     test('获取问题列表 - 待回复', async () => {
  524 |       const response = await apiFetch('/api/admin/academy/questions?status=pending', {
  525 |         token: adminToken
  526 |       })
  527 | 
> 528 |       expect(response.ok).toBeTruthy()
      |                           ^ Error: expect(received).toBeTruthy()
  529 |       const body = response.json
  530 |       expect(body.code).toBe(0)
  531 |     })
  532 | 
  533 |     test('获取问题列表 - 已回复', async () => {
  534 |       const response = await apiFetch('/api/admin/academy/questions?status=answered', {
  535 |         token: adminToken
  536 |       })
  537 | 
  538 |       expect(response.ok).toBeTruthy()
  539 |       const body = response.json
  540 |       expect(body.code).toBe(0)
  541 |     })
  542 |   })
  543 | 
  544 |   // ============================================================
  545 |   // 游戏配置测试
  546 |   // ============================================================
  547 |   describe('游戏配置', () => {
  548 |     test('获取游戏列表', async () => {
  549 |       const response = await apiFetch('/api/admin/games', {
  550 |         token: adminToken
  551 |       })
  552 | 
  553 |       expect(response.ok).toBeTruthy()
  554 |       const body = response.json
  555 |       expect(body.code).toBe(0)
  556 |       expect(Array.isArray(body.data)).toBeTruthy()
  557 |       expect(body.data.length).toBeGreaterThan(0)
  558 |     })
  559 | 
  560 |     test('更新游戏配置', async () => {
  561 |       const response = await apiFetch('/api/admin/games/1', {
  562 |         method: 'PUT',
  563 |         token: adminToken,
  564 |         body: {
  565 |           description: 'E2E 测试更新描述 ' + Date.now(),
  566 |           is_free: true
  567 |         }
  568 |       })
  569 | 
  570 |       expect(response.ok).toBeTruthy()
  571 |       const body = response.json
  572 |       expect(body.code).toBe(0)
  573 |     })
  574 |   })
  575 | 
  576 |   // ============================================================
  577 |   // 数据分析测试
  578 |   // ============================================================
  579 |   describe('数据分析', () => {
  580 |     test('获取训练数据分析 - 默认30天', async () => {
  581 |       const response = await apiFetch('/api/admin/analytics/training', {
  582 |         token: adminToken
  583 |       })
  584 | 
  585 |       expect(response.ok).toBeTruthy()
  586 |       const body = response.json
  587 |       expect(body.code).toBe(0)
  588 |       expect(body.data).toHaveProperty('dailyTrend')
  589 |       expect(body.data).toHaveProperty('ageGroupStats')
  590 |       expect(body.data).toHaveProperty('gameStats')
  591 |     })
  592 | 
  593 |     test('获取训练数据分析 - 自定义天数', async () => {
  594 |       const response = await apiFetch('/api/admin/analytics/training?days=7', {
  595 |         token: adminToken
  596 |       })
  597 | 
  598 |       expect(response.ok).toBeTruthy()
  599 |       const body = response.json
  600 |       expect(body.code).toBe(0)
  601 |     })
  602 | 
  603 |     test('获取用户留存分析', async () => {
  604 |       const response = await apiFetch('/api/admin/analytics/retention', {
  605 |         token: adminToken
  606 |       })
  607 | 
  608 |       expect(response.ok).toBeTruthy()
  609 |       const body = response.json
  610 |       expect(body.code).toBe(0)
  611 |       expect(Array.isArray(body.data)).toBeTruthy()
  612 |     })
  613 |   })
  614 | 
  615 |   // ============================================================
  616 |   // 权限验证测试
  617 |   // ============================================================
  618 |   describe('权限验证', () => {
  619 |     test('未登录用户不能访问管理接口 - 仪表盘', async () => {
  620 |       const response = await apiFetch('/api/admin/dashboard')
  621 |       expect(response.status).toBe(401)
  622 |     })
  623 | 
  624 |     test('未登录用户不能访问管理接口 - 用户列表', async () => {
  625 |       const response = await apiFetch('/api/admin/users')
  626 |       expect(response.status).toBe(401)
  627 |     })
  628 | 
```