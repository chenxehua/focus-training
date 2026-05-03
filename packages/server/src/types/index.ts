import { Request, Response } from 'express'

// ============================================================
// 通用响应类型
// ============================================================
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 0, message, data }
}

export function errorResponse(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null }
}

// ============================================================
// 用户相关
// ============================================================
export interface JwtPayload {
  userId: number
  iat?: number
  exp?: number
}

export interface AuthRequest extends Request {
  userId?: number
}

// ============================================================
// 数据库行类型
// ============================================================
export interface DbUser {
  id: number
  openid: string
  phone: string | null
  nickname: string | null
  avatar: string | null
  role: 'parent' | 'admin'
  status: 'active' | 'banned'
  created_at: Date
  updated_at: Date
}

export interface DbChild {
  id: number
  name: string
  age: number
  gender: 'male' | 'female'
  avatar: string | null
  age_group: '4-6' | '7-9' | '10-12'
  level: number
  experience: number
  created_at: Date
  updated_at: Date
}

export interface DbGame {
  id: number
  game_code: string
  game_name: string
  game_type: string
  icon_url: string | null
  difficulty_levels: number
  target_age_group: string
  description: string | null
  is_free: boolean
  requires_vip?: boolean
  category?: string
  status: 'active' | 'inactive'
}

export interface DbTrainingRecord {
  id: number
  child_id: number
  game_id: number
  duration_seconds: number
  accuracy: number
  score: number
  focus_score: number
  difficulty_level: number
  game_config: string | null
  result_data: string | null
  created_at: Date
}

export interface DbFocusReport {
  id: number
  child_id: number
  report_type: 'daily' | 'weekly'
  report_date: string
  training_count: number
  total_duration: number
  avg_focus_score: number
  trend_data: string | null
  highlights: string | null
  created_at: Date
  updated_at: Date
}

export interface DbAchievement {
  id: number
  child_id: number
  achievement_code: string
  progress: number
  unlocked_at: Date | null
  created_at: Date
}

// ============================================================
// 请求 Body 类型
// ============================================================
export interface WxLoginBody {
  code: string
}

export interface AddChildBody {
  name: string
  age: number
  gender: 'male' | 'female'
  ageGroup: '4-6' | '7-9' | '10-12'
}

export interface SubmitRecordBody {
  childId: number
  gameId: number
  durationSeconds: number
  accuracy: number
  score: number
  focusScore: number
  difficultyLevel: number
  gameConfig?: Record<string, unknown>
  resultData?: Record<string, unknown>
}

export interface UpdateUserBody {
  nickname?: string
  avatar?: string
  phone?: string
}

// ============================================================
// 数据库模块接口
// ============================================================
export interface DatabaseModule {
  query<T = Record<string, unknown>>(sql: string, values?: any[]): Promise<T[]>
  queryOne<T = Record<string, unknown>>(sql: string, values?: any[]): Promise<T | null>
  execute(sql: string, values?: any[]): Promise<{ affectedRows: number }>
}

// 扩展 global 类型
declare global {
  // eslint-disable-next-line no-var
  var db: DatabaseModule
}