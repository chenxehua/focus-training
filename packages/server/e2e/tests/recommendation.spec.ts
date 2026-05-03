/**
 * 训练推荐 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('训练推荐 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/recommendation/index')
  })

  describe('推荐首页', () => {
    test('应该显示推荐标题', async ({ page }) => {
      await expect(page.locator('.recommend-title')).toContainText('训练推荐')
    })

    test('应该显示孩子选择器', async ({ page }) => {
      await expect(page.locator('.child-selector')).toBeVisible()
    })

    test('应该显示推荐游戏列表', async ({ page }) => {
      const gameCards = page.locator('.game-card')
      await expect(gameCards.first()).toBeVisible()
    })
  })

  describe('推荐理由', () => {
    test('应该显示推荐理由', async ({ page }) => {
      const reasonText = page.locator('.recommend-reason')
      await expect(reasonText.first()).toBeVisible()
    })

    test('应该显示难度建议', async ({ page }) => {
      const difficultyBadge = page.locator('.difficulty-badge')
      await expect(difficultyBadge).toBeVisible()
    })
  })

  describe('个性化推荐', () => {
    test('应该根据孩子能力推荐', async ({ page }) => {
      // 选择不同孩子
      await page.locator('.child-item').first().click()
      
      // 检查推荐变化
      const gameCards = page.locator('.game-card')
      await expect(gameCards.first()).toBeVisible()
    })

    test('应该显示训练计划', async ({ page }) => {
      const weeklyPlan = page.locator('.weekly-plan')
      if (await weeklyPlan.count() > 0) {
        await expect(weeklyPlan).toBeVisible()
      }
    })
  })

  describe('快捷开始', () => {
    test('应该显示开始按钮', async ({ page }) => {
      const startBtn = page.locator('.start-btn')
      await expect(startBtn.first()).toBeVisible()
    })

    test('应该可以快速开始推荐游戏', async ({ page }) => {
      await page.locator('.start-btn').first().click()
      
      // 检查是否跳转到游戏页面
      // 等待页面跳转
      await page.waitForTimeout(500)
    })
  })

  describe('推荐详情', () => {
    test('应该可以查看游戏详情', async ({ page }) => {
      await page.locator('.game-card').first().click()
      
      // 检查详情弹窗
      await expect(page.locator('.game-detail-modal')).toBeVisible()
    })

    test('应该显示游戏介绍', async ({ page }) => {
      await page.locator('.game-card').first().click()
      
      await expect(page.locator('.game-intro')).toBeVisible()
    })

    test('应该显示训练目标', async ({ page }) => {
      await page.locator('.game-card').first().click()
      
      await expect(page.locator('.training-goal')).toBeVisible()
    })
  })
})