/**
 * AI推荐引擎服务
 * 
 * 基于用户画像和训练数据，提供个性化游戏推荐
 */

import { TrainingRecordModel, ChildModel, GameModel } from '../models'
import { query } from '../config/database'

interface UserProfile {
  childId: number
  ageGroup: string
  dimensionScores: {
    [key: string]: number
  }
  preferredCategories: string[]
  trainingHistory: {
    gameId: number
    count: number
    avgScore: number
    lastPlayed: Date
  }[]
  weaknessDimensions: string[]
  strengthDimensions: string[]
}

interface Recommendation {
  gameId: number
  gameCode: string
  gameName: string
  reason: string
  priority: number
  expectedImprovement: string
}

export class RecommendationService {
  /**
   * 生成用户画像
   */
  static async buildUserProfile(childId: number): Promise<UserProfile> {
    const child = await ChildModel.findById(childId)
    if (!child) {
      throw new Error('儿童不存在')
    }

    // 获取最近30天的训练记录
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const records = await query<{
      game_id: number
      score: number
      accuracy: number
      focus_score: number
      created_at: Date
    }>(
      `SELECT game_id, score, accuracy, focus_score, created_at 
       FROM training_record 
       WHERE child_id = ? AND created_at >= ?
       ORDER BY created_at DESC`,
      [childId, startDate]
    )

    // 计算各维度得分
    const dimensionScores = this.calculateDimensionScores(records)

    // 统计游戏偏好
    const gameStats = this.aggregateGameStats(records)

    // 确定强弱项
    const { weaknessDimensions, strengthDimensions } = this.identifyStrengthWeakness(dimensionScores)

    // 分类偏好
    const games = await GameModel.findAll()
    const gameCategoryMap = new Map(games.map(g => [g.id, g.category || 'unknown']))
    const preferredCategories = this.aggregatePreferredCategories(gameStats, gameCategoryMap)

    return {
      childId,
      ageGroup: child.age_group || '4-6',
      dimensionScores,
      preferredCategories,
      trainingHistory: gameStats,
      weaknessDimensions,
      strengthDimensions
    }
  }

  /**
   * 获取推荐游戏列表
   */
  static async getRecommendations(childId: number, limit: number = 3): Promise<Recommendation[]> {
    const profile = await this.buildUserProfile(childId)
    const allGames = await GameModel.findAll()

    // 根据用户画像计算每个游戏的推荐分数
    const scoredGames = await Promise.all(allGames.map(async (game) => {
      let score = 50 // 基础分
      let reason = ''

      // 1. 优先推荐训练弱项维度的游戏
      const relevantDimensions = this.getRelevantDimensions(game.game_code)
      const weaknessMatch = relevantDimensions.filter(d => profile.weaknessDimensions.includes(d))
      if (weaknessMatch.length > 0) {
        score += 30
        reason = `针对${weaknessMatch.join('、')}能力的训练`
      }

      // 2. 避免推荐已经过度训练的游戏
      const gameHistory = profile.trainingHistory.find(h => h.gameId === game.id)
      if (gameHistory) {
        const trainingFrequency = gameHistory.count
        if (trainingFrequency > 10) {
          score -= 20 // 降低频繁训练游戏的分数
        } else if (trainingFrequency < 3) {
          score += 10 // 轻微提升新游戏
        }
      }

      // 3. 根据年龄组调整
      const gameAgeRange = this.getGameAgeRange(game as any)
      if (profile.ageGroup === '4-6' && gameAgeRange.maxAge < 7) {
        score += 15
      } else if (profile.ageGroup === '10-12' && gameAgeRange.minAge > 9) {
        score += 15
      }

      // 4. VIP限制
      if ((game as any).requires_vip && !await this.hasVipAccess(childId)) {
        score -= 40
      }

      // 5. 提升用户偏好类别的游戏
      if (profile.preferredCategories.includes((game as any).category || '')) {
        score += 10
      }

      return {
        gameId: game.id,
        gameCode: game.game_code,
        gameName: game.game_name,
        score: Math.max(0, Math.min(100, score)),
        reason,
        priority: 0,
        expectedImprovement: this.generateImprovementDescription(relevantDimensions, profile.weaknessDimensions)
      }
    }))

    // 排序并返回top N
    scoredGames.sort((a, b) => b.score - a.score)
    
    return scoredGames.slice(0, limit).map((g, index) => ({
      ...g,
      priority: index + 1
    }))
  }

