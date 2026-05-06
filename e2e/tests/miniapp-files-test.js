/**
 * 专注星球小程序 - 页面文件验证测试
 * 验证所有页面和组件文件是否正确构建
 */

const fs = require('fs');
const path = require('path');

const MINIAPP_PATH = '/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin';

console.log('═'.repeat(60));
console.log('   专注星球小程序 - 文件验证测试');
console.log('═'.repeat(60));

// 定义所有页面
const pages = [
  // 首页和游戏列表
  { name: '首页 (训练主页)', path: '/pages/index/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '游戏广场', path: '/pages/games/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '全部游戏列表', path: '/pages/games/game-list', required: ['wxml', 'js', 'wxss', 'json'] },

  // 游戏页面
  { name: '舒尔特方格', path: '/pages/game-schulte/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '听声辨数', path: '/pages/game-audio/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '图案记忆', path: '/pages/game-memory/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '视觉追踪', path: '/pages/game-visual/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '反应速度', path: '/pages/game-reaction/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '节奏点击', path: '/pages/game-rhythm/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '小侦探听口令', path: '/pages/game-sound/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '迷宫寻路', path: '/pages/game-maze/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '快速分类', path: '/pages/game-sort/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '追踪目标', path: '/pages/game-tracking/index', required: ['wxml', 'js', 'wxss', 'json'] },

  // 个人页面
  { name: '个人中心', path: '/pages/profile/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '家长报告', path: '/pages/report/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '报告详情', path: '/pages/report-detail/index', required: ['wxml', 'js', 'wxss', 'json'] },

  // 评估相关
  { name: '初始评估', path: '/pages/assessment/index', required: ['wxml', 'js', 'wxss', 'json'] },
  { name: '评估欢迎页', path: '/pages/assessment/welcome', required: ['wxml', 'js', 'wxss', 'json'] },
];

// 定义组件
const components = [
  { name: 'GameCard', path: '/components/GameCard' },
  { name: 'ProgressBar', path: '/components/ProgressBar' },
  { name: 'StarRating', path: '/components/StarRating' },
  { name: 'GameTimer', path: '/components/GameTimer' },
];

let passed = 0;
let failed = 0;
const results = [];

function checkFile(filePath) {
  return fs.existsSync(path.join(MINIAPP_PATH, filePath));
}

function getFileSize(filePath) {
  const fullPath = path.join(MINIAPP_PATH, filePath);
  if (fs.existsSync(fullPath)) {
    return fs.statSync(fullPath).size;
  }
  return 0;
}

console.log('\n📄 页面文件验证\n');

for (const page of pages) {
  const pageDir = page.path;
  let allExist = true;
  const fileDetails = [];

  for (const ext of page.required) {
    const filePath = `${pageDir}.${ext}`;
    const exists = checkFile(filePath);
    const size = getFileSize(filePath);
    if (!exists) allExist = false;
    fileDetails.push({ ext, exists, size });
  }

  const status = allExist ? '✅' : '❌';
  console.log(`${status} ${page.name}`);
  console.log(`   路径: ${pageDir}`);

  if (!allExist) {
    failed++;
    fileDetails.forEach(f => {
      if (!f.exists) console.log(`   ⚠️  缺少 .${f.ext} 文件`);
    });
  } else {
    passed++;
    fileDetails.forEach(f => {
      console.log(`   ✅ .${f.ext} (${f.size} bytes)`);
    });
  }

  results.push({ name: page.name, path: pageDir, success: allExist });
}

console.log('\n📦 组件文件验证\n');

for (const comp of components) {
  const jsExists = checkFile(`${comp.path}.js`);
  const wxmlExists = checkFile(`${comp.path}.wxml`);
  const wxssExists = checkFile(`${comp.path}.wxss`);

  const status = jsExists && wxmlExists ? '✅' : '❌';
  console.log(`${status} ${comp.name}`);
  console.log(`   路径: ${comp.path}`);

  if (jsExists && wxmlExists) {
    passed++;
    console.log(`   ✅ .js (${getFileSize(`${comp.path}.js`)} bytes)`);
    console.log(`   ✅ .wxml (${getFileSize(`${comp.path}.wxml`)} bytes)`);
    if (wxssExists) console.log(`   ✅ .wxss (${getFileSize(`${comp.path}.wxss`)} bytes)`);
  } else {
    failed++;
    if (!jsExists) console.log(`   ⚠️  缺少 .js 文件`);
    if (!wxmlExists) console.log(`   ⚠️  缺少 .wxml 文件`);
  }

  results.push({ name: comp.name, path: comp.path, success: jsExists && wxmlExists });
}

// 检查 app.json 配置
console.log('\n⚙️  应用配置验证\n');

const appJsonExists = checkFile('/app.json');
const appJsExists = checkFile('/app.js');
const appWxssExists = checkFile('/app.wxss');

if (appJsonExists) {
  console.log('✅ app.json');
  const content = fs.readFileSync(path.join(MINIAPP_PATH, 'app.json'), 'utf8');
  try {
    const config = JSON.parse(content);
    console.log(`   ✅ pages 数量: ${config.pages?.length || 0}`);
    console.log(`   ✅ tabBar 配置: ${config.tabBar ? '有' : '无'}`);
    console.log(`   ✅ subPackages: ${config.subPackages?.length || 0}`);
  } catch (e) {
    console.log('   ⚠️  JSON 解析失败');
  }
} else {
  console.log('❌ app.json 不存在');
  failed++;
}

if (appJsExists) {
  console.log(`✅ app.js (${getFileSize('/app.js')} bytes)`);
} else {
  console.log('❌ app.js 不存在');
  failed++;
}

if (appWxssExists) {
  console.log(`✅ app.wxss (${getFileSize('/app.wxss')} bytes)`);
} else {
  console.log('⚠️  app.wxss 不存在 (可选)');
}

// 输出报告
console.log('\n' + '═'.repeat(60));
console.log('   测试报告');
console.log('═'.repeat(60));
console.log(`   总检查项: ${passed + failed}`);
console.log(`   ✅ 通过: ${passed}`);
console.log(`   ❌ 失败: ${failed}`);

if (failed === 0) {
  console.log('\n   🎉 所有文件验证通过！');
} else {
  console.log('\n   ⚠️  部分文件验证失败');
}

console.log('\n📋 详细结果:');
results.forEach(r => {
  const status = r.success ? '✅' : '❌';
  console.log(`   ${status} ${r.name}`);
});

console.log('\n' + '═'.repeat(60));

// 保存报告
const report = {
  timestamp: new Date().toISOString(),
  summary: { total: passed + failed, passed, failed },
  results
};

const fs2 = require('fs');
const reportPath = 'e2e/test-results/miniapp-files-report.json';
fs2.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 报告已保存: ${reportPath}\n`);

process.exit(failed > 0 ? 1 : 0);