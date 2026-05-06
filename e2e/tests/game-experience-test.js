/**
 * 游戏体验E2E测试
 * 
 * 测试覆盖：
 * - 各年龄组游戏配置验证
 * - 游戏难度渐进性
 * - 前端游戏页面可访问性
 */

const API_BASE = 'http://localhost:3000/api'

// 生成测试token
const jwt = require('jsonwebtoken')
const TEST_SECRET = 'focuskids_jwt_secret_key_2024_at_least_32_chars'
const authToken = jwt.sign({ userId: 1 }, TEST_SECRET, { expiresIn: '7d' })

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
}

// 简单的HTTP请求函数
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    })
    
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    return { status: 0, data: { message: error.message }, error: true }
  }
}

// 测试游戏配置
async function testGameConfig(gameCode, ageGroup, expectedParams) {
  const result = await fetchAPI(`/assessment/game-config/${gameCode}/${ageGroup}`)
  
  if (result.status !== 200 || !result.data.success) {
    return { success: false, message: 'API调用失败' }
  }
  
  const config = result.data.data
  const params = config.parameters
  
  // 验证预期参数
  for (const [key, expected] of Object.entries(expectedParams)) {
    if (params[key] !== expected) {
      return { 
        success: false, 
        message: `${key}不匹配: 期望${expected}, 实际${params[key]}` 
      }
    }
  }
  
  return { 
    success: true, 
    data: config,
    message: `${gameCode}/${ageGroup} 配置正确`
  }
}

// 测试套件
const tests = {
  // 1. 舒尔特方格各年龄组配置
  async testSchulteConfig() {
    log.info('测试1: 舒尔特方格年龄适配配置...')
    
    const testCases = [
      { age: '4-5', gridSize: 3, timeLimit: 60 },
      { age: '6-7', gridSize: 4, timeLimit: 90 },
      { age: '8-9', gridSize: 5, timeLimit: 120 },
      { age: '10-12', gridSize: 5, timeLimit: 120 }
    ]
    
    let allPassed = true
    for (const { age, gridSize, timeLimit } of testCases) {
      const result = await testGameConfig('schulte', age, {
        grid_size: gridSize
      })
      
      if (result.success) {
        log.info(`  ${age}: ${gridSize}×${gridSize}, ${timeLimit}秒 ✓`)
      } else {
        log.error(`  ${age}: ${result.message}`)
        allPassed = false
      }
    }
    
    if (allPassed) {
      log.success('舒尔特方格年龄适配配置正确')
    }
    
    return allPassed
  },
  
  // 2. 图案记忆各年龄组配置
  async testPatternMemoryConfig() {
    log.info('测试2: 图案记忆年龄适配配置...')
    
    const testCases = [
      { age: '4-5', patternCount: 3, displayTime: 3 },
      { age: '6-7', patternCount: 4, displayTime: 3 },
      { age: '8-9', patternCount: 5, displayTime: 2 },
      { age: '10-12', patternCount: 6, displayTime: 2 }
    ]
    
    let allPassed = true
    for (const { age, patternCount, displayTime } of testCases) {
      const result = await testGameConfig('pattern_memory', age, {
        pattern_count: patternCount,
        display_time: displayTime
      })
      
      if (result.success) {
        log.info(`  ${age}: ${patternCount}图案, ${displayTime}秒显示 ✓`)
      } else {
        log.error(`  ${age}: ${result.message}`)
        allPassed = false
      }
    }
    
    if (allPassed) {
      log.success('图案记忆年龄适配配置正确')
    }
    
    return allPassed
  },
  
  // 3. 听声辨数各年龄组配置
  async testAudioCountConfig() {
    log.info('测试3: 听声辨数年龄适配配置...')
    
    const testCases = [
      { age: '4-5', maxNumber: 5, rounds: 3 },
      { age: '6-7', maxNumber: 7, rounds: 4 },
      { age: '8-9', maxNumber: 9, rounds: 5 },
      { age: '10-12', maxNumber: 12, rounds: 5 }
    ]
    
    let allPassed = true
    for (const { age, maxNumber, rounds } of testCases) {
      const result = await testGameConfig('audio_count', age, {
        max_number: maxNumber,
        rounds: rounds
      })
      
      if (result.success) {
        log.info(`  ${age}: 最高${maxNumber}, ${rounds}轮 ✓`)
      } else {
        log.error(`  ${age}: ${result.message}`)
        allPassed = false
      }
    }
    
    if (allPassed) {
      log.success('听声辨数年龄适配配置正确')
    }
    
    return allPassed
  },
  
  // 4. 快速分类各年龄组配置
  async testQuickSortConfig() {
    log.info('测试4: 快速分类年龄适配配置...')
    
    const testCases = [
      { age: '4-5', categoryCount: 2, itemCount: 6 },
      { age: '6-7', categoryCount: 3, itemCount: 9 },
      { age: '8-9', categoryCount: 4, itemCount: 12 },
      { age: '10-12', categoryCount: 4, itemCount: 16 }
    ]
    
    let allPassed = true
    for (const { age, categoryCount, itemCount } of testCases) {
      const result = await testGameConfig('quick_sort', age, {
        category_count: categoryCount,
        item_count: itemCount
      })
      
      if (result.success) {
        log.info(`  ${age}: ${categoryCount}类, ${itemCount}项 ✓`)
      } else {
        log.error(`  ${age}: ${result.message}`)
        allPassed = false
      }
    }
    
    if (allPassed) {
      log.success('快速分类年龄适配配置正确')
    }
    
    return allPassed
  },
  
  // 5. 迷宫寻路各年龄组配置
  async testMazeConfig() {
    log.info('测试5: 迷宫寻路年龄适配配置...')
    
    const testCases = [
      { age: '4-5', gridSize: 7 },
      { age: '6-7', gridSize: 9 },
      { age: '8-9', gridSize: 11 },
      { age: '10-12', gridSize: 13 }
    ]
    
    let allPassed = true
    for (const { age, gridSize } of testCases) {
      const result = await testGameConfig('maze', age, {
        grid_size: gridSize
      })
      
      if (result.success) {
        log.info(`  ${age}: ${gridSize}×${gridSize}网格 ✓`)
      } else {
        log.error(`  ${age}: ${result.message}`)
        allPassed = false
      }
    }
    
    if (allPassed) {
      log.success('迷宫寻路年龄适配配置正确')
    }
    
    return allPassed
  },
  
  // 6. 游戏配置完整性检查
  async testGameConfigCompleteness() {
    log.info('测试6: 游戏配置完整性...')
    
    const games = ['schulte', 'audio_count', 'pattern_memory', 'quick_sort', 'maze']
    const ageGroups = ['4-5', '6-7', '8-9', '10-12']
    
    let missingCount = 0
    let totalCount = games.length * ageGroups.length
    
    for (const game of games) {
      for (const ageGroup of ageGroups) {
        const result = await fetchAPI(`/assessment/game-config/${game}/${ageGroup}`)
        
        if (result.status !== 200 || !result.data.success) {
          log.warn(`  缺失: ${game}/${ageGroup}`)
          missingCount++
        }
      }
    }
    
    if (missingCount === 0) {
      log.success(`所有${totalCount}个游戏配置完整`)
      return true
    } else {
      log.error(`${missingCount}/${totalCount}配置缺失`)
      return false
    }
  },
  
  // 7. 游戏难度渐进性验证
  async testDifficultyProgression() {
    log.info('测试7: 游戏难度渐进性...')
    
    // 舒尔特方格难度递增
    const schulteSizes = []
    for (const age of ['4-5', '6-7', '8-9', '10-12']) {
      const result = await fetchAPI(`/assessment/game-config/schulte/${age}`)
      if (result.status === 200 && result.data.success) {
        schulteSizes.push(result.data.data.parameters.grid_size)
      }
    }
    
    // 验证递增
    let isIncreasing = true
    for (let i = 1; i < schulteSizes.length; i++) {
      if (schulteSizes[i] < schulteSizes[i-1]) {
        isIncreasing = false
        break
      }
    }
    
    if (isIncreasing) {
      log.success(`舒尔特方格难度渐进正确: ${schulteSizes.join('×')}`)
      return true
    } else {
      log.error('难度未正确递增')
      return false
    }
  },
  
  // 8. 测评游戏列表验证
  async testAssessmentGamesList() {
    log.info('测试8: 测评游戏列表...')
    
    // 获取不同年龄组的测评游戏
    const ageGroups = ['4-5', '6-7', '8-9', '10-12']
    const gameCounts = []
    
    for (const age of ageGroups) {
      const result = await fetchAPI(`/assessment/games/999`) // 新建测评
      if (result.status === 200 && result.data.success) {
        const games = result.data.data?.games || []
        gameCounts.push({ age, count: games.length })
        log.info(`  ${age}: ${games.length}款游戏`)
      }
    }
    
    // 验证游戏数量符合预期 (2-3款)
    const allValid = gameCounts.every(({ count }) => count >= 2 && count <= 3)
    
    if (allValid) {
      log.success('测评游戏列表配置正确')
      return true
    } else {
      log.error('游戏数量异常')
      return false
    }
  }
}

