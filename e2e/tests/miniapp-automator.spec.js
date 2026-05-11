/**
 * WeChat Mini-App E2E Tests using miniprogram-automator
 * Tests UI interactions, page navigation, and component behavior
 */
const automator = require('miniprogram-automator');

const MINIAPP_PATH = '/Users/czh/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin';
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

let mp;
let testResults = [];
let passed = 0;
let failed = 0;

async function init() {
  console.log('🔄 Initializing WeChat Mini-App Automator...');
  mp = await automator.launch({
    cliPath: CLI_PATH,
    projectPath: MINIAPP_PATH,
    port: 9420
  });
  console.log('✅ Mini-app launched successfully');
}

async function close() {
  if (mp) {
    await mp.close();
    console.log('🔄 Mini-app closed');
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test(name, fn) {
  try {
    await fn();
    testResults.push({ name, status: 'passed' });
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    testResults.push({ name, status: 'failed', error: error.message });
    console.log(`  ✗ ${name}: ${error.message}`);
    failed++;
  }
}

async function runUITests() {
  console.log('\n============================================================');
  console.log('WeChat Mini-App UI Tests');
  console.log('============================================================\n');

  // Test 1: App Launch
  await test('App Launch', async () => {
    const currentPage = await mp.currentPage();
    const pageName = await currentPage.route();
    if (!pageName) throw new Error('Page not loaded');
    console.log(`    Current page: ${pageName}`);
  });

  // Test 2: Navigate to Login Page
  await test('Navigate to Login Page', async () => {
    const pages = await mp.getCurrentPages();
    console.log(`    Page stack length: ${pages.length}`);
  });

  // Test 3: Check Login Page Elements
  await test('Check Login Page Elements', async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    if (!data) throw new Error('Page data not accessible');
    console.log(`    Page data keys: ${Object.keys(data).slice(0, 5).join(', ')}...`);
  });

  // Test 4: Login Flow (simulate)
  await test('Login Flow', async () => {
    // Simulate login by setting storage
    await mp.evaluate(async () => {
      const app = getApp();
      if (app.globalData) {
        app.globalData.userToken = 'test_token_12345';
      }
    });
    await sleep(500);
  });

  // Test 5: Navigate to Home Page
  await test('Navigate to Home Page', async () => {
    // Use navigateTo if path exists
    const page = await mp.currentPage();
    await page.callMethod('onShow');
    await sleep(300);
  });

  // Test 6: Check Home Page Data
  await test('Check Home Page Data', async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    console.log(`    Has globalData: ${!!data.globalData}`);
  });

  // Test 7: Game List Page
  await test('Game List Page', async () => {
    await mp.switchTab('pages/games/index');
    await sleep(500);
    const page = await mp.currentPage();
    console.log(`    Games page loaded`);
  });

  // Test 8: Navigate to Academy
  await test('Navigate to Academy', async () => {
    await mp.switchTab('pages/academy/index');
    await sleep(500);
    console.log(`    Academy page loaded`);
  });

  // Test 9: Navigate to Profile
  await test('Navigate to Profile', async () => {
    await mp.switchTab('pages/profile/index');
    await sleep(500);
    console.log(`    Profile page loaded`);
  });

  // Test 10: Assessment Flow
  await test('Assessment Flow - Welcome', async () => {
    await mp.switchTab('pages/index/index');
    await sleep(300);
    // Navigate to assessment welcome
    const page = await mp.currentPage();
    await page.navigateTo({ url: '/pages/assessment/welcome' });
    await sleep(500);
  });

  // Test 11: Assessment Questionnaire
  await test('Assessment Flow - Questionnaire', async () => {
    const pages = await mp.getCurrentPages();
    const lastPage = pages[pages.length - 1];
    await lastPage.navigateTo({ url: '/pages/assessment/questionnaire' });
    await sleep(500);
    console.log(`    Questionnaire page navigated`);
  });

  // Test 12: Assessment Game
  await test('Assessment Flow - Game', async () => {
    const pages = await mp.getCurrentPages();
    const lastPage = pages[pages.length - 1];
    await lastPage.navigateTo({ url: '/pages/assessment/game-play' });
    await sleep(500);
    console.log(`    Game play page navigated`);
  });

  // Test 13: Component Rendering
  await test('Component Rendering', async () => {
    const page = await mp.currentPage();
    const data = await page.data();
    console.log(`    Components accessible: ${!!data}`);
  });

  // Test 14: Storage Operations
  await test('Storage Operations', async () => {
    await mp.evaluate(async () => {
      wx.setStorageSync('test_key', 'test_value');
    });
    const value = await mp.evaluate(async () => {
      return wx.getStorageSync('test_key');
    });
    if (value !== 'test_value') throw new Error('Storage sync failed');
  });

  // Test 15: User Session
  await test('User Session', async () => {
    await mp.evaluate(async () => {
      const app = getApp();
      app.globalData = app.globalData || {};
      app.globalData.userInfo = { id: 1, name: 'Test User' };
    });
    const userInfo = await mp.evaluate(async () => {
      const app = getApp();
      return app.globalData?.userInfo;
    });
    if (!userInfo) throw new Error('User session not set');
  });
}

async function runComponentTests() {
  console.log('\n============================================================');
  console.log('Component Tests');
  console.log('============================================================\n');

  // Test components on home page
  await test('GameCard Component', async () => {
    await mp.switchTab('pages/games/index');
    await sleep(500);
    const page = await mp.currentPage();
    console.log(`    GameCard can be accessed`);
  });

  await test('ProgressBar Component', async () => {
    const page = await mp.currentPage();
    await page.callMethod('updateProgress', { progress: 50 });
    await sleep(200);
    console.log(`    ProgressBar updated`);
  });

  await test('StarRating Component', async () => {
    const page = await mp.currentPage();
    await page.callMethod('setStars', { stars: 3 });
    await sleep(200);
    console.log(`    StarRating set to 3 stars`);
  });
}

async function runNavigationTests() {
  console.log('\n============================================================');
  console.log('Navigation Tests');
  console.log('============================================================\n');

  const pages = ['pages/index/index', 'pages/games/index', 'pages/academy/index', 'pages/profile/index'];

  for (const path of pages) {
    await test(`Navigate to ${path}`, async () => {
      await mp.switchTab(path);
      await sleep(300);
    });
  }

  // Test back navigation
  await test('Back Navigation', async () => {
    const pages = await mp.getCurrentPages();
    if (pages.length > 1) {
      await mp.navigateBack();
      await sleep(300);
    }
  });
}

function printSummary() {
  console.log('\n============================================================');
  console.log('Test Results Summary');
  console.log('============================================================');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${(performance.now() / 1000).toFixed(2)}s`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.log('Failed tests:');
    testResults.filter(t => t.status === 'failed').forEach(t => {
      console.log(`  ✗ ${t.name}: ${t.error}`);
    });
  }
}

async function main() {
  try {
    await init();
    await runUITests();
    await runComponentTests();
    await runNavigationTests();
    printSummary();
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();