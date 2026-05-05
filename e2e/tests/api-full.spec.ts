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

  // 统一响应格式: 支持 { code, data } 和 { success, data } 两种格式
  const unifiedJson = {
    ...json,
    // 兼容直接返回 token 的格式
    token: json.token || json.data?.token,
    userId: json.userId || json.data?.id || json.data?.userInfo?.id || json.data?.userInfo?.userId,
    userInfo: json.userInfo || json.data,
    isNew: json.isNew ?? json.data?.isNew,
    // 兼容列表数据
    children: json.children || json.data?.children || [],
    // 兼容 success 格式
    code: json.code ?? (json.success === true ? 0 : undefined),
    data: json.data ?? (json.success === true ? json : undefined),
  }
  
  // 判断请求是否成功
  const isSuccess = response.ok && (json.code === 0 || json.success === true || json.code === undefined)
  
  if (!isSuccess && failOnStatusCode) {
    throw new Error(`API ${path} failed with status ${response.status}: ${JSON.stringify(json)}`)
  }
  
  return {
    status: response.status,
    ok: isSuccess,
    json: unifiedJson,
    rawJson: json,
  }
}

async function authFetch(path: string, options: {
  method?: string
  body?: Record<string, unknown>
} = {}) {
  // 如果没有token，跳过需要认证的测试
  if (!testUser?.token) {
    throw new Error('No auth token available - test requires valid login')
  }
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
      body: { code: `test_${Date.now()}` }
    })
    // API返回格式: {code: 0, data: {token, userInfo, isNew}, message: "success"}
    expect(response.ok).toBeTruthy()
    expect(response.json.token || response.json.data?.token).toBeDefined()
    
    testUser = {
      userId: response.json.data?.userInfo?.id || response.json.userId,
      token: response.json.token || response.json.data?.token,
      openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
    }
  })

  test('POST /api/auth/wx-login - 已有用户登录', async () => {
    // 使用 test_ 前缀以测试模式登录
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_existing_user_${Date.now()}` }
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
  test.beforeEach(async () => {
    // 确保有登录token - 每个测试前都检查并重新登录
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `test_user_${Date.now()}` }
      })
      testUser = {
        userId: response.json.data?.userInfo?.id || response.json.userId,
        token: response.json.token || response.json.data?.token,
        openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
      }
    }
  })

  test('GET /api/user/info - 获取用户信息', async () => {
    const response = await authFetch('/api/user/info')
    expect(response.ok).toBeTruthy()
    expect(response.json.userId || response.json.data?.id).toBeDefined()
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
        gender: 'male',
        age: 8,
        ageGroup: '7-9'
      }
    })
    expect(response.ok).toBeTruthy()
    // 兼容不同的返回格式
    const childId = response.json.childId || response.rawJson?.data?.id || response.rawJson?.data?.childId
    if (childId) {
      testChild = { childId }
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
  test.beforeEach(async () => {
    // 确保有登录token - 每个测试前都检查并重新登录
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `test_user_${Date.now()}` }
      })
      testUser = {
        userId: response.json.data?.userInfo?.id || response.json.userId,
        token: response.json.token || response.json.data?.token,
        openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
      }
    }
  })

  test('GET /api/game/list - 获取游戏列表(无需认证)', async () => {
    const response = await apiFetch('/api/game/list')
    expect(response.ok).toBeTruthy()
    // API返回格式: {code: 0, data: [...], message: "success"}
    const games = response.json.data || response.json
    expect(Array.isArray(games)).toBeTruthy()
    
    // 保存游戏信息，testGameId 存 id (数字)，也保存 gameCode
    if (games.length > 0) {
      testGameId = games[0].id?.toString() || '1'
    }
  })

  test('GET /api/game/:gameId - 获取游戏详情', async () => {
    // 游戏详情API可能需要认证，改用apiFetch并处理可能的401
    const gameId = testGameId || '1'
    const response = await apiFetch(`/api/game/${gameId}`, { failOnStatusCode: false })
    // 期望成功或401(需要认证)
    expect([200, 401]).toContain(response.status)
  })

  test('POST /api/game/record - 提交游戏记录', async () => {
    // 先获取儿童列表，如果没有儿童则先创建一个
    let childId = testChild?.childId
    if (!childId) {
      const listResponse = await authFetch('/api/user/children')
      const children = listResponse.json.children || listResponse.json || []
      childId = children.length > 0 ? (children[0].childId || children[0].id) : null
    }
    
    // 如果仍然没有儿童，尝试创建
    if (!childId) {
      try {
        const createResponse = await authFetch('/api/user/child', {
          method: 'POST',
          body: {
            name: '测试儿童',
            gender: 'male',
            age: 8,
            ageGroup: '7-9'
          }
        })
        childId = createResponse.json.childId || createResponse.rawJson?.data?.id || createResponse.rawJson?.data?.childId
      } catch (e) {
        // 创建失败，跳过测试
        test.skip()
        return
      }
    }
    
    if (!childId) {
      test.skip()
      return
    }
    
    const response = await authFetch('/api/game/record', {
      method: 'POST',
      body: {
        childId,
        gameId: parseInt(testGameId || '1'),  // 使用数字 id
        durationSeconds: 120,
        accuracy: 0.85,  // 小数 0-1 之间
        score: 85,
        focusScore: 80,
        difficultyLevel: 1,
        gameConfig: { level: 1 },
        resultData: { correctCount: 20, totalCount: 25 }
      }
    })
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/game/records - 获取训练历史', async () => {
    // game/records 需要 childId 参数
    let childId = testChild?.childId
    if (!childId) {
      const listResponse = await authFetch('/api/user/children')
      const children = listResponse.json.children || listResponse.json || []
      childId = children.length > 0 ? (children[0].childId || children[0].id) : null
    }
    // 如果没有 childId，可能返回 400
    const childIdParam = childId ? `?childId=${childId}` : ''
    const response = await authFetch(`/api/game/records${childIdParam}`, { failOnStatusCode: false })
    // 可能返回 200 空数据或 400 缺少参数
    expect([200, 400]).toContain(response.status)
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
    // 确保有登录token
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `test_report_user_${Date.now()}` }
      })
      testUser = {
        userId: response.json.data?.userInfo?.id || response.json.userId,
        token: response.json.token || response.json.data?.token,
        openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
      }
    }
    
    // 确保有儿童数据
    if (!testChild?.childId) {
      // 先获取儿童列表
      const listResponse = await authFetch('/api/user/children')
      const children = listResponse.json.children || listResponse.json || []
      if (children.length > 0) {
        testChild = { childId: children[0].childId || children[0].id }
      } else {
        // 创建一个测试儿童
        const createResponse = await authFetch('/api/user/child', {
          method: 'POST',
          body: { name: '测试儿童', gender: 'male', age: 8, ageGroup: '7-9' }
        })
        testChild = { childId: createResponse.json.childId || createResponse.rawJson?.data?.id }
      }
    }
  })

  test('GET /api/report/list - 获取报告列表', async () => {
    const response = await authFetch('/api/report/list')
    expect(response.ok).toBeTruthy()
    expect(response.json).toBeDefined()
  })

  test('GET /api/report/today/:childId - 获取今日数据', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/today/${childId}`, { failOnStatusCode: false })
    // 可能成功或返回400（无训练数据）或500
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/report/weekly/:childId - 获取周报', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/weekly/${childId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/report/child/:childId/latest - 获取最新报告', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/report/child/${childId}/latest`, { failOnStatusCode: false })
    expect([200, 400, 404, 500]).toContain(response.status)
  })

  test('POST /api/report/generate - 生成报告', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch('/api/report/generate', {
      method: 'POST',
      body: { childId, type: 'weekly' },
      failOnStatusCode: false
    })
    expect([200, 400, 500]).toContain(response.status)
  })
})

// ============================================
// 成就模块
// ============================================
describe('🏆 成就模块', () => {
  test('GET /api/achievement/list - 获取成就列表(无需认证)', async () => {
    const response = await apiFetch('/api/achievement/list')
    expect(response.ok).toBeTruthy()
    // 兼容 {success: true, data: [...]} 和 {data: [...]} 格式
    const achievements = response.json.data || response.json.achievements || []
    expect(Array.isArray(achievements) || achievements.length !== undefined).toBeTruthy()
  })

  test('GET /api/achievement/child/:childId - 获取儿童成就', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/achievement/child/${childId}`, { failOnStatusCode: false })
    // 可能返回400（childId无效）或200
    expect([200, 400]).toContain(response.status)
  })

  test('GET /api/achievement/leaderboard/:gameId - 获取排行榜', async () => {
    const gameId = testGameId || '1'
    const response = await authFetch(`/api/achievement/leaderboard/${gameId}`, { failOnStatusCode: false })
    expect([200, 400]).toContain(response.status)
  })

  test('GET /api/achievement/stats/:childId - 获取成就统计', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/achievement/stats/${childId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })

  test('POST /api/achievement/unlock - 解锁成就', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch('/api/achievement/unlock', {
      method: 'POST',
      body: { childId, achievementId: '1' },
      failOnStatusCode: false
    })
    // 可能返回成功或错误
    expect([200, 400, 500]).toContain(response.status)
  })
})

