/**
 * AI推荐引擎API
 * 
 * 提供个性化训练推荐和周计划
 */

import { get, post } from './request'

export interface UserProfile {
  childId: number
  ageGroup: string
  dimensionScores: { [key: string]: number }
  preferredCategories: string[]
  trainingHistory: {
    gameId: number
    count: number
    avgScore: number
    lastPlayed: string
  }[]
  weaknessDimensions: string[]
  strengthDimensions: string[]
}

export interface GameRecommendation {
  gameId: number
  gameCode: string
  gameName: string
  reason: string
  priority: number
  expectedImprovement: string
}

export interface DailyPlan {
  day: number
  games: { gameCode: string; rounds: number }[]
}

export interface WeeklyPlan {
  dailyPlan: DailyPlan[]
  totalMinutes: number
  focusAdvice: string
}

export interface DifficultySuggestion {
  recommendedLevel: number
  reason: string
  shouldIncrease: boolean
  shouldDecrease: boolean
}

/**
 * 获取用户画像
 * @param childId 儿童ID
 */
export function getUserProfile(childId: number): Promise<{ data: UserProfile }> {
  return get(`/api/recommendation/profile/${childId}`)
}

/**
 * 获取推荐游戏列表
 * @param childId 儿童ID
 * @param limit 推荐数量，默认3
 */
export function getRecommendations(childId: number, limit?: number): Promise<{
  data: {
    recommendations: GameRecommendation[]
    generated_at: string
  }
}> {
  return get(`/api/recommendation/${childId}${limit ? `?limit=${limit}` : ''}`)
}

/**
 * 获取周训练计划
 * @param childId 儿童ID
 */
export function getWeeklyPlan(childId: number): Promise<{
  data: {
    plan: WeeklyPlan
    generated_at: string
  }
}> {
  return get(`/api/recommendation/weekly-plan/${childId}`)
}

/**
 * 获取难度建议
 * @param childId 儿童ID
 * @param gameId 游戏ID
 * @param recentScores 最近得分列表
 */
export function getDifficultySuggestion(
  childId: number,
  gameId: number,
  recentScores: number[]
): Promise<{ data: DifficultySuggestion }> {
  return post(`/api/recommendation/difficulty/${childId}/${gameId}`, {
    recentScores
  })
}

/**
 * 记录推荐反馈
 * @param childId 儿童ID
 * @param gameId 游戏ID
 * @param action 点击/忽略
 */
export function recordRecommendationFeedback(
  childId: number,
  gameId: number,
  action: 'click' | 'ignore'
): Promise<void> {
  return post('/api/recommendation/feedback', {
    childId,
    gameId,
    action,
    timestamp: new Date().toISOString()
  })
}