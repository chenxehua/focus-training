import { get, post } from './request'

/**
 * 初次测评系统 API
 * 
 * 功能：
 * - 测评状态管理
 * - 问卷获取与提交
 * - 游戏测评与结果
 * - 报告生成
 */

// ==================== 类型定义 ====================

// 测评状态
export interface AssessmentStatus {
  childId: number
  hasCompletedInitial: boolean
  lastAssessmentDate: string | null
  completionRate: number
  stages: {
    questionnaire: {
      completed: boolean
      answers: number
    }
    gameTesting: {
      completed: boolean
      completedGames: number
      totalGames: number
    }
    report: {
      generated: boolean
      reportId?: number
    }
  }
  nextStep: 'questionnaire' | 'games' | 'report' | null
  assessmentId?: number
}

// 问卷题目
export interface QuestionnaireQuestion {
  id: number
  dimension: string
  dimensionName: string
  questionText: string
  options: {
    value: number
    text: string
  }[]
}

// 测评游戏
export interface AssessmentGame {
  id: number
  gameCode: string
  gameName: string
  gameIcon: string
  description: string
  duration: number
  difficultyLevel: number
  difficultyName: string
}

// 游戏难度配置
export interface GameConfig {
  gameCode: string
  ageGroup: string
  difficultyLevel: number
  parameters: {
    gridSize?: number
    digitCount?: number
    patternCount?: number
    timeLimit?: number
    showNumberHints?: boolean
    playInterval?: number
    speed?: string
  }
  timeLimit: number
  passThreshold: number
}

// 百分位常模
export interface PercentileNorm {
  dimension: string
  ageGroup: string
  mean: number
  stdDev: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

// 维度评分
export interface DimensionScore {
  dimension: string
  dimensionName: string
  score: number
  percentile: number
  rating: string
  level: string
  analysis: string
  games: {
    gameName: string
    score: number
    percentile: number
  }[]
}

// 测评报告
export interface AssessmentReport {
  id: number
  assessmentId: number
  childId: number
  childName: string
  assessmentDate: string
  ageGroup: string
  
  // 综合评估
  overallScore: number
  overallPercentile: number
  overallRating: string
  overallLevel: string
  summary: string
  
  // 问卷总分和游戏总分
  questionnaireTotalScore: number
  gameTotalScore: number
  
  // 7维度详细分析
  dimensions: DimensionScore[]
  
  // 优势与建议
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  
  // 训练建议
  trainingRecommendations: {
    priority: number
    dimension: string
    dimensionName: string
    gameCode: string
    gameName: string
    reason: string
  }[]
  
  // 原始数据引用
  questionnaireAnswersCount: number
  gamesCompleted: number
  actualDuration: number
}

// 游戏结果
export interface GameResult {
  score: number
  accuracy: number
  duration: number
  focusScore?: number
  rawData?: Record<string, unknown>
  startedAt?: string
}

// 游戏结果提交响应
export interface GameResultResponse {
  saved: boolean
  performance: {
    score: number
    accuracy: number
    percentile: number
    rating: string
  }
  nextGame: string | null
  progress: {
    completed: number
    total: number
  }
  allCompleted: boolean
}

// ==================== API 函数 ====================

/**
 * 获取儿童测评状态
 * @param childId 儿童ID
 */
export function getAssessmentStatus(childId: number) {
  return get<AssessmentStatus>(`/api/assessment/status/${childId}`)
}

/**
 * 开始新测评
 * @param childId 儿童ID
 */
export function startAssessment(childId: number) {
  return post<{ assessmentId: number; assessmentNo: string }>('/api/assessment/start', { childId })
}

/**
 * 获取问卷题目（从80题库随机抽取5-7道）
 * @param assessmentId 测评ID
 */
export function getQuestionnaire(assessmentId: number) {
  return get<{
    assessmentId: number
    totalQuestions: number
    questions: QuestionnaireQuestion[]
    timeLimit: number
    progress: {
      current: number
      total: number
    }
  }>(`/api/assessment/questionnaire/${assessmentId}`)
}

/**
 * 提交问卷答案
 * @param assessmentId 测评ID
 * @param answers 答案数组 [{questionId, dimension, score}]
 */
export function submitQuestionnaire(assessmentId: number, answers: Array<{ questionId: number; dimension: string; score: number }>) {
  return post<{
    saved: boolean
    answersCount: number
    totalQuestions: number
    progress: number
  }>(`/api/assessment/questionnaire/${assessmentId}`, { answers })
}

/**
 * 获取测评游戏列表
 * @param assessmentId 测评ID
 */
export function getAssessmentGames(assessmentId: number) {
  return get<{
    assessmentId: number
    ageGroup: string
    games: AssessmentGame[]
    totalGames: number
    completedGames: number
  }>(`/api/assessment/games/${assessmentId}`)
}

/**
 * 获取游戏难度配置
 * @param gameCode 游戏代码
 * @param ageGroup 年龄组
 */
export function getGameConfig(gameCode: string, ageGroup: string) {
  return get<GameConfig>(`/api/assessment/game-config/${gameCode}/${ageGroup}`)
}

/**
 * 提交游戏测评结果
 * @param assessmentId 测评ID
 * @param gameId 游戏代码
 * @param result 游戏结果
 */
export function submitGameResult(assessmentId: number, gameId: string, result: GameResult) {
  return post<GameResultResponse>(`/api/assessment/games/${assessmentId}`, { gameId, result })
}

/**
 * 生成测评报告
 * @param assessmentId 测评ID
 */
export function generateReport(assessmentId: number) {
  return post<{
    success: boolean
    reportId: number
  }>(`/api/assessment/generate-report/${assessmentId}`)
}

/**
 * 获取测评报告详情
 * @param reportId 报告ID
 */
export function getReport(reportId: number) {
  return get<AssessmentReport>(`/api/assessment/report/${reportId}`)
}

/**
 * 获取儿童测评报告列表
 * @param childId 儿童ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getReportList(childId: number, page: number = 1, pageSize: number = 10) {
  return get<{
    list: Array<{
      id: number
      assessmentDate: string
      ageGroup: string
      overallScore: number
      overallRating: string
    }>
    total: number
    page: number
    pageSize: number
  }>(`/api/assessment/report/child/${childId}/list`, { page, pageSize })
}

/**
 * 获取百分位常模
 * @param dimension 维度代码
 * @param ageGroup 年龄组
 */
export function getNorm(dimension: string, ageGroup: string) {
  return get<PercentileNorm>(`/api/assessment/norm/${dimension}/${ageGroup}`)
}

/**
 * 获取多个维度的常模
 * @param dimensions 维度代码数组
 * @param ageGroup 年龄组
 */
export function getNorms(dimensions: string[], ageGroup: string) {
  return get<PercentileNorm[]>(`/api/assessment/norms/${ageGroup}`)
}