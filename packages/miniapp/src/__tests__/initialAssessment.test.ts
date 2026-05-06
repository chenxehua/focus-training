/**
 * 初次测评系统页面测试
 * 
 * 测试覆盖：
 * - 评估流程状态机
 * - 年龄分组逻辑
 * - 问卷维度覆盖
 * - 百分位计算
 */

import { describe, it, expect } from 'vitest'

describe('评估流程状态机', () => {
  it('应该正确计算下一步', () => {
    const calculateNextStep = (
      hasAssessment: boolean,
      questionnaireCompleted: boolean,
      gamesCompleted: number,
      totalGames: number,
      reportGenerated: boolean
    ) => {
      if (!hasAssessment) return 'welcome'
      if (!questionnaireCompleted) return 'questionnaire'
      if (gamesCompleted < totalGames) return 'games'
      if (!reportGenerated) return 'report'
      return 'completed'
    }

    expect(calculateNextStep(false, false, 0, 3, false)).toBe('welcome')
    expect(calculateNextStep(true, false, 0, 3, false)).toBe('questionnaire')
    expect(calculateNextStep(true, true, 1, 3, false)).toBe('games')
    expect(calculateNextStep(true, true, 3, 3, false)).toBe('report')
    expect(calculateNextStep(true, true, 3, 3, true)).toBe('completed')
  })

  it('应该正确计算完成率', () => {
    const calculateCompletionRate = (
      questionnaireCompleted: boolean,
      gamesCompleted: number,
      totalGames: number,
      reportGenerated: boolean
    ) => {
      const totalSteps = 3
      let completedSteps = 0
      if (questionnaireCompleted) completedSteps++
      if (gamesCompleted >= totalGames) completedSteps++
      if (reportGenerated) completedSteps++
      return Math.round((completedSteps / totalSteps) * 100)
    }

    expect(calculateCompletionRate(false, 0, 3, false)).toBe(0)
    expect(calculateCompletionRate(true, 0, 3, false)).toBe(33)
    expect(calculateCompletionRate(true, 3, 3, false)).toBe(67)
    expect(calculateCompletionRate(true, 3, 3, true)).toBe(100)
  })
})

describe('年龄分组逻辑', () => {
  it('应该正确判断年龄组', () => {
    const getAgeGroup = (age: number) => {
      if (age >= 4 && age <= 5) return '4-5'
      if (age >= 6 && age <= 7) return '6-7'
      if (age >= 8 && age <= 9) return '8-9'
      return '10-12'
    }

    expect(getAgeGroup(4)).toBe('4-5')
    expect(getAgeGroup(5)).toBe('4-5')
    expect(getAgeGroup(6)).toBe('6-7')
    expect(getAgeGroup(7)).toBe('6-7')
    expect(getAgeGroup(8)).toBe('8-9')
    expect(getAgeGroup(9)).toBe('8-9')
    expect(getAgeGroup(10)).toBe('10-12')
    expect(getAgeGroup(12)).toBe('10-12')
  })
})

describe('问卷维度覆盖', () => {
  it('应该验证所有7个维度都有题目', () => {
    const requiredDimensions = [
      'sustained_attention',
      'selective_attention',
      'divided_attention',
      'attention_shifting',
      'working_memory',
      'impulse_control',
      'reaction_speed',
    ]

    const validateDimensionCoverage = (questions: any[]) => {
      const coveredDimensions = new Set(questions.map((q) => q.dimension))
      return requiredDimensions.every((dim) => coveredDimensions.has(dim))
    }

    const questions = requiredDimensions.map((dim, index) => ({
      id: index + 1,
      dimension: dim,
      content: `题目${index + 1}`,
    }))

    expect(validateDimensionCoverage(questions)).toBe(true)

    const incompleteQuestions = requiredDimensions.slice(0, 5).map((dim, index) => ({
      id: index + 1,
      dimension: dim,
      content: `题目${index + 1}`,
    }))

    expect(validateDimensionCoverage(incompleteQuestions)).toBe(false)
  })

  it('应该支持维度均衡抽取', () => {
    const allQuestions = [
      { id: 1, dimension: 'sustained_attention' },
      { id: 2, dimension: 'sustained_attention' },
      { id: 3, dimension: 'selective_attention' },
      { id: 4, dimension: 'selective_attention' },
      { id: 5, dimension: 'working_memory' },
      { id: 6, dimension: 'working_memory' },
      { id: 7, dimension: 'impulse_control' },
    ]

    const selectQuestions = (questions: any[], count: number) => {
      // 按维度分组
      const byDimension: { [key: string]: any[] } = {}
      questions.forEach((q) => {
        if (!byDimension[q.dimension]) byDimension[q.dimension] = []
        byDimension[q.dimension].push(q)
      })

      const selected: any[] = []
      const dimensions = Object.keys(byDimension)

      // 每个维度至少选1题
      dimensions.forEach((dim) => {
        const dimQuestions = byDimension[dim]
        const randomIndex = Math.floor(Math.random() * dimQuestions.length)
        selected.push(dimQuestions[randomIndex])
      })

      return selected
    }

    const selected = selectQuestions(allQuestions, 5)
    
    // 验证每个维度都有
    const selectedDimensions = new Set(selected.map((q) => q.dimension))
    expect(selectedDimensions.has('sustained_attention')).toBe(true)
    expect(selectedDimensions.has('selective_attention')).toBe(true)
    expect(selectedDimensions.has('working_memory')).toBe(true)
  })
})

