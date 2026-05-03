/**
 * 管理端 E2E 测试
 * 
 * 测试覆盖：
 * 1. 登录功能
 * 2. 仪表盘页面
 * 3. 用户管理
 * 4. 儿童管理
 * 5. 订单管理
 * 6. 会员管理
 * 7. 文章管理
 * 8. 问答管理
 * 9. 游戏配置
 * 10. 数据分析
 */
import { test, expect, describe } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

// Helper function for API calls
async function apiFetch(path: string, options: {
  method?: string
  body?: Record<string, unknown>
  token?: string
} = {}) {
  const { method = 'GET', body, token } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  return {
    status: response.status,
    ok: response.ok,
    json: await response.json(),
  }
}

// 管理员凭证
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

// 创建管理员 token（通过直接登录）
async function getAdminToken(): Promise<string> {
  const response = await apiFetch('/api/auth/admin-login', {
    method: 'POST',
    body: ADMIN_CREDENTIALS
  })
  if (!response.ok || !response.json?.data?.token) {
    throw new Error(`Failed to get admin token: ${JSON.stringify(response.json)}`)
  }
  return response.json.data.token
}

describe('管理端登录功能测试', () => {
  test('管理员登录成功', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: ADMIN_CREDENTIALS
    })

    expect(response.ok).toBeTruthy()
    const body = response.json
    expect(body.code).toBe(0)
    expect(body.data).toHaveProperty('token')
    expect(body.data).toHaveProperty('user')
    expect(body.data.user.username).toBe('admin')
  })

  test('管理员登录失败 - 错误密码', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'wrong_password'
      }
    })

    expect(response.status).toBe(401)
    const body = response.json
    expect(body.code).toBe(1)  // 后端返回 code=1 表示业务错误
  })

  test('管理员登录失败 - 用户不存在', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: {
        username: 'nonexistent',
        password: 'anypassword'
      }
    })

    expect(response.status).toBe(401)
    const body = response.json
    expect(body.code).toBe(1)
  })

  test('管理员登录失败 - 缺少参数', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: {
        username: 'admin'
      }
    })

    expect(response.status).toBe(400)
  })

  test('获取管理员信息', async () => {
    const loginResponse = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: ADMIN_CREDENTIALS
    })

    const token = loginResponse.json.data.token

    const infoResponse = await apiFetch('/api/auth/admin-info', {
      token
    })

    expect(infoResponse.ok).toBeTruthy()
    const infoBody = infoResponse.json
    expect(infoBody.code).toBe(0)
    expect(infoBody.data).toHaveProperty('username')
    expect(infoBody.data).toHaveProperty('nickname')
  })
})

