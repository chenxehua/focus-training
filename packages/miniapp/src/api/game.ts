import { get, post } from './request'
import type { TrainingRecord, GameInfo } from '@/store/game'

export interface SubmitRecordParams {
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

export interface GetRecordsParams {
  childId: number
  page?: number
  pageSize?: number
  gameCode?: string
}

export interface RecordListResult {
  list: TrainingRecord[]
  total: number
  page: number
  pageSize: number
}

export function getGameList() {
  return get<GameInfo[]>('/api/game/list')
}

export function submitGameRecord(params: SubmitRecordParams) {
  return post<TrainingRecord>('/api/game/record', params)
}

export function getGameRecords(params: GetRecordsParams) {
  return get<RecordListResult>('/api/game/records', params as unknown as Record<string, unknown>)
}

export function getGameDetail(gameId: number) {
  return get<GameInfo>(`/api/game/${gameId}`)
}

export function getGameConfig(gameCode: string, ageGroup: string) {
  return get<Record<string, unknown>>(`/api/game/config`, { gameCode, ageGroup } as Record<string, unknown>)
}
