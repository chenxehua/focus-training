# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-api.spec.ts >> 管理端 API 性能测试 >> 仪表盘接口响应时间 < 500ms
- Location: tests/admin-api.spec.ts:658:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  629 |     test('普通用户不能访问管理接口', async () => {
  630 |       // 创建一个普通用户 token（这里简化处理）
  631 |       const normalUserToken = 'normal_user_token'
  632 | 
  633 |       const response = await apiFetch('/api/admin/dashboard', {
  634 |         token: normalUserToken
  635 |       })
  636 | 
  637 |       // 应该返回 403 或 401
  638 |       expect([401, 403]).toContain(response.status)
  639 |     })
  640 | 
  641 |     test('无效 token 不能访问管理接口', async () => {
  642 |       const response = await apiFetch('/api/admin/dashboard', {
  643 |         token: 'invalid_token_123456'
  644 |       })
  645 | 
  646 |       expect(response.status).toBe(401)
  647 |     })
  648 |   })
  649 | })
  650 | 
  651 | describe('管理端 API 性能测试', () => {
  652 |   let adminToken: string
  653 | 
  654 |   test.beforeAll(async () => {
  655 |     adminToken = await getAdminToken()
  656 |   })
  657 | 
  658 |   test('仪表盘接口响应时间 < 500ms', async () => {
  659 |     const startTime = Date.now()
  660 | 
  661 |     const response = await apiFetch('/api/admin/dashboard', {
  662 |       token: adminToken
  663 |     })
  664 | 
  665 |     const duration = Date.now() - startTime
  666 | 
> 667 |     expect(response.ok).toBeTruthy()
      |                         ^ Error: expect(received).toBeTruthy()
  668 |     expect(duration).toBeLessThan(500)
  669 |   })
  670 | 
  671 |   test('用户列表查询响应时间 < 300ms', async () => {
  672 |     const startTime = Date.now()
  673 | 
  674 |     const response = await apiFetch('/api/admin/users?page=1&pageSize=50', {
  675 |       token: adminToken
  676 |     })
  677 | 
  678 |     const duration = Date.now() - startTime
  679 | 
  680 |     expect(response.ok).toBeTruthy()
  681 |     expect(duration).toBeLessThan(300)
  682 |   })
  683 | 
  684 |   test('游戏列表查询响应时间 < 200ms', async () => {
  685 |     const startTime = Date.now()
  686 | 
  687 |     const response = await apiFetch('/api/admin/games', {
  688 |       token: adminToken
  689 |     })
  690 | 
  691 |     const duration = Date.now() - startTime
  692 | 
  693 |     expect(response.ok).toBeTruthy()
  694 |     expect(duration).toBeLessThan(200)
  695 |   })
  696 | })
```