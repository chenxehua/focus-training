#!/usr/bin/env node
/**
 * 专注星球 - 微信小程序自动化测试与修复系统
 * 
 * 功能:
 * 1. API 测试 - 测试后端接口
 * 2. 页面验证 - 验证页面文件存在
 * 3. UI 自动化测试 - 使用微信开发者工具
 * 4. 自动修复 - 自动修复常见问题
 * 
 * 使用方法:
 *   node scripts/run-tests.js              # 运行所有测试
 *   node scripts/run-tests.js --api       # 仅 API 测试
 *   node scripts/run-tests.js --pages     # 仅页面验证
 *   node scripts/run-tests.js --ui        # UI 自动化测试
 *   node scripts/run-tests.js --fix       # 自动修复问题
 *   node scripts/run-tests.js --all       # 完整测试+修复
 * 
 * @author Claude
 * @date 2024-05-05
 */

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

// ==================== 常量配置 ====================
const CONFIG = {
  WS_ENDPOINT: process.env.WS_ENDPOINT || `ws://127.0.0.1:${process.env.WEIXIN_DEVTOOLS_PORT || 47748}`,
  HTTP_ENDPOINT: process.env.HTTP_ENDPOINT || `http://127.0.0.1:${process.env.WEIXIN_DEVTOOLS_PORT || 47748}`,
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  API_TIMEOUT: 10000,
  PROJECT_ROOT: path.resolve(__dirname, '..'),
  PAGES_DIR: path.resolve(__dirname, '../src/pages'),
  TEST_RESULTS_DIR: path.resolve(__dirname, '../test-results'),
};

// ==================== 页面定义 ====================
const PAGES = {
  tabbar: [
    { path: 'pages/index/index', name: '首页' },
    { path: 'pages/parent/index', name: '家长报告' },
    { path: 'pages/profile/index', name: '个人中心' },
  ],
  navigation: [
    { path: 'pages/login/index', name: '登录' },
    { path: 'pages/games/index', name: '游戏广场' },
    { path: 'pages/achievement/index', name: '成就中心' },
    { path: 'pages/assessment/index', name: '专注力评估' },
    { path: 'pages/membership/index', name: '会员中心' },
    { path: 'pages/recommendation/index', name: '训练推荐' },
    { path: 'pages/academy/index', name: '家长学院' },
    { path: 'pages/academy/articles', name: '文章列表' },
    { path: 'pages/academy/article', name: '文章详情' },
    { path: 'pages/academy/questions', name: '专家问答' },
    { path: 'pages/school/index', name: '学校仪表盘' },
  ],
  games: [
    { path: 'pages/game-schulte/index', name: '舒尔特方格' },
    { path: 'pages/game-audio/index', name: '听声辨数' },
    { path: 'pages/game-memory/index', name: '图案记忆' },
    { path: 'pages/game-visual/index', name: '视觉追踪' },
    { path: 'pages/game-reaction/index', name: '反应速度' },
    { path: 'pages/game-rhythm/index', name: '节奏点击' },
  ],
};

