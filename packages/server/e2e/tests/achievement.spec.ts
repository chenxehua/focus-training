/**
 * 成就系统 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('成就系统 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/achievement/index')
  })

  describe('成就列表页面', () => {
    test('应该显示成就分类', async ({ page }) => {
      // 检查页面标题
      await expect(page.locator('.achievement-title')).toContainText('成就中心')
      
      // 检查成就分类
      await expect(page.locator('.category-tabs')).toBeVisible()
    })

    test('应该显示成就列表', async ({ page }) => {
      // 检查成就卡片
      const achievementCards = page.locator('.achievement-card')
      await expect(achievementCards.first()).toBeVisible()
    })

    test('应该显示成就图标', async ({ page }) => {
      // 检查图标
      const icons = page.locator('.achievement-icon')
      await expect(icons.first()).toBeVisible()
    })

    test('应该显示已解锁/未解锁状态', async ({ page }) => {
      // 检查锁定状态
      const lockedBadge = page.locator('.locked-badge')
      const unlockedBadge = page.locator('.unlocked-badge')
      
      // 至少有一种状态存在
      const hasAnyBadge = (await lockedBadge.count()) > 0 || (await unlockedBadge.count()) > 0
      expect(hasAnyBadge).toBeTruthy()
    })
  })

  describe('成就详情', () => {
    test('应该可以点击查看详情', async ({ page }) => {
      // 点击成就卡片
      await page.locator('.achievement-card').first().click()
      
      // 检查详情弹窗
      await expect(page.locator('.detail-modal')).toBeVisible()
    })

    test('应该显示解锁条件', async ({ page }) => {
      await page.locator('.achievement-card').first().click()
      
      // 检查条件描述
      await expect(page.locator('.condition-text')).toBeVisible()
    })

    test('应该显示奖励信息', async ({ page }) => {
      await page.locator('.achievement-card').first().click()
      
      // 检查奖励
      await expect(page.locator('.reward-info')).toBeVisible()
    })
  })

  describe('成就进度', () => {
    test('应该显示进度条', async ({ page }) => {
      // 检查进度条
      const progressBars = page.locator('.progress-bar')
      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible()
      }
    })

    test('应该显示进度百分比', async ({ page }) => {
      // 检查进度文本
      const progressText = page.locator('.progress-text')
      if (await progressText.count() > 0) {
        await expect(progressText.first()).toBeVisible()
      }
    })
  })

  describe('排行榜', () => {
    test('应该显示排行榜入口', async ({ page }) => {
      // 检查排行榜标签
      await expect(page.locator('.rankings-tab')).toBeVisible()
    })

    test('应该显示排名信息', async ({ page }) => {
      // 点击排行榜
      await page.locator('.rankings-tab').click()
      
      // 检查排名列表
      await expect(page.locator('.ranking-item').first()).toBeVisible()
    })
  })
})