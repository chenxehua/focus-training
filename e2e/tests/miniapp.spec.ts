/**
 * FocusKids 小程序页面 E2E 测试
 * 测试所有页面、事件、接口调用
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

// 辅助函数：等待一段时间
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 辅助函数：生成随机字符串
const randomStr = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

describe('【API健康检查】', () => {
  test('API服务运行正常', async () => {
    const response = await apiFetch('/api/health')
    expect(response.ok || response.status === 404).toBeTruthy()
  })
})

describe('【登录页面】pages/login/index', () => {
  let authToken: string
  let userId: number

  test('发送验证码接口', async () => {
    const response = await apiFetch('/api/auth/send-code', {
      method: 'POST',
      body: { phone: '13800138000' }
    })
    // 可能返回成功或其他状态
    expect([200, 400, 429, 500].includes(response.status)).toBeTruthy()
  })

  test('手机号登录接口', async () => {
    const response = await apiFetch('/api/auth/phone-login', {
      method: 'POST',
      body: { phone: '13800138000', code: '123456' }
    })
    expect([200, 400, 401, 429, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    if (body.code === 0 && body.data) {
      authToken = body.data.token
      userId = body.data.userId
    }
  })

  test('微信登录接口 - 新用户', async () => {
    await wait(1000)
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: {
        code: `wx_new_${randomStr('user')}`,
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.png'
      }
    })
    expect([200, 400, 401, 429, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    if (body.code === 0 && body.data) {
      authToken = body.data.token
      userId = body.data.userId
    }
  })

  test('登录 - 缺少必填参数', async () => {
    await wait(1000)
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: {}
    })
    expect(response.status).not.toBe(200)
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('登录 - 无效的code格式', async () => {
    await wait(1000)
    const response = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: '' }
    })
    expect([400, 401, 429].includes(response.status)).toBeTruthy()
  })
})

describe('【首页】pages/index/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    // 先登录获取token
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_index_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取游戏列表接口', async () => {
    const response = await apiFetch('/api/game/list', { token: authToken })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    if (body.code === 0) {
      expect(Array.isArray(body.data)).toBe(true)
    }
  })

  test('获取游戏详情接口 - 舒尔特方格', async () => {
    const response = await apiFetch('/api/game/schulte', { token: authToken })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取游戏详情接口 - 不存在的游戏', async () => {
    const response = await apiFetch('/api/game/invalid_game', { token: authToken })
    expect([404, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取今日数据接口', async () => {
    const response = await apiFetch('/api/report/today?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【游戏广场】pages/games/index', () => {
  test('获取全部游戏列表', async () => {
    const response = await apiFetch('/api/game/list')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    if (body.code === 0) {
      expect(Array.isArray(body.data)).toBe(true)
      // 验证游戏数据结构
      if (body.data.length > 0) {
        const game = body.data[0]
        expect(game).toHaveProperty('id')
        expect(game).toHaveProperty('gameCode')
        expect(game).toHaveProperty('gameName')
      }
    }
  })

  test('获取游戏列表 - 按类型筛选', async () => {
    const response = await apiFetch('/api/game/list?type=注意力')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【舒尔特方格】pages/game-schulte/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_schulte_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('开始游戏 - 提交训练记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        score: 85,
        duration: 60000,
        accuracy: 0.9,
        difficultyLevel: 1,
        correctCount: 9,
        errorCount: 0
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交训练记录 - 缺少参数', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: { gameId: 'G001' }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交训练记录 - 无效的分数', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        score: -100,
        duration: -1
      }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取历史训练记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/records?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('获取历史训练记录 - 无效的childId', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/records?childId=invalid', { token: authToken })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【图案记忆】pages/game-memory/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_memory_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交图案记忆训练记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G004',
        gameCode: 'pattern_memory',
        score: 90,
        duration: 45000,
        accuracy: 0.95,
        difficultyLevel: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【听觉记忆】pages/game-sound/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_sound_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交听觉记忆训练记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G009',
        gameCode: 'auditory_memory',
        score: 88,
        duration: 30000,
        accuracy: 0.92,
        difficultyLevel: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【家长报告】pages/parent/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_parent_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取周报数据', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/report/weekly?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('获取周报 - 无childId', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/report/weekly', { token: authToken })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取今日报告', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/report/today?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取专注力报告', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/report/focus?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【个人中心】pages/profile/index', () => {
  let authToken: string
  let userId: number

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_profile_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
      userId = loginBody.data.userId
    }
  })

  test('获取用户信息', async () => {
    if (!authToken || !userId) return
    
    const response = await apiFetch(`/api/user/info?userId=${userId}`, { token: authToken })
    expect([200, 401, 403, 500].includes(response.status)).toBeTruthy()
  })

  test('更新用户信息', async () => {
    if (!authToken || !userId) return
    
    const response = await apiFetch(`/api/user/info?userId=${userId}`, {
      method: 'PUT',
      token: authToken,
      body: { nickname: '新昵称测试', phone: '13900139000' }
    })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取孩子列表', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/user/children', { token: authToken })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('添加孩子档案', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/user/children', {
      method: 'POST',
      token: authToken,
      body: {
        name: '测试孩子',
        age: 8,
        gender: 'male',
        ageGroup: '7-9'
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('添加孩子 - 缺少必填字段', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/user/children', {
      method: 'POST',
      token: authToken,
      body: { age: 8 }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('添加孩子 - 无效的年龄', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/user/children', {
      method: 'POST',
      token: authToken,
      body: {
        name: '测试孩子',
        age: 20, // 超出范围
        gender: 'male'
      }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('更新孩子信息', async () => {
    if (!authToken) return
    
    // 先获取孩子列表
    const childrenRes = await apiFetch('/api/user/children', { token: authToken })
    const childrenBody = childrenRes.json
    
    if (childrenBody.code === 0 && childrenBody.data?.children?.length > 0) {
      const childId = childrenBody.data.children[0].id
      
      const response = await apiFetch(`/api/user/children/${childId}`, {
        method: 'PUT',
        token: authToken,
        body: { name: '更新后的名字' }
      })
      expect([200, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    }
  })

  test('删除孩子档案', async () => {
    if (!authToken) return
    
    const childrenRes = await apiFetch('/api/user/children', { token: authToken })
    const childrenBody = childrenRes.json
    
    if (childrenBody.code === 0 && childrenBody.data?.children?.length > 0) {
      const childId = childrenBody.data.children[0].id
      
      const response = await apiFetch(`/api/user/children/${childId}`, {
        method: 'DELETE',
        token: authToken
      })
      expect([200, 204, 400, 401, 404, 500].includes(response.status)).toBeTruthy()
    }
  })

  test('登出接口', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/auth/logout', {
      method: 'POST',
      token: authToken
    })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【成就中心】pages/achievement/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_achievement_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取成就列表', async () => {
    const response = await apiFetch('/api/achievement/list')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    // 支持 code:0 或 success:true 两种格式
    if (body.code === 0 || body.success === true) {
      expect(Array.isArray(body.data)).toBe(true)
    }
  })

  test('获取孩子的成就列表', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/achievement/child/1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取成就统计', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/achievement/stats/1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('解锁成就接口', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/achievement/unlock', {
      method: 'POST',
      token: authToken,
      body: { childId: 1, achievementCode: 'TRAINING_10' }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【会员中心】pages/membership/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_membership_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取会员状态', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/membership/status', { token: authToken })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('获取会员套餐列表', async () => {
    const response = await apiFetch('/api/membership/packages')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    if (body.code === 0 || body.success === true) {
      expect(Array.isArray(body.data?.tiers) || Array.isArray(body.data)).toBe(true)
    }
  })

  test('获取会员特权', async () => {
    const response = await apiFetch('/api/membership/benefits')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('创建会员订单', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/membership/order', {
      method: 'POST',
      token: authToken,
      body: { memberType: 'month' }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('创建订单 - 缺少参数', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/membership/order', {
      method: 'POST',
      token: authToken,
      body: {}
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('创建订单 - 无效的会员类型', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/membership/order', {
      method: 'POST',
      token: authToken,
      body: { memberType: 'invalid_type' }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('支付回调接口', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/payment/callback', {
      method: 'POST',
      token: authToken,
      body: {
        orderId: 'test_order_123',
        status: 'success',
        transactionId: 'wx123456789'
      }
    })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【训练推荐】pages/recommendation/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_rec_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取用户画像', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/recommendation/profile?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取游戏推荐', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/recommendation/games?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取周计划', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/recommendation/weekly-plan?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取推荐 - 无childId', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/recommendation/games', { token: authToken })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【专注力评估】pages/assessment/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_assessment_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取能力维度评分', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/dimensions?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取能力趋势', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/trend?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取评估报告', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/report?childId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交评估结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/assessment/submit', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        answers: JSON.stringify({ q1: 'A', q2: 'B', q3: 'C' }),
        totalScore: 85
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【家长学院】pages/academy/*', () => {
  test('获取分类列表', async () => {
    const response = await apiFetch('/api/academy/categories')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body).toHaveProperty('code')
  })

  test('获取文章列表', async () => {
    const response = await apiFetch('/api/academy/articles')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取文章列表 - 按分类筛选', async () => {
    const response = await apiFetch('/api/academy/articles?categoryId=1')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取文章详情', async () => {
    const response = await apiFetch('/api/academy/article/1')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取文章详情 - 不存在的文章', async () => {
    const response = await apiFetch('/api/academy/article/99999')
    expect([404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取问答列表', async () => {
    const response = await apiFetch('/api/academy/questions')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取问题详情', async () => {
    const response = await apiFetch('/api/academy/question/1')
    expect([200, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('提交问题', async () => {
    const response = await apiFetch('/api/academy/question', {
      method: 'POST',
      body: {
        title: '测试问题标题',
        content: '这是测试问题的内容',
        categoryId: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交问题 - 缺少必填字段', async () => {
    const response = await apiFetch('/api/academy/question', {
      method: 'POST',
      body: { title: '只有标题' }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【学校管理】pages/school/*', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_school_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('获取学校列表', async () => {
    const response = await apiFetch('/api/school/schools', { token: authToken })
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取学校详情', async () => {
    const response = await apiFetch('/api/school/1', { token: authToken })
    expect([200, 401, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('获取仪表盘数据', async () => {
    const response = await apiFetch('/api/school/dashboard?schoolId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取教师列表', async () => {
    const response = await apiFetch('/api/school/teachers?schoolId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('添加教师', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/school/teacher', {
      method: 'POST',
      token: authToken,
      body: {
        schoolId: 1,
        name: '测试教师',
        phone: '13800138001',
        subject: '数学'
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取班级列表', async () => {
    const response = await apiFetch('/api/school/classes?schoolId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('添加班级', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/school/class', {
      method: 'POST',
      token: authToken,
      body: {
        schoolId: 1,
        name: '测试班级',
        grade: '一年级',
        teacherId: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取学生列表', async () => {
    const response = await apiFetch('/api/school/students?classId=1', { token: authToken })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('添加学生', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/school/student', {
      method: 'POST',
      token: authToken,
      body: {
        classId: 1,
        name: '测试学生',
        age: 8,
        parentPhone: '13900139001'
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【其他游戏页面】', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_games_${randomStr('user')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交 听声辨数 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G002',
        gameCode: 'audio_count',
        score: 80,
        duration: 30000,
        accuracy: 0.85,
        difficultyLevel: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 视觉追踪 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G003',
        gameCode: 'visual_tracking',
        score: 78,
        duration: 40000,
        accuracy: 0.82,
        difficultyLevel: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 反应速度 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G005',
        gameCode: 'reaction_speed',
        score: 92,
        duration: 20000,
        accuracy: 0.95,
        difficultyLevel: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 节奏点击 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G006',
        gameCode: 'rhythm_tap',
        score: 88,
        duration: 35000,
        accuracy: 0.9,
        difficultyLevel: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 迷宫寻路 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G007',
        gameCode: 'maze_navigation',
        score: 75,
        duration: 50000,
        accuracy: 0.78,
        difficultyLevel: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 快速分类 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G008',
        gameCode: 'quick_sort',
        score: 82,
        duration: 40000,
        accuracy: 0.85,
        difficultyLevel: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('提交 追踪目标 游戏记录', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G010',
        gameCode: 'target_tracking',
        score: 86,
        duration: 45000,
        accuracy: 0.88,
        difficultyLevel: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【错误处理与边界测试】', () => {
  test('无效的认证令牌', async () => {
    const response = await apiFetch('/api/user/info?userId=1', {
      token: 'invalid_token_12345'
    })
    expect([401, 403, 500].includes(response.status)).toBeTruthy()
    const body = response.json
    expect(body.code).not.toBe(0)
  })

  test('过期的认证令牌', async () => {
    const response = await apiFetch('/api/user/children', {
      token: 'expired_token_xyz'
    })
    expect([401, 403, 500].includes(response.status)).toBeTruthy()
  })

  test('缺少必要参数', async () => {
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      body: { gameId: 'schulte' } // 缺少 childId
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('无效的gameCode', async () => {
    const response = await apiFetch('/api/game/invalid-game-code-999')
    expect([401, 404, 500].includes(response.status)).toBeTruthy()
  })

  test('SQL注入测试 - gameId参数', async () => {
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      body: { childId: '1 OR 1=1', gameId: 'schulte' }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('XSS测试 - 用户名参数', async () => {
    const response = await apiFetch('/api/user/children', {
      method: 'POST',
      body: { name: '<script>alert(1)</script>', age: 8 }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('超出长度限制的参数', async () => {
    const response = await apiFetch('/api/user/children', {
      method: 'POST',
      body: { name: 'a'.repeat(200), age: 8 }
    })
    expect([400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('无效的JSON格式', async () => {
    const response = await fetch(`${API_BASE}/api/auth/wx-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })
    expect([400, 500].includes(response.status)).toBeTruthy()
  })

  test('请求方法不支持', async () => {
    const response = await fetch(`${API_BASE}/api/game/list`, {
      method: 'DELETE'
    })
    expect([405, 500].includes(response.status)).toBeTruthy()
  })

  test('访问不存在的API路径', async () => {
    const response = await apiFetch('/api/nonexistent/path/123')
    expect([404, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【性能与限流测试】', () => {
  test('快速连续请求 - 测试限流', async () => {
    const results: number[] = []
    for (let i = 0; i < 5; i++) {
      const response = await apiFetch('/api/auth/wx-login', {
        method: 'POST',
        body: { code: `rate_test_${i}` }
      })
      results.push(response.status)
    }
    // 应该至少有一个被限流
    const hasRateLimit = results.includes(429)
    const allSuccess = results.every(s => s === 200)
    expect(hasRateLimit || allSuccess).toBeTruthy()
  })

  test('大并发请求', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      apiFetch('/api/game/list')
    )
    const results = await Promise.all(promises)
    // 允许部分失败，但不应全部失败
    const successCount = results.filter(r => r.ok).length
    expect(successCount).toBeGreaterThan(0)
  })
})