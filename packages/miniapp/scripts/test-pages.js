/**
 * 专注星球小程序 - 页面覆盖率测试
 * 测试所有 21 个页面（实际29个）导航和渲染
 * 
 * 使用方法:
 * node scripts/test-pages.js [all|tabbar|navigation|games]
 */
const automator = require('miniprogram-automator');
const path = require('path');
const fs = require('fs');

// 配置
const config = {
  wsEndpoint: process.env.WS_ENDPOINT || `ws://127.0.0.1:${process.env.WEIXIN_DEVTOOLS_PORT || 47748}`,
  screenshotDir: path.resolve(__dirname, '../test-results/screenshots'),
  reportDir: path.resolve(__dirname, '../test-results/reports'),
};

// 页面列表定义
const PAGES = {
  // ===== TabBar 页面 =====
  tabbar: [
    { path: 'pages/index/index', name: '首页', icon: '首页' },
    { path: 'pages/parent/index', name: '家长报告', icon: '家长报告' },
    { path: 'pages/profile/index', name: '个人中心', icon: '个人中心' },
  ],
  
  // ===== 导航页面 =====
  navigation: [
    { path: 'pages/login/index', name: '登录', icon: '登录页' },
    { path: 'pages/games/index', name: '游戏广场', icon: '游戏广场' },
    { path: 'pages/achievement/index', name: '成就中心', icon: '成就' },
    { path: 'pages/assessment/index', name: '专注力评估', icon: '评估' },
    { path: 'pages/membership/index', name: '会员中心', icon: '会员' },
    { path: 'pages/recommendation/index', name: '训练推荐', icon: '推荐' },
    { path: 'pages/academy/index', name: '家长学院', icon: '学院' },
    { path: 'pages/academy/articles', name: '文章列表', icon: '文章' },
    { path: 'pages/academy/article', name: '文章详情', icon: '详情' },
    { path: 'pages/academy/questions', name: '专家问答', icon: '问答' },
    { path: 'pages/academy/question', name: '问题详情', icon: '问题' },
    { path: 'pages/academy/ask', name: '提问', icon: '提问' },
    { path: 'pages/school/index', name: '学校仪表盘', icon: '学校' },
    { path: 'pages/school/teachers', name: '教师管理', icon: '教师' },
    { path: 'pages/school/classes', name: '班级管理', icon: '班级' },
    { path: 'pages/school/students', name: '学生管理', icon: '学生' },
  ],
  
  // ===== 游戏页面 =====
  games: [
    { path: 'pages/game-schulte/index', name: '舒尔特方格', icon: '舒尔特' },
    { path: 'pages/game-audio/index', name: '听声辨数', icon: '听声' },
    { path: 'pages/game-memory/index', name: '图案记忆', icon: '记忆' },
    { path: 'pages/game-visual/index', name: '视觉追踪', icon: '视觉' },
    { path: 'pages/game-reaction/index', name: '反应速度', icon: '反应' },
    { path: 'pages/game-rhythm/index', name: '节奏点击', icon: '节奏' },
    { path: 'pages/game-sound/index', name: '听觉记忆', icon: '听觉' },
    { path: 'pages/game-maze/index', name: '迷宫寻路', icon: '迷宫' },
    { path: 'pages/game-sort/index', name: '快速分类', icon: '分类' },
    { path: 'pages/game-tracking/index', name: '追踪目标', icon: '追踪' },
  ],
};

// 所有页面
const ALL_PAGES = [
  ...PAGES.tabbar,
  ...PAGES.navigation,
  ...PAGES.games,
];

// 测试结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
  startTime: Date.now(),
};

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 截图
 */
async function screenshot(page, name) {
  const filename = `${name.replace(/\//g, '-')}-${Date.now()}.png`;
  const filepath = path.join(config.screenshotDir, filename);
  try {
    await page.screenshot({ path: filepath });
    return filepath;
  } catch (e) {
    return null;
  }
}

/**
 * 连接开发者工具
 */