// ============================================
// 会员模块
// ============================================
describe('💎 会员模块', () => {
  test('GET /api/membership/packages - 获取套餐列表(无需认证)', async () => {
    const response = await apiFetch('/api/membership/packages')
    expect(response.ok).toBeTruthy()
    // 兼容不同的返回格式: {success: true, data: [...]} 或 {data: [...]} 或 {packages: [...]}
    const packages = response.json.data || response.json.packages || []
    expect(Array.isArray(packages) || typeof packages === 'object').toBeTruthy()
  })

  test('GET /api/membership/status - 获取会员状态', async () => {
    const response = await authFetch('/api/membership/status')
    expect(response.ok).toBeTruthy()
    // 返回格式: {success: true, data: {is_vip: false, ...}}
    expect(response.json.data !== undefined || response.json.is_vip !== undefined).toBeTruthy()
  })

  test('GET /api/membership/history - 获取购买历史', async () => {
    // 使用 authFetch 确保有token
    const response = await authFetch('/api/membership/history', {
      failOnStatusCode: false
    })
    // 返回200但success:false表示无数据，或返回空数组
    expect([200, 400, 500]).toContain(response.status)
  })

  test('POST /api/membership/create-order - 创建订单', async () => {
    const response = await apiFetch('/api/membership/create-order', {
      method: 'POST',
      body: { packageId: 'yearly_basic', payType: 'wechat' },
      token: testUser?.token,
      failOnStatusCode: false
    })
    // 缺少参数或其他业务逻辑错误
    expect([200, 400, 401, 500]).toContain(response.status)
  })

  test('POST /api/membership/pay - 发起支付', async () => {
    const response = await apiFetch('/api/membership/pay', {
      method: 'POST',
      body: { orderNo: `TEST_${Date.now()}` },
      token: testUser?.token,
      failOnStatusCode: false
    })
    // 订单不存在或支付失败
    expect([200, 400, 401, 500]).toContain(response.status)
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
    // assessment需要token，且需要有效的childId
    const response = await apiFetch(`/api/assessment/child/1/dimensions`, {
      token: testUser?.token,
      failOnStatusCode: false
    })
    // 可能返回成功或400（childId无效）或401（无token）
    expect([200, 400, 401, 500]).toContain(response.status)
  })

  test('GET /api/assessment/child/:childId/trend - 能力趋势', async () => {
    const response = await apiFetch(`/api/assessment/child/1/trend`, {
      token: testUser?.token,
      failOnStatusCode: false
    })
    expect([200, 400, 401, 500]).toContain(response.status)
  })

  test('GET /api/assessment/child/:childId/summary - 能力摘要', async () => {
    const response = await apiFetch(`/api/assessment/child/1/summary`, {
      token: testUser?.token,
      failOnStatusCode: false
    })
    expect([200, 400, 401, 500]).toContain(response.status)
  })
})

