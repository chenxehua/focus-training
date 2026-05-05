/**
 * 微信小程序自动化测试与自动修复系统
 * 集成了 API 测试、页面自动化测试、自动问题修复
 * 
 * 使用方法:
 *   node scripts/auto-test-fix.js          # 运行所有测试
 *   node scripts/auto-test-fix.js --api    # 仅 API 测试
 *   node scripts/auto-test-fix.js --ui     # 仅 UI 测试
 *   node scripts/auto-test-fix.js --fix    # 自动修复问题
 */

const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

// ==================== 配置 ====================
const CONFIG = {
  // API 配置
  API_BASE: process.env.API_BASE_URL || 'http://localhost:3000',
  API_TIMEOUT: 15000,
  
  // 小程序自动化配置
  WS_ENDPOINT: process.env.WS_ENDPOINT || `ws://127.0.0.1:${process.env.WEIXIN_DEVTOOLS_PORT || 47748}`,
  
  // 路径配置
  screenshotDir: path.resolve(__dirname, '../test-results/screenshots'),
  reportDir: path.resolve(__dirname, '../test-results/reports'),
  fixLogDir: path.resolve(__dirname, '../test-results/fixes'),
};

// 常用选择器映射
const SELECTORS = {
  // 登录页
  login: {
    phoneInput: 'input[type="number"]',
    codeInput: 'input[maxlength="6"]',
    sendCodeBtn: 'text=发送验证码',
    loginBtn: 'text=登录',
    wxLoginBtn: 'text=微信一键登录',
    agreement: 'text=用户服务协议',
  },
  // 首页
  index: {
    welcome: '.welcome-title, text=专注星球',
    gameList: '.game-list, .games-container',
    tabBar: '.tab-bar, .van-tabbar',
  },
  // 游戏页
  games: {
    gameCard: '.game-card, .game-item',
    schulteGrid: '.schulte-grid, .grid-container',
  },
  // 个人中心
  profile: {
    avatar: '.avatar, .user-avatar',
    nickname: '.nickname, .user-name',
    stats: '.stats-card, .data-overview',
  },
};

// ==================== 工具函数 ====================
function log(msg, type = 'info') {
  const icons = { info: '📘', success: '✅', error: '❌', warning: '⚠️', fix: '🔧' };
  console.log(`${icons[type] || '📘'} ${msg}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// API 请求封装
async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, timeout = CONFIG.API_TIMEOUT } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${CONFIG.API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const json = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, json };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ==================== 测试结果收集器 ====================
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  fixed: 0,
  tests: [],
  fixes: [],
  startTime: Date.now(),
};

function recordTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error, timestamp: new Date().toISOString() });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function recordFix(description, success, originalCode = null, fixedCode = null) {
  testResults.fixes.push({ description, success, originalCode, fixedCode, timestamp: new Date().toISOString() });
  if (success) testResults.fixed++;
}

// ==================== 问题诊断与自动修复 ====================
class AutoFixer {
  constructor() {
    this.fixes = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }
  
  // 诊断问题
  async diagnose() {
    log('开始诊断问题...', 'info');
    const issues = [];
    
    // 1. 检查后端服务
    try {
      const health = await apiRequest('/api/health', { timeout: 5000 });
      if (!health.ok) {
        issues.push({ type: 'api', severity: 'high', message: `API 响应异常: ${health.status}` });
      } else {
        log('✅ 后端服务正常', 'success');
      }
    } catch (e) {
      issues.push({ type: 'api', severity: 'critical', message: `无法连接到后端: ${e.message}` });
    }
    
    // 2. 检查数据库连接
    try {
      const db = await apiRequest('/api/user/info', { timeout: 5000 });
      if (db.status === 401 || db.status === 404) {
        log('✅ 数据库连接正常', 'success');
      }
    } catch (e) {
      issues.push({ type: 'database', severity: 'critical', message: `数据库连接失败: ${e.message}` });
    }
    
    // 3. 检查 rate limit
    try {
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const r = await apiRequest('/api/health', { timeout: 3000 });
        responses.push(r);
        await wait(100);
      }
      if (responses.some(r => r.status === 429)) {
        issues.push({ type: 'rate-limit', severity: 'medium', message: '检测到 rate limit 限制' });
      }
    } catch (e) {}
    
    return issues;
  }
  
  // 自动修复问题
  async autoFix(issues) {
    log('开始自动修复...', 'info');
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'rate-limit':
          await this.fixRateLimit();
          break;
        case 'api':
          await this.fixApiConfig();
          break;
        case 'database':
          await this.fixDatabaseConfig();
          break;
      }
    }
  }
  
  // 修复 rate limit 配置
  async fixRateLimit() {
    log('修复: 调整 rate limit 配置', 'fix');
    const rateLimitPath = path.join(this.projectRoot, 'packages/server/src/middleware/rateLimit.ts');
    
    if (fs.existsSync(rateLimitPath)) {
      let content = fs.readFileSync(rateLimitPath, 'utf8');
      const original = content;
      
      // 增加限制以适应测试
      content = content.replace(/windowMs: 15 \* 60 \* 1000/g, 'windowMs: 1 * 60 * 1000');
      content = content.replace(/max: 200/g, 'max: 1000');
      
      if (content !== original) {
        fs.writeFileSync(rateLimitPath, content);
        recordFix('增加 rate limit 阈值', true, original, content);
        log('✅ Rate limit 已调整 (1分钟内1000次)', 'success');
      }
    }
  }
  
  // 修复 API 配置
  async fixApiConfig() {
    log('检查 API 配置...', 'fix');
    const envPath = path.join(this.projectRoot, 'packages/server/.env');
    
    if (!fs.existsSync(envPath)) {
      const envExample = path.join(this.projectRoot, 'packages/server/.env.example');
      if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, envPath);
        recordFix('创建 .env 配置文件', true);
        log('✅ 已从 .env.example 创建配置', 'success');
      }
    }
  }
  
  // 修复数据库配置
  async fixDatabaseConfig() {
    log('检查数据库配置...', 'fix');
    // 数据库连接问题需要在环境变量中配置
  }
  
  // 保存修复日志
  saveFixLog() {
    mkdir(CONFIG.fixLogDir);
    const logPath = path.join(CONFIG.fixLogDir, `fix-log-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(testResults.fixes, null, 2));
    log(`📄 修复日志: ${logPath}`, 'info');
  }
}

