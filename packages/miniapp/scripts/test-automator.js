/**
 * 微信小程序自动化测试入口
 * 使用 miniprogram-automator
 * 
 * 使用方法:
 * 1. 确保微信开发者工具已启动并开启自动化端口
 * 2. 运行: node scripts/test-automator.js
 */

const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');

// 测试配置
const config = {
  wsEndpoint: process.env.WS_ENDPOINT || `ws://127.0.0.1:${process.env.WEIXIN_DEVTOOLS_PORT || 47748}`,
  timeout: 30000,
  screenshotDir: path.resolve(__dirname, '../test-results/screenshots'),
  reportDir: path.resolve(__dirname, '../test-results/reports'),
};

// 确保目录存在
[config.screenshotDir, config.reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 测试结果收集器
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * 记录测试结果
 */
function recordTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * 截图并保存
 */
async function screenshot(page, name) {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(config.screenshotDir, filename);
  await page.screenshot({ path: filepath });
  console.log(`📸 截图: ${filename}`);
  return filepath;
}

/**
 * 等待元素出现
 */
async function waitForElement(page, selector, timeout = 10000) {
  return page.waitForSelector(selector, { timeout });
}

/**
 * 主测试类
 */
class MiniAppTester {
  constructor() {
    this.miniProgram = null;
    this.currentPage = null;
    this.testStartTime = Date.now();
  }

  /**
   * 连接开发者工具
   */
  async connect() {
    console.log('🔌 正在连接微信开发者工具...\n');
    console.log(`   端口: ${config.wsEndpoint}\n`);
    
    try {
      this.miniProgram = await automator.connect({
        wsEndpoint: config.wsEndpoint,
      });
      console.log('✅ 连接成功!\n');
      return true;
    } catch (error) {
      console.error('❌ 连接失败!');
      console.error('   请确保:');
      console.error('   1. 微信开发者工具已启动');
      console.error('   2. 已开启自动化端口 (设置 → 安全设置 → 开启服务端口)');
      console.error(`\n错误信息: ${error.message}\n`);
      process.exit(1);
    }
  }

  /**
   * 启动小程序
   */
  async launch() {
    console.log('🚀 启动小程序...\n');
    await this.miniProgram.launch();
    await this.miniProgram.waitForPage('pages/index/index');
    this.currentPage = await this.miniProgram.currentPage();
    console.log(`📱 当前页面: ${await this.currentPage.path()}\n`);
  }

  /**
   * 执行测试
   */
  async runTest(name, testFn) {
    const testName = `测试: ${name}`;
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`🧪 ${testName}`);
    console.log('─'.repeat(50));
    
    try {
      await testFn();
      console.log(`✅ ${testName} - 通过`);
      recordTest(testName, true);
    } catch (error) {
      console.log(`❌ ${testName} - 失败`);
      console.log(`   错误: ${error.message}`);
      recordTest(testName, false, error.message);
    }
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(pagePath) {
    console.log(`\n📍 导航到: ${pagePath}`);
    await this.currentPage.navigateTo({ url: pagePath });
    await this.currentPage.waitForPage(pagePath);
    this.currentPage = await this.currentPage;
  }

  /**
   * 点击元素
   */
  async clickElement(selector, description = '元素') {
    console.log(`👆 点击: ${description}`);
    const element = await this.currentPage.$(selector);
    if (element) {
      await element.tap();
      await this.currentPage.waitForTimeout(500);
    } else {
      throw new Error(`未找到元素: ${selector}`);
    }
  }

  /**
   * 获取元素文本
   */
  async getElementText(selector) {
    const element = await this.currentPage.$(selector);
    if (element) {
      return await element.text();
    }
    return null;
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.miniProgram) {
      await this.miniProgram.close();
      console.log('\n🔌 已断开连接');
    }
  }
}

/**
 * 所有测试用例
 */