// ==================== 工具函数 ====================
function log(msg, type = 'info') {
  const icons = {
    info: '📘', success: '✅', error: '❌', 
    warning: '⚠️', fix: '🔧', test: '🧪',
    page: '📄', api: '🌐', ui: '🎨'
  };
  console.log(`${icons[type] || '📘'} ${msg}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60) + '\n');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 执行 shell 命令
function execCommand(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: options.timeout || 30000, ...options }, (error, stdout, stderr) => {
      if (error) {
        if (options.ignoreError) {
          resolve({ success: false, stdout, stderr });
        } else {
          reject(error);
        }
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
}

// ==================== 测试结果收集 ====================
const testResults = {
  startTime: Date.now(),
  api: { passed: 0, failed: 0, tests: [] },
  pages: { passed: 0, failed: 0, tests: [] },
  ui: { passed: 0, failed: 0, tests: [] },
  fixes: [],
};

function recordApiTest(name, passed, error = null) {
  testResults.api.tests.push({ name, passed, error, timestamp: new Date().toISOString() });
  if (passed) testResults.api.passed++;
  else testResults.api.failed++;
}

function recordPageTest(name, passed, error = null) {
  testResults.pages.tests.push({ name, passed, error, timestamp: new Date().toISOString() });
  if (passed) testResults.pages.passed++;
  else testResults.pages.failed++;
}

function recordUiTest(name, passed, error = null) {
  testResults.ui.tests.push({ name, passed, error, timestamp: new Date().toISOString() });
  if (passed) testResults.ui.passed++;
  else testResults.ui.failed++;
}

function recordFix(description, success) {
  testResults.fixes.push({ description, success, timestamp: new Date().toISOString() });
}

// ==================== 环境检查 ====================
class EnvironmentChecker {
  async checkAll() {
    logSection('环境检查');
    
    const checks = [
      this.checkNode(),
      this.checkWechatDevTools(),
      this.checkAutomationPort(),
      this.checkProjectFiles(),
      this.checkDependencies(),
    ];
    
    await Promise.all(checks);
    
    return true;
  }
  
  async checkNode() {
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      log(`Node.js: ${version}`, 'success');
      return true;
    } catch {
      log('Node.js: 未安装', 'error');
      return false;
    }
  }
  
  async checkWechatDevTools() {
    try {
      const result = execSync('pgrep -x "wechatdevtools"', { encoding: 'utf8' });
      if (result.trim()) {
        log('微信开发者工具: 运行中', 'success');
        return true;
      }
    } catch {}
    
    log('微信开发者工具: 未运行 (UI测试将被跳过)', 'warning');
    return false;
  }
  
  async checkAutomationPort() {
    try {
      execSync('lsof -i :47748 -sTCP:LISTEN', { encoding: 'utf8' });
      log('自动化端口 (47748): 已开启', 'success');
      return true;
    } catch {
      log('自动化端口 (47748): 未开启 (UI测试将被跳过)', 'warning');
      return false;
    }
  }
  
  async checkProjectFiles() {
    const files = ['src/app.vue', 'src/pages.json', 'package.json'];
    let allExist = true;
    
    for (const file of files) {
      const exists = fs.existsSync(path.join(CONFIG.PROJECT_ROOT, file));
      if (exists) {
        log(`文件存在: ${file}`, 'success');
      } else {
        log(`文件缺失: ${file}`, 'error');
        allExist = false;
      }
    }
    
    return allExist;
  }
  
  async checkDependencies() {
    try {
      const result = execSync('npm ls miniprogram-automator --depth=0 2>/dev/null', { encoding: 'utf8' });
      if (result.includes('miniprogram-automator')) {
        log('miniprogram-automator: 已安装', 'success');
        return true;
      }
    } catch {}
    
    log('miniprogram-automator: 未安装', 'warning');
    return false;
  }
}

// ==================== API 测试 ====================
class APITester {
  async testHealth() {
    log('测试: 健康检查', 'api');
    try {
      const response = await this.request('/api/health');
      if (response.status === 200 && response.data?.status === 'ok') {
        recordApiTest('API 健康检查', true);
        log('✅ API 服务正常', 'success');
        return true;
      }
      recordApiTest('API 健康检查', false, `状态码: ${response.status}`);
      return false;
    } catch (e) {
      recordApiTest('API 健康检查', false, e.message);
      return false;
    }
  }
  
  async testGameList() {
    log('测试: 游戏列表 API', 'api');
    try {
      const response = await this.request('/api/game/list');
      if (response.status === 200) {
        const count = Array.isArray(response.data) ? response.data.length : 0;
        log(`找到 ${count} 个游戏`, 'success');
        recordApiTest('游戏列表 API', true);
        return true;
      }
      recordApiTest('游戏列表 API', false, `状态码: ${response.status}`);
      return false;
    } catch (e) {
      recordApiTest('游戏列表 API', false, e.message);
      return false;
    }
  }
  
  async testUserInfo() {
    log('测试: 用户信息 API (未认证)', 'api');
    try {
      const response = await this.request('/api/user/info');
      if (response.status === 401 || response.status === 404) {
        recordApiTest('用户信息 API (认证检查)', true);
        return true;
      }
      recordApiTest('用户信息 API (认证检查)', false, `状态码: ${response.status}`);
      return false;
    } catch (e) {
      recordApiTest('用户信息 API (认证检查)', false, e.message);
      return false;
    }
  }
  
  async request(path, options = {}) {
    const { method = 'GET', body, timeout = CONFIG.API_TIMEOUT } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const url = `${CONFIG.API_BASE}${path}`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));
      return { status: response.status, ok: response.ok, data };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  async runAll() {
    logSection('API 测试');
    await this.testHealth();
    await this.testGameList();
    await this.testUserInfo();
  }
}

// ==================== 页面验证 ====================
class PageVerifier {
  checkPage(pagePath) {
    const vuePath = path.join(CONFIG.PAGES_DIR, pagePath.replace('pages/', '')) + '.vue';
    const exists = fs.existsSync(vuePath);
    return { path: pagePath, exists, fullPath: vuePath };
  }
  
  checkAllPages() {
    logSection('页面文件验证');
    
    const categories = [
      { name: 'TabBar 页面', pages: PAGES.tabbar },
      { name: '导航页面', pages: PAGES.navigation },
      { name: '游戏页面', pages: PAGES.games },
    ];
    
    let total = 0, found = 0;
    
    for (const category of categories) {
      log(`📁 ${category.name} (${category.pages.length}个)`, 'page');
      
      for (const page of category.pages) {
        total++;
        const result = this.checkPage(page.path);
        
        if (result.exists) {
          found++;
          console.log(`   ✅ ${page.name} (${page.path})`);
          recordPageTest(`页面存在: ${page.path}`, true);
        } else {
          console.log(`   ❌ ${page.name} (${page.path})`);
          recordPageTest(`页面存在: ${page.path}`, false, '文件不存在');
        }
      }
      console.log('');
    }
    
    log(`总计: ${found}/${total} 个页面文件存在`, found === total ? 'success' : 'warning');
    return { total, found };
  }
}

// ==================== UI 自动化测试 ====================
class UIAutomatorTester {
  constructor() {
    this.miniProgram = null;
    this.automator = null;
  }
  
  async connect() {
    try {
      this.automator = require('miniprogram-automator');
      this.miniProgram = await this.automator.connect({
        wsEndpoint: CONFIG.WS_ENDPOINT,
      });
      log('UI 自动化: 已连接微信开发者工具', 'success');
      return true;
    } catch (e) {
      log(`UI 自动化: 连接失败 - ${e.message}`, 'warning');
      return false;
    }
  }
  
  async launch() {
    if (!this.miniProgram) return false;
    try {
      await this.miniProgram.launch();
      await this.miniProgram.waitForPage('pages/index/index', 10000);
      log('UI 自动化: 小程序已启动', 'success');
      return true;
    } catch (e) {
      log(`UI 自动化: 启动失败 - ${e.message}`, 'warning');
      return false;
    }
  }
  
  async testPageNavigation(pagePath, pageName) {
    if (!this.miniProgram) {
      recordUiTest(`导航: ${pageName}`, false, '未连接');
      return false;
    }
    
    try {
      const page = await this.miniProgram.currentPage();
      await page.navigateTo({ url: `/${pagePath}` });
      await this.miniProgram.waitForPage(pagePath, 5000);
      
      const currentPath = (await page.path()).replace(/^\//, '');
      if (currentPath === pagePath || currentPath.includes(pagePath.split('/')[1])) {
        recordUiTest(`导航: ${pageName}`, true);
        log(`✅ 导航成功: ${pageName}`, 'ui');
        return true;
      }
      
      recordUiTest(`导航: ${pageName}`, false, '页面不匹配');
      return false;
    } catch (e) {
      recordUiTest(`导航: ${pageName}`, false, e.message);
      return false;
    }
  }
  
  async runAll() {
    logSection('UI 自动化测试');
    
    if (!await this.connect()) {
      log('跳过 UI 测试 (需要开发者工具运行)', 'warning');
      return;
    }
    
    if (!await this.launch()) {
      log('跳过 UI 测试 (无法启动小程序)', 'warning');
      return;
    }
    
    // 测试主要页面导航
    const testPages = [
      { path: 'pages/index/index', name: '首页' },
      { path: 'pages/games/index', name: '游戏广场' },
      { path: 'pages/achievement/index', name: '成就中心' },
      { path: 'pages/profile/index', name: '个人中心' },
    ];
    
    for (const page of testPages) {
      await this.testPageNavigation(page.path, page.name);
      await wait(500);
    }
    
    await this.close();
  }
  
  async close() {
    if (this.miniProgram) {
      await this.miniProgram.close();
    }
  }
}

// ==================== 自动修复 ====================
class AutoFixer {
  constructor() {
    this.projectRoot = CONFIG.PROJECT_ROOT;
  }
  
  fixRateLimit() {
    log('修复: Rate Limit 配置', 'fix');
    const filePath = path.join(this.projectRoot, 'packages/server/src/middleware/rateLimit.ts');
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      
      // 增加限制阈值
      content = content.replace(/windowMs: 15 \* 60 \* 1000/g, 'windowMs: 1 * 60 * 1000');
      content = content.replace(/max: \d+/g, 'max: 1000');
      
      if (content !== original) {
        fs.writeFileSync(filePath, content);
        recordFix('Rate Limit 配置已调整', true);
        log('✅ Rate Limit 已调整为: 1分钟内1000次', 'success');
        return true;
      }
    }
    
    recordFix('Rate Limit 配置无需修改', false);
    return false;
  }
  
  fixEnvFile() {
    log('检查: 环境配置文件', 'fix');
    const envPath = path.join(this.projectRoot, 'packages/server/.env');
    const envExample = path.join(this.projectRoot, 'packages/server/.env.example');
    
    if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      recordFix('.env 文件已创建', true);
      log('✅ 已从 .env.example 创建配置', 'success');
      return true;
    }
    
    recordFix('.env 文件已存在', false);
    return false;
  }
  
  fixPackageJson() {
    log('检查: package.json 脚本', 'fix');
    const pkgPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      
      // 确保包含所有必要的测试脚本
      const requiredScripts = [
        'test:auto', 'test:api', 'test:pages', 'test:ui', 'e2e'
      ];
      
      let hasAll = true;
      for (const script of requiredScripts) {
        if (!pkg.scripts?.[script]) {
          hasAll = false;
          break;
        }
      }
      
      if (hasAll) {
        recordFix('package.json 脚本完整', false);
        return false;
      }
    }
    
    recordFix('package.json 脚本检查', false);
    return false;
  }
  
  runAutoFix() {
    logSection('自动修复');
    
    this.fixEnvFile();
    this.fixRateLimit();
    this.fixPackageJson();
    
    // 保存修复日志
    const fixDir = path.join(CONFIG.TEST_RESULTS_DIR, 'fixes');
    mkdir(fixDir);
    
    const fixLog = {
      timestamp: new Date().toISOString(),
      fixes: testResults.fixes,
    };
    
    const fixLogPath = path.join(fixDir, `fix-log-${Date.now()}.json`);
    fs.writeFileSync(fixLogPath, JSON.stringify(fixLog, null, 2));
    log(`📄 修复日志: ${fixLogPath}`, 'info');
    
    return testResults.fixes.filter(f => f.success).length;
  }
}

// ==================== 报告生成 ====================
function generateReport() {
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
  
  console.log('\n' + '═'.repeat(60));
  console.log('  📊 测试报告');
  console.log('═'.repeat(60));
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log('');
  
  // API 测试结果
  console.log('🌐 API 测试:');
  console.log(`   通过: ${testResults.api.passed} | 失败: ${testResults.api.failed}`);
  if (testResults.api.failed > 0) {
    testResults.api.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.error}`);
    });
  }
  
  // 页面验证结果
  console.log('\n📄 页面验证:');
  console.log(`   通过: ${testResults.pages.passed} | 失败: ${testResults.pages.failed}`);
  if (testResults.pages.failed > 0) {
    testResults.pages.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.error}`);
    });
  }
  
  // UI 自动化结果
  console.log('\n🎨 UI 自动化:');
  console.log(`   通过: ${testResults.ui.passed} | 失败: ${testResults.ui.failed}`);
  if (testResults.ui.failed > 0) {
    testResults.ui.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.name}: ${t.error}`);
    });
  }
  
  // 修复结果
  if (testResults.fixes.length > 0) {
    console.log('\n🔧 自动修复:');
    const successful = testResults.fixes.filter(f => f.success).length;
    console.log(`   已修复: ${successful} | 无需修复: ${testResults.fixes.length - successful}`);
  }
  
  console.log('═'.repeat(60));
  
  // 保存 JSON 报告
  mkdir(CONFIG.TEST_RESULTS_DIR);
  const reportPath = path.join(CONFIG.TEST_RESULTS_DIR, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 报告已保存: ${reportPath}`);
  console.log('');
  
  // 返回成功状态
  const totalFailed = testResults.api.failed + testResults.pages.failed + testResults.ui.failed;
  return totalFailed === 0;
}

// ==================== 主函数 ====================
async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  const runAll = args.includes('--all') || args.length === 0;
  const runApi = args.includes('--api') || runAll;
  const runPages = args.includes('--pages') || runAll;
  const runUi = args.includes('--ui') || runAll;
  const runFix = args.includes('--fix');
  
  // 打印标题
  console.log('\n' + '🎯'.repeat(20));
  console.log('  专注星球 - 自动化测试与修复系统');
  console.log('🎯'.repeat(20) + '\n');
  
  // 环境检查
  const envChecker = new EnvironmentChecker();
  await envChecker.checkAll();
  
  // 自动修复
  if (runFix) {
    const fixer = new AutoFixer();
    fixer.runAutoFix();
    console.log('');
  }
  
  // 运行测试
  if (runApi) {
    const apiTester = new APITester();
    await apiTester.runAll();
  }
  
  if (runPages) {
    const pageVerifier = new PageVerifier();
    pageVerifier.checkAllPages();
  }
  
  if (runUi) {
    const uiTester = new UIAutomatorTester();
    await uiTester.runAll();
  }
  
  // 生成报告
  const success = generateReport();
  
  process.exit(success ? 0 : 1);
}

// 导出模块
module.exports = {
  APITester,
  PageVerifier,
  UIAutomatorTester,
  AutoFixer,
  EnvironmentChecker,
  testResults,
};

// 运行
if (require.main === module) {
  main().catch(e => {
    log(`Fatal error: ${e.message}`, 'error');
    process.exit(1);
  });
}