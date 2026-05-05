/**
 * 专注星球小程序 - 完整 API E2E 测试
 * 测试所有微信小程序后端接口
 * 使用纯 fetch API，直接运行测试
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'

// 测试结果
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

// 存储测试数据
let testUser = null
let testChild = null
let testGameId = null

/**
 * 简单的 fetch 封装
 */
async function apiFetch(path, options = {}) {
  const { method = 'GET', body, token, failOnStatusCode = true } = options
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  const json = await response.json().catch(() => ({}))
  return { status: response.status, ok: response.ok, json }
}

async function authFetch(path, options = {}) {
  return apiFetch(path, { ...options, token: testUser?.token })
}

async function authFetchPost(path, body) {
  return apiFetch(path, { method: 'POST', body, token: testUser?.token })
}

async function authFetchPut(path, body) {
  return apiFetch(path, { method: 'PUT', body, token: testUser?.token })
}

async function authFetchGet(path) {
  return apiFetch(path, { token: testUser?.token })
}

/**
 * 测试工具
 */
async function test(name, fn) {
  results.total++
  try {
    await fn()
    results.passed++
    results.details.push({ name, status: 'passed' })
    console.log(`  ✅ ${name}`)
  } catch (error) {
    results.failed++
    results.details.push({ name, status: 'failed', error: error.message })
    console.log(`  ❌ ${name}: ${error.message}`)
  }
}

