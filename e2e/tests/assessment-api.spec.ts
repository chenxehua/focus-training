/**
 * 初次测评系统 - 完整API自动化测试
 * 测试所有评估相关API端点
 */

import { test, expect, describe } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api'
const TEST_CHILD_ID = 143
const TEST_ASSESSMENT_ID = 15

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

// 辅助函数: 登录获取token
async function login(): Promise<string> {
  const response = await apiFetch('/auth/wx-login', {
    method: 'POST',
    body: { code: 'test_code_assessment_' + Date.now(), childId: TEST_CHILD_ID }
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(response.json)}`)
  }

  const body = response.json

  // 支持两种响应格式: { success: true } 或 { code: 0 }
  let token: string | null = null
  if (body.success === true && body.data?.token) {
    token = body.data.token
  } else if (body.code === 0 && body.data?.token) {
    token = body.data.token
  } else if (body.token) {
    token = body.token
  }

  if (!token) {
    throw new Error(`Login returned no token: ${JSON.stringify(body)}`)
  }

  return token
}

// ===== 评估状态API =====

describe('评估状态 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/status/:childId - 获取儿童评估状态', async () => {
    const response = await apiFetch(`/assessment/status/${TEST_CHILD_ID}`, { token })
    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.childId).toBe(TEST_CHILD_ID)
    expect(body.data).toHaveProperty('hasCompletedInitial')
    expect(body.data).toHaveProperty('stages')
    expect(body.data.stages).toHaveProperty('questionnaire')
    expect(body.data.stages).toHaveProperty('gameTesting')
    expect(body.data.stages).toHaveProperty('report')
  })

  test('GET /assessment/status/:childId - 无效childId应返回错误', async () => {
    const response = await apiFetch('/assessment/status/999999', { token })
    const body = response.json
    expect(body.success === false || body.data === null).toBeTruthy()
  })

  test('GET /assessment/status/:childId - 无认证应返回401', async () => {
    const response = await apiFetch(`/assessment/status/${TEST_CHILD_ID}`)
    expect(response.status).toBe(401)
  })
})

// ===== 开始评估API =====

describe('开始评估 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('POST /assessment/start - 开始新评估', async () => {
    const response = await apiFetch('/assessment/start', {
      method: 'POST',
      body: { childId: TEST_CHILD_ID },
      token
    })

    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data).toHaveProperty('assessmentId')
    expect(body.data).toHaveProperty('childInfo')
    expect(body.data).toHaveProperty('estimatedDuration')
    expect(body.data).toHaveProperty('totalSteps')
    expect(body.data).toHaveProperty('consentRequired')
  })

  test('POST /assessment/start - 重复开始应返回现有评估', async () => {
    const response = await apiFetch('/assessment/start', {
      method: 'POST',
      body: { childId: TEST_CHILD_ID },
      token
    })

    const body = response.json
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('isExisting', true)
  })

  test('POST /assessment/start - 缺少childId应返回400', async () => {
    const response = await apiFetch('/assessment/start', {
      method: 'POST',
      body: {},
      token
    })

    expect(response.status).toBe(400)
    const body = response.json
    expect(body.success).toBe(false)
  })

  test('POST /assessment/start - 无效childId应返回404', async () => {
    const response = await apiFetch('/assessment/start', {
      method: 'POST',
      body: { childId: 999999 },
      token
    })

    expect(response.status).toBe(404)
  })
})

// ===== 问卷题目API =====

describe('问卷题目 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/questionnaire/:assessmentId - 获取问卷题目', async () => {
    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, { token })
    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data).toHaveProperty('questions')
    expect(body.data).toHaveProperty('ageGroup')
    expect(Array.isArray(body.data.questions)).toBe(true)
    expect(body.data.questions.length).toBeGreaterThan(0)

    const firstQuestion = body.data.questions[0]
    expect(firstQuestion).toHaveProperty('id')
    expect(firstQuestion).toHaveProperty('content')
    expect(firstQuestion).toHaveProperty('options')
    expect(firstQuestion).toHaveProperty('dimension')
    expect(firstQuestion).toHaveProperty('dimensionName')
    expect(firstQuestion).toHaveProperty('weight')
  })

  test('GET /assessment/questionnaire/:assessmentId - 问卷应覆盖多个维度', async () => {
    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, { token })
    const body = response.json
    const questions = body.data.questions

    const dimensions = new Set(questions.map((q: any) => q.dimension))
    expect(dimensions.size).toBeGreaterThanOrEqual(4)
  })

  test('GET /assessment/questionnaire/:assessmentId - 无效assessmentId应返回404', async () => {
    const response = await apiFetch('/assessment/questionnaire/999999', { token })
    expect(response.status).toBe(404)
  })
})

// ===== 提交问卷答案API =====

describe('提交问卷答案 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('POST /assessment/questionnaire/:assessmentId - 提交部分答案', async () => {
    const answers = [
      { questionId: 32, value: 1, dimension: 'sustained_attention' },
      { questionId: 33, value: 2, dimension: 'selective_attention' },
      { questionId: 34, value: 3, dimension: 'divided_attention' }
    ]

    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      body: { answers },
      token
    })

    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('saved')
    expect(body.data.saved).toBeGreaterThan(0)
  })

  test('POST /assessment/questionnaire/:assessmentId - 提交完成标志', async () => {
    const qResponse = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, { token })
    const qBody = qResponse.json
    const totalQuestions = qBody.data.totalQuestions || qBody.data.questions?.length || 5

    const answers = []
    const qIds = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
    for (let i = 0; i < Math.min(totalQuestions, qIds.length); i++) {
      answers.push({
        questionId: qIds[i],
        value: (i % 4) + 1,
        dimension: ['sustained_attention', 'selective_attention', 'divided_attention', 'attention_shifting', 'working_memory', 'impulse_control', 'reaction_speed'][i % 7]
      })
    }

    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      body: { answers, completed: true },
      token
    })

    expect(response.ok).toBeTruthy()
    const body = response.json
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('completed')
  })

  test('POST /assessment/questionnaire/:assessmentId - 空答案应返回400', async () => {
    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      body: { answers: [] },
      token
    })

    expect(response.status).toBe(400)
  })

  test('POST /assessment/questionnaire/:assessmentId - 缺少answers字段应返回400', async () => {
    const response = await apiFetch(`/assessment/questionnaire/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      body: {},
      token
    })

    expect(response.status).toBe(400)
  })
})