  /**
   * 计算周训练计划
   */
  static async generateWeeklyPlan(childId: number): Promise<{
    dailyPlan: { day: number; games: { gameCode: string; rounds: number }[] }[]
    totalMinutes: number
    focusAdvice: string
  }> {
    const recommendations = await this.getRecommendations(childId, 5)
    
    // 生成每日计划
    const dailyPlan = []
    const today = new Date()
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() + day)
      
      // 每天安排2-3个游戏，每个游戏1-2轮
      const dayGames = []
      
      if (recommendations.length > 0) {
        // 主游戏 (针对弱项)
        dayGames.push({
          gameCode: recommendations[0].gameCode,
          rounds: day % 3 === 0 ? 2 : 1 // 每3天做2轮
        })
        
        // 次要游戏 (轮换)
        if (recommendations.length > 1 && day % 2 === 0) {
          dayGames.push({
            gameCode: recommendations[day % recommendations.length].gameCode,
            rounds: 1
          })
        }
      }
      
      dailyPlan.push({
        day: date.getDay(),
        games: dayGames
      })
    }

    const totalMinutes = dailyPlan.reduce((sum, day) => {
      return sum + day.games.reduce((s, g) => s + g.rounds * 5, 0)
    }, 0)

    return {
      dailyPlan,
      totalMinutes,
      focusAdvice: this.generateFocusAdvice(recommendations)
    }
  }

  /**
   * 自适应难度调整
   */
  static async adjustDifficulty(childId: number, gameId: number, recentScores: number[]): Promise<{
    recommendedLevel: number
    reason: string
    shouldIncrease: boolean
    shouldDecrease: boolean
  }> {
    if (recentScores.length < 3) {
      return {
        recommendedLevel: 1,
        reason: '数据不足，保持当前难度',
        shouldIncrease: false,
        shouldDecrease: false
      }
    }

    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const latestScore = recentScores[recentScores.length - 1]
    
    let recommendedLevel = 1
    let shouldIncrease = false
    let shouldDecrease = false
    let reason = ''

    // 连续高分，提升难度
    if (recentScores.slice(-3).every(s => s >= 85)) {
      shouldIncrease = true
      recommendedLevel = Math.min(5, 2) // 假设当前是1-5级
      reason = '连续3次高分，建议提升难度挑战'
    }
    // 连续低分，降低难度
    else if (recentScores.slice(-3).every(s => s < 60)) {
      shouldDecrease = true
      recommendedLevel = Math.max(1, 1) // 降低一级
      reason = '连续低分，建议降低难度打好基础'
    }
    // 波动较大，保持
    else if (this.calculateVariance(recentScores.slice(-5)) > 400) {
      reason = '成绩波动较大，保持当前难度稳定发挥'
    }
    // 正常波动范围
    else {
      reason = '表现稳定，继续保持'
    }

    return {
      recommendedLevel,
      reason,
      shouldIncrease,
      shouldDecrease
    }
  }

  // ==================== 私有辅助方法 ====================

  private static calculateDimensionScores(records: { game_id: number; score: number; accuracy: number; focus_score: number }[]): { [key: string]: number } {
    const dimensionMap: { [gameCode: string]: string[] } = {
      'schulte': ['sustained_attention', 'reaction_speed'],
      'audio_count': ['auditory_memory', 'working_memory'],
      'pattern_memory': ['working_memory', 'selective_attention'],
      'visual_tracking': ['selective_attention', 'divided_attention'],
      'rhythm_tap': ['reaction_speed', 'impulse_control'],
      'auditory_memory': ['auditory_memory', 'shifting_attention'],
      'maze_navigation': ['sustained_attention', 'spatial_cognition'],
      'quick_sort': ['shifting_attention', 'impulse_control'],
      'target_tracking': ['selective_attention', 'divided_attention']
    }

    const scores: { [dimension: string]: number[] } = {}
    
    records.forEach(record => {
      // 这里需要根据 game_id 找到 game_code，实际使用中需要联表查询
      // 简化处理，使用固定映射
      const dimensions = ['sustained_attention', 'selective_attention', 'working_memory']
      dimensions.forEach(d => {
        if (!scores[d]) scores[d] = []
        scores[d].push(Number(record.focus_score))
      })
    })

    const result: { [key: string]: number } = {}
    Object.entries(scores).forEach(([dim, arr]) => {
      result[dim] = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
    })

    return result
  }

  private static aggregateGameStats(records: { game_id: number; score: number; created_at: Date }[]): { gameId: number; count: number; avgScore: number; lastPlayed: Date }[] {
    const stats = new Map<number, { count: number; totalScore: number; lastPlayed: Date }>()
    
    records.forEach(r => {
      const existing = stats.get(r.game_id)
      if (existing) {
        existing.count++
        existing.totalScore += Number(r.score)
        if (new Date(r.created_at) > existing.lastPlayed) {
          existing.lastPlayed = new Date(r.created_at)
        }
      } else {
        stats.set(r.game_id, {
          count: 1,
          totalScore: Number(r.score),
          lastPlayed: new Date(r.created_at)
        })
      }
    })

    return Array.from(stats.entries()).map(([gameId, data]) => ({
      gameId,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      lastPlayed: data.lastPlayed
    }))
  }

  private static identifyStrengthWeakness(dimensionScores: { [key: string]: number }): { weaknessDimensions: string[]; strengthDimensions: string[] } {
    const entries = Object.entries(dimensionScores)
    const sorted = entries.sort((a, b) => a[1] - b[1])
    
    return {
      weaknessDimensions: sorted.slice(0, 2).map(e => e[0]),
      strengthDimensions: sorted.slice(-2).map(e => e[0])
    }
  }

  private static aggregatePreferredCategories(
    gameStats: { gameId: number; count: number }[],
    categoryMap: Map<number, string>
  ): string[] {
    const categoryCount: { [cat: string]: number } = {}
    
    gameStats.forEach(gs => {
      const cat = categoryMap.get(gs.gameId) || 'unknown'
      categoryCount[cat] = (categoryCount[cat] || 0) + gs.count
    })

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0])
  }

  private static getRelevantDimensions(gameCode: string): string[] {
    const dimensionMap: { [key: string]: string[] } = {
      'schulte': ['sustained_attention', 'reaction_speed'],
      'audio_count': ['auditory_memory', 'working_memory'],
      'pattern_memory': ['working_memory', 'selective_attention'],
      'visual_tracking': ['selective_attention', 'divided_attention'],
      'rhythm_tap': ['reaction_speed', 'impulse_control'],
      'auditory_memory': ['auditory_memory', 'shifting_attention'],
      'maze_navigation': ['sustained_attention', 'spatial_cognition'],
      'quick_sort': ['shifting_attention', 'impulse_control'],
      'target_tracking': ['selective_attention', 'divided_attention']
    }
    return dimensionMap[gameCode] || []
  }

  private static generateImprovementDescription(relevantDimensions: string[], weaknessDimensions: string[]): string {
    const matched = relevantDimensions.filter(d => weaknessDimensions.includes(d))
    if (matched.length > 0) {
      return `有助于提升${matched[0]}能力`
    }
    return '综合训练多个维度'
  }

  private static async hasVipAccess(childId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM child_membership cm 
       JOIN membership m ON cm.membership_id = m.id 
       WHERE cm.child_id = ? AND cm.status = 1 AND cm.end_date >= CURDATE()
       AND m.tier != 'free' LIMIT 1`,
      [childId]
    )
    return result.length > 0
  }

  private static generateFocusAdvice(recommendations: Recommendation[]): string {
    if (recommendations.length === 0) {
      return '建议从舒尔特方格开始训练，打好基础'
    }
    const topGame = recommendations[0]
    return `本周建议重点关注${topGame.gameName}，${topGame.reason}`
  }

  private static calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length
  }

  private static getGameAgeRange(game: { min_age?: number; max_age?: number }): { minAge: number; maxAge: number } {
    // 解析 min_age / max_age
    return {
      minAge: game.min_age ?? 4,
      maxAge: game.max_age ?? 12
    }
  }
}

export default RecommendationService