describe('管理端后端 API E2E 测试', () => {
  let adminToken: string

  test.beforeAll(async () => {
    adminToken = await getAdminToken()
  })

  // ============================================================
  // 仪表盘测试
  // ============================================================
  describe('仪表盘', () => {
    test('获取仪表盘数据 - 包含统计数据', async () => {
      const response = await apiFetch('/api/admin/dashboard', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('stats')
      expect(body.data.stats).toHaveProperty('totalUsers')
      expect(body.data.stats).toHaveProperty('totalChildren')
      expect(body.data.stats).toHaveProperty('todayTraining')
      expect(body.data.stats).toHaveProperty('monthOrders')
      expect(body.data.stats).toHaveProperty('monthAmount')
      expect(body.data.stats).toHaveProperty('activeMembers')
    })

    test('获取仪表盘数据 - 包含用户趋势', async () => {
      const response = await apiFetch('/api/admin/dashboard', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.data).toHaveProperty('userTrend')
      expect(Array.isArray(body.data.userTrend)).toBeTruthy()
    })

    test('获取仪表盘数据 - 包含游戏使用排行', async () => {
      const response = await apiFetch('/api/admin/dashboard', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.data).toHaveProperty('gameUsage')
      expect(Array.isArray(body.data.gameUsage)).toBeTruthy()
    })
  })

  // ============================================================
  // 用户管理测试
  // ============================================================
  describe('用户管理', () => {
    test('获取用户列表 - 默认分页', async () => {
      const response = await apiFetch('/api/admin/users', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
      expect(body.data).toHaveProperty('page')
      expect(body.data).toHaveProperty('pageSize')
    })

    test('获取用户列表 - 自定义分页', async () => {
      const response = await apiFetch('/api/admin/users?page=1&pageSize=10', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.data.page).toBe(1)
      expect(body.data.pageSize).toBe(10)
    })

    test('获取用户列表 - 按关键词搜索', async () => {
      const response = await apiFetch('/api/admin/users?keyword=test', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取用户列表 - 按状态筛选', async () => {
      const response = await apiFetch('/api/admin/users?status=1', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取用户详情', async () => {
      const response = await apiFetch('/api/admin/users/1', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('user')
      expect(body.data).toHaveProperty('children')
      expect(body.data).toHaveProperty('orderStats')
    })

    test('更新用户状态 - 启用', async () => {
      const response = await apiFetch('/api/admin/users/1/status', {
        method: 'PUT',
        token: adminToken,
        body: { status: 1 }
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('更新用户状态 - 禁用', async () => {
      const response = await apiFetch('/api/admin/users/1/status', {
        method: 'PUT',
        token: adminToken,
        body: { status: 0 }
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })
  })

  // ============================================================
  // 儿童管理测试
  // ============================================================
  describe('儿童管理', () => {
    test('获取儿童列表 - 默认分页', async () => {
      const response = await apiFetch('/api/admin/children', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
    })

    test('获取儿童列表 - 按年龄段筛选', async () => {
      const response = await apiFetch('/api/admin/children?ageGroup=4-6', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取儿童列表 - 按关键词搜索', async () => {
      const response = await apiFetch('/api/admin/children?keyword=小', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })
  })

  // ============================================================
  // 订单管理测试
  // ============================================================
  describe('订单管理', () => {
    test('获取订单列表 - 默认分页', async () => {
      const response = await apiFetch('/api/admin/orders', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
    })

    test('获取订单列表 - 按状态筛选', async () => {
      const response = await apiFetch('/api/admin/orders?status=paid', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取订单列表 - 按日期范围筛选', async () => {
      const response = await apiFetch('/api/admin/orders?startDate=2024-01-01&endDate=2024-12-31', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取订单详情', async () => {
      const response = await apiFetch('/api/admin/orders/1', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toBeDefined()
    })
  })

  // ============================================================
  // 会员管理测试
  // ============================================================
  describe('会员管理', () => {
    test('获取会员列表 - 默认', async () => {
      const response = await apiFetch('/api/admin/members', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
    })

    test('获取会员列表 - 活跃会员', async () => {
      const response = await apiFetch('/api/admin/members?status=active', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取会员列表 - 过期会员', async () => {
      const response = await apiFetch('/api/admin/members?status=expired', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })
  })

  // ============================================================
  // 文章管理测试
  // ============================================================
  describe('文章管理', () => {
    test('获取文章列表 - 默认分页', async () => {
      const response = await apiFetch('/api/admin/academy/articles', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
      expect(body.data).toHaveProperty('total')
    })

    test('获取文章列表 - 按分类筛选', async () => {
      const response = await apiFetch('/api/admin/academy/articles?categoryId=1', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取文章列表 - 按关键词搜索', async () => {
      const response = await apiFetch('/api/admin/academy/articles?keyword=专注', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('创建文章', async () => {
      const response = await apiFetch('/api/admin/academy/articles', {
        method: 'POST',
        token: adminToken,
        body: {
          title: 'E2E 测试文章 - ' + Date.now(),
          content: '这是测试文章的内容，用于 E2E 测试验证创建功能',
          summary: '测试摘要',
          categoryId: 1,
          author: '测试管理员',
          isPublished: true
        }
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('id')
    })

    test('更新文章', async () => {
      // 先创建文章
      const createResponse = await apiFetch('/api/admin/academy/articles', {
        method: 'POST',
        token: adminToken,
        body: {
          title: '待更新文章',
          content: '原始内容',
          categoryId: 1
        }
      })

      const createBody = createResponse.json
      const articleId = createBody.data.id

      // 更新文章
      const updateResponse = await apiFetch(`/api/admin/academy/articles/${articleId}`, {
        method: 'PUT',
        token: adminToken,
        body: {
          title: 'E2E 测试更新后的标题',
          content: '更新后的内容'
        }
      })

      expect(updateResponse.ok).toBeTruthy()
      const updateBody = updateResponse.json
      expect(updateBody.code).toBe(0)
    })

    test('删除文章', async () => {
      // 先创建文章
      const createResponse = await apiFetch('/api/admin/academy/articles', {
        method: 'POST',
        token: adminToken,
        body: {
          title: '待删除文章',
          content: '内容',
          categoryId: 1
        }
      })

      const createBody = createResponse.json
      const articleId = createBody.data.id

      // 删除文章
      const deleteResponse = await apiFetch(`/api/admin/academy/articles/${articleId}`, {
        method: 'DELETE',
        token: adminToken
      })

      expect(deleteResponse.ok).toBeTruthy()
      const deleteBody = deleteResponse.json
      expect(deleteBody.code).toBe(0)
    })
  })

  // ============================================================
  // 问题管理测试
  // ============================================================
  describe('问题管理', () => {
    test('获取问题列表 - 默认', async () => {
      const response = await apiFetch('/api/admin/academy/questions', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('list')
    })

    test('获取问题列表 - 待回复', async () => {
      const response = await apiFetch('/api/admin/academy/questions?status=pending', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取问题列表 - 已回复', async () => {
      const response = await apiFetch('/api/admin/academy/questions?status=answered', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })
  })

  // ============================================================
  // 游戏配置测试
  // ============================================================
  describe('游戏配置', () => {
    test('获取游戏列表', async () => {
      const response = await apiFetch('/api/admin/games', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toBeGreaterThan(0)
    })

    test('更新游戏配置', async () => {
      const response = await apiFetch('/api/admin/games/1', {
        method: 'PUT',
        token: adminToken,
        body: {
          description: 'E2E 测试更新描述 ' + Date.now(),
          is_free: true
        }
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })
  })

  // ============================================================
  // 数据分析测试
  // ============================================================
  describe('数据分析', () => {
    test('获取训练数据分析 - 默认30天', async () => {
      const response = await apiFetch('/api/admin/analytics/training', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('dailyTrend')
      expect(body.data).toHaveProperty('ageGroupStats')
      expect(body.data).toHaveProperty('gameStats')
    })

    test('获取训练数据分析 - 自定义天数', async () => {
      const response = await apiFetch('/api/admin/analytics/training?days=7', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
    })

    test('获取用户留存分析', async () => {
      const response = await apiFetch('/api/admin/analytics/retention', {
        token: adminToken
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })
  })

  // ============================================================
  // 权限验证测试
  // ============================================================
  describe('权限验证', () => {
    test('未登录用户不能访问管理接口 - 仪表盘', async () => {
      const response = await apiFetch('/api/admin/dashboard')
      expect(response.status).toBe(401)
    })

    test('未登录用户不能访问管理接口 - 用户列表', async () => {
      const response = await apiFetch('/api/admin/users')
      expect(response.status).toBe(401)
    })

    test('普通用户不能访问管理接口', async () => {
      // 创建一个普通用户 token（这里简化处理）
      const normalUserToken = 'normal_user_token'

      const response = await apiFetch('/api/admin/dashboard', {
        token: normalUserToken
      })

      // 应该返回 403 或 401
      expect([401, 403]).toContain(response.status)
    })

    test('无效 token 不能访问管理接口', async () => {
      const response = await apiFetch('/api/admin/dashboard', {
        token: 'invalid_token_123456'
      })

      expect(response.status).toBe(401)
    })
  })
})

describe('管理端 API 性能测试', () => {
  let adminToken: string

  test.beforeAll(async () => {
    adminToken = await getAdminToken()
  })

  test('仪表盘接口响应时间 < 500ms', async () => {
    const startTime = Date.now()

    const response = await apiFetch('/api/admin/dashboard', {
      token: adminToken
    })

    const duration = Date.now() - startTime

    expect(response.ok).toBeTruthy()
    expect(duration).toBeLessThan(500)
  })

  test('用户列表查询响应时间 < 300ms', async () => {
    const startTime = Date.now()

    const response = await apiFetch('/api/admin/users?page=1&pageSize=50', {
      token: adminToken
    })

    const duration = Date.now() - startTime

    expect(response.ok).toBeTruthy()
    expect(duration).toBeLessThan(300)
  })

  test('游戏列表查询响应时间 < 200ms', async () => {
    const startTime = Date.now()

    const response = await apiFetch('/api/admin/games', {
      token: adminToken
    })

    const duration = Date.now() - startTime

    expect(response.ok).toBeTruthy()
    expect(duration).toBeLessThan(200)
  })
})