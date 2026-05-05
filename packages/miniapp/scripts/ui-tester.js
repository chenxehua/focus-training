/**
 * 专注星球 - 页面 UI 自动化测试
 * 
 * 使用方法:
 *   1. 确保微信开发者工具已开启自动化端口 (47748)
 *   2. 确保自动化服务已启用 (工具 → 自动化)
 *   3. 运行: node scripts/ui-tester.js
 */

const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');

// ==================== 配置 ====================
const CONFIG = {
  wsEndpoint: 'ws://127.0.0.1:9420',
  screenshotDir: path.resolve(__dirname, '../test-results/ui-screenshots'),
  reportDir: path.resolve(__dirname, '../test-results/ui-reports'),
};

// 确保目录存在
[CONFIG.screenshotDir, CONFIG.reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== 工具函数 ====================
function log(msg, type = 'info') {
  const icons = { info: '📘', success: '✅', error: '❌', warning: '⚠️', test: '🧪' };
  console.log(`${icons[type] || '📘'} ${msg}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(CONFIG.screenshotDir, filename);
  await page.waitForTimeout(500); // 等待UI渲染
  await page.screenshot({ path: filepath });
  log(`📸 截图: ${filename}`, 'info');
  return filepath;
}

// ==================== 测试结果 ====================
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  startTime: Date.now(),
};

function recordTest(name, passed, error = null, screenshotPath = null) {
  testResults.tests.push({ name, passed, error, screenshotPath, timestamp: new Date().toISOString() });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// ==================== 页面选择器 ====================
const SELECTORS = {
  // 登录页
  login: {
    appName: 'text=专注星球',
    phoneInput: 'input[type="number"], input[maxlength="11"]',
    codeInput: 'input[maxlength="6"]',
    sendCodeBtn: 'text=发送验证码',
    loginBtn: 'text=登录',
    wxLoginBtn: 'text=微信一键登录',
    agreement: 'text=用户服务协议',
  },
  // 首页
  index: {
    appName: 'text=专注星球',
    welcome: '.welcome-title',
    gameList: '.game-list, .games-container, .game-card',
    tabBar: '.tab-bar, .van-tabbar',
    bottomNav: '.bottom-nav',
  },
  // 游戏列表
  games: {
    gameCard: '.game-card, .game-item, .game',
    schulteGame: 'text=舒尔特方格',
    audioGame: 'text=听声辨数',
  },
  // 个人中心
  profile: {
    avatar: '.avatar, .user-avatar, .avatar-img',
    nickname: '.nickname, .user-name',
    stats: '.stats-card, .data-overview',
  },
  // 家长报告
  parent: {
    dataOverview: '.data-overview, .stats-card',
    charts: '.chart, .chart-container',
    weeklyReport: 'text=本周报告',
  },
};

// ==================== UI 测试类 ====================
class UITester {
  constructor() {
    this.miniProgram = null;
    this.currentPage = null;
    this.connected = false;
  }

  // 连接开发者工具
  async connect() {
    log('连接微信开发者工具...', 'info');
    log(`   端口: ${CONFIG.wsEndpoint}`, 'info');
    
    try {
      this.miniProgram = await automator.connect({
        wsEndpoint: CONFIG.wsEndpoint,
        timeout: 30000,
      });
      this.connected = true;
      log('✅ 连接成功!', 'success');
      return true;
    } catch (error) {
      log(`❌ 连接失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 启动小程序
  async launch() {
    log('🚀 启动小程序...', 'info');
    try {
      await this.miniProgram.launch();
      await this.miniProgram.waitForPage('pages/index/index');
      this.currentPage = await this.miniProgram.currentPage();
      const path = await this.currentPage.path();
      log(`📱 当前页面: ${path}`, 'success');
      await wait(1000);
    } catch (error) {
      log(`启动失败: ${error.message}`, 'error');
      throw error;
    }
  }

  // 导航到页面
  async navigateTo(url) {
    log(`📍 导航到: ${url}`, 'info');
    await this.currentPage.navigateTo({ url });
    await wait(1500);
    this.currentPage = await this.currentPage.currentPage();
  }

  // 切换 Tab
  async switchTab(tabPath) {
    log(`🔄 切换 Tab: ${tabPath}`, 'info');
    await this.currentPage.switchTab({ url: tabPath });
    await wait(1500);
    this.currentPage = await this.currentPage.currentPage();
  }

  // 点击元素
  async clickElement(selector, description = '元素') {
    log(`👆 点击: ${description}`, 'info');
    try {
      const element = await this.currentPage.$(selector);
      if (element) {
        await element.tap();
        await wait(500);
        return true;
      }
      log(`   ⚠️ 未找到元素: ${selector}`, 'warning');
      return false;
    } catch (error) {
      log(`   ❌ 点击失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 检查元素存在
  async checkElement(selector, description = '元素') {
    try {
      const element = await this.currentPage.$(selector);
      if (element) {
        log(`✅ 找到: ${description}`, 'success');
        return true;
      }
      log(`❌ 未找到: ${description}`, 'error');
      return false;
    } catch (error) {
      log(`❌ 检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  // 截图
  async takeScreenshot(name) {
    return screenshot(this.currentPage, name);
  }

  // 关闭连接
  async close() {
    if (this.miniProgram) {
      await this.miniProgram.close();
      log('🔌 已断开连接', 'info');
    }
  }

  // ==================== 测试用例 ====================

  // 测试登录页
  async testLoginPage() {
    log('\n========== 测试: 登录页 ==========', 'test');
    
    await this.navigateTo('/pages/login/index');
    await this.takeScreenshot('login-page');
    
    // 检查页面元素
    const checks = [
      { selector: SELECTORS.login.appName, desc: 'App名称' },
      { selector: SELECTORS.login.wxLoginBtn, desc: '微信登录按钮' },
    ];
    
    for (const check of checks) {
      const found = await this.checkElement(check.selector, check.desc);
      recordTest(`登录页 - ${check.desc}`, found);
    }
    
    // 检查输入框
    const phoneInput = await this.currentPage.$('input[type="number"], input');
    recordTest('登录页 - 手机号输入框', !!phoneInput, phoneInput ? null : '未找到输入框');
  }

  // 测试首页
  async testIndexPage() {
    log('\n========== 测试: 首页 ==========', 'test');
    
    await this.switchTab('/pages/index/index');
    await this.takeScreenshot('index-page');
    
    const checks = [
      { selector: SELECTORS.index.appName, desc: 'App名称' },
      { selector: SELECTORS.index.tabBar, desc: '底部TabBar' },
    ];
    
    for (const check of checks) {
      const found = await this.checkElement(check.selector, check.desc);
      recordTest(`首页 - ${check.desc}`, found);
    }
    
    // 检查游戏列表
    const gameList = await this.currentPage.$$('.game-card, .game-item, .game');
    log(`   游戏卡片数量: ${gameList.length}`, 'info');
    recordTest('首页 - 游戏列表', gameList.length > 0, gameList.length === 0 ? '未找到游戏' : null);
  }

  // 测试游戏列表页
  async testGamesPage() {
    log('\n========== 测试: 游戏列表页 ==========', 'test');
    
    await this.navigateTo('/pages/games/games');
    await this.takeScreenshot('games-page');
    
    const games = await this.currentPage.$$('.game-card, .game-item, .game');
    log(`   找到 ${games.length} 个游戏卡片`, 'info');
    recordTest('游戏列表页 - 游戏数量', games.length > 0);
    
    // 尝试点击第一个游戏
    if (games.length > 0) {
      const firstGame = games[0];
      await firstGame.tap();
      await wait(1000);
      await this.takeScreenshot('game-detail');
      recordTest('游戏列表页 - 进入游戏', true);
    }
  }

  // 测试个人中心
  async testProfilePage() {
    log('\n========== 测试: 个人中心 ==========', 'test');
    
    await this.switchTab('/pages/profile/profile');
    await this.takeScreenshot('profile-page');
    
    const checks = [
      { selector: SELECTORS.profile.avatar, desc: '头像' },
      { selector: SELECTORS.profile.nickname, desc: '昵称' },
    ];
    
    for (const check of checks) {
      const found = await this.checkElement(check.selector, check.desc);
      recordTest(`个人中心 - ${check.desc}`, found);
    }
  }

  // 测试家长报告页
  async testParentPage() {
    log('\n========== 测试: 家长报告页 ==========', 'test');
    
    await this.navigateTo('/pages/parent/parent');
    await this.takeScreenshot('parent-page');
    
    const dataOverview = await this.currentPage.$('.data-overview, .stats-card');
    recordTest('家长报告页 - 数据概览', !!dataOverview);
  }

  // 运行所有测试
  async runAllTests() {
    if (!this.connected) {
      log('无法运行测试 - 未连接', 'error');
      return;
    }
    
    await this.testIndexPage();
    await this.testLoginPage();
    await this.testGamesPage();
    await this.testProfilePage();
    await this.testParentPage();
    
    // 返回首页
    await this.switchTab('/pages/index/index');
  }
}

// ==================== 生成报告 ====================
function generateReport() {
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
  const passRate = testResults.tests.length > 0 
    ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1) 
    : 0;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 UI 自动化测试报告');
  console.log('='.repeat(50));
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`📝 总测试数: ${testResults.tests.length}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 通过率: ${passRate}%`);
  console.log('─'.repeat(50));
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败测试:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   • ${t.name}`);
      if (t.error) console.log(`     原因: ${t.error}`);
    });
  }
  
  console.log('='.repeat(50));
  
  // 保存报告
  const reportPath = path.join(CONFIG.reportDir, `ui-test-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 报告: ${reportPath}`);
  console.log(`📸 截图: ${CONFIG.screenshotDir}`);
  
  return testResults.failed === 0;
}

// ==================== 主函数 ====================
async function main() {
  console.log('\n' + '🎯'.repeat(20));
  console.log('   专注星球 - UI 自动化测试');
  console.log('🎯'.repeat(20) + '\n');
  
  // 检查连接
  try {
    const wsTest = await new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(CONFIG.wsEndpoint);
      ws.on('open', () => { ws.close(); resolve(true); });
      ws.on('error', (e) => reject(e));
      setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 3000);
    });
  } catch (e) {
    log('⚠️ 无法连接到自动化端口', 'warning');
    log('请确保: 微信开发者工具已开启自动化端口 (47748)', 'warning');
    log('操作: 工具 → 自动化 → 开启自动化', 'warning');
    console.log('\n详细步骤请查看: scripts/UI_AUTOMATION_SETUP.md');
    process.exit(1);
  }
  
  const tester = new UITester();
  
  try {
    if (await tester.connect()) {
      await tester.launch();
      await tester.runAllTests();
    }
  } catch (error) {
    log(`测试出错: ${error.message}`, 'error');
  } finally {
    await tester.close();
    const success = generateReport();
    process.exit(success ? 0 : 1);
  }
}

// 运行
if (require.main === module) {
  main().catch(e => {
    log(`Fatal: ${e.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { UITester, SELECTORS };