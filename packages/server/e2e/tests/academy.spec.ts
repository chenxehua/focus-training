/**
 * 家长学院 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('家长学院 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/academy/index')
  })

  describe('学院首页', () => {
    test('应该显示学院标题', async ({ page }) => {
      await expect(page.locator('.academy-title')).toContainText('家长学院')
    })

    test('应该显示分类导航', async ({ page }) => {
      await expect(page.locator('.category-nav')).toBeVisible()
    })

    test('应该显示热门文章', async ({ page }) => {
      const articles = page.locator('.article-item')
      await expect(articles.first()).toBeVisible()
    })

    test('应该显示专家问答入口', async ({ page }) => {
      await expect(page.locator('.qa-entrance')).toBeVisible()
    })
  })

  describe('文章列表', () => {
    test('应该可以进入文章列表', async ({ page }) => {
      await page.locator('.category-item').first().click()
      
      // 检查文章列表
      await expect(page.locator('.articles-page')).toBeVisible()
    })

    test('应该可以筛选文章', async ({ page }) => {
      await page.goto('/pages/academy/articles')
      
      // 点击筛选
      await page.locator('.filter-btn').click()
      
      // 检查筛选选项
      await expect(page.locator('.filter-options')).toBeVisible()
    })

    test('应该可以加载更多文章', async ({ page }) => {
      await page.goto('/pages/academy/articles')
      
      // 检查加载更多按钮
      const loadMoreBtn = page.locator('.load-more')
      if (await loadMoreBtn.count() > 0) {
        await expect(loadMoreBtn).toBeVisible()
      }
    })
  })

  describe('文章详情', () => {
    test('应该可以打开文章详情', async ({ page }) => {
      await page.locator('.article-item').first().click()
      
      // 检查文章内容
      await expect(page.locator('.article-content')).toBeVisible()
    })

    test('应该显示文章标题和作者', async ({ page }) => {
      await page.locator('.article-item').first().click()
      
      await expect(page.locator('.article-title')).toBeVisible()
      await expect(page.locator('.article-author')).toBeVisible()
    })

    test('应该显示相关推荐', async ({ page }) => {
      await page.goto('/pages/academy/article')
      
      const relatedArticles = page.locator('.related-article')
      await expect(relatedArticles.first()).toBeVisible()
    })
  })

  describe('专家问答', () => {
    test('应该显示问答列表', async ({ page }) => {
      await page.goto('/pages/academy/questions')
      
      await expect(page.locator('.question-item')).toBeVisible()
    })

    test('应该可以查看问题详情', async ({ page }) => {
      await page.goto('/pages/academy/questions')
      
      await page.locator('.question-item').first().click()
      
      // 检查问题详情
      await expect(page.locator('.question-detail')).toBeVisible()
    })

    test('应该显示回答列表', async ({ page }) => {
      await page.goto('/pages/academy/question')
      
      const answers = page.locator('.answer-item')
      await expect(answers.first()).toBeVisible()
    })

    test('应该可以提问', async ({ page }) => {
      await page.goto('/pages/academy/ask')
      
      // 检查提问表单
      await expect(page.locator('.ask-form')).toBeVisible()
    })

    test('应该验证必填项', async ({ page }) => {
      await page.goto('/pages/academy/ask')
      
      // 提交空表单
      await page.locator('.submit-btn').click()
      
      // 检查提示
      await expect(page.locator('.error-tip')).toBeVisible()
    })
  })

  describe('搜索功能', () => {
    test('应该显示搜索入口', async ({ page }) => {
      const searchIcon = page.locator('.search-icon')
      await expect(searchIcon).toBeVisible()
    })

    test('应该可以搜索文章', async ({ page }) => {
      await page.locator('.search-icon').click()
      
      // 输入关键词
      await page.locator('.search-input').fill('专注力')
      
      // 点击搜索
      await page.locator('.search-btn').click()
      
      // 检查搜索结果
      await expect(page.locator('.search-results')).toBeVisible()
    })
  })
})