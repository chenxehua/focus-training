/**
 * 听声辨数游戏配置适配器
 * 
 * 功能：
 * - 将API返回的配置转换为游戏配置
 * - 支持不同年龄组的配置差异
 */

import type { AgeGroup } from './useAgeAdaptiveGame'

// 听声辨数游戏的难度配置
export interface AudioCountGameConfig {
  optionCount: number
  minNumber: number
  maxNumber: number
  soundType: 'beep' | 'voice' | 'drum'
  soundInterval: number
  totalQuestions: number
  timeLimit: number
  allowReplay: boolean
  maxReplayCount: number
}

// 年龄组到配置的映射
const ageGroupConfigs: Record<AgeGroup, AudioCountGameConfig> = {
  '4-5': {
    optionCount: 3,
    minNumber: 1,
    maxNumber: 5,
    soundType: 'beep',
    soundInterval: 1000,
    totalQuestions: 6,
    timeLimit: 20,
    allowReplay: true,
    maxReplayCount: 3,
  },
  '6-7': {
    optionCount: 4,
    minNumber: 1,
    maxNumber: 7,
    soundType: 'beep',
    soundInterval: 800,
    totalQuestions: 8,
    timeLimit: 15,
    allowReplay: true,
    maxReplayCount: 2,
  },
  '8-9': {
    optionCount: 4,
    minNumber: 1,
    maxNumber: 9,
    soundType: 'voice',
    soundInterval: 700,
    totalQuestions: 10,
    timeLimit: 12,
    allowReplay: true,
    maxReplayCount: 2,
  },
  '10-12': {
    optionCount: 5,
    minNumber: 2,
    maxNumber: 12,
    soundType: 'voice',
    soundInterval: 600,
    totalQuestions: 10,
    timeLimit: 10,
    allowReplay: true,
    maxReplayCount: 1,
  },
}

// 从API配置转换
export function adaptAudioCountConfig(apiParams: any, ageGroup: AgeGroup): AudioCountGameConfig {
  if (!apiParams) {
    // 使用默认配置
    return ageGroupConfigs[ageGroup]
  }

  // 如果API提供了参数，使用API参数
  return {
    optionCount: apiParams.optionCount || ageGroupConfigs[ageGroup].optionCount,
    minNumber: apiParams.minNumber || ageGroupConfigs[ageGroup].minNumber,
    maxNumber: apiParams.maxNumber || ageGroupConfigs[ageGroup].maxNumber,
    soundType: apiParams.soundType || ageGroupConfigs[ageGroup].soundType,
    soundInterval: apiParams.playInterval || apiParams.soundInterval || ageGroupConfigs[ageGroup].soundInterval,
    totalQuestions: apiParams.totalQuestions || ageGroupConfigs[ageGroup].totalQuestions,
    timeLimit: apiParams.timeLimit || ageGroupConfigs[ageGroup].timeLimit,
    allowReplay: apiParams.hasRepeat !== undefined ? apiParams.hasRepeat : ageGroupConfigs[ageGroup].allowReplay,
    maxReplayCount: apiParams.maxReplayCount || ageGroupConfigs[ageGroup].maxReplayCount,
  }
}

// 获取年龄组的默认配置
export function getAudioCountConfig(ageGroup: AgeGroup): AudioCountGameConfig {
  return ageGroupConfigs[ageGroup]
}

// 推断年龄组
export function inferAudioCountAgeGroup(birthDate: string | Date): AgeGroup {
  const { inferAgeGroup } = require('./useAgeAdaptiveGame')
  return inferAgeGroup(birthDate)
}
