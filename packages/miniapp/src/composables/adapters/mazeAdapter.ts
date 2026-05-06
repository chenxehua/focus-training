/**
 * 迷宫寻路游戏配置适配器
 */

import type { AgeGroup } from '../useAgeAdaptiveGame'

export interface MazeGameConfig {
  gridSize: number // 迷宫大小
  gridRows: number // 行数
  gridCols: number // 列数
  hasKey: boolean // 是否有钥匙
  timeLimit: number // 时间限制
  maxSteps: number // 最大步数
}

const ageGroupConfigs: Record<AgeGroup, MazeGameConfig> = {
  '4-5': {
    gridSize: 7,
    gridRows: 7,
    gridCols: 7,
    hasKey: false,
    timeLimit: 180,
    maxSteps: 50,
  },
  '6-7': {
    gridSize: 9,
    gridRows: 9,
    gridCols: 9,
    hasKey: false,
    timeLimit: 150,
    maxSteps: 60,
  },
  '8-9': {
    gridSize: 11,
    gridRows: 11,
    gridCols: 11,
    hasKey: true,
    timeLimit: 120,
    maxSteps: 70,
  },
  '10-12': {
    gridSize: 13,
    gridRows: 13,
    gridCols: 13,
    hasKey: true,
    timeLimit: 90,
    maxSteps: 80,
  },
}

export function adaptMazeConfig(apiParams: any, ageGroup: AgeGroup): MazeGameConfig {
  if (!apiParams) {
    return ageGroupConfigs[ageGroup]
  }

  return {
    gridSize: apiParams.gridSize || ageGroupConfigs[ageGroup].gridSize,
    gridRows: apiParams.gridRows || ageGroupConfigs[ageGroup].gridRows,
    gridCols: apiParams.gridCols || ageGroupConfigs[ageGroup].gridCols,
    hasKey: apiParams.hasKey !== undefined ? apiParams.hasKey : ageGroupConfigs[ageGroup].hasKey,
    timeLimit: apiParams.timeLimit || ageGroupConfigs[ageGroup].timeLimit,
    maxSteps: apiParams.maxSteps || ageGroupConfigs[ageGroup].maxSteps,
  }
}

export function getMazeConfig(ageGroup: AgeGroup): MazeGameConfig {
  return ageGroupConfigs[ageGroup]
}
