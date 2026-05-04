/**
 * 专注星球小程序 - 页面清单验证脚本
 * 验证所有页面文件是否存在，不依赖开发者工具
 */
const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');
const pagesDir = path.resolve(srcDir, 'pages');

// 页面列表定义
const PAGES = {
  // ===== TabBar 页面 =====
  tabbar: [
    'pages/index/index',      // 首页
    'pages/parent/index',     // 家长报告
    'pages/profile/index',    // 个人中心
  ],
  
  // ===== 导航页面 =====
  navigation: [
    'pages/login/index',               // 登录
    'pages/games/index',               // 游戏广场
    'pages/achievement/index',         // 成就中心
    'pages/assessment/index',          // 专注力评估
    'pages/membership/index',          // 会员中心
    'pages/recommendation/index',      // 训练推荐
    'pages/academy/index',             // 家长学院首页
    'pages/academy/articles',          // 文章列表
    'pages/academy/article',           // 文章详情
    'pages/academy/questions',         // 专家问答
    'pages/academy/question',          // 问题详情
    'pages/academy/ask',               // 提问
    'pages/school/index',              // 学校仪表盘
    'pages/school/teachers',           // 教师管理
    'pages/school/classes',            // 班级管理
    'pages/school/students',           // 学生管理
  ],
  
  // ===== 游戏页面 =====
  games: [
    'pages/game-schulte/index',        // 舒尔特方格
    'pages/game-audio/index',          // 听声辨数
    'pages/game-memory/index',         // 图案记忆
    'pages/game-visual/index',         // 视觉追踪
    'pages/game-reaction/index',       // 反应速度
    'pages/game-rhythm/index',        // 节奏点击
    'pages/game-sound/index',         // 听觉记忆
    'pages/game-maze/index',          // 迷宫寻路
    'pages/game-sort/index',          // 快速分类
    'pages/game-tracking/index',      // 追踪目标
  ],
};

// 验证结果
const results = {
  total: 0,
  found: 0,
  missing: [],
  details: [],
};

/**
 * 检查页面文件是否存在
 */
function checkPage(pagePath) {
  // 移除路径开头的 'pages/' 前缀，因为 pagePath 已经包含完整的相对路径
  const relativePath = pagePath.startsWith('pages/') ? pagePath.slice(6) : pagePath;
  const fullPath = path.join(pagesDir, relativePath);
  const vuePath = fullPath + '.vue';
  const exists = fs.existsSync(vuePath);
  
  return {
    path: pagePath,
    fullPath: vuePath,
    exists,
  };
}

/**
 * 打印分隔线
 */
function printLine() {
  console.log('═'.repeat(80));
}

/**
 * 打印标题
 */
function printTitle(text) {
  printLine();
  console.log(`  ${text}`);
  printLine();
}

/**
 * 验证并打印结果
 */
function verifyAndPrint(category, pages) {
  printTitle(`📁 ${category} 页面 (${pages.length}个)`);
  
  pages.forEach(pagePath => {
    const result = checkPage(pagePath);
    results.total++;
    
    if (result.exists) {
      results.found++;
      console.log(`  ✅ ${result.path}`);
    } else {
      results.missing.push(result.path);
      console.log(`  ❌ ${result.path}`);
    }
    
    results.details.push(result);
  });
  
  console.log('');
}

/**
 * 主函数
 */
function main() {
  console.log('');
  console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
  console.log('  专注星球小程序 - 页面清单验证');
  console.log('🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯');
  console.log('');
  
  // 检查页面目录
  if (!fs.existsSync(pagesDir)) {
    console.error('❌ 页面目录不存在:', pagesDir);
    process.exit(1);
  }
  
  console.log(`📂 页面目录: ${pagesDir}`);
  console.log('');
  
  // 验证各类页面
  verifyAndPrint('TabBar 底部导航', PAGES.tabbar);
  verifyAndPrint('Navigation 导航页面', PAGES.navigation);
  verifyAndPrint('Games 游戏页面', PAGES.games);
  
  // 总结
  printTitle('📊 验证结果总结');
  
  console.log(`  📋 总页面数: ${results.total}`);
  console.log(`  ✅ 存在: ${results.found}`);
  console.log(`  ❌ 缺失: ${results.missing.length}`);
  console.log('');
  
  // 覆盖率
  const coverage = ((results.found / results.total) * 100).toFixed(2);
  console.log(`  📈 页面文件覆盖率: ${coverage}%`);
  console.log('');
  
  // 缺失页面列表
  if (results.missing.length > 0) {
    printTitle('⚠️ 缺失的页面文件');
    results.missing.forEach(page => {
      console.log(`  - ${page}`);
    });
    console.log('');
  }
  
  // 按类型统计
  printTitle('📊 按类型统计');
  console.log(`  TabBar页面: ${PAGES.tabbar.length}个`);
  console.log(`  导航页面: ${PAGES.navigation.length}个`);
  console.log(`  游戏页面: ${PAGES.games.length}个`);
  console.log(`  总计: ${PAGES.tabbar.length + PAGES.navigation.length + PAGES.games.length}个`);
  console.log('');
  
  // 生成 JSON 报告
  const reportPath = path.resolve(__dirname, '../test-results/pages-verification-report.json');
  const fsExtra = require('fs');
  if (!fsExtra.existsSync(path.dirname(reportPath))) {
    fsExtra.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fsExtra.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.total,
      found: results.found,
      missing: results.missing.length,
      coverage: `${coverage}%`,
    },
  }, null, 2));
  
  console.log(`📄 报告已生成: ${reportPath}`);
  console.log('');
  
  // 最终状态
  if (results.missing.length === 0) {
    console.log('✅ 所有页面文件都已创建!');
    process.exit(0);
  } else {
    console.log(`⚠️  仍有 ${results.missing.length} 个页面文件缺失`);
    process.exit(1);
  }
}

// 运行
main();