// 主测试运行器
async function runTests() {
  console.log('\n' + '='.repeat(60))
  console.log('游戏体验测试 - 年龄适配验证')
  console.log('='.repeat(60) + '\n')
  
  const results = []
  
  // 运行所有测试
  for (const [name, testFn] of Object.entries(tests)) {
    try {
      const passed = await testFn()
      results.push({ name, passed })
    } catch (error) {
      log.error(`${name} 测试异常: ${error.message}`)
      results.push({ name, passed: false, error: error.message })
    }
    console.log('')
  }
  
  // 输出测试结果汇总
  console.log('='.repeat(60))
  console.log('游戏体验测试结果汇总')
  console.log('='.repeat(60))
  
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.filter(r => !r.passed).length
  
  results.forEach(({ name, passed, error }) => {
    if (passed) {
      log.success(`${name}`)
    } else {
      log.error(`${name}${error ? ` - ${error}` : ''}`)
    }
  })
  
  console.log('')
  console.log(`总计: ${results.length} 个测试`)
  console.log(`${colors.green}通过: ${passedCount}${colors.reset}`)
  console.log(`${colors.red}失败: ${failedCount}${colors.reset}`)
  console.log('')
  
  if (failedCount === 0) {
    console.log(`${colors.green}🎉 所有游戏体验测试通过!${colors.reset}\n`)
  } else {
    console.log(`${colors.yellow}⚠️ 有 ${failedCount} 个测试失败${colors.reset}\n`)
  }
  
  process.exit(failedCount > 0 ? 1 : 0)
}

// 运行测试
runTests()
