/**
 * 微信小程序自动化启动脚本
 * 通过 AppleScript 启用开发者工具自动化服务
 */

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_PATH = path.resolve(__dirname, '../dist/dev/mp-weixin');

/**
 * 使用 AppleScript 尝试启用自动化
 * 注意: 这需要开发者工具支持 UI 自动化
 */
function enableAutomationViaAppleScript() {
  try {
    // 首先确保项目已打开
    const script = `
      tell application "WeChat DevTools"
        activate
      end tell

      delay 2

      tell application "System Events"
        tell process "WeChat DevTools"
          -- 尝试点击自动化菜单
          keystroke "a" using {command down, shift down}
        end tell
      end tell
    `;

    execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
    console.log('✅ 已发送自动化启用命令');
    return true;
  } catch (e) {
    console.log('⚠️ AppleScript 自动化失败:', e.message);
    return false;
  }
}

/**
 * 检查自动化服务状态
 */
function checkAutomationStatus() {
  try {
    const result = execSync('lsof -i :47748 | grep LISTEN | wc -l', { encoding: 'utf8' });
    return parseInt(result.trim()) > 0;
  } catch (e) {
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 微信小程序自动化测试启动脚本');
  console.log('='.repeat(60));
  console.log('');

  // 检查进程
  console.log('1️⃣ 检查开发者工具状态...');
  const processCheck = execSync('pgrep -x "wechatdevtools" | wc -l', { encoding: 'utf8' });
  if (parseInt(processCheck.trim()) > 0) {
    console.log('   ✅ 开发者工具正在运行');
  } else {
    console.log('   ❌ 开发者工具未运行');
    console.log('   💡 请先打开微信开发者工具');
    return;
  }

  // 检查端口
  console.log('\n2️⃣ 检查自动化端口...');
  const portCheck = execSync('lsof -i :47748 | grep LISTEN | wc -l', { encoding: 'utf8' });
  if (parseInt(portCheck.trim()) > 0) {
    console.log('   ✅ 端口 47748 已监听');
  } else {
    console.log('   ⚠️ 端口 47748 未监听');
  }

  // 尝试启用自动化
  console.log('\n3️⃣ 尝试启用自动化服务...');
  enableAutomationViaAppleScript();

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 再次检查
  console.log('\n4️⃣ 验证自动化状态...');
  if (checkAutomationStatus()) {
    console.log('   ✅ 自动化服务已启用!');
    console.log('\n运行测试命令:');
    console.log('   npm run test:pages');
  } else {
    console.log('   ❌ 自动化服务未启用');
    console.log('\n请手动启用:');
    console.log('   1. 在开发者工具中打开项目');
    console.log('   2. 点击顶部菜单: 工具 → 自动化');
    console.log('   3. 点击 "开启自动化服务"');
    console.log('   4. 确认端口 47748 已启用');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