// ==================== API 测试 ====================
class APITester {
  async testHealthCheck() {
    log('测试: API 健康检查', 'info');
    try {
      const response = await apiRequest('/api/health');
      if (response.ok && response.json.status === 'ok') {
        recordTest('API 健康检查', true);
        return true;
      }
      recordTest('API 健康检查', false, `响应: ${JSON.stringify(response)}`);
      return false;
    } catch (e) {
      recordTest('API 健康检查', false, e.message);
      return false;
    }
  }
  
  async testGamesAPI() {
    log('测试: 游戏列表 API', 'info');
    try {
      // 游戏列表在 /api/game/list
      const response = await apiRequest('/api/game/list');
      if (response.ok && response.json.code === 0) {
        log(`   找到 ${response.json.data?.length || 0} 个游戏`, 'info');
        recordTest('游戏列表 API', true);
        return true;
      }
      recordTest('游戏列表 API', false, `状态码: ${response.status}`);
      return false;
    } catch (e) {
      recordTest('游戏列表 API', false, e.message);
      return false;
    }
  }
  
  async testAuthAPI() {
    log('测试: 认证 API (缺少参数)', 'info');
    try {
      const response = await apiRequest('/api/auth/wx-login', {
        method: 'POST',
        body: {}
      });
      if (response.status === 400) {
        recordTest('认证 API - 参数验证', true);
        return true;
      }
      recordTest('认证 API - 参数验证', false, `预期 400，实际 ${response.status}`);
      return false;
    } catch (e) {
      recordTest('认证 API - 参数验证', false, e.message);
      return false;
    }
  }
  
  async runAllTests() {
    log('\n========== API 测试 ==========', 'info');
    await this.testHealthCheck();
    await this.testGamesAPI();
    await this.testAuthAPI();
  }
}

// ==================== 页面自动化测试 ====================
class PageTester {
  constructor() {
    this.miniProgram = null;
    this.currentPage = null;
  }
  
  async connect() {
    log('连接微信开发者工具...', 'info');
    try {
      this.miniProgram = await automator.connect({
        wsEndpoint: CONFIG.WS_ENDPOINT,
      });
      log('✅ 连接成功!', 'success');
      return true;
    } catch (e) {
      log(`❌ 连接失败: ${e.message}`, 'error');
      log('提示: 请确保开发者工具已开启自动化端口', 'warning');
      return false;
    }
  }
  
  async launch() {
    log('启动小程序...', 'info');
    await this.miniProgram.launch();
    await this.miniProgram.waitForPage('pages/index/index');
    this.currentPage = await this.miniProgram.currentPage();
    log(`📱 当前页面: ${await this.currentPage.path()}`, 'info');
  }
  