async function skip(name, reason) {
  results.total++
  results.details.push({ name, status: 'skipped', reason })
  console.log(`  ⏭️  ${name} (跳过: ${reason})`)
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`)
    },
    toBeTruthy: () => {
      if (!value) throw new Error(`Expected truthy, got ${value}`)
    },
    toBeDefined: () => {
      if (value === undefined) throw new Error('Expected defined, got undefined')
    },
    toContain: (item) => {
      if (!value.includes(item)) throw new Error(`Expected array to contain ${item}`)
    },
  }
}

function expectArray(value) {
  if (!Array.isArray(value)) throw new Error(`Expected array, got ${typeof value}`)
}

console.log('\n' + '═'.repeat(60))
console.log('   专注星球小程序 - API 自动化测试')
console.log('   API Base: ' + API_BASE)
console.log('═'.repeat(60) + '\n')

// ============================================
// 1. 健康检查
// ============================================
async function runHealthCheck() {
  console.log('📋 1. 健康检查')
  
  await test('GET /api/health - 服务正常', async () => {
    const res = await apiFetch('/api/health')
    expect(res.ok).toBeTruthy()
    expect(res.json.status).toBe('ok')
  })
}

// ============================================
// 2. 认证模块
// ============================================
async function runAuthTests() {
  console.log('\n📋 2. 认证模块')
  
  await test('POST /api/auth/wx-login - 新用户登录', async () => {
    const res = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `test_${Date.now()}` }
    })
    expect(res.ok).toBeTruthy()
    testUser = {
      userId: res.json.userId,
      token: res.json.token,
      openId: res.json.openId
    }
  })
  
  await test('POST /api/auth/wx-login - 已有用户登录', async () => {
    const res = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: { code: `existing_${Date.now()}` }
    })
    expect(res.ok).toBeTruthy()
    expect(res.json.token).toBeDefined()
  })
  
  await test('POST /api/auth/wx-login - 缺少参数', async () => {
    const res = await apiFetch('/api/auth/wx-login', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect(res.status).toBe(400)
  })
  
  await test('GET /api/auth/admin-info - 无权限', async () => {
    const res = await apiFetch('/api/auth/admin-info', { failOnStatusCode: false })
    expect(res.status).toBe(401)
  })
}

// ============================================
// 3. 用户模块
// ============================================
async function runUserTests() {
  console.log('\n📋 3. 用户模块')
  
  await test('GET /api/user/info - 获取用户信息', async () => {
    const res = await authFetchGet('/api/user/info')
    expect(res.ok).toBeTruthy()
  })
  
  await test('PUT /api/user/info - 更新用户信息', async () => {
    const res = await authFetchPut('/api/user/info', {
      nickname: '测试用户'
    })
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/user/children - 获取儿童列表', async () => {
    const res = await authFetchGet('/api/user/children')
    expect(res.ok).toBeTruthy()
  })
  
  await test('POST /api/user/child - 添加儿童', async () => {
    const res = await authFetchPost('/api/user/child', {
      name: '测试儿童',
      gender: 1,
      birthDate: '2018-01-01'
    })
    expect(res.ok).toBeTruthy()
    if (res.json.childId) testChild = { childId: res.json.childId }
  })
  
  await test('PUT /api/user/child/:id - 更新儿童信息', async () => {
    const listRes = await authFetchGet('/api/user/children')
    const children = listRes.json.children || listRes.json || []
    if (children.length === 0) {
      await skip('更新儿童', '没有儿童数据')
      return
    }
    const childId = children[0].childId || children[0].id
    const res = await authFetchPut(`/api/user/child/${childId}`, { name: '新名称' })
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 4. 游戏模块
// ============================================
async function runGameTests() {
  console.log('\n📋 4. 游戏模块')
  
  await test('GET /api/game/list - 获取游戏列表', async () => {
    const res = await apiFetch('/api/game/list')
    expect(res.ok).toBeTruthy()
    const games = res.json.games || res.json
    expectArray(games)
    if (games.length > 0) testGameId = games[0].gameId || games[0].id || 'G001'
  })
  
  await test('GET /api/game/:gameId - 获取游戏详情', async () => {
    const res = await authFetchGet(`/api/game/${testGameId || 'G001'}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('POST /api/game/record - 提交游戏记录', async () => {
    const res = await authFetchPost('/api/game/record', {
      childId: testChild?.childId || 1,
      gameId: testGameId || 'G001',
      score: 85,
      duration: 120
    })
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/game/records - 获取训练历史', async () => {
    const res = await authFetchGet('/api/game/records')
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 5. 报告模块
// ============================================
async function runReportTests() {
  console.log('\n📋 5. 报告模块')
  
  await test('GET /api/report/today/:childId - 获取今日数据', async () => {
    const res = await authFetchGet(`/api/report/today/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/report/weekly/:childId - 获取周报', async () => {
    const res = await authFetchGet(`/api/report/weekly/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/report/list - 获取报告列表', async () => {
    const res = await authFetchGet('/api/report/list')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/report/child/:childId/latest - 获取最新报告', async () => {
    const res = await authFetchGet(`/api/report/child/${testChild?.childId || 1}/latest`)
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 6. 成就模块
// ============================================
async function runAchievementTests() {
  console.log('\n📋 6. 成就模块')
  
  await test('GET /api/achievement/list - 获取成就列表', async () => {
    const res = await apiFetch('/api/achievement/list')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/achievement/child/:childId - 获取儿童成就', async () => {
    const res = await authFetchGet(`/api/achievement/child/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/achievement/leaderboard/:gameId - 获取排行榜', async () => {
    const res = await authFetchGet(`/api/achievement/leaderboard/${testGameId || 'G001'}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/achievement/stats/:childId - 获取成就统计', async () => {
    const res = await authFetchGet(`/api/achievement/stats/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 7. 会员模块
// ============================================
async function runMembershipTests() {
  console.log('\n📋 7. 会员模块')
  
  await test('GET /api/membership/packages - 获取套餐列表', async () => {
    const res = await apiFetch('/api/membership/packages')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/membership/status - 获取会员状态', async () => {
    const res = await authFetchGet('/api/membership/status')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/membership/history - 获取购买历史', async () => {
    const res = await authFetchGet('/api/membership/history')
    expect(res.ok).toBeTruthy()
  })
  
  await test('POST /api/membership/create-order - 创建订单', async () => {
    const res = await authFetchPost('/api/membership/create-order', {
      packageId: 'P001',
      payType: 'wechat'
    })
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 8. 评估模块
// ============================================
async function runAssessmentTests() {
  console.log('\n📋 8. 评估模块')
  
  await test('GET /api/assessment/child/:childId/dimensions - 7维度评估', async () => {
    const res = await authFetchGet(`/api/assessment/child/${testChild?.childId || 1}/dimensions`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/assessment/child/:childId/trend - 能力趋势', async () => {
    const res = await authFetchGet(`/api/assessment/child/${testChild?.childId || 1}/trend`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/assessment/child/:childId/summary - 能力摘要', async () => {
    const res = await authFetchGet(`/api/assessment/child/${testChild?.childId || 1}/summary`)
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 9. 推荐模块
// ============================================
async function runRecommendationTests() {
  console.log('\n📋 9. AI推荐模块')
  
  await test('GET /api/recommendation/profile/:childId - 用户画像', async () => {
    const res = await authFetchGet(`/api/recommendation/profile/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/recommendation/:childId - 推荐游戏', async () => {
    const res = await authFetchGet(`/api/recommendation/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/recommendation/weekly-plan/:childId - 周训练计划', async () => {
    const res = await authFetchGet(`/api/recommendation/weekly-plan/${testChild?.childId || 1}`)
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/recommendation/difficulty/:childId/:gameId - 难度建议', async () => {
    const res = await authFetchGet(`/api/recommendation/difficulty/${testChild?.childId || 1}/${testGameId || 'G001'}`)
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 10. 家长学院模块
// ============================================
async function runAcademyTests() {
  console.log('\n📋 10. 家长学院模块')
  
  await test('GET /api/academy/categories - 获取分类列表', async () => {
    const res = await apiFetch('/api/academy/categories')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/categories/:id - 获取分类详情', async () => {
    const res = await apiFetch('/api/academy/categories/1')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/tags - 获取标签列表', async () => {
    const res = await apiFetch('/api/academy/tags')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/articles - 获取文章列表', async () => {
    const res = await apiFetch('/api/academy/articles')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/articles/hot - 热门文章', async () => {
    const res = await apiFetch('/api/academy/articles/hot')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/articles/recommended - 推荐文章', async () => {
    const res = await apiFetch('/api/academy/articles/recommended')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/articles/:id - 文章详情', async () => {
    const res = await apiFetch('/api/academy/articles/1')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/articles/:id/related - 相关文章', async () => {
    const res = await apiFetch('/api/academy/articles/1/related')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/questions/categories - 问答分类', async () => {
    const res = await apiFetch('/api/academy/questions/categories')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/questions/hot - 热门问题', async () => {
    const res = await apiFetch('/api/academy/questions/hot')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/questions - 问题列表', async () => {
    const res = await apiFetch('/api/academy/questions')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/questions/:id - 问题详情', async () => {
    const res = await apiFetch('/api/academy/questions/1')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/questions/:id/answers - 回答列表', async () => {
    const res = await apiFetch('/api/academy/questions/1/answers')
    expect(res.ok).toBeTruthy()
  })
  
  await test('POST /api/academy/questions - 创建提问', async () => {
    const res = await authFetchPost('/api/academy/questions', {
      title: '测试问题',
      content: '这是测试内容',
      categoryId: 1
    })
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/academy/expert-answers - 专家问答', async () => {
    const res = await apiFetch('/api/academy/expert-answers')
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 11. 学校管理模块
// ============================================
async function runSchoolTests() {
  console.log('\n📋 11. 学校管理模块')
  
  await test('GET /api/school/schools - 学校列表', async () => {
    const res = await apiFetch('/api/school/schools')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/school/schools/:id - 学校详情', async () => {
    const res = await apiFetch('/api/school/schools/1')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/school/teachers - 教师列表', async () => {
    const res = await apiFetch('/api/school/teachers')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/school/classes - 班级列表', async () => {
    const res = await apiFetch('/api/school/classes')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/school/classes/:id/students - 学生列表', async () => {
    const res = await apiFetch('/api/school/classes/1/students')
    expect(res.ok).toBeTruthy()
  })
  
  await test('GET /api/school/dashboard - 仪表盘数据', async () => {
    const res = await apiFetch('/api/school/dashboard')
    expect(res.ok).toBeTruthy()
  })
}

// ============================================
// 12. 错误处理测试
// ============================================
async function runErrorTests() {
  console.log('\n📋 12. 错误处理测试')
  
  await test('无效的认证令牌 - 401', async () => {
    const res = await apiFetch('/api/user/info', {
      token: 'invalid_token',
      failOnStatusCode: false
    })
    expect(res.status).toBe(401)
  })
  
  await test('缺少必需参数 - 400', async () => {
    const res = await apiFetch('/api/game/record', {
      method: 'POST',
      body: {},
      failOnStatusCode: false
    })
    expect(res.status).toBe(400)
  })
  
  await test('不存在的资源 - 404', async () => {
    const res = await apiFetch('/api/game/NONEXISTENT', { failOnStatusCode: false })
    expect(res.status).toBe(404)
  })
}

// ============================================
// 13. 性能测试
// ============================================
async function runPerformanceTests() {
  console.log('\n📋 13. 性能测试')
  
  await test('响应时间 - 健康检查 < 1s', async () => {
    const start = Date.now()
    await apiFetch('/api/health')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(1000)
  })
  
  await test('响应时间 - 游戏列表 < 2s', async () => {
    const start = Date.now()
    await apiFetch('/api/game/list')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })
  
  await test('并发请求处理 - 10个请求 < 5s', async () => {
    const requests = Array(10).fill(null).map(() => apiFetch('/api/health'))
    const start = Date.now()
    await Promise.all(requests)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })
}

// ============================================
// 主函数
// ============================================
async function main() {
  const startTime = Date.now()
  
  try {
    await runHealthCheck()
    await runAuthTests()
    await runUserTests()
    await runGameTests()
    await runReportTests()
    await runAchievementTests()
    await runMembershipTests()
    await runAssessmentTests()
    await runRecommendationTests()
    await runAcademyTests()
    await runSchoolTests()
    await runErrorTests()
    await runPerformanceTests()
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message)
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  // 打印报告
  console.log('\n' + '═'.repeat(60))
  console.log('   测试报告')
  console.log('═'.repeat(60))
  console.log(`   总测试数: ${results.total}`)
  console.log(`   ✅ 通过: ${results.passed}`)
  console.log(`   ❌ 失败: ${results.failed}`)
  console.log(`   ⏱️  耗时: ${duration}s`)
  console.log('═'.repeat(60))
  
  if (results.failed > 0) {
    console.log('\n失败的测试:')
    results.details
      .filter(d => d.status === 'failed')
      .forEach(d => console.log(`   • ${d.name}`))
  }
  
  console.log('')
  
  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    duration: parseFloat(duration),
    ...results
  }
  
  const fs = require('fs')
  const reportPath = 'e2e/test-results/api-full-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📄 报告已保存: ${reportPath}`)
  
  // 退出码
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)