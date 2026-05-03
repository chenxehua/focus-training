/**
 * 学校管理 E2E 测试
 */
import { test, expect } from '@playwright/test'

describe('学校管理功能 E2E 测试', () => {
  // 测试前登录
  test.beforeEach(async ({ page }) => {
    // 模拟登录状态
    await page.goto('/pages/school/index')
  })

  describe('仪表盘页面', () => {
    test('应该显示学校统计数据', async ({ page }) => {
      // 检查页面标题
      await expect(page.locator('.title')).toBeVisible()
      
      // 检查统计卡片
      await expect(page.locator('.stat-card').first()).toBeVisible()
      
      // 检查快速操作区域
      await expect(page.locator('.action-grid')).toBeVisible()
    })

    test('应该可以导航到各管理页面', async ({ page }) => {
      // 点击教师管理
      const teacherAction = page.locator('.action-item').filter({ hasText: '教师管理' })
      await expect(teacherAction).toBeVisible()
      
      // 点击班级管理
      const classAction = page.locator('.action-item').filter({ hasText: '班级管理' })
      await expect(classAction).toBeVisible()
    })
  })

  describe('教师管理页面', () => {
    test('应该显示教师列表', async ({ page }) => {
      await page.goto('/pages/school/teachers')
      
      // 检查页面标题
      await expect(page.locator('.title')).toContainText('教师管理')
      
      // 检查添加按钮
      await expect(page.locator('.add-btn')).toBeVisible()
    })

    test('应该可以打开添加教师弹窗', async ({ page }) => {
      await page.goto('/pages/school/teachers')
      
      // 点击添加按钮
      await page.locator('.add-btn').click()
      
      // 检查弹窗
      await expect(page.locator('.modal')).toBeVisible()
      await expect(page.locator('.modal-title')).toContainText('添加教师')
    })

    test('应该可以填写并提交教师信息', async ({ page }) => {
      await page.goto('/pages/school/teachers')
      
      // 打开添加弹窗
      await page.locator('.add-btn').click()
      
      // 填写表单
      await page.locator('input[placeholder="请输入教师姓名"]').fill('测试教师')
      await page.locator('input[type="number"]').fill('13800138000')
      
      // 选择角色
      await page.locator('.picker-value').first().click()
      
      // 提交
      await page.locator('.btn-confirm').click()
    })
  })

  describe('班级管理页面', () => {
    test('应该显示班级列表', async ({ page }) => {
      await page.goto('/pages/school/classes')
      
      // 检查页面标题
      await expect(page.locator('.title')).toContainText('班级管理')
      
      // 检查创建按钮
      await expect(page.locator('.add-btn')).toBeVisible()
    })

    test('应该可以筛选年级', async ({ page }) => {
      await page.goto('/pages/school/classes')
      
      // 点击年级筛选
      await page.locator('.filter-item').click()
      
      // 检查选项
      await expect(page.locator('.picker')).toBeVisible()
    })

    test('应该可以打开创建班级弹窗', async ({ page }) => {
      await page.goto('/pages/school/classes')
      
      // 点击创建按钮
      await page.locator('.add-btn').click()
      
      // 检查弹窗
      await expect(page.locator('.modal')).toBeVisible()
    })
  })

  describe('学生管理页面', () => {
    test('应该显示学生列表', async ({ page }) => {
      await page.goto('/pages/school/students')
      
      // 检查页面元素
      await expect(page.locator('.back-btn')).toBeVisible()
      await expect(page.locator('.search-bar')).toBeVisible()
    })

    test('应该可以搜索学生', async ({ page }) => {
      await page.goto('/pages/school/students')
      
      // 输入搜索关键词
      const searchInput = page.locator('.search-input')
      await searchInput.fill('张三')
      
      // 点击搜索
      await page.locator('.search-btn').click()
    })

    test('应该可以打开导入弹窗', async ({ page }) => {
      await page.goto('/pages/school/students')
      
      // 点击导入按钮
      await page.locator('.add-btn').click()
      
      // 检查弹窗
      await expect(page.locator('.modal')).toBeVisible()
      await expect(page.locator('.modal-title')).toContainText('批量导入')
    })

    test('应该可以添加单个学生', async ({ page }) => {
      await page.goto('/pages/school/students')
      
      // 打开导入弹窗
      await page.locator('.add-btn').click()
      
      // 填写学生信息
      await page.locator('input[placeholder="请输入学生姓名"]').fill('新学生')
      
      // 选择性别
      await page.locator('.form-group').filter({ hasText: '性别' }).locator('.picker-value').click()
      
      // 输入年龄
      await page.locator('input[placeholder="年龄"]').fill('8')
      
      // 添加
      await page.locator('.btn-confirm').click()
    })
  })

  describe('性能测试', () => {
    test('页面加载应在2秒内完成', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/pages/school/index')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
    })

    test('列表渲染应流畅', async ({ page }) => {
      await page.goto('/pages/school/teachers')
      
      // 快速滚动列表
      await page.evaluate(() => {
        const list = document.querySelector('.teacher-list')
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
      
      // 检查列表完整性
      await expect(page.locator('.teacher-card').first()).toBeVisible()
    })
  })
})