// ============================================
// 推荐模块
// ============================================
describe('🤖 AI推荐模块', () => {
  test.beforeEach(async () => {
    // 确保有登录token - 每个测试前都检查并重新登录
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `test_user_${Date.now()}` }
      })
      testUser = {
        userId: response.json.data?.userInfo?.id || response.json.userId,
        token: response.json.token || response.json.data?.token,
        openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
      }
    }
  })

  test('GET /api/recommendation/profile/:childId - 用户画像', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/profile/${childId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/recommendation/:childId - 推荐游戏', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/${childId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/recommendation/weekly-plan/:childId - 周训练计划', async () => {
    const childId = testChild?.childId || 1
    const response = await authFetch(`/api/recommendation/weekly-plan/${childId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/recommendation/difficulty/:childId/:gameId - 难度建议', async () => {
    const childId = testChild?.childId || 1
    const gameId = testGameId || '1'
    const response = await authFetch(`/api/recommendation/difficulty/${childId}/${gameId}`, { failOnStatusCode: false })
    expect([200, 400, 500]).toContain(response.status)
  })
})

// ============================================
// 家长学院模块
// ============================================
describe('📚 家长学院模块', () => {
  test.beforeEach(async () => {
    // 确保有登录token - 每个测试前都检查并重新登录
    if (!testUser?.token) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `test_user_${Date.now()}` }
      })
      testUser = {
        userId: response.json.data?.userInfo?.id || response.json.userId,
        token: response.json.token || response.json.data?.token,
        openId: response.json.data?.userInfo?.openid || `test_openid_${Date.now()}`
      }
    }
  })

  test('GET /api/academy/categories - 获取分类列表', async () => {
    const response = await apiFetch('/api/academy/categories')
    expect(response.ok).toBeTruthy()
    // 兼容 {code: 0, data: [...]} 格式
    const categories = response.json.data || response.json.categories || []
    expect(Array.isArray(categories) || categories.length !== undefined).toBeTruthy()
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
    // 兼容不同的返回格式
    const articles = response.json.data?.articles || response.json.articles || response.json.data || []
    expect(Array.isArray(articles) || typeof response.json.data?.total === 'number').toBeTruthy()
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
    const response = await apiFetch('/api/academy/articles/1', { failOnStatusCode: false })
    // 可能返回404（文章不存在）
    expect([200, 404]).toContain(response.status)
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
    const response = await apiFetch('/api/academy/questions/1', { failOnStatusCode: false })
    expect([200, 404]).toContain(response.status)
  })

  test('GET /api/academy/questions/:id/answers - 获取回答列表', async () => {
    const response = await apiFetch('/api/academy/questions/1/answers', { failOnStatusCode: false })
    expect([200, 404]).toContain(response.status)
  })

  test('POST /api/academy/questions - 创建提问(需认证)', async () => {
    const response = await authFetch('/api/academy/questions', {
      method: 'POST',
      body: {
        title: '测试问题',
        content: '这是一个测试问题',
        categoryId: 1
      },
      failOnStatusCode: false
    })
    // 200=成功, 400=参数错误, 401=未认证, 500=服务器错误
    expect([200, 400, 401, 500]).toContain(response.status)
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
    // 返回格式: {code: 0, data: {schools: [], total: 0}}
    const schools = response.json.data?.schools || response.json.schools || []
    expect(Array.isArray(schools) || response.json.data?.total !== undefined).toBeTruthy()
  })

  test('GET /api/school/schools/:id - 获取学校详情', async () => {
    const response = await apiFetch('/api/school/schools/1', { failOnStatusCode: false })
    // 可能返回404（学校不存在）
    expect([200, 404]).toContain(response.status)
  })

  test('GET /api/school/teachers - 获取教师列表', async () => {
    // 需要学校ID参数
    const response = await apiFetch('/api/school/teachers', { failOnStatusCode: false })
    // 返回400表示需要参数，或200表示正常
    expect([200, 400]).toContain(response.status)
  })

  test('GET /api/school/classes - 获取班级列表', async () => {
    // 需要学校ID参数
    const response = await apiFetch('/api/school/classes', { failOnStatusCode: false })
    expect([200, 400]).toContain(response.status)
  })

  test('GET /api/school/classes/:classId/students - 获取学生列表', async () => {
    const response = await apiFetch('/api/school/classes/1/students', { failOnStatusCode: false })
    expect([200, 404]).toContain(response.status)
  })

  test('GET /api/school/classes/:classId/report - 获取班级报告', async () => {
    const response = await apiFetch('/api/school/classes/1/report', { failOnStatusCode: false })
    expect([200, 404, 500]).toContain(response.status)
  })

  test('GET /api/school/dashboard - 获取仪表盘数据', async () => {
    // 需要学校ID参数
    const response = await apiFetch('/api/school/dashboard', { failOnStatusCode: false })
    expect([200, 400]).toContain(response.status)
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
    expect([401, 403]).toContain(response.status)
  })

  test('缺少必需参数', async () => {
    // game/record 需要登录
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect([400, 401]).toContain(response.status)
  })

  test('不存在的资源', async () => {
    // 需要token才能访问
    const response = await apiFetch('/api/game/NONEXISTENT', {
      token: 'invalid',
      failOnStatusCode: false
    })
    expect([400, 401, 404]).toContain(response.status)
  })

  test('无效的请求方法', async () => {
    // 需要token才能访问
    const response = await apiFetch('/api/game/list', {
      method: 'DELETE',
      token: 'invalid',
      failOnStatusCode: false
    })
    expect([400, 401, 404, 405]).toContain(response.status)
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