/**
 * 管理员后端 E2E 测试
 */
import { test, expect } from '@playwright/test'
import { apiFetch, createTestUser, cleanupTestData } from './helpers'

test.describe('管理员后端 API E2E 测试', () => {
  let adminToken: string
  let testUserId: number

  test.beforeAll(async () => {
    // 创建测试管理员用户
    const adminResult = await createTestUser({ role: 'admin' })
    adminToken = adminResult.token
    testUserId = adminResult.userId
  })

  test.afterAll(async () => {
    // 清理测试数据
    await cleanupTestData(testUserId)
  })

  test.describe('仪表盘统计', () => {
    test('获取仪表盘数据', async () => {
      const response = await apiFetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('stats')
      expect(body.data.stats).toHaveProperty('totalUsers')
      expect(body.data.stats).toHaveProperty('totalChildren')
      expect(body.data.stats).toHaveProperty('todayTraining')
      expect(body.data.stats).toHaveProperty('monthOrders')
      expect(body.data.stats).toHaveProperty('monthAmount')
      expect(body.data.stats).toHaveProperty('activeMembers')
    })
  })

  test.describe('用户管理', () => {
    test('获取用户列表', async () => {
      const response = await apiFetch('/api/admin/users?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
      expect(body.data).toHaveProperty('page')
      expect(body.data).toHaveProperty('pageSize')
    })

    test('根据关键词搜索用户', async () => {
      const response = await apiFetch('/api/admin/users?keyword=test&page=1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('获取用户详情', async () => {
      const response = await apiFetch(`/api/admin/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('user')
      expect(body.data).toHaveProperty('children')
      expect(body.data).toHaveProperty('orderStats')
    })

    test('更新用户状态', async () => {
      const response = await apiFetch(`/api/admin/users/${testUserId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 1 }),
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data.message).toBe('状态更新成功')
    })
  })

  test.describe('儿童管理', () => {
    test('获取儿童列表', async () => {
      const response = await apiFetch('/api/admin/children?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
    })

    test('按年龄段筛选', async () => {
      const response = await apiFetch('/api/admin/children?ageGroup=4-6', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })
  })

  test.describe('订单管理', () => {
    test('获取订单列表', async () => {
      const response = await apiFetch('/api/admin/orders?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
    })

    test('按状态筛选订单', async () => {
      const response = await apiFetch('/api/admin/orders?status=paid', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('按日期范围筛选', async () => {
      const response = await apiFetch('/api/admin/orders?startDate=2024-01-01&endDate=2024-12-31', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })
  })

  test.describe('会员管理', () => {
    test('获取会员列表', async () => {
      const response = await apiFetch('/api/admin/members?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
    })

    test('获取活跃会员', async () => {
      const response = await apiFetch('/api/admin/members?status=active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('获取过期会员', async () => {
      const response = await apiFetch('/api/admin/members?status=expired', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })
  })

  test.describe('内容管理 - 文章', () => {
    test('获取文章列表', async () => {
      const response = await apiFetch('/api/admin/academy/articles?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
    })

    test('按分类筛选文章', async () => {
      const response = await apiFetch('/api/admin/academy/articles?categoryId=1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('创建文章', async () => {
      const response = await apiFetch('/api/admin/academy/articles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '测试文章标题',
          content: '这是测试文章的内容',
          summary: '测试摘要',
          categoryId: 1,
          isPublished: true,
        }),
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('id')

      // 清理测试文章
      const articleId = body.data.id
      await apiFetch(`/api/admin/academy/articles/${articleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    })

    test('更新文章', async () => {
      // 先创建文章
      const createResponse = await apiFetch('/api/admin/academy/articles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '原始标题',
          content: '原始内容',
          categoryId: 1,
        }),
      })
      const createBody = await createResponse.json()
      const articleId = createBody.data.id

      // 更新文章
      const updateResponse = await apiFetch(`/api/admin/academy/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '更新后的标题',
          content: '更新后的内容',
        }),
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.code).toBe(0)

      // 清理
      await apiFetch(`/api/admin/academy/articles/${articleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    })
  })

  test.describe('内容管理 - 问题', () => {
    test('获取问题列表', async () => {
      const response = await apiFetch('/api/admin/academy/questions?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
    })

    test('筛选待回复问题', async () => {
      const response = await apiFetch('/api/admin/academy/questions?status=pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('回复问题', async () => {
      // 先创建一个问题
      const createResponse = await apiFetch('/api/academy/questions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '测试问题',
          content: '这是测试问题的内容',
          categoryId: 1,
        }),
      })

      const createBody = await createResponse.json()
      if (createBody.code === 0 && createBody.data && createBody.data.id) {
        const questionId = createBody.data.id

        // 回复问题
        const answerResponse = await apiFetch(`/api/admin/academy/questions/${questionId}/answer`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: '这是专家回复',
            isExpert: true,
          }),
        })

        expect(answerResponse.ok()).toBeTruthy()
        const answerBody = await answerResponse.json()
        expect(answerBody.code).toBe(0)
        expect(answerBody.data).toHaveProperty('id')
      }
    })
  })

  test.describe('游戏配置管理', () => {
    test('获取游戏列表', async () => {
      const response = await apiFetch('/api/admin/games', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('更新游戏配置', async () => {
      // 获取第一个游戏
      const listResponse = await apiFetch('/api/admin/games', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const listBody = await listResponse.json()
      
      if (listBody.data && listBody.data.length > 0) {
        const gameId = listBody.data[0].id

        const response = await apiFetch(`/api/admin/games/${gameId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: '更新后的描述',
            is_free: true,
          }),
        })

        expect(response.ok()).toBeTruthy()
        const body = await response.json()
        expect(body.code).toBe(0)
      }
    })
  })

  test.describe('数据分析', () => {
    test('获取训练数据分析', async () => {
      const response = await apiFetch('/api/admin/analytics/training?days=30', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('dailyTrend')
      expect(body.data).toHaveProperty('ageGroupStats')
      expect(body.data).toHaveProperty('gameStats')
    })

    test('获取用户留存分析', async () => {
      const response = await apiFetch('/api/admin/analytics/retention', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })
  })

  test.describe('权限验证', () => {
    test('非管理员用户不能访问管理接口', async () => {
      // 创建一个普通用户
      const userResult = await createTestUser({ role: 'parent' })
      
      const response = await apiFetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${userResult.token}` },
      })

      // 应该返回 403 权限不足
      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.code).toBe(403)

      await cleanupTestData(userResult.userId)
    })

    test('未登录用户不能访问管理接口', async () => {
      const response = await apiFetch('/api/admin/dashboard')

      expect(response.status()).toBe(401)
    })
  })
})

test.describe('管理员后端性能测试', () => {
  let adminToken: string

  test.beforeAll(async () => {
    const adminResult = await createTestUser({ role: 'admin' })
    adminToken = adminResult.token
  })

  test('仪表盘接口响应时间 < 500ms', async () => {
    const startTime = Date.now()
    
    const response = await apiFetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    
    const duration = Date.now() - startTime
    
    expect(response.ok()).toBeTruthy()
    expect(duration).toBeLessThan(500)
  })

  test('用户列表查询响应时间 < 300ms', async () => {
    const startTime = Date.now()
    
    const response = await apiFetch('/api/admin/users?page=1&pageSize=50', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    
    const duration = Date.now() - startTime
    
    expect(response.ok()).toBeTruthy()
    expect(duration).toBeLessThan(300)
  })
})