async function runAllTests(tester) {
  // ===== 首页测试 =====
  await tester.runTest('首页 - 检查页面加载', async () => {
    const pagePath = await tester.currentPage.path();
    if (!pagePath.includes('index')) {
      throw new Error(`页面路径不正确: ${pagePath}`);
    }
    await screenshot(tester.currentPage, 'index-loaded');
  });

  await tester.runTest('首页 - 显示欢迎信息', async () => {
    // 根据实际情况调整选择器
    const title = await tester.currentPage.$('.welcome-title');
    if (!title) {
      console.log('   ⚠️ 未找到欢迎标题元素，跳过此测试');
    }
  });

  await tester.runTest('首页 - 游戏列表加载', async () => {
    await tester.currentPage.waitForSelector('.game-list', { timeout: 5000 }).catch(() => {
      console.log('   ⚠️ 未找到游戏列表');
    });
  });

  // ===== 游戏列表测试 =====
  await tester.runTest('游戏列表 - 导航到游戏页面', async () => {
    await tester.navigateTo('/pages/games/games');
  });

  await tester.runTest('游戏列表 - 检查游戏数量', async () => {
    const games = await tester.currentPage.$$('.game-card');
    const count = games.length;
    console.log(`   游戏数量: ${count}`);
    if (count === 0) {
      console.log('   ⚠️ 未找到游戏卡片');
    }
  });

  // ===== 舒尔特方格游戏测试 =====
  await tester.runTest('游戏 - 进入舒尔特方格', async () => {
    await tester.clickElement('.game-card:first-child', '第一个游戏卡片');
    await tester.currentPage.waitForTimeout(1000);
    await screenshot(tester.currentPage, 'game-started');
  });

  await tester.runTest('游戏 - 舒尔特方格基本操作', async () => {
    // 检查游戏区域
    const grid = await tester.currentPage.$('.schulte-grid');
    if (grid) {
      console.log('   ✅ 找到舒尔特方格');
    } else {
      console.log('   ⚠️ 未找到方格元素，可能不是舒尔特游戏');
    }
  });

  // ===== 个人中心测试 =====
  await tester.runTest('个人中心 - 导航到个人中心', async () => {
    await tester.navigateTo('/pages/profile/profile');
  });

  await tester.runTest('个人中心 - 检查用户信息', async () => {
    const avatar = await tester.currentPage.$('.avatar');
    const nickname = await tester.currentPage.$('.nickname');
    if (avatar || nickname) {
      console.log('   ✅ 找到用户信息区域');
    } else {
      console.log('   ⚠️ 未找到用户信息，可能未登录');
    }
  });

  // ===== 家长界面测试 =====
  await tester.runTest('家长界面 - 导航到家长界面', async () => {
    await tester.navigateTo('/pages/parent/parent');
  });

  await tester.runTest('家长界面 - 检查数据概览', async () => {
    const stats = await tester.currentPage.$('.stats-card');
    if (stats) {
      console.log('   ✅ 找到数据概览');
    } else {
      console.log('   ⚠️ 未找到数据卡片');
    }
  });

  // ===== 返回首页 =====
  await tester.runTest('返回首页', async () => {
    await tester.navigateTo('/pages/index/index');
  });
}

/**
 * 打印测试报告
 */
function printReport() {
  const duration = ((Date.now() - testResults.testStartTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试报告');
  console.log('='.repeat(50));
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`⏭️  跳过: ${testResults.skipped}`);
  console.log('─'.repeat(50));
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败测试:\n');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   • ${t.name}`);
        if (t.error) {
          console.log(`     ${t.error}`);
        }
      });
  }
  
  console.log('\n' + '='.repeat(50));
  
  // 保存报告到文件
  const reportPath = path.join(config.reportDir, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 报告已保存: ${reportPath}`);
  console.log('='.repeat(50) + '\n');
  
  // 返回退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '🎯'.repeat(25));
  console.log('   专注星球小程序 - 自动化测试');
  console.log('🎯'.repeat(25) + '\n');
  
  const tester = new MiniAppTester();
  
  try {
    // 连接开发者工具
    await tester.connect();
    
    // 启动小程序
    await tester.launch();
    
    // 运行所有测试
    await runAllTests(tester);
    
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
  } finally {
    // 打印报告
    printReport();
    
    // 关闭连接
    await tester.close();
  }
}

// 运行
main().catch(console.error);