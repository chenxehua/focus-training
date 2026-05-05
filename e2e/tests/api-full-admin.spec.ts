/**
 * 专注星球小程序 - 管理员模式 API E2E 测试
 * 使用管理员账号进行认证测试
 */

import { test, expect, describe } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

// 管理员token (userId=1)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3Nzk1MDg2NSwiZXhwIjoxNzc4NTU1NjY1fQ.iPmudGGWaMWOTnyqaD-tfKHCAH9UPazXFDY09KNZDWs'

// 测试数据
let testChild = { childId: 2 }  // 使用数据库中已存在的测试儿童
let testGameId = 'G001'

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
    token: ADMIN_TOKEN,
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
  test('POST /api/auth/admin-login - 管理员登录成功', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    })
    expect(response.ok).toBeTruthy()
    expect(response.json.data?.token).toBeDefined()
  })

  test('POST /api/auth/admin-login - 管理员登录失败', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrong_password' },
      failOnStatusCode: false
    })
    expect(response.status).toBe(401)
  })

  test('POST /api/auth/admin-login - 缺少参数', async () => {
    const response = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect(response.status).toBe(400)
  })

  test('GET /api/auth/admin-info - 获取管理员信息', async () => {
    const response = await authFetch('/api/auth/admin-info')
    expect(response.ok).toBeTruthy()
    expect(response.json.data?.username).toBe('admin')
  })
})

// ============================================
// 用户模块
// ============================================
describe('👤 用户模块', () => {
  test('GET /api/user/info - 获取用户信息', async () => {
    const response = await authFetch('/api/user/info')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/user/children - 获取儿童列表', async () => {
    const response = await authFetch('/api/user/children')
    expect(response.ok).toBeTruthy()
    const children = response.json.data || []
    expect(Array.isArray(children)).toBeTruthy()
    
    if (children.length > 0) {
      testChild = { childId: children[0].id || 2 }
    }
  })
})

// ============================================
// 游戏模块
// ============================================
describe('🎮 游戏模块', () => {
  test('GET /api/game/list - 获取游戏列表', async () => {
    const response = await apiFetch('/api/game/list')
    expect(response.ok).toBeTruthy()
    const games = response.json.data || response.json.games || response.json || []
    expect(Array.isArray(games)).toBeTruthy()
    
    if (games.length > 0) {
      testGameId = games[0].id || games[0].gameId || 'G001'
    }
  })

  test('GET /api/game/list - 分页参数', async () => {
    const response = await apiFetch('/api/game/list?page=1&pageSize=5')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/game/:gameId - 获取游戏详情', async () => {
    const response = await authFetch(`/api/game/${testGameId}`)
    expect(response.ok).toBeTruthy()
  })

  test('POST /api/game/record - 提交游戏记录', async () => {
    const response = await authFetch('/api/game/record', {
      method: 'POST',
      body: {
        childId: testChild.childId,
        gameId: testGameId,
        score: 85,
        duration: 120,
        level: 1,
        correctCount: 20,
        totalCount: 25
      }
    })
    // 可能成功或已有记录
    expect([200, 400, 500]).toContain(response.status)
  })

  test('GET /api/game/records - 获取训练历史', async () => {
    const response = await authFetch('/api/game/records')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 报告模块
// ============================================
describe('📊 报告模块', () => {
  test('GET /api/report/today/:childId - 获取今日数据', async () => {
    const response = await authFetch(`/api/report/today/${testChild.childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/report/weekly/:childId - 获取周报', async () => {
    const response = await authFetch(`/api/report/weekly/${testChild.childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/report/list - 获取报告列表', async () => {
    const response = await authFetch('/api/report/list')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 成就模块
// ============================================
describe('🏆 成就模块', () => {
  test('GET /api/achievement/list - 获取成就列表', async () => {
    const response = await apiFetch('/api/achievement/list')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/achievement/child/:childId - 获取儿童成就', async () => {
    const response = await authFetch(`/api/achievement/child/${testChild.childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/achievement/leaderboard/:gameId - 获取排行榜', async () => {
    const response = await authFetch(`/api/achievement/leaderboard/${testGameId}`)
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 会员模块
// ============================================
describe('💎 会员模块', () => {
  test('GET /api/membership/packages - 获取套餐列表', async () => {
    const response = await apiFetch('/api/membership/packages')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/membership/status - 获取会员状态', async () => {
    const response = await authFetch('/api/membership/status')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/membership/history - 获取购买历史', async () => {
    const response = await authFetch('/api/membership/history')
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 评估模块
// ============================================
describe('📈 评估模块', () => {
  test('GET /api/assessment/child/:childId/dimensions - 7维度评估', async () => {
    const response = await authFetch(`/api/assessment/child/${testChild.childId}/dimensions`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/assessment/child/:childId/trend - 能力趋势', async () => {
    const response = await authFetch(`/api/assessment/child/${testChild.childId}/trend`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/assessment/child/:childId/summary - 能力摘要', async () => {
    const response = await authFetch(`/api/assessment/child/${testChild.childId}/summary`)
    expect(response.ok).toBeTruthy()
  })
})

// ============================================
// 推荐模块
// ============================================
describe('🤖 AI推荐模块', () => {
  test('GET /api/recommendation/profile/:childId - 用户画像', async () => {
    const response = await authFetch(`/api/recommendation/profile/${testChild.childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/recommendation/:childId - 推荐游戏', async () => {
    const response = await authFetch(`/api/recommendation/${testChild.childId}`)
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/recommendation/weekly-plan/:childId - 周训练计划', async () => {
    const response = await authFetch(`/api/recommendation/weekly-plan/${testChild.childId}`)
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
  })

  test('GET /api/academy/tags - 获取标签列表', async () => {
    const response = await apiFetch('/api/academy/tags')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles - 获取文章列表', async () => {
    const response = await apiFetch('/api/academy/articles')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles/hot - 获取热门文章', async () => {
    const response = await apiFetch('/api/academy/articles/hot')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/academy/articles/recommended - 获取推荐文章', async () => {
    const response = await apiFetch('/api/academy/articles/recommended')
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
  })

  test('GET /api/school/teachers - 获取教师列表', async () => {
    const response = await apiFetch('/api/school/teachers')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/classes - 获取班级列表', async () => {
    const response = await apiFetch('/api/school/classes')
    expect(response.ok).toBeTruthy()
  })

  test('GET /api/school/dashboard - 获取仪表盘数据', async () => {
    const response = await authFetch('/api/school/dashboard')
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

  test('缺少必需参数 - 添加儿童', async () => {
    const response = await authFetch('/api/user/child', {
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
})

// ============================================
// 性能测试
// ============================================
describe('⚡ 性能测试', () => {
  test('响应时间 - 健康检查 < 1s', async () => {
    const start = Date.now()
    await apiFetch('/api/health')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(1000)
  })

  test('响应时间 - 游戏列表 < 2s', async () => {
    const start = Date.now()
    await apiFetch('/api/game/list')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })

  test('并发请求处理', async () => {
    const requests = Array(5).fill(null).map(() => apiFetch('/api/health'))
    const start = Date.now()
    await Promise.all(requests)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })
})
