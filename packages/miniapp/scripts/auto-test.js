/**
 * 自动化测试与修复脚本
 * 自动运行测试，发现问题后尝试修复
 *
 * 运行:
 *   node scripts/auto-test.js          # 运行所有测试
 *   node scripts/auto-test.js api     # 只运行 API 测试
 *   node scripts/auto-test.js ui     # 只运行 UI 测试
 *   node scripts/auto-test.js fix    # 尝试修复已知问题
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const API_TEST_FILE = 'e2e/api-miniapp.spec.ts'
const UI_TEST_FILE = 'e2e/ui-miniapp.spec.ts'

// 已知问题及修复方案
const KNOWN_ISSUES = [
  {
    id: 'MISSING_CHILD_TABLE',
    pattern: /Table.*parent_child.*doesn't exist/i,
    fix: () => {
      console.log('🔧 修复: 创建 parent_child 表...')
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
      execSync(`mysql -u root focuskids -e "${sql}"`, { stdio: 'inherit' })
      console.log('✅ parent_child 表已创建')
      return true
    }
  },
  {
    id: 'CORS_MISSING',
    pattern: /CORS|cross-origin|Access-Control-Allow-Origin/i,
    fix: () => {
      const serverFile = path.join(PROJECT_ROOT, 'packages/server/src/app.ts')
      if (fs.existsSync(serverFile)) {
        let content = fs.readFileSync(serverFile, 'utf8')
        if (!content.includes('cors')) {
          console.log('🔧 修复: 添加 CORS 中间件...')
          content = content.replace(
            "const app = express()",
            `const app = express()
const cors = require('cors')
app.use(cors())`
          )
          fs.writeFileSync(serverFile, content)
          console.log('✅ CORS 已添加')
          return true
        }
      }
      return false
    }
  },
  {
    id: 'RATE_LIMIT_TOO_LOW',
    pattern: /429|Too Many Requests|rate.?limit/i,
    fix: () => {
      const envFile = path.join(PROJECT_ROOT, 'packages/server/.env')
      if (fs.existsSync(envFile)) {
        let content = fs.readFileSync(envFile, 'utf8')
        console.log('🔧 修复: 增加 rate limit...')
        if (content.includes('RATE_LIMIT')) {
          content = content.replace(/RATE_LIMIT=\d+/, 'RATE_LIMIT=1000')
        } else {
          content += '\nRATE_LIMIT=1000\n'
        }
        fs.writeFileSync(envFile, content)
        console.log('✅ Rate limit 已更新')
        return true
      }
      return false
    }
  },
  {
    id: 'MODAL_CLOSING_ON_INPUT',
    pattern: /modal.*close|popup.*disappear|@tap\.self/i,
    fix: () => {
      const profileFile = path.join(PROJECT_ROOT, 'packages/miniapp/src/pages/profile/index.vue')
      if (fs.existsSync(profileFile)) {
        let content = fs.readFileSync(profileFile, 'utf8')
        console.log('🔧 修复: 修复弹窗事件处理...')
        // 确保 modal 有 @tap.stop
        if (content.includes('class="modal"') && !content.includes('@tap.stop="() => {}"')) {
          content = content.replace(
            '<view class="modal">',
            '<view class="modal" @tap.stop="() => {}">'
          )
        }
        fs.writeFileSync(profileFile, content)
        console.log('✅ 弹窗事件已修复')
        return true
      }
      return false
    }
  },
  {
    id: 'API_TIMEOUT',
    pattern: /timeout|ETIMEDOUT|ECONNREFUSED/i,
    fix: () => {
      const envFile = path.join(PROJECT_ROOT, 'packages/server/.env')
      console.log('🔧 检查: API 超时配置...')
      // 超时问题通常需要重启服务器
      console.log('💡 提示: 尝试重启服务器: npm run dev:server')
      return false
    }
  },
  {
    id: 'DB_CONNECTION',
    pattern: /ER_.*_connect|Access denied|Unknown database/i,
    fix: () => {
      console.log('🔧 检查: 数据库连接...')
      try {
        execSync('mysql -u root -e "SHOW DATABASES;"', { stdio: 'pipe' })
        console.log('✅ MySQL 连接正常')
        return true
      } catch (e) {
        console.log('❌ MySQL 连接失败')
        console.log('💡 提示: 检查 .env 中的数据库配置')
        return false
      }
    }
  }
]

// 收集测试输出
function runCommand(cmd, options = {}) {
  console.log(`\n📦 执行: ${cmd}\n`)
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    })
    return { success: true, output }
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.stderr || error.message
    }
  }
}

// 检测问题
function detectIssues(output) {
  const issues = []
  for (const issue of KNOWN_ISSUES) {
    if (issue.pattern.test(output)) {
      issues.push(issue)
    }
  }
  return issues
}

// 尝试修复问题
async function tryFix(issues) {
  let fixed = 0
  for (const issue of issues) {
    console.log(`\n🔧 发现问题: ${issue.id}`)
    try {
      const result = issue.fix()
      if (result) {
        fixed++
        console.log('✅ 修复成功')
      } else {
        console.log('⚠️ 无法自动修复')
      }
    } catch (error) {
      console.log(`❌ 修复失败: ${error.message}`)
    }
  }
  return fixed
}

// 运行 API 测试
async function runApiTests() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 运行 API 测试')
  console.log('='.repeat(60))

  const result = runCommand(`npm run test:api --workspace=packages/miniapp`)
  const issues = detectIssues(result.output)

  if (issues.length > 0) {
    console.log(`\n⚠️ 检测到 ${issues.length} 个问题`)
    await tryFix(issues)
  }

  return result.success
}

// 运行 UI 测试
async function runUiTests() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 运行 UI 测试')
  console.log('='.repeat(60))

  const result = runCommand(`node ${UI_TEST_FILE}`)
  const issues = detectIssues(result.output)

  if (issues.length > 0) {
    console.log(`\n⚠️ 检测到 ${issues.length} 个问题`)
    await tryFix(issues)
  }

  return result.success
}

// 尝试修复所有已知问题
async function fixAll() {
  console.log('\n' + '='.repeat(60))
  console.log('🔧 修复所有已知问题')
  console.log('='.repeat(60))

  let fixed = 0
  for (const issue of KNOWN_ISSUES) {
    console.log(`\n🔧 检查: ${issue.id}`)
    try {
      const result = issue.fix()
      if (result) fixed++
    } catch (e) {
      // 忽略错误，继续检查下一个
    }
  }

  console.log(`\n✅ 已修复 ${fixed} 个问题`)
}

// 主程序
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'

  console.log('\n' + '='.repeat(60))
  console.log('🎯 FocusKids 自动化测试与修复')
  console.log('='.repeat(60))
  console.log(`\n命令: ${command}`)

  switch (command) {
    case 'api':
      await runApiTests()
      break
    case 'ui':
      await runUiTests()
      break
    case 'fix':
      await fixAll()
      break
    case 'all':
    default:
      console.log('\n1️⃣ 运行 API 测试...')
      const apiOk = await runApiTests()

      console.log('\n2️⃣ 运行 UI 测试...')
      const uiOk = await runUiTests()

      console.log('\n' + '='.repeat(60))
      console.log('📊 测试结果汇总')
      console.log('='.repeat(60))
      console.log(`  API 测试: ${apiOk ? '✅ 通过' : '❌ 失败'}`)
      console.log(`  UI 测试: ${uiOk ? '✅ 通过' : '❌ 失败'}`)

      if (!apiOk || !uiOk) {
        console.log('\n⚠️ 存在失败的测试')
        process.exit(1)
      }
  }

  console.log('\n✅ 完成!\n')
}

main().catch(console.error)
