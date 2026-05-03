/**
 * 家长学院 E2E 测试
 */
import { test, expect, describe } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api'

describe('家长学院 API E2E 测试', () => {
  
  let authToken: string
  let userId: number

  test.beforeAll(async () => {
    // 登录获取 token
    const loginRes = await fetch(`${BASE_URL}/auth/wx-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: `test_academy_${Date.now()}` })
    })
    const loginData = await loginRes.json()
    if (loginData.code === 0) {
      authToken = loginData.data.token
      userId = loginData.data.userId
    }
  })

  test.describe('分类管理', () => {
    test('获取所有分类', async () => {
      const res = await fetch(`${BASE_URL}/academy/categories`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('获取分类详情', async () => {
      // 先获取分类列表
      const catRes = await fetch(`${BASE_URL}/academy/categories`)
      const catData = await catRes.json()
      
      if (catData.data && catData.data.length > 0) {
        const categoryId = catData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/categories/${categoryId}`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(body.data).toHaveProperty('category')
        expect(body.data).toHaveProperty('articles')
      }
    })

    test('获取不存在的分类返回404', async () => {
      const res = await fetch(`${BASE_URL}/academy/categories/99999`)
      const body = await res.json()
      expect(body.code).toBe(404)
    })
  })

  test.describe('文章管理', () => {
    test('获取热门文章', async () => {
      const res = await fetch(`${BASE_URL}/academy/articles/hot?limit=5`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('获取推荐文章', async () => {
      const res = await fetch(`${BASE_URL}/academy/articles/recommended?limit=3`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
    })

    test('获取文章列表（分页）', async () => {
      const res = await fetch(`${BASE_URL}/academy/articles?page=1&pageSize=10`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('items')
      expect(body.data).toHaveProperty('total')
      expect(body.data).toHaveProperty('page')
      expect(body.data).toHaveProperty('pageSize')
    })

    test('按分类筛选文章', async () => {
      // 获取第一个分类的文章
      const catRes = await fetch(`${BASE_URL}/academy/categories`)
      const catData = await catRes.json()
      
      if (catData.data && catData.data.length > 0) {
        const categoryId = catData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/articles?categoryId=${categoryId}`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
      }
    })

    test('搜索文章', async () => {
      const res = await fetch(`${BASE_URL}/academy/articles?keyword=专注`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
    })

    test('获取文章详情', async () => {
      // 先获取热门文章
      const hotRes = await fetch(`${BASE_URL}/academy/articles/hot?limit=1`)
      const hotData = await hotRes.json()
      
      if (hotData.data && hotData.data.length > 0) {
        const articleId = hotData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/articles/${articleId}`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(body.data).toHaveProperty('title')
        expect(body.data).toHaveProperty('content')
      }
    })

    test('获取不存在的文章返回404', async () => {
      const res = await fetch(`${BASE_URL}/academy/articles/99999`)
      const body = await res.json()
      expect(body.code).toBe(404)
    })

    test('获取相关文章', async () => {
      const hotRes = await fetch(`${BASE_URL}/academy/articles/hot?limit=1`)
      const hotData = await hotRes.json()
      
      if (hotData.data && hotData.data.length > 0) {
        const articleId = hotData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/articles/${articleId}/related?limit=3`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(Array.isArray(body.data)).toBeTruthy()
      }
    })

    test('获取所有标签', async () => {
      const res = await fetch(`${BASE_URL}/academy/tags`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })
  })

  test.describe('问答管理', () => {
    test('获取问答分类', async () => {
      const res = await fetch(`${BASE_URL}/academy/questions/categories`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('获取热门问题', async () => {
      const res = await fetch(`${BASE_URL}/academy/questions/hot?limit=5`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('获取问题列表（分页）', async () => {
      const res = await fetch(`${BASE_URL}/academy/questions?page=1&pageSize=10`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('items')
      expect(body.data).toHaveProperty('total')
    })

    test('获取专家回答', async () => {
      const res = await fetch(`${BASE_URL}/academy/expert-answers?limit=3`)
      expect(res.ok).toBeTruthy()
      
      const body = await res.json()
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBeTruthy()
    })

    test('获取问题详情', async () => {
      // 先获取热门问题
      const hotRes = await fetch(`${BASE_URL}/academy/questions/hot?limit=1`)
      const hotData = await hotRes.json()
      
      if (hotData.data && hotData.data.length > 0) {
        const questionId = hotData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/questions/${questionId}`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(body.data).toHaveProperty('question_title')
        expect(body.data).toHaveProperty('question_content')
      }
    })

    test('获取问题回答', async () => {
      const hotRes = await fetch(`${BASE_URL}/academy/questions/hot?limit=1`)
      const hotData = await hotRes.json()
      
      if (hotData.data && hotData.data.length > 0) {
        const questionId = hotData.data[0].id
        const res = await fetch(`${BASE_URL}/academy/questions/${questionId}/answers`)
        expect(res.ok).toBeTruthy()
        
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(body.data).toHaveProperty('items')
      }
    })

    test('创建提问 - 未登录返回401', async () => {
      const res = await fetch(`${BASE_URL}/academy/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: '测试问题标题',
          questionContent: '这是测试问题的内容描述',
          categoryId: 1
        })
      })
      
      const body = await res.json()
      expect(body.code).toBe(401)
    })

    test('创建提问 - 缺少必填字段返回400', async () => {
      const res = await fetch(`${BASE_URL}/academy/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          questionTitle: '测试'
        })
      })
      
      const body = await res.json()
      expect(body.code).toBe(400)
    })

    test('创建提问 - 成功', async () => {
      // 获取问答分类
      const catRes = await fetch(`${BASE_URL}/academy/questions/categories`)
      const catData = await catRes.json()
      
      if (catData.data && catData.data.length > 0 && authToken) {
        const res = await fetch(`${BASE_URL}/academy/questions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            questionTitle: '测试问题标题',
            questionContent: '这是测试问题的内容描述，至少10个字',
            categoryId: catData.data[0].id
          })
        })
        
        expect(res.ok).toBeTruthy()
        const body = await res.json()
        expect(body.code).toBe(0)
        expect(body.data).toHaveProperty('id')
      }
    })
  })
})

describe('家长学院页面 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // 模拟登录
    await page.goto('http://localhost:5173/')
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_123')
      localStorage.setItem('user_id', '1')
    })
  })

  test('家长学院首页加载', async ({ page }) => {
    await page.goto('http://localhost:5173/pages/academy/index')
    await page.waitForLoadState('networkidle')
    
    // 检查页面标题
    const title = page.locator('.title')
    await expect(title).toContainText('家长学院')
  })

  test('文章列表页面加载', async ({ page }) => {
    await page.goto('http://localhost:5173/pages/academy/articles')
    await page.waitForLoadState('networkidle')
    
    const title = page.locator('.title')
    await expect(title).toContainText('文章列表')
  })

  test('专家问答页面加载', async ({ page }) => {
    await page.goto('http://localhost:5173/pages/academy/questions')
    await page.waitForLoadState('networkidle')
    
    const title = page.locator('.title')
    await expect(title).toContainText('专家问答')
  })

  test('提问页面加载', async ({ page }) => {
    await page.goto('http://localhost:5173/pages/academy/ask')
    await page.waitForLoadState('networkidle')
    
    const title = page.locator('.title')
    await expect(title).toContainText('提问')
  })
})