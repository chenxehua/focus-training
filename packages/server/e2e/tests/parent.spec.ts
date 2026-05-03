/**
 * 家长报告 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('家长报告 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/parent/index')
  })

  describe('报告概览', () => {
    test('应该显示报告标题', async ({ page }) => {
      await expect(page.locator('.report-title')).toBeVisible()
    })

    test('应该显示日期选择器', async ({ page }) => {
      const datePicker = page.locator('.date-picker')
      await expect(datePicker).toBeVisible()
    })

    test('应该显示孩子选择器', async ({ page }) => {
      const childSelector = page.locator('.child-selector')
      await expect(childSelector).toBeVisible()
    })
  })

  describe('训练数据统计', () => {
    test('应该显示今日训练次数', async ({ page }) => {
      const statCard = page.locator('.stat-card').filter({ hasText: '训练次数' })
      await expect(statCard).toBeVisible()
    })

    test('应该显示累计训练时长', async ({ page }) => {
      const statCard = page.locator('.stat-card').filter({ hasText: '训练时长' })
      await expect(statCard).toBeVisible()
    })

    test('应该显示平均准确率', async ({ page }) => {
      const statCard = page.locator('.stat-card').filter({ hasText: '准确率' })
      await expect(statCard).toBeVisible()
    })
  })

  describe('能力雷达图', () => {
    test('应该显示雷达图', async ({ page }) => {
      const radarChart = page.locator('.radar-chart')
      await expect(radarChart).toBeVisible()
    })

    test('应该显示7个维度', async ({ page }) => {
      // 检查维度标签
      const dimensionLabels = page.locator('.dimension-label')
      await expect(dimensionLabels).toHaveCount(7)
    })
  })

  describe('周报详情', () => {
    test('应该可以切换到周报视图', async ({ page }) => {
      // 点击周报标签
      await page.locator('.tab-item').filter({ hasText: '周报' }).click()
      
      // 检查周报内容
      await expect(page.locator('.weekly-report')).toBeVisible()
    })

    test('应该显示本周亮点', async ({ page }) => {
      await page.locator('.tab-item').filter({ hasText: '周报' }).click()
      
      // 检查亮点
      const highlight = page.locator('.highlight-card')
      await expect(highlight.first()).toBeVisible()
    })
  })

  describe('游戏详情', () => {
    test('应该显示各游戏表现', async ({ page }) => {
      const gameList = page.locator('.game-item')
      await expect(gameList.first()).toBeVisible()
    })

    test('应该可以查看游戏详情', async ({ page }) => {
      await page.locator('.game-item').first().click()
      
      // 检查详情
      await expect(page.locator('.game-detail')).toBeVisible()
    })
  })
})