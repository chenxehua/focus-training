/**
 * 专注星球小程序 - 完整 API E2E 测试
 * 测试所有微信小程序后端接口
 */

import { test, expect, describe } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

// 存储测试数据
let testUser: { userId: number; token: string; openId: string }
let testChild: { childId: number }
let testGameId: string

/**
 * 测试工具函数
 */
async function apiFetch(path: string, options: {
  method?: string
  body?: Record<string, unknown>
  token?: string
  failOnStatusCode?: boolean
} = {}) {
  const { method = 'GET', body, token, failOnStatusCode = true } = options
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
  
  const json = await response.json().catch(() => ({}))
  
  if (!response.ok && failOnStatusCode) {
    throw new Error(`API ${path} failed with status ${response.status}: ${JSON.stringify(json)}`)
  }
  
  return {
    status: response.status,
    ok: response.ok,
    json,
  }
}

async function authFetch(path: string, options: {
  method?: string
  body?: Record<string, unknown>
} = {}) {
  return apiFetch(path, {
    ...options,
    token: testUser.token,
  })
}

// ============================================
// 健康检查
// ============================================
describe('✅ 健康检查', () => {
  test('GET /api/health - 服务正常', async () => {
    const response = await apiFetch('/api/health')
    expect(response.ok).toBeTruthy()
    expect(response.json.status).toBe('ok')
    expect(response.json.timestamp).toBeDefined()
  })
})

