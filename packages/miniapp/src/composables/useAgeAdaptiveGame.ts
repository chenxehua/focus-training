/**
 * 年龄适配游戏配置 Hook
 * 
 * 功能：
 * - 根据年龄组自动获取游戏难度配置
 * - 统一游戏参数
 * - 支持评估模式和训练模式
 */

import { ref, computed, onMounted } from 'vue'
import { getGameConfig } from '@/api/initialAssessment'
import { getGameConfig as getTrainingGameConfig } from '@/api/game'

// 年龄组定义
export type AgeGroup = '4-5' | '6-7' | '8-9' | '10-12'

// 游戏代码
export type GameCode = 'schulte' | 'pattern_memory' | 'audio_count' | 'quick_sort' | 'maze'

// 年龄组到数字的映射
const ageGroupToMinAge: Record<AgeGroup, number> = {
  '4-5': 4,
  '6-7': 6,
  '8-9': 8,
  '10-12': 10,
}

// 从儿童信息推断年龄组
export function inferAgeGroup(birthDate: string | Date): AgeGroup {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const now = new Date()
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  
  if (age < 6) return '4-5'
  if (age < 8) return '6-7'
  if (age < 10) return '8-9'
  return '10-12'
}

// 获取年龄组标签
export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    '4-5': '4-5岁',
    '6-7': '6-7岁',
    '8-9': '8-9岁',
    '10-12': '10-12岁',
  }
  return labels[ageGroup]
}

// 游戏配置接口
export interface GameConfig {
  gameCode: string
  ageGroup: string
  difficultyLevel: number
  parameters: {
    gridSize?: number
    digitCount?: number
    patternCount?: number
    showTime?: number
    timeLimit?: number
    showNumberHints?: boolean
    playInterval?: number
    speed?: 'slow' | 'medium' | 'fast' | 'very_fast'
    hasRepeat?: boolean
    categories?: number
    basketCount?: number
    gridRows?: number
    gridCols?: number
  }
  timeLimit: number
  passThreshold: number
}

// 默认配置
const defaultConfigs: Record<GameCode, Partial<GameConfig>> = {
  schulte: {
    difficultyLevel: 1,
    parameters: {
      gridSize: 5,
      showNumberHints: true,
    },
    timeLimit: 120,
    passThreshold: 50,
  },
  pattern_memory: {
    difficultyLevel: 1,
    parameters: {
      patternCount: 4,
      showTime: 3000,
    },
    timeLimit: 60,
    passThreshold: 3,
  },
  audio_count: {
    difficultyLevel: 1,
    parameters: {
      digitCount: 4,
      playInterval: 1200,
      speed: 'medium',
    },
    timeLimit: 90,
    passThreshold: 3,
  },
  quick_sort: {
    difficultyLevel: 1,
    parameters: {
      categories: 2,
      basketCount: 2,
    },
    timeLimit: 120,
    passThreshold: 7,
  },
  maze: {
    difficultyLevel: 1,
    parameters: {
      gridSize: 9,
      gridRows: 9,
      gridCols: 9,
    },
    timeLimit: 180,
    passThreshold: 50,
  },
}

// Hook 函数
export function useAgeAdaptiveGame(gameCode: GameCode, mode: 'assessment' | 'training' = 'assessment') {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = ref<GameConfig | null>(null)
  
  // 年龄组
  const ageGroup = ref<AgeGroup>('8-9') // 默认值
  
  // 是否加载完成
  const isReady = computed(() => config.value !== null && !loading.value)
  
  // 加载游戏配置
  async function loadConfig(targetAgeGroup?: AgeGroup) {
    if (targetAgeGroup) {
      ageGroup.value = targetAgeGroup
    }
    
    loading.value = true
    error.value = null
    
    try {
      let res
      
      if (mode === 'assessment') {
        // 评估模式：使用评估API
        res = await getGameConfig(gameCode, ageGroup.value)
      } else {
        // 训练模式：使用游戏API
        res = await getTrainingGameConfig(gameCode, ageGroup.value)
      }
      
      if (res.success && res.data) {
        config.value = res.data as GameConfig
      } else {
        // 使用默认配置
        config.value = {
          gameCode,
          ageGroup: ageGroup.value,
          ...defaultConfigs[gameCode],
        } as GameConfig
      }
    } catch (err) {
      console.error(`加载游戏配置失败 [${gameCode}]:`, err)
      error.value = '加载游戏配置失败，使用默认配置'
      // 使用默认配置
      config.value = {
        gameCode,
        ageGroup: ageGroup.value,
        ...defaultConfigs[gameCode],
      } as GameConfig
    } finally {
      loading.value = false
    }
  }
  
  // 更新年龄组
  function setAgeGroup(newAgeGroup: AgeGroup) {
    ageGroup.value = newAgeGroup
    loadConfig(newAgeGroup)
  }
  
  // 便捷的 getters
  const gridSize = computed(() => config.value?.parameters.gridSize || defaultConfigs[gameCode]?.parameters?.gridSize || 5)
  const digitCount = computed(() => config.value?.parameters.digitCount || defaultConfigs[gameCode]?.parameters?.digitCount || 4)
  const patternCount = computed(() => config.value?.parameters.patternCount || defaultConfigs[gameCode]?.parameters?.patternCount || 4)
  const showTime = computed(() => config.value?.parameters.showTime || 3000)
  const showNumberHints = computed(() => config.value?.parameters.showNumberHints ?? true)
  const timeLimit = computed(() => config.value?.timeLimit || (defaultConfigs[gameCode] as any)?.timeLimit || 120)
  const difficultyLevel = computed(() => config.value?.difficultyLevel || 1)
  
  return {
    // 状态
    loading,
    error,
    config,
    ageGroup,
    isReady,
    
    // 方法
    loadConfig,
    setAgeGroup,
    
    // 便捷的 getters
    gridSize,
    digitCount,
    patternCount,
    showTime,
    showNumberHints,
    timeLimit,
    difficultyLevel,
    
    // 工具函数
    inferAgeGroup,
    getAgeGroupLabel,
  }
}

// 导出类型
export type { AgeGroup, GameCode, GameConfig }
