/**
 * WeChat Mini Program Automation Diagnostics
 * 微信小程序自动化诊断工具
 */

const { execSync } = require('child_process');
const automator = require('miniprogram-automator');
const http = require('http');

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   微信小程序自动化测试诊断工具                        ║');
console.log('║   WeChat Mini Program Automation Diagnostics         ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

// 1. Check WeChat DevTools Process
console.log('📋 Step 1: Check WeChat DevTools Process');
console.log('─'.repeat(50));
try {
    const psOutput = execSync('ps aux | grep -i wechatwebdevtools | grep -v grep', { encoding: 'utf8' });
    const lines = psOutput.trim().split('\n');
    console.log(`   Found ${lines.length} WeChat DevTools process(es)`);
    lines.forEach((line, i) => {
        const parts = line.trim().split(/\s+/);
        console.log(`   ${i + 1}. PID: ${parts[1]}, CPU: ${parts[2]}%, MEM: ${parts[3]}%`);
    });
} catch (e) {
    console.log('   ❌ No WeChat DevTools process found');
}

// 2. Check Port 47748 Status
console.log('');
console.log('📋 Step 2: Check Port 9420 Status');
console.log('─'.repeat(50));
try {
    const lsofOutput = execSync('lsof -i :9420 -sTCP:LISTEN', { encoding: 'utf8' });
    console.log('   ✅ Port 9420 is LISTENING');
    const lines = lsofOutput.trim().split('\n');
    lines.forEach((line, i) => {
        if (i > 0) console.log('   ' + line);
    });
} catch (e) {
    console.log('   ❌ Port 9420 is not listening');
}

// 3. Test HTTP Connection
console.log('');
console.log('📋 Step 3: Test HTTP Connection to Port 9420');
console.log('─'.repeat(50));
http.get('http://127.0.0.1:9420/', (res) => {
    console.log(`   HTTP Status: ${res.statusCode}`);
    if (res.statusCode === 404) {
        console.log('   ✅ Port is responding (404 is expected for automation)');
    } else if (res.statusCode === 200) {
        console.log('   ✅ Port is responding normally');
    } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
    }

    // 4. Test miniprogram-automator Connection
    console.log('');
    console.log('📋 Step 4: Test miniprogram-automator Connection');
    console.log('─'.repeat(50));
    
    automator.connect({
        ws: 'ws://127.0.0.1:9420'
    }).then(ui => {
        console.log('   ✅ Connected to mini program!');
        console.log('   Current page:', ui.page().path);
        ui.disconnect();
        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║   🎉 All checks passed! Ready for testing.          ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        process.exit(0);
    }).catch(err => {
        console.log('   ❌ Connection failed');
        console.log('   Error:', err.message);
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║   ⚠️  需要在微信开发者工具中启用自动化功能                ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log('║   启用步骤:                                            ║');
        console.log('║   1. 打开微信开发者工具                                ║');
        console.log('║   2. 打开项目: packages/miniapp/dist/dev/mp-weixin     ║');
        console.log('║   3. 点击菜单: 工具 → 自动化                            ║');
        console.log('║   4. 点击"开启自动化"                                   ║');
        console.log('║   5. 重新运行此脚本验证                                 ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        process.exit(1);
    });
}).on('error', (err) => {
    console.log('   ❌ HTTP connection failed:', err.message);
    process.exit(1);
});