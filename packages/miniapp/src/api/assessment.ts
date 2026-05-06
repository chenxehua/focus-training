import { get } from './request'

export interface AssessmentDimension {
  score: number
  level: string
  levelColor: string
  games: { gameName: string; score: number }[]
}

export interface AssessmentData {
  childId: number
  childName: string
  assessmentDate: string
  ageGroup: string
  dimensions: {
    [key: string]: AssessmentDimension
  }
  overallScore: number
  overallLevel: string
  summary: string
  recommendations: string[]
}

export interface RadarChartPoint {
  name: string
  value: number
  max: number
}

/**
 * 获取儿童7维度评估数据
 * @param childId 儿童ID
 * @param days 统计天数范围，默认30天
 */
export function getDimensionScores(childId: number, days: number = 30) {
  return get<{
    dimensions: { [key: string]: { score: number; games: any[] } }
    overall: number
    summary: string
  }>(`/api/assessment/${childId}/dimensions`, { days })
}

/**
 * 获取专注力评估报告
 * @param childId 儿童ID
 */
export function getAssessmentReport(childId: number) {
  return get<AssessmentData>(`/api/assessment/${childId}/report`)
}

/**
 * 获取历史报告列表
 * @param childId 儿童ID
 * @param type 报告类型：daily/weekly/monthly
 */
export function getReportHistory(childId: number, type: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  return get<{
    list: Array<{
      id: number
      reportDate: string
      avgFocusScore: number
      trainingCount: number
    }>
    total: number
  }>(`/api/assessment/${childId}/history`, { type })
}

// 初始评估 API
export const initialAssessmentApi = {
  getStatus: (childId: number) => get<{ inProgress: boolean; completedCount: number }>(`/api/assessment/${childId}/status`),
  start: (childId: number) => get<{ assessmentId: number }>(`/api/assessment/${childId}/start`),
  getConfig: () => get<Record<string, unknown>>('/api/assessment/config'),
}