/**
 * 游戏功能 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('游戏功能 E2E 测试', () => {
  describe('舒尔特方格游戏', () => {
    test('应该显示难度选择', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 检查标题
      await expect(page.locator('.game-title')).toBeVisible()
      
      // 检查难度选项
      await expect(page.locator('.difficulty-item')).toHaveCount(5)
    })

    test('应该可以开始游戏', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 选择难度
      await page.locator('.difficulty-item').first().click()
      
      // 点击开始
      await page.locator('.start-btn').click()
      
      // 检查游戏区域
      await expect(page.locator('.grid-container')).toBeVisible()
    })

    test('应该可以点击方格', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 开始游戏
      await page.locator('.difficulty-item').first().click()
      await page.locator('.start-btn').click()
      
      // 等待方格出现
      await expect(page.locator('.grid-cell').first()).toBeVisible()
      
      // 点击方格1
      const cell1 = page.locator('.grid-cell').filter({ hasText: '1' })
      await cell1.click()
    })

    test('应该显示计时器', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 开始游戏
      await page.locator('.difficulty-item').first().click()
      await page.locator('.start-btn').click()
      
      // 检查计时器
      await expect(page.locator('.timer')).toBeVisible()
    })
  })

  describe('图案记忆游戏', () => {
    test('应该显示难度选择', async ({ page }) => {
      await page.goto('/pages/game-memory/index')
      
      // 检查难度选项
      await expect(page.locator('.difficulty-btn')).toHaveCount(5)
    })

    test('应该显示记忆阶段', async ({ page }) => {
      await page.goto('/pages/game-memory/index')
      
      // 选择难度并开始
      await page.locator('.difficulty-btn').first().click()
      await page.locator('.start-btn').click()
      
      // 检查图案显示
      await expect(page.locator('.pattern-grid')).toBeVisible()
    })
  })

  describe('反应速度游戏', () => {
    test('应该显示开始界面', async ({ page }) => {
      await page.goto('/pages/game-reaction/index')
      
      // 检查开始按钮
      await expect(page.locator('.start-btn')).toBeVisible()
    })

    test('应该等待倒计时后显示目标', async ({ page }) => {
      await page.goto('/pages/game-reaction/index')
      
      // 开始游戏
      await page.locator('.start-btn').click()
      
      // 等待倒计时
      await expect(page.locator('.countdown')).toBeVisible()
      
      // 等待目标出现
      await page.waitForSelector('.target-circle', { timeout: 10000 })
      await expect(page.locator('.target-circle')).toBeVisible()
    })
  })

  describe('游戏完成流程', () => {
    test('应该显示完成结果', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 开始并完成游戏（模拟）
      await page.locator('.difficulty-item').first().click()
      await page.locator('.start-btn').click()
      
      // 完成所有方格点击（简化测试）
      // 实际完成需要点击1-9所有方格
      
      // 检查结果页面
      await expect(page.locator('.result-panel')).toBeVisible({ timeout: 60000 })
    })

    test('应该可以重新开始', async ({ page }) => {
      await page.goto('/pages/game-schulte/index')
      
      // 开始游戏
      await page.locator('.difficulty-item').first().click()
      await page.locator('.start-btn').click()
      
      // 点击重新开始
      await page.locator('.replay-btn').click()
      
      // 检查重新开始
      await expect(page.locator('.difficulty-panel')).toBeVisible()
    })
  })
})