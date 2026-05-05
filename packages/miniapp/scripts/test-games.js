/**
 * 小游戏自动化测试用例
 * 针对每款游戏的具体测试
 */
const automator = require('miniprogram-automator');

async function connect() {
  return automator.connect({
    wsEndpoint: process.env.WS_ENDPOINT || 'ws://127.0.0.1:47748',
  });
}

/**
 * 舒尔特方格测试 (G001)
 */
async function testSchulte(miniProgram) {
  console.log('\n🎮 测试: 舒尔特方格 (G001)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-schulte/game-schulte');
  const page = await miniProgram.currentPage();
  
  // 获取方格尺寸
  const grid = await page.$('.grid-container');
  if (!grid) {
    console.log('❌ 未找到方格容器');
    return false;
  }
  
  console.log('✅ 找到方格容器');
  
  // 获取所有数字格子
  const cells = await page.$$('.grid-cell');
  console.log(`✅ 找到 ${cells.length} 个格子`);
  
  // 点击数字1
  const cell1 = await page.$('.grid-cell:nth-child(1)');
  if (cell1) {
    await cell1.tap();
    console.log('✅ 点击数字1');
  }
  
  await page.waitForTimeout(500);
  
  // 截图
  await page.screenshot({ path: `test-results/screenshots/schulte-${Date.now()}.png` });
  
  return true;
}

/**
 * 数字连连看测试 (G002)
 */
async function testNumberLink(miniProgram) {
  console.log('\n🎮 测试: 数字连连看 (G002)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-number-link/game-number-link');
  const page = await miniProgram.currentPage();
  
  // 检查游戏区域
  const gameArea = await page.$('.game-area');
  if (gameArea) {
    console.log('✅ 找到游戏区域');
  } else {
    console.log('❌ 未找到游戏区域');
    return false;
  }
  
  // 获取数字对
  const pairs = await page.$$('.number-pair');
  console.log(`✅ 找到 ${pairs.length} 个数字对`);
  
  return true;
}

/**
 * 颜色识别测试 (G003)
 */
async function testColorRecognition(miniProgram) {
  console.log('\n🎮 测试: 颜色识别 (G003)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-color/game-color');
  const page = await miniProgram.currentPage();
  
  // 检查颜色选择器
  const colorOptions = await page.$$('.color-option');
  console.log(`✅ 找到 ${colorOptions.length} 个颜色选项`);
  
  // 点击第一个选项
  if (colorOptions.length > 0) {
    await colorOptions[0].tap();
    console.log('✅ 点击颜色选项');
  }
  
  return true;
}

/**
 * 图形记忆测试 (G004)
 */
async function testShapeMemory(miniProgram) {
  console.log('\n🎮 测试: 图形记忆 (G004)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-shape/game-shape');
  const page = await miniProgram.currentPage();
  
  // 检查图形显示区
  const shapeArea = await page.$('.shape-area');
  if (shapeArea) {
    console.log('✅ 找到图形区域');
  }
  
  // 检查计时器
  const timer = await page.$('.timer');
  if (timer) {
    console.log('✅ 找到计时器');
  }
  
  return true;
}

/**
 * 反应速度测试 (G005)
 */
async function testReactionSpeed(miniProgram) {
  console.log('\n🎮 测试: 反应速度 (G005)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-reaction/game-reaction');
  const page = await miniProgram.currentPage();
  
  // 检查反应区域
  const reactionArea = await page.$('.reaction-area');
  if (reactionArea) {
    console.log('✅ 找到反应区域');
  }
  
  // 获取开始按钮
  const startBtn = await page.$('.start-btn');
  if (startBtn) {
    await startBtn.tap();
    console.log('✅ 点击开始按钮');
    await page.waitForTimeout(2000);
  }
  
  return true;
}

/**
 * 专注呼吸测试 (G006)
 */