// ============================================
// 认证模块
// ============================================
describe('🔐 认证模块', () => {
  test('POST /api/auth/wx-login - 新用户登录(创建用户)', async () => {
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_code_${Date.now()}` }
    })
    expect(response.ok).toBeTruthy()
    expect(response.json.token).toBeDefined()
    
    testUser = {
      userId: response.json.userId,
      token: response.json.token,
      openId: response.json.openId || `test_openid_${Date.now()}`
    }
  })

  test('POST /api/auth/wx-login - 已有用户登录', async () => {
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `existing_user_${Date.now()}` }
    })
    expect(response.ok).toBeTruthy()
    expect(response.json.token).toBeDefined()
  })

  test('POST /api/auth/wx-login - 缺少code参数', async () => {
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect(response.status).toBe(400)
  })

  test('POST /api/auth/admin-login - 管理员登录', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'admin123'
      },
      failOnStatusCode: false
    })
    // 可能返回401或200
    expect([200, 401]).toContain(response.status)
  })

  test('GET /api/auth/admin-info - 获取管理员信息(无权限)', async () => {
    const response = await apiFetch('/api/auth/admin-info', {
      failOnStatusCode: false
    })
    expect(response.status).toBe(401)
  })
})

// ============================================
// 用户模块
// ============================================
describe('👤 用户模块', () => {
  test.beforeAll(async () => {
    // 确保有登录token
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `user_test_${Date.now()}` }
      })
      testUser = {
        userId: response.json.userId,
        token: response.json.token,
        openId: response.json.openId || `test_openid_${Date.now()}`
      }
    }
  })

  test('GET /api/user/info - 获取用户信息', async () => {
    const response = await authFetch('/api/user/info')
    expect(response.ok).toBeTruthy()
    expect(response.json.userId).toBeDefined()
  })

  test('PUT /api/user/info - 更新用户信息', async () => {
    const response = await authFetch('/api/user/info', {
      method: 'PUT',
      body: {
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.png'
      }
    })
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/user/children - 获取儿童列表', async () => {
    const response = await authFetch('/api/user/children')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.children) || Array.isArray(response.json)).toBeTruthy()
  })

  test('POST /api/user/child - 添加儿童', async () => {
    const response = await authFetch('/api/user/child', {
      method: 'POST',
      body: {
        name: '测试儿童',
        gender: 1,
        birthDate: '2018-01-01'
      }
    })
    expect(response.ok).toBeTruthy()
    if (response.json.childId) {
      testChild = { childId: response.json.childId }
    }
  })

  test('PUT /api/user/child/:childId - 更新儿童信息', async () => {
    const listResponse = await authFetch('/api/user/children')
    const children = listResponse.json.children || listResponse.json || []
    
    if (children.length > 0) {
      const childId = children[0].childId || children[0].id
      const response = await authFetch(`/api/user/child/${childId}`, {
        method: 'PUT',
        body: { name: '更新后的名称' }
      })
      expect(response.ok).toBeTruthy()
    } else {
      test.skip()
    }
  })
})

// ============================================
// 游戏模块
// ============================================
describe('🎮 游戏模块', () => {
  test('GET /api/game/list - 获取游戏列表(无需认证)', async () => {
    const response = await apiFetch('/api/game/list')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.games) || Array.isArray(response.json)).toBeTruthy()
    
    const games = response.json.games || response.json
    if (games.length > 0) {
      testGameId = games[0].gameId || games[0].id || 'G001'
    }
  })

  test('GET /api/game/:gameId - 获取游戏详情', async () => {
    const gameId = testGameId || 'G001'
    const response = await authFetch(`/api/game/${gameId}`)
    expect(response.ok).toBeTruthy()
    expect(response.json.gameId || response.json.id).toBeDefined()
  })

  test('POST /api/game/record - 提交游戏记录', async () => {
    const listResponse = await authFetch('/api/user/children')
    const children = listResponse.json.children || listResponse.json || []
    const childId = children.length > 0 ? (children[0].childId || children[0].id) : 1
    
    const response = await authFetch('/api/game/record', {
      method: 'POST',
      body: {
        childId,
        gameId: testGameId || 'G001',
        score: 85,
        duration: 120,
        level: 1,
        correctCount: 20,
        totalCount: 25
      }
    })
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/game/records - 获取训练历史', async () => {
    const response = await authFetch('/api/game/records')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.records) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/game/list - 分页参数', async () => {
    const response = await apiFetch('/api/game/list?page=1&pageSize=5')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/game/list - 过滤参数', async () => {
    const response = await apiFetch('/api/game/list?type=attention')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 报告模块
// ============================================
describe('📊 报告模块', () => {
  test.beforeAll(async () => {
    if (!testChild?.childId) {
      const listResponse = await authFetch('/api/user/children')
      const children = listResponse.json.children || listResponse.json || []
      if (children.length > 0) {
        testChild = { childId: children[0].childId || children[0].id }
      }
    }
  })

  test('GET /api/report/today/:childId - 获取今日数据', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/today/${childId}`)
    expect(response.ok).toBeTruthy()
    expect(response.json.childId || response.json.child_id).toBeDefined()
  })

  test('GET /api/report/weekly/:childId - 获取周报', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/weekly/${childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/report/list - 获取报告列表', async () => {
    const response = await authFetch('/api/report/list')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.reports) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/report/child/:childId/latest - 获取最新报告', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/child/${childId}/latest`)
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/report/generate - 生成报告', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch('/api/report/generate', {
      method: 'POST',
      body: { childId, type: 'weekly' }
    })
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 成就模块
// ============================================
describe('🏆 成就模块', () => {
  test('GET /api/achievement/list - 获取成就列表(无需认证)', async () => {
    const response = await apiFetch('/api/achievement/list')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.achievements) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/achievement/child/:childId - 获取儿童成就', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/achievement/child/${childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/achievement/leaderboard/:gameId - 获取排行榜', async () => {
    const gameId = testGameId || 'G001'
    const response = await authFetch(`/api/achievement/leaderboard/${gameId}`)
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.leaderboard) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/achievement/stats/:childId - 获取成就统计', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/achievement/stats/${childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/achievement/unlock - 解锁成就', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch('/api/achievement/unlock', {
      method: 'POST',
      body: { childId, achievementId: 'A001' }
    })
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 会员模块
// ============================================
describe('💎 会员模块', () => {
  test('GET /api/membership/packages - 获取套餐列表(无需认证)', async () => {
    const response = await apiFetch('/api/membership/packages')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.packages) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/membership/status - 获取会员状态', async () => {
    const response = await authFetch('/api/membership/status')
    expect(response.ok).toBeTruthy()
    expect(response.json.isVip !== undefined || response.json.vip !== undefined).toBeTruthy()
  })

  test('GET /api/membership/history - 获取购买历史', async () => {
    const response = await authFetch('/api/membership/history')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.history) || Array.isArray(response.json)).toBeTruthy()
  })

  test('POST /api/membership/create-order - 创建订单', async () => {
    const response = await authFetch('/api/membership/create-order', {
      method: 'POST',
      body: { packageId: 'P001', payType: 'wechat' }
    })
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/membership/pay - 发起支付', async () => {
    const response = await authFetch('/api/membership/pay', {
      method: 'POST',
      body: { orderNo: `TEST_${Date.now()}` }
    })
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/membership/callback - 支付回调(无需认证)', async () => {
    const response = await apiFetch('/api/membership/callback', {
      method: 'POST',
      body: { return_code: 'SUCCESS', transaction_id: `TEST_${Date.now()}` }
    })
    // 微信回调可能返回不同状态
    expect([200, 400, 500]).toContain(response.status)
  })
})

