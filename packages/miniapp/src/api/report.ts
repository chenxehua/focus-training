import { get } from './request'

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

export function getTodayData(childId: number) {
  return get<TodayData>(`/api/report/today/${childId}`)
}

export function getWeeklyReport(childId: number) {
  return get<WeeklyReport>(`/api/report/weekly/${childId}`)
}
