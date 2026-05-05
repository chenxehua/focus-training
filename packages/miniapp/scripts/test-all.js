/**
 * FocusKids 自动化测试与修复
 * 合并 API + UI 测试，支持自动修复
 *
 * 运行:
 *   node scripts/test-all.js          # 运行全部测试
 *   node scripts/test-all.js api      # 只运行 API 测试
 *   node scripts/test-all.js ui       # 只运行 UI 测试
 *   node scripts/test-all.js pages    # 只运行页面测试
 *   node scripts/test-all.js fix      # 尝试修复已知问题
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')  // project root
const MINIAPP_ROOT = path.resolve(__dirname, '..')  // packages/miniapp
const SERVER_ROOT = path.resolve(MINIAPP_ROOT, '..', 'server')  // packages/server
const API_TEST_FILE = path.join(MINIAPP_ROOT, 'e2e/api-miniapp.spec.ts')
const UI_TEST_FILE = path.join(MINIAPP_ROOT, 'e2e/ui-miniapp.spec.ts')
const PAGES_TEST_FILE = path.join(MINIAPP_ROOT, 'e2e/all-pages.spec.ts')

// 配置
const CONFIG = {
  apiBase: process.env.API_BASE_URL || 'http://localhost:3000',
  devtools: {
    cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    projectPath: path.join(MINIAPP_ROOT, 'dist/dev/mp-weixin'),
    port: 9420,
  },
  screenshotDir: path.join(MINIAPP_ROOT, 'test-results/screenshots'),
  reportDir: path.join(MINIAPP_ROOT, 'test-results/reports'),
}

// ==================== 已知问题及修复 ====================
const KNOWN_FIXES = [
  {
    id: 'DB_LIMIT_PLACEHOLDER',
    description: 'MySQL LIMIT/OFFSET 占位符问题',
    check: () => {
      const dbFile = path.join(SERVER_ROOT, 'src/config/database.ts')
      if (fs.existsSync(dbFile)) {
        const content = fs.readFileSync(dbFile, 'utf8')
        return content.includes('pool.execute') && content.includes('LIMIT ?')
      }
      return false
    },
    fix: () => {
      const dbFile = path.join(SERVER_ROOT, 'src/config/database.ts')
      let content = fs.readFileSync(dbFile, 'utf8')
      content = content.replace(
        'const [rows] = await pool.execute(sql, values)',
        'const [rows] = await pool.query(sql, values)'
      )
      fs.writeFileSync(dbFile, content)
      console.log('✅ 已修复: MySQL LIMIT 占位符问题 (pool.execute → pool.query)')
      return true
    }
  },
  {
    id: 'CORS_NOT_ENABLED',
    description: 'CORS 未启用',
    check: () => {
      const appFile = path.join(SERVER_ROOT, 'src/app.ts')
      if (fs.existsSync(appFile)) {
        const content = fs.readFileSync(appFile, 'utf8')
        return !content.includes('cors')
      }
      return false
    },
    fix: () => {
      const appFile = path.join(SERVER_ROOT, 'src/app.ts')
      let content = fs.readFileSync(appFile, 'utf8')
      if (!content.includes('cors')) {
        content = content.replace(
          "const express = require('express')",
          "const express = require('express')\nconst cors = require('cors')"
        )
        content = content.replace('app.use(express.json())', "app.use(cors())\napp.use(express.json())")
        fs.writeFileSync(appFile, content)
        console.log('✅ 已修复: CORS 中间件已添加')
        return true
      }
      return false
    }
  },
  {
    id: 'SERVER_PORT_CONFLICT',
    description: '服务器端口被占用',
    check: () => {
      return new Promise((resolve) => {
        const req = http.get(`${CONFIG.apiBase}/api/health`, (res) => {
          resolve(false)
        })
        req.on('error', () => resolve(true))
        req.setTimeout(1000, () => {
          req.destroy()
          resolve(true)
        })
      })
    },
    fix: async () => {
      console.log('⚠️ 端口被占用，尝试重启服务器...')
      try {
        execSync('pkill -f "tsx.*server" 2>/dev/null', { stdio: 'ignore' })
        execSync(`sleep 2 && npm run dev:server 2>&1 &`, {
          cwd: MINIAPP_ROOT,
          stdio: 'ignore'
        })
        await new Promise(r => setTimeout(r, 5000))
        console.log('✅ 服务器已重启')
        return true
      } catch (e) {
        console.log('❌ 服务器重启失败:', e.message)
        return false
      }
    }
  },
  {
    id: 'MISSING_CHILD_TABLE',
    description: 'parent_child 表缺失',
    check: async () => {
      try {
        const result = execSync('mysql -u root focuskids -e "SHOW TABLES LIKE \'parent_child\'" 2>/dev/null', { encoding: 'utf8' })
        return !result.includes('parent_child')
      } catch (e) {
        return true
      }
    },
    fix: async () => {
      const sql = `
CREATE TABLE IF NOT EXISTS \`parent_child\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`parent_id\` int NOT NULL,
  \`child_id\` int NOT NULL,
  \`relation\` varchar(50) DEFAULT 'parent',
  \`status\` tinyint DEFAULT 1,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_parent_id\` (\`parent_id\`),
  KEY \`idx_child_id\` (\`child_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
      try {
        execSync(`mysql -u root focuskids -e "${sql}" 2>/dev/null`, { stdio: 'ignore' })
        console.log('✅ 已修复: parent_child 表已创建')
        return true
      } catch (e) {
        console.log('❌ 创建表失败:', e.message)
        return false
      }
    }
  }
]

// ==================== 测试运行器 ====================
class TestRunner {
  constructor() {
    this.results = {
      api: { passed: 0, failed: 0, total: 0 },
      ui: { passed: 0, failed: 0, total: 0 },
      pages: { passed: 0, failed: 0, total: 0 }
    }
    this.fixedIssues = []
  }

  async checkAndFix() {
    console.log('\n🔍 检查已知问题...\n')

    for (const fix of KNOWN_FIXES) {
      try {
        const needsFix = await fix.check()
        if (needsFix) {
          console.log(`🔧 发现问题: ${fix.description}`)
          const result = await fix.fix()
          if (result) {
            this.fixedIssues.push(fix.id)
          }
        }
      } catch (e) {
        // 跳过
      }
    }

    if (this.fixedIssues.length > 0) {
      console.log(`\n✅ 已修复 ${this.fixedIssues.length} 个问题`)
    } else {
      console.log('✅ 未发现需要修复的问题')
    }
  }

  async runApiTests() {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 API 测试')
    console.log('='.repeat(60))

    try {
      const result = execSync(
        `npx playwright test ${API_TEST_FILE} --reporter=list 2>&1`,
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, cwd: PROJECT_ROOT }
      )

      const passed = (result.match(/✓/g) || []).length
      const failed = (result.match(/✘/g) || []).length
      this.results.api = { passed, failed, total: passed + failed }

      if (failed > 0) {
        console.log('\n⚠️ API 测试有失败')
      } else {
        console.log('\n✅ API 测试全部通过')
      }

      return failed === 0
    } catch (e) {
      console.log('\n❌ API 测试执行失败:', e.message)
      return false
    }
  }

  async runUiTests() {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 UI 自动化测试')
    console.log('='.repeat(60))

    try {
      const result = execSync(
        `node ${UI_TEST_FILE} 2>&1`,
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, cwd: MINIAPP_ROOT }
      )

      const passMatch = result.match(/通过: (\d+)/)
      const failMatch = result.match(/失败: (\d+)/)

      const passed = passMatch ? parseInt(passMatch[1]) : 0
      const failed = failMatch ? parseInt(failMatch[1]) : 0
      this.results.ui = { passed, failed, total: passed + failed }

      if (failed > 0) {
        console.log('\n⚠️ UI 测试有失败')
      } else {
        console.log('\n✅ UI 测试全部通过')
      }

      return failed === 0
    } catch (e) {
      console.log('\n❌ UI 测试执行失败:', e.message)
      return false
    }
  }

  async runPagesTests() {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 全页面测试')
    console.log('='.repeat(60))

    try {
      const result = execSync(
        `node ${PAGES_TEST_FILE} 2>&1`,
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, cwd: MINIAPP_ROOT }
      )

      const passMatch = result.match(/通过: (\d+)/)
      const failMatch = result.match(/失败: (\d+)/)

      const passed = passMatch ? parseInt(passMatch[1]) : 0
      const failed = failMatch ? parseInt(failMatch[1]) : 0
      this.results.pages = { passed, failed, total: passed + failed }

      if (failed > 0) {
        console.log('\n⚠️ 页面测试有失败')
      } else {
        console.log('\n✅ 页面测试全部通过')
      }

      return failed === 0
    } catch (e) {
      console.log('\n❌ 页面测试执行失败:', e.message)
      return false
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试结果汇总')
    console.log('='.repeat(60))

    const { api, ui, pages } = this.results
    const totalPassed = api.passed + ui.passed + pages.passed
    const totalFailed = api.failed + ui.failed + pages.failed
    const total = api.total + ui.total + pages.total

    console.log(`\n  API 测试:    ${api.passed}/${api.total} 通过`)
    console.log(`  UI 测试:     ${ui.passed}/${ui.total} 通过`)
    console.log(`  页面测试:    ${pages.passed}/${pages.total} 通过`)
    console.log(`  ──────────────────────────────`)
    console.log(`  总计:        ${totalPassed}/${total} 通过`)

    if (this.fixedIssues.length > 0) {
      console.log(`\n  已修复问题:  ${this.fixedIssues.length} 个`)
    }

    console.log('\n' + '='.repeat(60))

    if (totalFailed === 0) {
      console.log('🎉 所有测试通过!')
    } else {
      console.log(`⚠️ ${totalFailed} 个测试失败`)
    }

    console.log('='.repeat(60) + '\n')

    return totalFailed === 0
  }
}

// ==================== 主程序 ====================
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'

  console.log('\n' + '='.repeat(60))
  console.log('🎯 FocusKids 自动化测试与修复')
  console.log('='.repeat(60))

  const runner = new TestRunner()

  switch (command) {
    case 'api':
      await runner.checkAndFix()
      await runner.runApiTests()
      break

    case 'ui':
      await runner.checkAndFix()
      await runner.runUiTests()
      break

    case 'pages':
      await runner.checkAndFix()
      await runner.runPagesTests()
      break

    case 'fix':
      await runner.checkAndFix()
      break

    case 'all':
    default:
      await runner.checkAndFix()
      await runner.runApiTests()
      await runner.runUiTests()
      await runner.runPagesTests()

      const success = runner.printSummary()

      const reportPath = path.join(CONFIG.reportDir, `test-summary-${Date.now()}.json`)
      if (!fs.existsSync(CONFIG.reportDir)) {
        fs.mkdirSync(CONFIG.reportDir, { recursive: true })
      }
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results: runner.results,
        fixedIssues: runner.fixedIssues
      }, null, 2))
      console.log(`📝 报告已保存: ${reportPath}`)

      process.exit(success ? 0 : 1)
  }
}

main().catch(console.error)