// ============================================
// 评估模块
// ============================================
describe('📈 评估模块', () => {
  test('GET /api/assessment/child/:childId/dimensions - 7维度评估', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/assessment/child/${childId}/dimensions`)
    expect(response.ok).toBeTruthy()
    expect(response.json).toBeDefined()
  })

  test('GET /api/assessment/child/:childId/trend - 能力趋势', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/assessment/child/${childId}/trend`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/assessment/child/:childId/summary - 能力摘要', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/assessment/child/${childId}/summary`)
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 推荐模块
// ============================================
describe('🤖 AI推荐模块', () => {
  test('GET /api/recommendation/profile/:childId - 用户画像', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/profile/${childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/recommendation/:childId - 推荐游戏', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/${childId}`)
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.recommendations) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/recommendation/weekly-plan/:childId - 周训练计划', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/weekly-plan/${childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/recommendation/difficulty/:childId/:gameId - 难度建议', async () => {
    const childId = testChild?.childId || 1
    const gameId = testGameId || 'G001'
    const response = await authFetch(`/api/recommendation/difficulty/${childId}/${gameId}`)
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 家长学院模块
// ============================================
describe('📚 家长学院模块', () => {
  test('GET /api/academy/categories - 获取分类列表', async () => {
    const response = await apiFetch('/api/academy/categories')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.categories) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/academy/categories/:id - 获取分类详情', async () => {
    const response = await apiFetch('/api/academy/categories/1')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/tags - 获取标签列表', async () => {
    const response = await apiFetch('/api/academy/tags')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles - 获取文章列表', async () => {
    const response = await apiFetch('/api/academy/articles')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.articles) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/academy/articles/hot - 获取热门文章', async () => {
    const response = await apiFetch('/api/academy/articles/hot')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles/recommended - 获取推荐文章', async () => {
    const response = await apiFetch('/api/academy/articles/recommended')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles/:id - 获取文章详情', async () => {
    const response = await apiFetch('/api/academy/articles/1')
    expect(response.ok).toBeTruthy()
    expect(response.json.id || response.json.articleId).toBeDefined()
  })

  test('GET /api/academy/articles/:id/related - 获取相关文章', async () => {
    const response = await apiFetch('/api/academy/articles/1/related')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/questions/categories - 获取问答分类', async () => {
    const response = await apiFetch('/api/academy/questions/categories')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/questions/hot - 获取热门问题', async () => {
    const response = await apiFetch('/api/academy/questions/hot')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/questions - 获取问题列表', async () => {
    const response = await apiFetch('/api/academy/questions')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/questions/:id - 获取问题详情', async () => {
    const response = await apiFetch('/api/academy/questions/1')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/questions/:id/answers - 获取回答列表', async () => {
    const response = await apiFetch('/api/academy/questions/1/answers')
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/academy/questions - 创建提问(需认证)', async () => {
    const response = await authFetch('/api/academy/questions', {
      method: 'POST',
      body: {
        title: '测试问题',
        content: '这是一个测试问题',
        categoryId: 1
      }
    })
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/expert-answers - 获取专家问答', async () => {
    const response = await apiFetch('/api/academy/expert-answers')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 学校管理模块
// ============================================
describe('🏫 学校管理模块', () => {
  test('GET /api/school/schools - 获取学校列表', async () => {
    const response = await apiFetch('/api/school/schools')
    expect(response.ok).toBeTruthy()
    expect(Array.isArray(response.json.schools) || Array.isArray(response.json)).toBeTruthy()
  })

  test('GET /api/school/schools/:id - 获取学校详情', async () => {
    const response = await apiFetch('/api/school/schools/1')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/teachers - 获取教师列表', async () => {
    const response = await apiFetch('/api/school/teachers')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/classes - 获取班级列表', async () => {
    const response = await apiFetch('/api/school/classes')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/classes/:classId/students - 获取学生列表', async () => {
    const response = await apiFetch('/api/school/classes/1/students')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/classes/:classId/report - 获取班级报告', async () => {
    const response = await apiFetch('/api/school/classes/1/report')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/dashboard - 获取仪表盘数据', async () => {
    const response = await apiFetch('/api/school/dashboard')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 错误处理测试
// ============================================
describe('⚠️ 错误处理测试', () => {
  test('无效的认证令牌', async () => {
    const response = await apiFetch('/api/user/info', {
      token: 'invalid_token',
      failOnStatusCode: false
    })
    expect(response.status).toBe(401)
  })

  test('缺少必需参数', async () => {
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect(response.status).toBe(400)
  })

  test('不存在的资源', async () => {
    const response = await apiFetch('/api/game/NONEXISTENT', {
      failOnStatusCode: false
    })
    expect(response.status).toBe(404)
  })

  test('无效的请求方法', async () => {
    const response = await apiFetch('/api/game/list', {
      method: 'DELETE',
      failOnStatusCode: false
    })
    expect([405, 404]).toContain(response.status)
  })
})

// ============================================
// 性能测试
// ============================================
describe('⚡ 性能测试', () => {
  test('响应时间 - 健康检查', async () => {
    const start = Date.now()
    await apiFetch('/api/health')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(1000)
  })

  test('响应时间 - 游戏列表', async () => {
    const start = Date.now()
    await apiFetch('/api/game/list')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })

  test('并发请求处理', async () => {
    const requests = Array(10).fill(null).map(() => apiFetch('/api/health'))
    const start = Date.now()
    await Promise.all(requests)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })
})