async function connect() {
  console.log('🔌 正在连接开发者工具...\n');
  try {
    const miniProgram = await automator.connect({
      wsEndpoint: config.wsEndpoint,
    });
    console.log('✅ 连接成功!\n');
    return miniProgram;
  } catch (error) {
    console.error('❌ 连接失败!');
    console.error('   请确保:');
    console.error('   1. 微信开发者工具已启动');
    console.error('   2. 已开启自动化端口');
    console.error(`\n错误: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * 测试单个页面
 */
async function testPage(miniProgram, pageInfo) {
  const { path: pagePath, name, icon } = pageInfo;
  const startTime = Date.now();
  
  console.log(`\n📍 [${results.total + 1}/${results.total + 1}] 测试: ${name} (${pagePath})`);
  
  try {
    // 尝试导航到页面
    const page = await miniProgram.currentPage();
    
    // 处理 tabbar 页面使用 switchTab，其他用 navigateTo
    const isTabBar = PAGES.tabbar.some(p => p.path === pagePath);
    
    if (isTabBar) {
      await miniProgram.switchTab({ url: pagePath });
    } else {
      await page.navigateTo({ url: `/${pagePath}` });
    }
    
    // 等待页面加载
    await miniProgram.waitForPage(pagePath, { timeout: 10000 });
    
    // 验证页面存在
    const currentPage = await miniProgram.currentPage();
    const actualPath = await currentPage.path();
    
    if (!actualPath.includes(pagePath.split('/').pop())) {
      throw new Error(`页面路径不匹配: 期望 ${pagePath}, 实际 ${actualPath}`);
    }
    
    // 截图
    const screenshotPath = await screenshot(currentPage, pagePath);
    
    // 获取页面元素
    const elements = await currentPage.$$('view, text, image, button');
    
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ 页面加载成功 (${duration}ms)`);
    console.log(`   📊 元素数量: ${elements.length}`);
    if (screenshotPath) {
      console.log(`   📸 截图: ${path.basename(screenshotPath)}`);
    }
    
    results.passed++;
    results.details.push({
      path: pagePath,
      name,
      status: 'passed',
      duration,
      elements: elements.length,
      screenshot: screenshotPath ? path.basename(screenshotPath) : null,
    });
    
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`   ❌ 失败: ${error.message}`);
    
    results.failed++;
    results.details.push({
      path: pagePath,
      name,
      status: 'failed',
      duration,
      error: error.message,
    });
    
    return false;
  }
}

/**
 * 导航到指定页面（TabBar）
 */
async function navigateToTab(miniProgram, pagePath) {
  await miniProgram.switchTab({ url: pagePath });
  await miniProgram.waitForPage(pagePath);
}

/**
 * 运行测试
 */
async function runTests(miniProgram, filter = 'all') {
  let pagesToTest = [];
  
  switch (filter) {
    case 'tabbar':
      pagesToTest = PAGES.tabbar;
      break;
    case 'navigation':
      pagesToTest = PAGES.navigation;
      break;
    case 'games':
      pagesToTest = PAGES.games;
      break;
    case 'all':
    default:
      pagesToTest = ALL_PAGES;
  }
  
  results.total = pagesToTest.length;
  
  console.log(`\n📋 待测试页面: ${pagesToTest.length} 个\n`);
  console.log('═'.repeat(60));
  
  // 首先访问首页作为起点
  console.log('\n🚀 初始化: 访问首页');
  await miniProgram.launch();
  await miniProgram.waitForPage('pages/index/index', { timeout: 15000 });
  console.log('✅ 首页加载成功\n');
  
  console.log('─'.repeat(60));
  
  // 逐个测试页面
  for (const pageInfo of pagesToTest) {
    results.total++;
    await testPage(miniProgram, pageInfo);
  }
  
  // 返回首页
  console.log('\n🏠 返回首页');
  await miniProgram.switchTab({ url: 'pages/index/index' });
}

