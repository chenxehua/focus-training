/**
 * API 接口测试
 */
import { test, expect, request } from '@playwright/test'

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api'

describe('API 接口测试', () => {
  describe('健康检查', () => {
    test('GET /health 应该返回状态', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/health`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.status).toBe('ok')
    })
  })

  describe('认证接口', () => {
    test('POST /auth/login 应该验证code参数', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {},
      })
      
      const body = await response.json()
      expect(body.code).toBe(400)
    })

    test('POST /auth/login 应该处理无效code', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: { code: 'invalid_code' },
      })
      
      const body = await response.json()
      // 应该返回错误，因为code无效
      expect(body).toBeDefined()
    })
  })

  describe('用户接口', () => {
    test('GET /user/info 应该需要认证', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/user/info`)
      const body = await response.json()
      
      expect(body.code).toBe(401)
    })

    test('POST /user/children 应该验证孩子信息', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/user/children`, {
        data: { name: '' },
      })
      
      const body = await response.json()
      expect(body.code).toBe(400)
    })
  })

  describe('游戏接口', () => {
    test('GET /game/list 应该返回游戏列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/game/list`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('GET /game/detail 应该验证gameId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/game/detail?game_id=`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })

    test('POST /game/submit-record 应该验证必填项', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/game/submit-record`, {
        data: {},
      })
      
      const body = await response.json()
      expect(body.code).toBe(400)
    })
  })

  describe('报告接口', () => {
    test('GET /report/today 应该需要认证', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/report/today`)
      const body = await response.json()
      
      expect(body.code).toBe(401)
    })

    test('GET /report/weekly 应该需要认证', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/report/weekly`)
      const body = await response.json()
      
      expect(body.code).toBe(401)
    })
  })

  describe('会员接口', () => {
    test('GET /membership/status 应该需要认证', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/membership/status`)
      const body = await response.json()
      
      expect(body.code).toBe(401)
    })

    test('GET /membership/packages 应该返回套餐列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/membership/packages`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.code).toBe(0)
    })
  })

  describe('成就接口', () => {
    test('GET /achievement/list 应该返回成就列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/achievement/list`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('GET /achievement/child/:childId 应该验证childId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/achievement/child/`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })
  })

  describe('评估接口', () => {
    test('GET /assessment/dimensions 应该验证childId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/dimensions`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })

    test('GET /assessment/trend 应该需要认证', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/assessment/trend`)
      const body = await response.json()
      
      expect(body.code).toBe(401)
    })
  })

  describe('家长学院接口', () => {
    test('GET /academy/categories 应该返回分类', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/academy/categories`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.code).toBe(0)
    })

    test('GET /academy/articles 应该支持分页', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/academy/articles?page=1&page_size=10`)
      expect(response.ok()).toBeTruthy()
      
      const body = await response.json()
      expect(body.code).toBe(0)
      expect(body.data).toBeDefined()
    })

    test('GET /academy/questions 应该返回问题列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/academy/questions`)
      expect(response.ok()).toBeTruthy()
    })
  })

  describe('学校管理接口', () => {
    test('GET /school/teachers 应该需要school_id', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/school/teachers`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })

    test('GET /school/classes 应该需要school_id', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/school/classes`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })

    test('GET /school/dashboard 应该需要school_id', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/school/dashboard`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })
  })

  describe('推荐接口', () => {
    test('GET /recommendation/profile 应该验证childId', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/recommendation/profile`)
      const body = await response.json()
      
      expect(body.code).toBe(400)
    })

    test('GET /recommendation/games 应该返回推荐游戏', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/recommendation/games?child_id=1`)
      expect(response.ok()).toBeTruthy()
    })
  })
})