/**
 * 微信小程序上传脚本
 * 使用 miniprogram-ci 进行自动化发布
 */
const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

// 读取配置
const projectConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'project.config.json'), 'utf-8')
);

// 环境变量
const {
  CI_PRIVATE_KEY_PATH = path.resolve(__dirname, 'private.wx003bb69f003c24b9.key'),
  CI_APP_ID = projectConfig.appid,
  CI_VERSION = '1.0.0',
  CI_DESC = '自动化构建上传'
} = process.env;

/**
 * 上传小程序
 */
async function upload() {
  const projectPath = path.resolve(__dirname);

  // 检查私钥文件
  if (!fs.existsSync(CI_PRIVATE_KEY_PATH)) {
    console.error(`❌ 私钥文件不存在: ${CI_PRIVATE_KEY_PATH}`);
    console.log('💡 请到微信公众平台下载私钥: https://mp.weixin.qq.com');
    process.exit(1);
  }

  const project = new ci.Project({
    appid: CI_APP_ID,
    type: 'miniProgram',
    projectPath,
    privateKeyPath: CI_PRIVATE_KEY_PATH,
    ignoreFiles: ['node_modules/**/*']
  });

  try {
    console.log('🚀 开始上传小程序...\n');
    console.log(`📦 AppID: ${CI_APP_ID}`);
    console.log(`📍 版本: ${CI_VERSION}`);
    console.log(`📝 描述: ${CI_DESC}\n`);

    const uploadResult = await ci.upload({
      project,
      version: CI_VERSION,
      desc: CI_DESC,
      setting: {
        es6: true,
        minifyJS: true,
        minifyWXML: true,
        minifyWXSS: true,
        minify: true
      },
      onProgressUpdate: (progress) => {
        console.log(`📤 上传进度: ${progress.percent}%`);
      }
    });

    console.log('\n✅ 上传成功!');
    console.log(`📋 版本号: ${uploadResult.versionInfo.version}`);
    console.log(`🆔 请求 ID: ${uploadResult.requestId}`);
    console.log('\n💡 请到微信公众平台提交审核或设置体验版');
    
  } catch (err) {
    console.error('\n❌ 上传失败:', err.message);
    if (err.code) {
      console.error(`错误码: ${err.code}`);
    }
    process.exit(1);
  }
}

/**
 * 预览小程序
 */
async function preview() {
  const projectPath = path.resolve(__dirname);

  if (!fs.existsSync(CI_PRIVATE_KEY_PATH)) {
    console.error(`❌ 私钥文件不存在: ${CI_PRIVATE_KEY_PATH}`);
    process.exit(1);
  }

  const project = new ci.Project({
    appid: CI_APP_ID,
    type: 'miniProgram',
    projectPath,
    privateKeyPath: CI_PRIVATE_KEY_PATH,
    ignoreFiles: ['node_modules/**/*']
  });

  try {
    console.log('🔍 开始预览...\n');

    const previewResult = await ci.preview({
      project,
      version: CI_VERSION,
      desc: CI_DESC,
      setting: {
        es6: true,
        minifyJS: true,
        minifyWXML: true,
        minifyWXSS: true
      },
      qrcodeFormat: 'image',
      qrcodeOutputPath: path.resolve(__dirname, 'preview-qrcode.png'),
      onProgressUpdate: (progress) => {
        console.log(`📤 预览进度: ${progress.percent}%`);
      }
    });

    console.log('\n✅ 预览生成成功!');
    console.log(`📍 二维码: ${previewResult.qrcodeOutputPath}`);
    console.log(`🔗 预览链接: ${previewResult.url}`);
    
  } catch (err) {
    console.error('\n❌ 预览失败:', err.message);
    process.exit(1);
  }
}

// 主入口
const command = process.argv[2] || 'upload';

if (command === 'preview') {
  preview();
} else if (command === 'upload') {
  upload();
} else {
  console.log('用法: node scripts/upload.js [preview|upload]');
  process.exit(1);
}