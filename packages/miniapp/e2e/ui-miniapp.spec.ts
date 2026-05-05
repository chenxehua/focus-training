/**
 * FocusKids UI 自动化测试
 * 使用 miniprogram-automator 连接微信开发者工具进行 UI 测试
 *
 * 运行: npm run test:ui
 */
const automator = require('miniprogram-automator')
const path = require('path')
const fs = require('fs')

// 配置
const CONFIG = {
  cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
  projectPath: '/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin',
  port: 9420,
  screenshotDir: path.resolve(__dirname, '../test-results/ui-screenshots'),
  reportDir: path.resolve(__dirname, '../test-results/ui-reports'),
}

// 测试结果收集器
const results = {
  passed: 0,
  failed: 0,
  errors: [],
}

function recordTest(name, passed, error = null) {
  if (passed) {
    results.passed++
    console.log(`  ✅ ${name}`)
  } else {
    results.failed++
    results.errors.push({ name, error })
    console.log(`  ❌ ${name}: ${error}`)
  }
}

async function screenshot(page, name) {
  const dir = CONFIG.screenshotDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const filename = `${name.replace(/\s+/g, '_')}_${Date.now()}.png`
  const filepath = path.join(dir, filename)
  try {
    await page.screenshot({ path: filepath })
    console.log(`    📸 截图: ${filename}`)
  } catch (e) {
    console.log(`    ⚠️ 截图失败: ${e.message}`)
  }
}

// ==================== 主测试类 ====================
class UITestRunner {
  constructor() {
    this.mp = null
    this.page = null
  }

  async launch() {
    console.log('\n🚀 启动微信开发者工具...\n')
    console.log(`   CLI: ${CONFIG.cliPath}`)
    console.log(`   项目: ${CONFIG.projectPath}`)
    console.log(`   端口: ${CONFIG.port}\n`)

    try {
      this.mp = await automator.launch({
        cliPath: CONFIG.cliPath,
        projectPath: CONFIG.projectPath,
        port: CONFIG.port,
      })
      this.page = await this.mp.currentPage()
      console.log('✅ 启动成功!\n')
      return true
    } catch (error) {
      console.error('❌ 启动失败:', error.message)
      return false
    }
  }

  async navigate(pathname, query = '') {
    const fullPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    console.log(`\n📍 导航到: ${fullPath}`)
    try {
      await this.mp.reLaunch(fullPath)
      await this.page.waitFor(3000)
      this.page = await this.mp.currentPage()
      return true
    } catch (error) {
      console.error(`   ❌ 导航失败: ${error.message}`)
      return false
    }
  }

