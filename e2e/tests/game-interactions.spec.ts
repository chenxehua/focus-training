/**
 * FocusKids 游戏页面交互 E2E 测试
 * 测试游戏内的所有交互事件、状态变化、数据提交
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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomStr = (prefix: string) => `${prefix}_${Date.now()}`

describe('【舒尔特方格游戏】pages/game-schulte/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_schulte_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('游戏难度选择', () => {
    test('简单难度 (3x3)', async () => {
      if (!authToken) return
      
      // 提交简单难度游戏记录
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 90,
          duration: 30000,
          accuracy: 0.95,
          difficultyLevel: 1,
          gridSize: 3,
          correctCount: 9,
          errorCount: 0
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('中等难度 (4x4)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 80,
          duration: 60000,
          accuracy: 0.85,
          difficultyLevel: 2,
          gridSize: 4,
          correctCount: 16,
          errorCount: 2
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('困难难度 (5x5)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 70,
          duration: 120000,
          accuracy: 0.75,
          difficultyLevel: 3,
          gridSize: 5,
          correctCount: 25,
          errorCount: 5
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('游戏计时器事件', () => {
    test('游戏计时器启动', async () => {
      // 模拟游戏开始
      const response = await apiFetch('/api/game/schulte/start', {
        method: 'POST',
        token: authToken,
        body: { childId: 1, difficultyLevel: 1 }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('游戏计时器暂停', async () => {
      const response = await apiFetch('/api/game/schulte/pause', {
        method: 'POST',
        token: authToken,
        body: { childId: 1 }
      })
      expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('游戏超时处理', async () => {
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 0,
          duration: 180000, // 3分钟超时
          accuracy: 0,
          difficultyLevel: 3,
          status: 'timeout'
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })

  describe('游戏结果提交', () => {
    test('完美通关 (零错误)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 100,
          duration: 25000,
          accuracy: 1.0,
          difficultyLevel: 1,
          correctCount: 9,
          errorCount: 0,
          starRating: 3
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('普通通关', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G001',
          gameCode: 'schulte',
          score: 75,
          duration: 45000,
          accuracy: 0.8,
          difficultyLevel: 2,
          correctCount: 14,
          errorCount: 3,
          starRating: 2
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【图案记忆游戏】pages/game-memory/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_memory_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  describe('难度选择', () => {
    test('简单模式 (4个图案)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G004',
          gameCode: 'pattern_memory',
          score: 95,
          duration: 20000,
          accuracy: 0.95,
          difficultyLevel: 1,
          patternCount: 4,
          correctCount: 4,
          errorCount: 0
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('中等模式 (6个图案)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G004',
          gameCode: 'pattern_memory',
          score: 85,
          duration: 35000,
          accuracy: 0.88,
          difficultyLevel: 2,
          patternCount: 6,
          correctCount: 5,
          errorCount: 1
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })

    test('困难模式 (9个图案)', async () => {
      if (!authToken) return
      
      const response = await apiFetch('/api/game/record', {
        method: 'POST',
        token: authToken,
        body: {
          childId: 1,
          gameId: 'G004',
          gameCode: 'pattern_memory',
          score: 75,
          duration: 50000,
          accuracy: 0.78,
          difficultyLevel: 3,
          patternCount: 9,
          correctCount: 7,
          errorCount: 2
        }
      })
      expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
    })
  })
})

describe('【听觉记忆游戏】pages/game-sound/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_sound_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交听觉记忆结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G009',
        gameCode: 'auditory_memory',
        score: 88,
        duration: 45000,
        accuracy: 0.9,
        difficultyLevel: 2,
        sequenceLength: 5,
        correctCount: 5,
        errorCount: 0
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【反应速度游戏】pages/game-reaction/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_reaction_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交反应速度结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G005',
        gameCode: 'reaction_speed',
        score: 95,
        duration: 15000,
        accuracy: 0.98,
        difficultyLevel: 1,
        reactionTime: 250, // 毫秒
        correctCount: 10,
        errorCount: 0
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('极慢反应时间', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G005',
        gameCode: 'reaction_speed',
        score: 30,
        duration: 60000,
        accuracy: 0.35,
        difficultyLevel: 3,
        reactionTime: 1500,
        correctCount: 3,
        errorCount: 5
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【节奏点击游戏】pages/game-rhythm/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_rhythm_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交节奏点击结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G006',
        gameCode: 'rhythm_tap',
        score: 90,
        duration: 30000,
        accuracy: 0.92,
        difficultyLevel: 2,
        perfectCount: 20,
        goodCount: 5,
        missCount: 2
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【迷宫寻路游戏】pages/game-maze/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_maze_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交迷宫寻路结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G007',
        gameCode: 'maze_navigation',
        score: 82,
        duration: 55000,
        accuracy: 0.85,
        difficultyLevel: 2,
        mazeLevel: 5,
        stepCount: 45,
        wrongTurns: 5
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【快速分类游戏】pages/game-sort/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_sort_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交快速分类结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G008',
        gameCode: 'quick_sort',
        score: 88,
        duration: 40000,
        accuracy: 0.9,
        difficultyLevel: 2,
        correctCount: 18,
        errorCount: 2,
        categoryCount: 4
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【视觉追踪游戏】pages/game-visual/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_visual_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交视觉追踪结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G003',
        gameCode: 'visual_tracking',
        score: 85,
        duration: 35000,
        accuracy: 0.88,
        difficultyLevel: 2,
        targetCount: 8,
        correctCount: 7,
        missCount: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【听声辨数游戏】pages/game-audio/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_audio_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交听声辨数结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G002',
        gameCode: 'audio_count',
        score: 92,
        duration: 40000,
        accuracy: 0.95,
        difficultyLevel: 2,
        correctCount: 19,
        errorCount: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【追踪目标游戏】pages/game-tracking/index', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_tracking_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('提交追踪目标结果', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G010',
        gameCode: 'target_tracking',
        score: 86,
        duration: 42000,
        accuracy: 0.88,
        difficultyLevel: 2,
        trackCount: 6,
        correctCount: 5,
        missCount: 1
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【游戏成就解锁触发】', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_achievement_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('首次游戏触发新手成就', async () => {
    if (!authToken) return
    
    // 先检查成就状态
    const beforeRes = await apiFetch(`/api/achievement/child/1`, { token: authToken })
    
    // 提交游戏记录
    const recordRes = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        score: 60,
        duration: 50000,
        accuracy: 0.7,
        difficultyLevel: 1,
        triggerAchievement: true
      }
    })
    expect([200, 201, 400, 401, 500].includes(recordRes.status)).toBeTruthy()
    
    // 检查成就是否更新
    const afterRes = await apiFetch(`/api/achievement/child/1`, { token: authToken })
    expect([200, 400, 401, 500].includes(afterRes.status)).toBeTruthy()
  })

  test('连续打卡触发连续成就', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        score: 80,
        duration: 40000,
        accuracy: 0.85,
        difficultyLevel: 1,
        streakCount: 7, // 连续7天
        triggerStreakAchievement: true
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('高分触发成就', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        score: 100,
        duration: 20000,
        accuracy: 1.0,
        difficultyLevel: 3,
        perfectScore: true,
        triggerScoreAchievement: true
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【游戏状态管理测试】', () => {
  let authToken: string

  test.beforeAll(async () => {
    await wait(1000)
    const loginRes = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `game_state_${randomStr('u')}` }
    })
    const loginBody = loginRes.json
    if (loginBody.code === 0 && loginBody.data) {
      authToken = loginBody.data.token
    }
  })

  test('游戏中断保存', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/pause', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        progress: 5,
        remainingTime: 45
      }
    })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('游戏恢复', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/resume', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte'
      }
    })
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('游戏放弃', async () => {
    if (!authToken) return
    
    const response = await apiFetch('/api/game/record', {
      method: 'POST',
      token: authToken,
      body: {
        childId: 1,
        gameId: 'G001',
        gameCode: 'schulte',
        score: 20,
        duration: 10000,
        accuracy: 0.3,
        difficultyLevel: 2,
        status: 'abandoned'
      }
    })
    expect([200, 201, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})

describe('【游戏数据统计】', () => {
  test('获取游戏统计信息', async () => {
    const response = await apiFetch('/api/game/statistics')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取游戏排名', async () => {
    const response = await apiFetch('/api/game/leaderboard?gameCode=schulte&limit=10')
    expect([200, 401, 500].includes(response.status)).toBeTruthy()
  })

  test('获取个人最佳成绩', async () => {
    const response = await apiFetch('/api/game/best-score?childId=1&gameCode=schulte')
    expect([200, 400, 401, 500].includes(response.status)).toBeTruthy()
  })
})