async function testBreathing(miniProgram) {
  console.log('\n🎮 测试: 专注呼吸 (G006)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-breathing/game-breathing');
  const page = await miniProgram.currentPage();
  
  // 检查呼吸动画区域
  const breathArea = await page.$('.breath-area');
  if (breathArea) {
    console.log('✅ 找到呼吸区域');
  }
  
  // 获取开始按钮
  const startBtn = await page.$('.start-btn');
  if (startBtn) {
    await startBtn.tap();
    console.log('✅ 开始呼吸训练');
    
    // 等待动画
    await page.waitForTimeout(3000);
  }
  
  // 截图
  await page.screenshot({ path: `test-results/screenshots/breathing-${Date.now()}.png` });
  
  return true;
}

/**
 * 找不同测试 (G007)
 */
async function testFindDifference(miniProgram) {
  console.log('\n🎮 测试: 找不同 (G007)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-find/game-find');
  const page = await miniProgram.currentPage();
  
  // 检查图片区域
  const images = await page.$$('.compare-image');
  console.log(`✅ 找到 ${images.length} 个对比图片`);
  
  return true;
}

/**
 * 数字方阵测试 (G008)
 */
async function testNumberMatrix(miniProgram) {
  console.log('\n🎮 测试: 数字方阵 (G008)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-matrix/game-matrix');
  const page = await miniProgram.currentPage();
  
  // 检查方阵
  const matrix = await page.$('.number-matrix');
  if (matrix) {
    console.log('✅ 找到数字方阵');
  }
  
  return true;
}

/**
 * 声音专注测试 (G009)
 */
async function testSoundFocus(miniProgram) {
  console.log('\n🎮 测试: 声音专注 (G009)');
  console.log('─'.repeat(40));
  
  await miniProgram.navigateTo('/pages/game-sound/game-sound');
  const page = await miniProgram.currentPage();
  
  // 检查音频控制
  const audioControls = await page.$('.audio-controls');
  if (audioControls) {
    console.log('✅ 找到音频控制');
  }
  
  // 获取播放按钮
  const playBtn = await page.$('.play-btn');
  if (playBtn) {
    await playBtn.tap();
    console.log('✅ 点击播放按钮');
    await page.waitForTimeout(2000);
  }
  
  return true;
}

/**
 * 运行所有游戏测试
 */
async function runAllGameTests() {
  console.log('\n' + '🎮'.repeat(20));
  console.log('专注星球 - 游戏自动化测试');
  console.log('🎮'.repeat(20) + '\n');
  
  let miniProgram;
  let passed = 0;
  let failed = 0;
  
  try {
    console.log('🔌 连接开发者工具...\n');
    miniProgram = await connect();
    console.log('✅ 连接成功!\n');
    
    // 启动小程序
    await miniProgram.launch();
    await miniProgram.waitForPage('pages/index/index');
    console.log('🚀 小程序已启动\n');
    
    // 运行各游戏测试
    const tests = [
      { name: '舒尔特方格', fn: testSchulte },
      { name: '数字连连看', fn: testNumberLink },
      { name: '颜色识别', fn: testColorRecognition },
      { name: '图形记忆', fn: testShapeMemory },
      { name: '反应速度', fn: testReactionSpeed },
      { name: '专注呼吸', fn: testBreathing },
      { name: '找不同', fn: testFindDifference },
      { name: '数字方阵', fn: testNumberMatrix },
      { name: '声音专注', fn: testSoundFocus },
    ];
    
    for (const test of tests) {
      try {
        const result = await test.fn(miniProgram);
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name}测试失败: ${error.message}`);
        failed++;
      }
    }
    
    // 返回首页
    await miniProgram.navigateTo('/pages/index/index');
    
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
    failed++;
  } finally {
    if (miniProgram) {
      await miniProgram.close();
    }
    
    // 打印结果
    console.log('\n' + '='.repeat(40));
    console.log('📊 游戏测试结果');
    console.log('='.repeat(40));
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log('='.repeat(40) + '\n');
    
    process.exit(failed > 0 ? 1 : 0);
  }
}

// 运行
runAllGameTests();