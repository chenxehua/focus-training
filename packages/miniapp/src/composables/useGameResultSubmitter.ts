/**
 * 游戏结果提交 Hook
 * 
 * 功能：
 * - 统一游戏结果格式
 * - 支持评估模式和训练模式
 * - 自动计算百分位和评分
 */

import { ref } from 'vue'
import { submitGameRecord } from '@/api/game'
import { submitGameResult as submitAssessmentGameResult } from '@/api/initialAssessment'

// 游戏结果基础格式
export interface GameResult {
  score: number
  accuracy: number
  duration: number
  focusScore?: number
  gameConfig?: Record<string, any>
  rawData?: Record<string, any>
}

// 评估模式下的结果响应
export interface AssessmentResultResponse {
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

// 游戏代码类型
export type GameCode = 'schulte' | 'pattern_memory' | 'audio_count' | 'quick_sort' | 'maze'

/**
 * 使用游戏结果提交器
 */
export function useGameResultSubmitter() {
  const submitting = ref(false)
  const error = ref<string | null>(null)

  /**
   * 提交训练模式游戏结果
   */
  async function submitTrainingResult(
    childId: number,
    gameId: number,
    result: GameResult
  ): Promise<boolean> {
    submitting.value = true
    error.value = null

    try {
      const res = await submitGameRecord({
        childId,
        gameId,
        durationSeconds: Math.max(1, result.duration),
        accuracy: Math.min(1, Math.max(0, result.accuracy)),
        score: result.score,
        focusScore: result.focusScore || result.score,
        difficultyLevel: 1,
        gameConfig: result.gameConfig || {},
        resultData: result.rawData || {},
      })

      return res.success
    } catch (err) {
      console.error('提交训练结果失败:', err)
      error.value = '提交结果失败'
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * 提交评估模式游戏结果
   */
  async function submitAssessmentResult(
    assessmentId: number,
    gameCode: GameCode,
    result: GameResult
  ): Promise<AssessmentResultResponse | null> {
    submitting.value = true
    error.value = null

    try {
      const res = await submitAssessmentGameResult(assessmentId, gameCode, result)

      if (res.success) {
        return res.data
      } else {
        throw new Error(res.message || '提交结果失败')
      }
    } catch (err) {
      console.error('提交评估结果失败:', err)
      error.value = '提交结果失败'
      return null
    } finally {
      submitting.value = false
    }
  }

  /**
   * 统一的结果提交函数
   */
  async function submitResult(
    mode: 'training' | 'assessment',
    params: {
      // 训练模式参数
      childId?: number
      gameId?: number
      // 评估模式参数
      assessmentId?: number
      gameCode?: GameCode
    },
    result: GameResult
  ): Promise<any> {
    if (mode === 'assessment') {
      if (!params.assessmentId || !params.gameCode) {
        throw new Error('评估模式需要assessmentId和gameCode')
      }
      return submitAssessmentResult(params.assessmentId, params.gameCode, result)
    } else {
      if (!params.childId || !params.gameId) {
        throw new Error('训练模式需要childId和gameId')
      }
      const success = await submitTrainingResult(params.childId, params.gameId, result)
      return { success }
    }
  }

  /**
   * 计算游戏评分
   */
  function calculateScore(params: {
    baseScore: number
    maxScore: number
    timeLimit?: number
    elapsed?: number
    errors?: number
    errorPenalty?: number
    timeBonus?: number
    timeWeight?: number
    accuracyWeight?: number
  }): { score: number; focusScore: number } {
    const {
      baseScore,
      maxScore,
      timeLimit = 0,
      elapsed = 0,
      errors = 0,
      errorPenalty = 5,
      timeBonus = 50,
      timeWeight = 0.4,
      accuracyWeight = 0.6,
    } = params

    // 基础分
    const normalizedScore = Math.min(1, baseScore / maxScore) * 100

    // 时间奖励
    let timeBonusScore = 0
    if (timeLimit > 0 && elapsed > 0) {
      const timeEfficiency = Math.max(0, Math.min(1, (timeLimit - elapsed) / timeLimit))
      timeBonusScore = timeEfficiency * timeBonus
    }

    // 错误惩罚
    const errorPenaltyScore = errors * errorPenalty

    // 最终得分
    const score = Math.max(0, Math.round(normalizedScore + timeBonusScore - errorPenaltyScore))

    // 专注分
    const accuracy = Math.max(0, Math.min(100, normalizedScore))
    const timeEfficiency = timeLimit > 0
      ? Math.max(0, Math.min(100, ((timeLimit - elapsed) / timeLimit) * 100))
      : 100
    const focusScore = Math.round(accuracy * accuracyWeight + timeEfficiency * timeWeight)

    return { score, focusScore }
  }

  return {
    submitting,
    error,
    submitTrainingResult,
    submitAssessmentResult,
    submitResult,
    calculateScore,
  }
}

// 导出类型
export type { GameResult, AssessmentResultResponse }
