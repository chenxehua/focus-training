/**
 * 快速连接测试脚本
 * 用于诊断微信开发者工具自动化连接问题
 */

const WebSocket = require('ws');
const http = require('http');

// 配置
const WS_ENDPOINT = 'ws://127.0.0.1:47748';
const HTTP_ENDPOINT = 'http://127.0.0.1:47748';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, icon, message) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, '✅', message);
}

function error(message) {
  log(colors.red, '❌', message);
}

function info(message) {
  log(colors.blue, 'ℹ️', message);
}

function warning(message) {
  log(colors.yellow, '⚠️', message);
}

// 测试 HTTP 连接
async function testHttpConnection() {
  return new Promise((resolve) => {
    console.log('\n🔍 测试 HTTP 连接...\n');
    
    const req = http.get(HTTP_ENDPOINT, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头:`, res.headers);
      
      if (res.statusCode === 404) {
        warning('收到 404 响应 - 这通常表示自动化服务未启用');
        resolve(false);
      } else if (res.statusCode === 400) {
        warning('收到 400 响应 - WebSocket 握手失败');
        resolve(false);
      } else {
        success('HTTP 连接成功!');
        resolve(true);
      }
    });
    
    req.on('error', (e) => {
      error(`HTTP 连接失败: ${e.message}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      error('HTTP 连接超时');
      resolve(false);
    });
  });
}

// 测试 WebSocket 连接
async function testWebSocketConnection() {
  return new Promise((resolve) => {
    console.log('\n🔍 测试 WebSocket 连接...\n');
    console.log(`连接地址: ${WS_ENDPOINT}\n`);
    
    const ws = new WebSocket(WS_ENDPOINT, {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Version': '13',
      }
    });
    
    const timeout = setTimeout(() => {
      ws.close();
      error('WebSocket 连接超时 (3秒)');
      resolve(false);
    }, 3000);
    
    ws.on('open', () => {
      clearTimeout(timeout);
      success('WebSocket 连接成功!');
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (err) => {
      clearTimeout(timeout);
      error(`WebSocket 连接失败: ${err.message}`);
      console.log('\n可能的原因:');
      console.log('1. 开发者工具未开启自动化功能');
      console.log('2. 项目未在模拟器中加载');
      console.log('3. 自动化端口配置错误');
      resolve(false);
    });
    
    ws.on('message', (data) => {
      console.log('收到消息:', data.toString());
    });
  });
}

// 诊断检查清单
async function runDiagnostics() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 微信开发者工具自动化连接诊断');
  console.log('='.repeat(60) + '\n');
  
  // 1. 检查进程
  console.log('1️⃣ 检查微信开发者工具进程...');
  const { execSync } = require('child_process');
  
  try {
    const result = execSync('pgrep -x "wechatdevtools" | wc -l', { encoding: 'utf8' });
    const count = parseInt(result.trim());
    
    if (count > 0) {
      success(`微信开发者工具正在运行 (进程数: ${count})`);
    } else {
      error('微信开发者工具未运行');
      console.log('请启动微信开发者工具');
    }
  } catch (e) {
    error('无法检查进程状态');
  }
  
  // 2. 检查端口
  console.log('\n2️⃣ 检查自动化端口 (47748)...');
  
  try {
    const portResult = execSync('lsof -i :47748 | grep LISTEN | wc -l', { encoding: 'utf8' });
    const portCount = parseInt(portResult.trim());
    
    if (portCount > 0) {
      success('端口 47748 正在监听');
    } else {
      error('端口 47748 未监听');
      console.log('请在开发者工具中: 设置 → 安全设置 → 开启服务端口');
    }
  } catch (e) {
    error('无法检查端口状态');
  }
  
  // 3. 测试连接
  const httpOk = await testHttpConnection();
  const wsOk = await testWebSocketConnection();
  
  // 结果总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 诊断结果');
  console.log('='.repeat(60) + '\n');
  
  if (httpOk && wsOk) {
    success('所有检查通过! 可以运行自动化测试');
    console.log('\n运行测试命令:');
    console.log('  npm run test:pages');
    return true;
  } else {
    error('存在连接问题，请按照以下步骤解决:\n');
    
    console.log('解决步骤:');
    console.log('1. 打开微信开发者工具');
    console.log('2. 打开项目: packages/miniapp/dist/dev/mp-weixin');
    console.log('3. 等待项目完全加载');
    console.log('4. 点击菜单: 工具 → 自动化');
    console.log('5. 点击 "开启自动化" 按钮');
    console.log('6. 确认状态显示为 "已连接"');
    console.log('7. 重新运行本诊断脚本\n');
    
    console.log('或运行一键配置脚本:');
    console.log('  ./setup-automation.sh\n');
    
    return false;
  }
}

// 运行诊断
runDiagnostics().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((err) => {
  console.error('诊断失败:', err);
  process.exit(1);
});