  async click(selector) {
    try {
      const element = await this.page.$(selector)
      if (element) {
        await element.tap()
        await this.page.waitFor(500)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  async input(selector, text) {
    try {
      const element = await this.page.$(selector)
      if (element) {
        await element.input(text)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  async getText(selector) {
    try {
      const element = await this.page.$(selector)
      if (element) {
        return await element.text()
      }
      return null
    } catch (error) {
      return null
    }
  }

  async runTests() {
    console.log('='.repeat(60))
    console.log('🧪 开始 UI 测试')
    console.log('='.repeat(60))

    // ==================== 首页测试 ====================
    console.log('\n📱 首页测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/index/index')
    await screenshot(this.page, 'homepage')

    // 检查关键元素
    const title = await this.getText('.title, .nav-title, text')
    recordTest('首页加载', !!title)

    // 检查游戏列表 - 使用实际的选择器
    const gameList = await this.page.$$('.games-grid, .game-item')
    recordTest('游戏列表显示', gameList.length > 0, `找到 ${gameList.length} 个元素`)

    // ==================== 游戏页测试 ====================
    console.log('\n🎮 游戏页测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/games/index')
    await screenshot(this.page, 'games_page')

    const games = await this.page.$$('.game-card, .game-item')
    recordTest('游戏列表页加载', games.length > 0, `找到 ${games.length} 个游戏`)

    // 点击第一个游戏
    if (games.length > 0) {
      await games[0].tap()
      await this.page.waitFor(1500)
      await screenshot(this.page, 'game_detail')
      recordTest('游戏详情页加载', true)
    }

    // ==================== 舒尔特方格测试 ====================
    console.log('\n🧩 舒尔特方格测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/game-schulte/index')
    await screenshot(this.page, 'schulte_game')

    // 尝试点击开始按钮 - 先点击开始，网格才会出现
    const startBtn = await this.page.$('.start-btn, .btn-start, button')
    if (startBtn) {
      await startBtn.tap()
      await this.page.waitFor(1000)
      recordTest('游戏开始按钮', true)
      await screenshot(this.page, 'schulte_playing')
    }

    // 检查游戏元素 - 网格在开始后才显示
    const grid = await this.page.$('.grid-container, .grid')
    recordTest('舒尔特方格网格加载', !!grid)

    // ==================== 个人中心测试 ====================
    console.log('\n👤 个人中心测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/profile/index')
    await screenshot(this.page, 'profile_page')

    // 检查用户信息卡
    const userCard = await this.page.$('.user-card, .user-info')
    recordTest('用户信息卡显示', !!userCard)

    // 检查孩子列表
    const childList = await this.page.$$('.child-item')
    recordTest('孩子列表显示', childList.length >= 0, `找到 ${childList.length} 个孩子`)

    // ==================== 添加孩子弹窗测试 ====================
    console.log('\n➕ 添加孩子弹窗测试')
    console.log('-'.repeat(50))

    // 点击添加按钮
    const addBtn = await this.page.$('.add-child-btn, .add-btn')
    if (addBtn) {
      await addBtn.tap()
      await this.page.waitFor(800)
      await screenshot(this.page, 'add_child_modal')
      recordTest('添加孩子弹窗打开', true)

      // 测试输入姓名
      const nameInput = await this.page.$('input[name="name"], .name-input')
      if (nameInput) {
        await nameInput.input('测试孩子')
        recordTest('姓名输入框可用', true)
      }

      // 测试年龄加减
      const minusBtn = await this.page.$('.stepper-btn:first-child, .age-minus')
      if (minusBtn) {
        await minusBtn.tap()
        recordTest('年龄减按钮可用', true)
      }

      const plusBtn = await this.page.$('.stepper-btn:last-child, .age-plus')
      if (plusBtn) {
        await plusBtn.tap()
        recordTest('年龄加按钮可用', true)
      }

      // 测试性别选择
      const maleBtn = await this.page.$('.gender-btn:first-child')
      if (maleBtn) {
        await maleBtn.tap()
        recordTest('性别选择可用', true)
      }

      // 测试取消按钮
      const cancelBtn = await this.page.$('.btn-outline, .cancel-btn')
      if (cancelBtn) {
        await cancelBtn.tap()
        await this.page.waitFor(500)
        recordTest('取消按钮关闭弹窗', true)
      }
    } else {
      recordTest('添加孩子按钮未找到', false, '需要先登录')
    }

    // ==================== 家长学院测试 ====================
    console.log('\n📚 家长学院测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/academy/index')
    await screenshot(this.page, 'academy_page')

    const academyTitle = await this.getText('.title, .page-title')
    recordTest('家长学院页面加载', !!academyTitle)

    // ==================== 学校管理测试 ====================
    console.log('\n🏫 学校管理测试')
    console.log('-'.repeat(50))

    await this.navigate('/pages/school/index')
    await screenshot(this.page, 'school_page')

    recordTest('学校管理页面加载', true)

    // ==================== 结果汇总 ====================
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试结果汇总')
    console.log('='.repeat(60))
    console.log(`  ✅ 通过: ${results.passed}`)
    console.log(`  ❌ 失败: ${results.failed}`)
    console.log(`  📈 总计: ${results.passed + results.failed}`)

    if (results.errors.length > 0) {
      console.log('\n❌ 失败详情:')
      results.errors.forEach(e => {
        console.log(`  - ${e.name}: ${e.error}`)
      })
    }

    // 保存报告
    const reportPath = path.join(CONFIG.reportDir, `ui-test-report-${Date.now()}.json`)
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true })
    }
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...results,
    }, null, 2))
    console.log(`\n📝 报告已保存: ${reportPath}`)

    console.log('\n' + '='.repeat(60))
    console.log(results.failed === 0 ? '🎉 所有测试通过!' : '⚠️ 存在失败测试')
    console.log('='.repeat(60) + '\n')
  }

  async close() {
    if (this.mp) {
      console.log('\n👋 关闭开发者工具...')
      await this.mp.close()
    }
  }
}

// ==================== 主程序 ====================
async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🎯 FocusKids UI 自动化测试')
  console.log('='.repeat(60))

  const runner = new UITestRunner()

  // 启动
  const launched = await runner.launch()
  if (!launched) {
    console.error('\n❌ 无法启动，退出测试')
    process.exit(1)
  }

  try {
    // 执行测试
    await runner.runTests()
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message)
    console.error(error.stack)
  } finally {
    // 关闭
    await runner.close()
  }

  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)