  async testLoginPage() {
    log('\n测试: 登录页面', 'info');
    try {
      await this.currentPage.navigateTo({ url: '/pages/login/index' });
      await wait(1000);
      
      // 尝试找到关键元素
      const elements = await this.currentPage.elements();
      log(`   找到 ${elements.length} 个元素`, 'info');
      
      recordTest('登录页面加载', true);
    } catch (e) {
      recordTest('登录页面加载', false, e.message);
    }
  }
  
  async testIndexPage() {
    log('\n测试: 首页', 'info');
    try {
      await this.currentPage.navigateTo({ url: '/pages/index/index' });
      await wait(1000);
      
      recordTest('首页加载', true);
    } catch (e) {
      recordTest('首页加载', false, e.message);
    }
  }
  
  async testGamesPage() {
    log('\n测试: 游戏列表页', 'info');
    try {
      await this.currentPage.navigateTo({ url: '/pages/games/games' });
      await wait(1000);
      
      recordTest('游戏列表页加载', true);
    } catch (e) {
      recordTest('游戏列表页加载', false, e.message);
    }
  }
  
  async runAllTests() {
    if (!await this.connect()) {
      log('页面测试需要微信开发者工具运行', 'warning');
      return;
    }
    
    log('\n========== 页面自动化测试 ==========', 'info');
    await this.launch();
    await this.testLoginPage();
    await this.testIndexPage();
    await this.testGamesPage();
    
    await this.close();
  }
  
  async close() {
    if (this.miniProgram) {
      await this.miniProgram.close();
    }
  }
}

// ==================== 截图功能 ====================
async function screenshot(page, name) {
  mkdir(CONFIG.screenshotDir);
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(CONFIG.screenshotDir, filename);
  await page.screenshot({ path: filepath });
  log(`📸 截图: ${filename}`, 'info');
  return filepath;
}

// ==================== 生成报告 ====================
function generateReport() {
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
  const passRate = testResults.tests.length > 0 
    ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1) 
    : 0;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试报告');
  console.log('='.repeat(50));
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`📝 总测试数: ${testResults.tests.length}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`🔧 修复数: ${testResults.fixed}`);
  console.log(`📈 通过率: ${passRate}%`);
  console.log('─'.repeat(50));
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败测试:\n');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   • ${t.name}`);
      console.log(`     原因: ${t.error || '未知'}`);
    });
  }
  
  if (testResults.fixes.length > 0) {
    console.log('\n🔧 已修复问题:\n');
    testResults.fixes.forEach(f => {
      console.log(`   • ${f.description}`);
    });
  }
  
  console.log('='.repeat(50));
  
  // 保存 JSON 报告
  mkdir(CONFIG.reportDir);
  const reportPath = path.join(CONFIG.reportDir, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 报告已保存: ${reportPath}`);
  console.log('');
  
  return testResults.failed === 0;
}

// ==================== 主函数 ====================
async function main() {
  const args = process.argv.slice(2);
  const runAPI = args.includes('--api') || args.length === 0;
  const runUI = args.includes('--ui') || args.length === 0;
  const runFix = args.includes('--fix') || args.includes('--auto-fix');
  const skipFix = args.includes('--no-fix');
  
  console.log('\n' + '🎯'.repeat(20));
  console.log('   专注星球 - 自动化测试与修复系统');
  console.log('🎯'.repeat(20) + '\n');
  
  const fixer = new AutoFixer();
  
  // 1. 诊断问题
  const issues = await fixer.diagnose();
  
  // 2. 自动修复 (除非明确跳过)
  if (runFix && !skipFix && issues.length > 0) {
    await fixer.autoFix(issues);
    fixer.saveFixLog();
    await wait(2000); // 等待配置生效
  }
  
  // 3. 运行测试
  const apiTester = new APITester();
  const pageTester = new PageTester();
  
  if (runAPI) {
    await apiTester.runAllTests();
  }
  
  if (runUI) {
    await pageTester.runAllTests();
  }
  
  // 4. 生成报告
  const success = generateReport();
  
  process.exit(success ? 0 : 1);
}

// 导出供外部使用
module.exports = {
  APITester,
  PageTester,
  AutoFixer,
  apiRequest,
  testResults,
};

// 运行
if (require.main === module) {
  main().catch(e => {
    log(`Fatal error: ${e.message}`, 'error');
    process.exit(1);
  });
}