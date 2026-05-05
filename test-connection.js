/**
 * WebSocket Connection Test for WeChat Developer Tools
 * 微信开发者工具WebSocket连接测试
 */

const WebSocket = require('ws');
const http = require('http');

const WS_URL = 'ws://127.0.0.1:47748';
const HTTP_URL = 'http://127.0.0.1:47748';

console.log('🧪 WeChat Developer Tools Connection Test');
console.log('='.repeat(50));
console.log('');

// Test HTTP connection
console.log('1️⃣  Testing HTTP connection...');
http.get(HTTP_URL, (res) => {
    console.log(`   ✅ HTTP connected - Status: ${res.statusCode}`);
    console.log('');
    
    // Test WebSocket
    console.log('2️⃣  Testing WebSocket connection...');
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
        console.log('   ✅ WebSocket connected successfully!');
        console.log('');
        console.log('🎉 All tests passed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Open project in WeChat DevTools:');
        console.log('   ~/Documents/Claude/Projects/focus-training/packages/miniapp/dist/dev/mp-weixin');
        console.log('2. Run page tests: npm run test:pages');
        ws.close();
        process.exit(0);
    });
    
    ws.on('error', (err) => {
        console.log('   ❌ WebSocket connection failed');
        console.log(`   Error: ${err.message}`);
        console.log('');
        console.log('⚠️  Automation feature may not be enabled');
        console.log('');
        console.log('Please enable automation in WeChat DevTools:');
        console.log('  Menu → Tools → Automation → Enable Automation');
        process.exit(1);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
        console.log('   ⚠️  WebSocket connection timeout');
        ws.terminate();
        process.exit(1);
    }, 5000);
    
}).on('error', (err) => {
    console.log(`   ❌ HTTP connection failed - ${err.message}`);
    console.log('');
    console.log('Please check:');
    console.log('1. WeChat DevTools is running');
    console.log('2. Service port is enabled (Settings → Security)');
    process.exit(1);
});