describe('百分位计算', () => {
  it('应该正确计算Z分数对应的百分位', () => {
    const calculatePercentile = (score: number, mean: number, stdDev: number) => {
      if (stdDev === 0) return 50
      const zScore = (score - mean) / stdDev

      // 简化的百分位计算
      if (zScore < -2) return 2
      if (zScore > 2) return 98
      if (zScore < 0) return 30 + Math.round((zScore + 2) * 10)
      return 50 + Math.round(zScore * 20)
    }

    expect(calculatePercentile(70, 70, 15)).toBe(50) // 平均分 = 50百分位
    expect(calculatePercentile(85, 70, 15)).toBeGreaterThan(50) // 高于平均
    expect(calculatePercentile(55, 70, 15)).toBeLessThan(50) // 低于平均
  })

  it('应该根据百分位返回正确评级', () => {
    const getRating = (percentile: number) => {
      if (percentile >= 90) return 'excellent'
      if (percentile >= 70) return 'good'
      if (percentile >= 30) return 'normal'
      if (percentile >= 10) return 'concern'
      return 'severe'
    }

    expect(getRating(95)).toBe('excellent')
    expect(getRating(75)).toBe('good')
    expect(getRating(50)).toBe('normal')
    expect(getRating(15)).toBe('concern')
    expect(getRating(5)).toBe('severe')
  })
})

describe('游戏结果评估', () => {
  it('应该正确计算游戏综合分数', () => {
    const calculateGameScore = (
      accuracy: number,
      duration: number,
      targetDuration: number
    ) => {
      // 准确率权重 60%
      const accuracyScore = accuracy * 60

      // 时间效率权重 40%
      const timeEfficiency = Math.max(0, 1 - (duration - targetDuration) / targetDuration)
      const timeScore = timeEfficiency * 40

      return Math.round(accuracyScore + timeScore)
    }

    const perfectScore = calculateGameScore(1.0, 60, 60)
    expect(perfectScore).toBe(100)

    const goodScore = calculateGameScore(0.9, 70, 60)
    expect(goodScore).toBeLessThan(100)
    expect(goodScore).toBeGreaterThan(50)
  })

  it('应该根据年龄组返回正确游戏配置', () => {
    const getGameConfigForAge = (ageGroup: string) => {
      const configs: { [key: string]: any } = {
        '4-5': {
          games: ['schulte', 'pattern_memory', 'rhythm_tap'],
          timeMultiplier: 1.5,
          difficulty: 'easy',
        },
        '6-7': {
          games: ['schulte', 'audio_count', 'visual_tracking'],
          timeMultiplier: 1.2,
          difficulty: 'medium',
        },
        '8-9': {
          games: ['schulte', 'quick_sort', 'auditory_memory'],
          timeMultiplier: 1.0,
          difficulty: 'medium',
        },
        '10-12': {
          games: ['maze', 'quick_sort', 'target_tracking'],
          timeMultiplier: 0.9,
          difficulty: 'hard',
        },
      }
      return configs[ageGroup] || configs['8-9']
    }

    expect(getGameConfigForAge('4-5').difficulty).toBe('easy')
    expect(getGameConfigForAge('6-7').difficulty).toBe('medium')
    expect(getGameConfigForAge('8-9').difficulty).toBe('medium')
    expect(getGameConfigForAge('10-12').difficulty).toBe('hard')
  })
})

describe('报告生成逻辑', () => {
  it('应该正确识别优势和劣势', () => {
    const identifyStrengthsAndWeaknesses = (dimensionPercentiles: { [key: string]: number }) => {
      const strengths: string[] = []
      const weaknesses: string[] = []

      Object.entries(dimensionPercentiles).forEach(([dimension, percentile]) => {
        if (percentile >= 70) {
          strengths.push(dimension)
        } else if (percentile < 50) {
          weaknesses.push(dimension)
        }
      })

      return { strengths, weaknesses }
    }

    const result = identifyStrengthsAndWeaknesses({
      sustained_attention: 75,
      selective_attention: 45,
      working_memory: 82,
      impulse_control: 55,
    })

    expect(result.strengths).toContain('sustained_attention')
    expect(result.strengths).toContain('working_memory')
    expect(result.weaknesses).toContain('selective_attention')
    expect(result.weaknesses).not.toContain('impulse_control')
  })

  it('应该生成个性化训练计划', () => {
    const generateTrainingPlan = (
      ageGroup: string,
      weaknesses: string[]
    ) => {
      const dailyDuration = ageGroup === '4-5' ? 10 : ageGroup === '6-7' ? 15 : 20
      const focusGames = weaknesses.slice(0, 2).map((w) => {
        const gameMap: { [key: string]: string } = {
          sustained_attention: 'schulte',
          selective_attention: 'visual_tracking',
          working_memory: 'pattern_memory',
          impulse_control: 'quick_sort',
          reaction_speed: 'rhythm_tap',
        }
        return gameMap[w] || 'schulte'
      })

      return {
        dailyDuration,
        focusGames,
        weeklySchedule: weaknesses.slice(0, 3),
      }
    }

    const plan = generateTrainingPlan('6-7', [
      'selective_attention',
      'working_memory',
      'impulse_control',
    ])

    expect(plan.dailyDuration).toBe(15)
    expect(plan.focusGames).toContain('visual_tracking')
    expect(plan.focusGames).toContain('pattern_memory')
  })
})
