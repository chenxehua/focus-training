import { get } from './request'

export interface Achievement {
  id: number
  achievement_code: string
  achievement_name: string
  achievement_type: string
  description: string
  icon_url?: string
  requirement_type: string
  requirement_value: number
  experience_reward: number
  progress: number
  is_unlocked: boolean
  unlocked_at?: string
}

export interface AchievementStats {
  total: number
  unlocked: number
  progress: number
}

export interface LeaderboardEntry {
  rank: number
  child_id: number
  child_name: string
  score: number
  avatar?: string
}

/**
 * 获取成就列表
 */
export function getAchievementList() {
  return get<Achievement[]>('/api/achievement/list')
}

/**
 * 获取儿童成就状态
 */
export function getChildAchievements(childId: number) {
  return get<Achievement[]>(`/api/achievement/child/${childId}`)
}

/**
 * 获取成就统计
 */
export function getAchievementStats(childId: number) {
  return get<AchievementStats>(`/api/achievement/stats/${childId}`)
}

/**
 * 获取游戏排行榜
 */
export function getLeaderboard(gameId: number, limit: number = 20) {
  return get<LeaderboardEntry[]>(`/api/achievement/leaderboard/${gameId}`, { limit })
}