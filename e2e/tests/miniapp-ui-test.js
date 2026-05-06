/**
 * 专注星球小程序 - UI 自动化测试
 * 测试编译后的小程序页面
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MINIAPP_PATH = '/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin';
const PORT = 9420;

let server = null;
let browser = null;

// 简单的静态文件服务器
function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let filePath = path.join(MINIAPP_PATH, req.url === '/' ? 'index.html' : req.url);

      // 处理微信小程序特殊路由
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      }

      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.wxss': 'text/css',
        '.wxml': 'text/html',
      };

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(PORT, () => {
      console.log(`📦 文件服务器运行在 http://127.0.0.1:${PORT}`);
      resolve();
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPage(page, name, url) {
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      // 过滤微信小程序特定错误
      const text = msg.text();
      if (!text.includes('wx') && !text.includes('WeChat') && !text.includes('getCurrentPages')) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    console.log(`  测试: ${name}`);
    await page.goto(url, { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 检查页面内容
    const content = await page.evaluate(() => {
      return {
        hasBody: document.body && document.body.innerHTML.length > 0,
        bodyLength: document.body ? document.body.innerHTML.length : 0,
        title: document.title || '',
      };
    });

    console.log(`    ✅ 页面加载成功 (内容长度: ${content.bodyLength})`);

    if (errors.length > 0) {
      console.log(`    ⚠️  控制台错误: ${errors.length}个`);
      errors.slice(0, 3).forEach(e => console.log(`      - ${e.substring(0, 80)}`));
    }

    return { name, url, errors, content };
  } catch (err) {
    console.log(`    ❌ 页面加载失败: ${err.message}`);
    return { name, url, errors: [err.message] };
  }
}

async function testComponent(page, name, selector) {
  try {
    console.log(`  测试组件: ${name}`);
    const element = await page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log(`    ✅ 组件可见`);
      return { name, visible: true };
    } else {
      console.log(`    ⚠️  组件未找到`);
      return { name, visible: false };
    }
  } catch (err) {
    console.log(`    ❌ ${err.message}`);
    return { name, visible: false, error: err.message };
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('   专注星球小程序 - UI 自动化测试');
  console.log('═'.repeat(60));

  // 启动服务器
  await startServer();
  await sleep(1000);

  // 启动浏览器
  console.log('\n📱 启动浏览器...');
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  // 测试页面列表
  const pages = [
    { name: '首页 (训练主页)', path: '/pages/index/index' },
    { name: '游戏广场', path: '/pages/games/index' },
    { name: '舒尔特方格游戏', path: '/pages/game-schulte/index' },
    { name: '听声辨数游戏', path: '/pages/game-audio/index' },
    { name: '视觉追踪游戏', path: '/pages/game-visual/index' },
    { name: '个人中心', path: '/pages/profile/index' },
    { name: '家长报告', path: '/pages/report/index' },
  ];

  const results = [];

  console.log('\n📋 开始页面测试...\n');

  for (const p of pages) {
    const url = `http://127.0.0.1:${PORT}${p.path}`;
    const result = await testPage(page, p.name, url);
    results.push(result);
  }

  // 测试组件
  console.log('\n📦 测试组件...\n');

  const componentResults = [];

  // 先访问游戏页面测试组件
  await page.goto(`http://127.0.0.1:${PORT}/pages/games/index`, { timeout: 30000 });
  await page.waitForTimeout(2000);

  // 测试 GameCard 组件
  const gameCardResult = await testComponent(page, 'GameCard', '.game-card');
  componentResults.push(gameCardResult);

  // 访问首页测试 ProgressBar
  await page.goto(`http://127.0.0.1:${PORT}/pages/index/index`, { timeout: 30000 });
  await page.waitForTimeout(2000);

  const progressBarResult = await testComponent(page, 'ProgressBar', '.progress-bar, .check-in-card');
  componentResults.push(progressBarResult);

  // 输出报告
  console.log('\n' + '═'.repeat(60));
  console.log('   测试报告');
  console.log('═'.repeat(60));

  const totalPages = results.length;
  const pagesWithErrors = results.filter(r => r.errors.length > 0).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\n📄 页面测试结果:`);
  console.log(`   测试页面数: ${totalPages}`);
  console.log(`   成功加载: ${totalPages - pagesWithErrors}`);
  console.log(`   有错误: ${pagesWithErrors}`);
  console.log(`   总控制台错误: ${totalErrors}`);

  console.log(`\n📦 组件测试结果:`);
  componentResults.forEach(c => {
    console.log(`   ${c.name}: ${c.visible ? '✅ 可见' : '⚠️ 未找到'}`);
  });

  console.log('\n📋 页面详情:');
  results.forEach(r => {
    const status = r.errors.length === 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${r.name}`);
  });

  console.log('\n' + '═'.repeat(60));

  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    pages: results,
    components: componentResults,
    summary: {
      totalPages,
      successPages: totalPages - pagesWithErrors,
      pagesWithErrors,
      totalErrors
    }
  };

  const fs2 = require('fs');
  const reportPath = 'e2e/test-results/miniapp-ui-report.json';
  fs2.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 报告已保存: ${reportPath}`);

  console.log('');

  // 清理
  if (browser) await browser.close();
  if (server) server.close();

  process.exit(pagesWithErrors > 0 ? 1 : 0);
}

runTests().catch(console.error);