// ===== 游戏列表API =====

describe('游戏列表 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/games/:assessmentId - 获取游戏列表', async () => {
    const response = await apiFetch(`/assessment/games/${TEST_ASSESSMENT_ID}`, { token })
    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data).toHaveProperty('games')
    expect(body.data).toHaveProperty('totalGames')
    expect(body.data).toHaveProperty('completedGames')
    expect(body.data).toHaveProperty('ageGroup')
    expect(Array.isArray(body.data.games)).toBe(true)
    expect(body.data.games.length).toBeGreaterThan(0)
  })

  test('GET /assessment/games/:assessmentId - 游戏应包含完整信息', async () => {
    const response = await apiFetch(`/assessment/games/${TEST_ASSESSMENT_ID}`, { token })
    const body = response.json
    const firstGame = body.data.games[0]

    expect(firstGame).toHaveProperty('gameCode')
    expect(firstGame).toHaveProperty('gameId')
    expect(firstGame).toHaveProperty('gameName')
    expect(firstGame).toHaveProperty('description')
    expect(firstGame).toHaveProperty('difficultyLevel')
    expect(firstGame).toHaveProperty('difficultyName')
    expect(firstGame).toHaveProperty('duration')
    expect(firstGame).toHaveProperty('timeLimit')
    expect(firstGame).toHaveProperty('gameIcon')
    expect(firstGame).toHaveProperty('completed')
    expect(firstGame).toHaveProperty('status')
  })

  test('GET /assessment/games/:assessmentId - 无效assessmentId应返回404', async () => {
    const response = await apiFetch('/assessment/games/999999', { token })
    expect(response.status).toBe(404)
  })
})

