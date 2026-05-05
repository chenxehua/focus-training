import { get, post } from './request'

export interface TodayData {
  records: Array<{
    id: number
    childId: number
    gameId: number
    gameName: string
    gameCode: string
    durationSeconds: number
    accuracy: number
    score: number
    focusScore: number
    difficultyLevel: number
    createdAt: string
  }>
  currentStreak: number
  totalTrainingCount: number
  totalDuration: number
  avgFocusScore: number
}

export interface WeeklyReport {
  childId: number
  reportDate: string
  trainingCount: number
  totalDuration: number
  avgFocusScore: number
  trendData: Array<{
    date: string
    trainingCount: number
    duration: number
    focusScore: number
  }>
  highlights: Array<{
    type: string
    title: string
    description: string
    value: number
  }>
  gameBreakdown: Array<{
    gameCode: string
    gameName: string
    count: number
    avgScore: number
  }>
}

// 评估报告类型
export interface FocusReport {
  id: number
  childId: number
  reportType: 'daily' | 'weekly' | 'monthly'
  overallScore: number
  attentionScore: number
  perceptionScore: number
  memoryScore: number
  reactionScore: number
  meditationScore: number
  observationScore: number
  calculationScore: number
  summary: string
  suggestions: string
  createdAt: string
}

// 报告列表项
export interface ReportListItem {
  id: number
  childId: number
  childName: string
  reportType: 'daily' | 'weekly' | 'monthly'
  overallScore: number
  summary: string
  createdAt: string
}

export function getTodayData(childId: number) {
  return get<TodayData>(`/api/report/today/${childId}`)
}

export function getWeeklyReport(childId: number) {
  return get<WeeklyReport>(`/api/report/weekly/${childId}`)
}

// 获取报告列表
export function getReportList(params: { childId?: number; page?: number; pageSize?: number }) {
  return get<{ list: ReportListItem[]; total: number }>('/api/report/list', params)
}

// 获取报告详情
export function getReportDetail(reportId: number) {
  return get<FocusReport>(`/api/report/${reportId}`)
}

// 生成报告
export function generateReport(childId: number, reportType: 'daily' | 'weekly' = 'daily') {
  return post<FocusReport>('/api/report/generate', { childId, reportType })
}
