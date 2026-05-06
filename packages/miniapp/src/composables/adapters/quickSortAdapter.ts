/**
 * 快速分类游戏配置适配器
 */

import type { AgeGroup } from '../useAgeAdaptiveGame'

export interface QuickSortGameConfig {
  categories: number // 分类数量
  basketCount: number // 篮子数量
  totalItems: number // 总项目数
  timeLimit: number // 时间限制
  itemTypes: 'fruits' | 'animals' | 'colors' | 'numbers' // 项目类型
}

const ageGroupConfigs: Record<AgeGroup, QuickSortGameConfig> = {
  '4-5': {
    categories: 2,
    basketCount: 2,
    totalItems: 8,
    timeLimit: 120,
    itemTypes: 'fruits',
  },
  '6-7': {
    categories: 2,
    basketCount: 2,
    totalItems: 10,
    timeLimit: 90,
    itemTypes: 'fruits',
  },
  '8-9': {
    categories: 3,
    basketCount: 3,
    totalItems: 12,
    timeLimit: 90,
    itemTypes: 'animals',
  },
  '10-12': {
    categories: 4,
    basketCount: 4,
    totalItems: 16,
    timeLimit: 60,
    itemTypes: 'colors',
  },
}

export function adaptQuickSortConfig(apiParams: any, ageGroup: AgeGroup): QuickSortGameConfig {
  if (!apiParams) {
    return ageGroupConfigs[ageGroup]
  }

  return {
    categories: apiParams.categories || ageGroupConfigs[ageGroup].categories,
    basketCount: apiParams.basketCount || ageGroupConfigs[ageGroup].basketCount,
    totalItems: apiParams.totalItems || ageGroupConfigs[ageGroup].totalItems,
    timeLimit: apiParams.timeLimit || ageGroupConfigs[ageGroup].timeLimit,
    itemTypes: apiParams.itemTypes || ageGroupConfigs[ageGroup].itemTypes,
  }
}

export function getQuickSortConfig(ageGroup: AgeGroup): QuickSortGameConfig {
  return ageGroupConfigs[ageGroup]
}