// ===== 提交游戏结果API =====

describe('提交游戏结果 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('POST /assessment/games/:assessmentId - 提交舒尔特方格结果', async () => {
    const response = await apiFetch(`/assessment/games/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      body: {
        gameId: 'schulte',
        result: { score: 85, accuracy: 0.92, duration: 120 }
      },
      token
    })

    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('performance')
    expect(body.data.performance).toHaveProperty('score')
    expect(body.data.performance).toHaveProperty('percentile')
    expect(body.data.performance).toHaveProperty('rating')
  })

  test('POST /assessment/games/:assessmentId - 提交多个游戏结果', async () => {
    const games = ['schulte', 'quick_sort', 'audio_count']

    for (const gameId of games) {
      const response = await apiFetch(`/assessment/games/${TEST_ASSESSMENT_ID}`, {
        method: 'POST',
        body: {
          gameId,
          result: {
            score: Math.floor(Math.random() * 30) + 70,
            accuracy: 0.8 + Math.random() * 0.15,
            duration: Math.floor(Math.random() * 60) + 60
          }
        },
        token
      })

      expect(response.ok).toBeTruthy()
      const body = response.json
      expect(body.success).toBe(true)
    }
  })
})

// ===== 生成报告API =====

describe('生成报告 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('POST /assessment/generate-report/:assessmentId - 生成完整报告', async () => {
    const response = await apiFetch(`/assessment/generate-report/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      token
    })

    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data).toHaveProperty('reportId')
    expect(body.data).toHaveProperty('overallScore')
    expect(body.data).toHaveProperty('overallPercentile')
    expect(body.data).toHaveProperty('overallRating')
    expect(body.data).toHaveProperty('overallLevel')
    expect(body.data).toHaveProperty('summary')
    expect(body.data).toHaveProperty('dimensions')
    expect(body.data).toHaveProperty('strengths')
    expect(body.data).toHaveProperty('weaknesses')
    expect(body.data).toHaveProperty('recommendations')
    expect(body.data).toHaveProperty('trainingPlan')
    expect(body.data).toHaveProperty('disclaimer')
  })

  test('POST /assessment/generate-report/:assessmentId - 报告应包含多个维度', async () => {
    const response = await apiFetch(`/assessment/generate-report/${TEST_ASSESSMENT_ID}`, {
      method: 'POST',
      token
    })

    const body = response.json
    const dimensions = body.data.dimensions

    expect(Array.isArray(dimensions)).toBe(true)
    expect(dimensions.length).toBeGreaterThanOrEqual(5)
  })
})

// ===== 获取报告详情API =====

describe('获取报告详情 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/report/child/:childId/list - 获取报告列表', async () => {
    const response = await apiFetch(`/assessment/report/child/${TEST_CHILD_ID}/list`, { token })
    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('reports')
    expect(body.data).toHaveProperty('pagination')
    expect(Array.isArray(body.data.reports)).toBe(true)
  })

  test('GET /assessment/report/:reportNo - 获取单个报告详情', async () => {
    const listResponse = await apiFetch(`/assessment/report/child/${TEST_CHILD_ID}/list`, { token })
    const listBody = listResponse.json

    if (listBody.data.reports.length === 0) {
      return
    }

    const reportNo = listBody.data.reports[0].reportNo
    const response = await apiFetch(`/assessment/report/${reportNo}`, { token })

    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('report')
    expect(body.data.report).toHaveProperty('dimensionDetails')
    expect(body.data.report).toHaveProperty('summary')
    expect(body.data.report).toHaveProperty('recommendations')
  })
})

// ===== 常模和配置API =====