/**
 * 打印报告
 */
function printReport() {
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 页面覆盖率测试报告');
  console.log('═'.repeat(60));
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`📝 总页面数: ${results.total}`);
  console.log(`✅ 通过: ${results.passed} (${passRate}%)`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log('─'.repeat(60));
  
  // 失败列表
  if (results.failed > 0) {
    console.log('\n❌ 失败页面:\n');
    results.details
      .filter(d => d.status === 'failed')
      .forEach(d => {
        console.log(`   • ${d.name} (${d.path})`);
        console.log(`     错误: ${d.error}`);
      });
  }
  
  // 详细结果
  console.log('\n📋 详细结果:\n');
  results.details.forEach((d, i) => {
    const status = d.status === 'passed' ? '✅' : '❌';
    console.log(`   ${status} ${i + 1}. ${d.name}`);
    console.log(`      路径: ${d.path}`);
    console.log(`      耗时: ${d.duration}ms`);
    if (d.elements) {
      console.log(`      元素: ${d.elements} 个`);
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  
  // 保存 JSON 报告
  const reportPath = path.join(config.reportDir, `pages-report-${Date.now()}.json`);
  ensureDir(config.reportDir);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON 报告: ${reportPath}`);
  
  // 保存 HTML 报告
  const htmlReport = generateHTMLReport(results);
  const htmlPath = path.join(config.reportDir, `pages-report-${Date.now()}.html`);
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`📄 HTML 报告: ${htmlPath}`);
  console.log('═'.repeat(60) + '\n');
  
  return results.failed === 0;
}

/**
 * 生成 HTML 报告
 */
function generateHTMLReport(results) {
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  
  const rows = results.details.map((d, i) => `
    <tr class="${d.status}">
      <td>${i + 1}</td>
      <td>${d.name}</td>
      <td><code>${d.path}</code></td>
      <td>${d.duration}ms</td>
      <td>${d.elements || '-'}</td>
      <td>${d.status === 'passed' ? '✅ 通过' : '❌ ' + d.error}</td>
    </tr>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>页面覆盖率测试报告</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #6C63FF; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; }
    .stat.danger { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat h3 { margin: 0; font-size: 32px; }
    .stat p { margin: 5px 0 0; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #6C63FF; color: white; }
    tr:hover { background: #f9f9f9; }
    .passed { color: #6BCB77; }
    .failed { color: #f5576c; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .brand { color: #6C63FF; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 专注星球 - 页面覆盖率测试报告</h1>
    <p>测试时间: ${new Date().toLocaleString()}</p>
    
    <div class="stats">
      <div class="stat">
        <h3>${results.total}</h3>
        <p>总页面数</p>
      </div>
      <div class="stat">
        <h3>${passRate}%</h3>
        <p>通过率</p>
      </div>
      <div class="stat">
        <h3>${results.passed}</h3>
        <p>通过</p>
      </div>
      <div class="stat danger">
        <h3>${results.failed}</h3>
        <p>失败</p>
      </div>
    </div>
    
    <p>总耗时: ${duration}s | <span class="brand">专注星球</span></p>
    
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>页面名称</th>
          <th>路径</th>
          <th>耗时</th>
          <th>元素数</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
}

/**
 * 主函数
 */
async function main() {
  const filter = process.argv[2] || 'all';
  
  console.log('\n' + '🎯'.repeat(20));
  console.log('专注星球小程序 - 页面覆盖率测试');
  console.log('🎯'.repeat(20) + '\n');
  console.log(`📋 测试范围: ${filter.toUpperCase()}\n`);
  
  // 确保目录存在
  ensureDir(config.screenshotDir);
  ensureDir(config.reportDir);
  
  let miniProgram;
  
  try {
    miniProgram = await connect();
    await runTests(miniProgram, filter);
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
  } finally {
    if (miniProgram) {
      await miniProgram.close();
    }
    const success = printReport();
    process.exit(success ? 0 : 1);
  }
}

// 运行
main();