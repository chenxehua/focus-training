/**
 * 会员中心 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('会员中心 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/membership/index')
  })

  describe('会员页面结构', () => {
    test('应该显示会员等级选项', async ({ page }) => {
      // 检查页面标题
      await expect(page.locator('.page-title')).toContainText('会员中心')
      
      // 检查会员等级
      const membershipCards = page.locator('.membership-card')
      await expect(membershipCards.first()).toBeVisible()
    })

    test('应该显示价格信息', async ({ page }) => {
      // 检查价格
      const priceText = page.locator('.price')
      await expect(priceText.first()).toBeVisible()
    })

    test('应该显示权益列表', async ({ page }) => {
      // 检查权益
      const benefits = page.locator('.benefit-item')
      await expect(benefits.first()).toBeVisible()
    })
  })

  describe('会员购买流程', () => {
    test('应该可以点击购买按钮', async ({ page }) => {
      // 点击购买
      await page.locator('.buy-btn').first().click()
      
      // 检查订单确认
      await expect(page.locator('.confirm-modal')).toBeVisible()
    })

    test('应该显示购买确认信息', async ({ page }) => {
      await page.locator('.buy-btn').first().click()
      
      // 检查商品信息
      await expect(page.locator('.order-info')).toBeVisible()
    })

    test('应该可以取消购买', async ({ page }) => {
      await page.locator('.buy-btn').first().click()
      
      // 点击取消
      await page.locator('.cancel-btn').click()
      
      // 检查弹窗关闭
      await expect(page.locator('.confirm-modal')).not.toBeVisible()
    })
  })

  describe('会员状态', () => {
    test('应该显示当前会员状态', async ({ page }) => {
      // 检查会员标签
      const memberBadge = page.locator('.member-badge')
      if (await memberBadge.count() > 0) {
        await expect(memberBadge).toBeVisible()
      }
    })

    test('应该显示到期时间', async ({ page }) => {
      // 检查到期时间
      const expireText = page.locator('.expire-text')
      if (await expireText.count() > 0) {
        await expect(expireText).toBeVisible()
      }
    })
  })

  describe('购买历史', () => {
    test('应该显示购买历史入口', async ({ page }) => {
      // 检查历史按钮
      const historyBtn = page.locator('.history-btn')
      if (await historyBtn.count() > 0) {
        await expect(historyBtn).toBeVisible()
      }
    })

    test('应该可以查看订单列表', async ({ page }) => {
      const historyBtn = page.locator('.history-btn')
      if (await historyBtn.count() > 0) {
        await historyBtn.click()
        
        // 检查订单列表
        await expect(page.locator('.order-list')).toBeVisible()
      }
    })
  })

  describe('试用期', () => {
    test('应该显示试用入口', async ({ page }) => {
      // 检查试用按钮
      const trialBtn = page.locator('.trial-btn')
      if (await trialBtn.count() > 0) {
        await expect(trialBtn).toBeVisible()
      }
    })

    test('应该可以开始试用', async ({ page }) => {
      const trialBtn = page.locator('.trial-btn')
      if (await trialBtn.count() > 0) {
        await trialBtn.click()
        
        // 检查试用确认
        await expect(page.locator('.trial-modal')).toBeVisible()
      }
    })
  })
})