describe('常模和配置 API', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/norm/:dimension/:ageGroup - 获取百分位常模', async () => {
    const dimensions = ['sustained_attention', 'selective_attention', 'divided_attention', 'working_memory']
    const ageGroups = ['4-5', '6-7', '8-9', '10-12']

    for (const dimension of dimensions) {
      for (const ageGroup of ageGroups) {
        const response = await apiFetch(`/assessment/norm/${dimension}/${ageGroup}`, { token })
        expect([200, 404]).toContain(response.status)
      }
    }
  })

  test('GET /assessment/game-config/:gameCode/:ageGroup - 获取游戏配置', async () => {
    const games = ['schulte', 'pattern_memory', 'audio_count', 'quick_sort', 'maze']
    const ageGroups = ['4-5', '6-7', '8-9', '10-12']

    for (const gameCode of games) {
      for (const ageGroup of ageGroups) {
        const response = await apiFetch(`/assessment/game-config/${gameCode}/${ageGroup}`, { token })

        expect(response.ok).toBeTruthy()
        const body = response.json

        expect(body.success).toBe(true)
        expect(body.data).toHaveProperty('gameCode')
        expect(body.data).toHaveProperty('gameName')
        expect(body.data).toHaveProperty('ageGroup')
        expect(body.data).toHaveProperty('difficultyLevel')
        expect(body.data).toHaveProperty('parameters')
        expect(body.data).toHaveProperty('timeLimit')
      }
    }
  })
})

// ===== 游戏配置API（通过 /api/game/config）=====

describe('游戏配置 API (/api/game/config)', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /game/config - 获取游戏配置(训练模式)', async () => {
    const response = await apiFetch('/game/config?gameCode=schulte&ageGroup=8-9', { token })
    expect(response.ok).toBeTruthy()
    const body = response.json

    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('gameCode', 'schulte')
    expect(body.data).toHaveProperty('ageGroup', '8-9')
    expect(body.data).toHaveProperty('difficultyLevel')
    expect(body.data).toHaveProperty('parameters')
  })

  test('GET /game/config - 缺少gameCode参数应返回400', async () => {
    const response = await apiFetch('/game/config?ageGroup=8-9', { token })
    expect(response.status).toBe(400)
  })

  test('GET /game/config - 缺少ageGroup参数应返回400', async () => {
    const response = await apiFetch('/game/config?gameCode=schulte', { token })
    expect(response.status).toBe(400)
  })

  test('GET /game/config - 无效gameCode应返回404', async () => {
    const response = await apiFetch('/game/config?gameCode=invalid_game&ageGroup=8-9', { token })
    expect(response.status).toBe(404)
  })
})

// ===== 边界和错误处理 =====

describe('边界和错误处理', () => {
  let token: string

  test.beforeAll(async () => {
    token = await login()
  })

  test('GET /assessment/status - 无效token应返回401', async () => {
    const response = await apiFetch('/assessment/status/' + TEST_CHILD_ID, {
      token: 'invalid_token'
    })
    expect(response.status).toBe(401)
  })

  test('POST /assessment/start - 缺少必需字段应返回400', async () => {
    const response = await apiFetch('/assessment/start', {
      method: 'POST',
      body: {},
      token
    })
    expect(response.status).toBe(400)
  })

  test('GET /assessment/questionnaire - 无效应返回404', async () => {
    const response = await apiFetch('/assessment/questionnaire/999999', { token })
    expect(response.status).toBe(404)
  })

  test('POST /assessment/questionnaire - 无效应返回404', async () => {
    const response = await apiFetch('/assessment/questionnaire/999999', {
      method: 'POST',
      body: { answers: [{ questionId: 1, value: 1, dimension: 'test' }] },
      token
    })
    expect(response.status).toBe(404)
  })

  test('GET /assessment/games - 无效应返回404', async () => {
    const response = await apiFetch('/assessment/games/999999', { token })
    expect(response.status).toBe(404)
  })

  test('POST /assessment/generate-report - 无效应返回404', async () => {
    const response = await apiFetch('/assessment/generate-report/999999', {
      method: 'POST',
      token
    })
    expect(response.status).toBe(404)
  })
})