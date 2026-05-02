/**
 * 评估系统控制器
 * 
 * 7维度评估模型：
 * 1. 持续注意力 - 舒尔特方格、迷宫寻路
 * 2. 选择性注意力 - 追踪目标、视觉追踪
 * 3. 分配注意力 - 节奏点击、追踪目标
 * 4. 转移注意力 - 快速分类、听觉记忆
 * 5. 工作记忆 - 图案记忆、听觉记忆
 * 6. 冲动控制 - 快速分类、追踪目标
 * 7. 反应速度 - 舒尔特方格、节奏点击
 */

import { Request, Response } from 'express'
import { query, queryOne } from '../config/database'
import { TrainingRecordModel, ChildModel, GameModel } from '../models'

interface AuthRequest extends Request {
  userId?: number
}

// 维度与游戏的映射
const DIMENSION_GAME_MAP: { [key: string]: string[] } = {
  'sustained_attention': ['schulte', 'maze'],           // 持续注意力
  'selective_attention': ['target_tracking', 'visual_tracking'], // 选择性注意力
  'divided_attention': ['rhythm', 'target_tracking'],   // 分配注意力
  'shifting_attention': ['sort', 'auditory_memory'],     // 转移注意力
  'working_memory': ['pattern_memory', 'auditory_memory'], // 工作记忆
  'impulse_control': ['sort', 'target_tracking'],       // 冲动控制
  'reaction_speed': ['schulte', 'rhythm']               // 反应速度
}

export class AssessmentController {
  /**
   * 获取儿童7维度评估数据
   */
  static async getDimensionScores(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)
      const days = parseInt(req.query.days as string) || 30

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const dimensions: { [key: string]: { score: number; games: { game_id: number; score: number }[] } } = {}

      // 计算每个维度的得分
      for (const [dimension, gameCodes] of Object.entries(DIMENSION_GAME_MAP)) {
        // 获取相关游戏的最近训练记录
        const placeholders = gameCodes.map(() => '?').join(',')
        const records = await query<{
          game_id: number
          score: number
          accuracy: number
          focus_score: number
        }>(
          `SELECT game_id, score, accuracy, focus_score FROM training_record 
           WHERE child_id = ? AND created_at >= ? AND game_id IN (
             SELECT id FROM game WHERE game_code IN (${placeholders})
           ) ORDER BY created_at DESC LIMIT 10`,
          [childId, startDate, ...gameCodes]
        )

        if (records.length > 0) {
          // 计算综合得分
          const scores = records.map(r => {
            // 综合评分 = 准确率 * 0.4 + 专注度 * 0.3 + 效率 * 0.3
            const accuracyScore = Number(r.accuracy) * 100
            const focusScore = Number(r.focus_score)
            return accuracyScore * 0.4 + focusScore * 0.3 + Number(r.score) * 0.3
          })

          dimensions[dimension] = {
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            games: records.slice(0, 5).map(r => ({
              game_id: r.game_id,
              score: Math.round(Number(r.score))
            }))
          }
        } else {
          dimensions[dimension] = { score: 0, games: [] }
        }
      }

      res.json({
        success: true,
        data: {
          dimensions,
          period: `${days}天`,
          calculated_at: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('获取维度评分失败:', error)
      res.status(500).json({
        success: false,
        message: '获取维度评分失败'
      })
    }
  }

  /**
   * 获取能力趋势数据
   */
  static async getAbilityTrend(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)
      const days = parseInt(req.query.days as string) || 90

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 获取该时间段的训练记录
      const records = await query<{
        created_at: Date
        accuracy: number
        focus_score: number
      }>(
        'SELECT created_at, accuracy, focus_score FROM training_record WHERE child_id = ? AND created_at >= ? ORDER BY created_at ASC',
        [childId, startDate]
      )

      // 按日期聚合数据
      const dailyData: { [date: string]: { accuracy: number; focus: number; count: number } } = {}
      records.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { accuracy: 0, focus: 0, count: 0 }
        }
        dailyData[date].accuracy += Number(record.accuracy)
        dailyData[date].focus += Number(record.focus_score)
        dailyData[date].count += 1
      })

      // 计算日均值
      const trend = Object.entries(dailyData).map(([date, data]) => ({
        date,
        avg_accuracy: Math.round(data.accuracy / data.count * 100),
        avg_focus: Math.round(data.focus / data.count),
        training_count: data.count
      }))

      res.json({
        success: true,
        data: {
          trend,
          period: `${days}天`,
          total_trainings: records.length
        }
      })
    } catch (error) {
      console.error('获取能力趋势失败:', error)
      res.status(500).json({
        success: false,
        message: '获取能力趋势失败'
      })
    }
  }

  /**
   * 获取能力综合摘要
   */
  static async getAbilitySummary(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      // 获取儿童基本信息
      const child = await ChildModel.findById(childId)
      if (!child) {
        return res.status(404).json({
          success: false,
          message: '儿童不存在'
        })
      }

      // 获取最近30天数据
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const recentRecords = await query<{
        duration_seconds: number
        focus_score: number
        accuracy: number
        created_at: Date
      }>(
        'SELECT duration_seconds, focus_score, accuracy, created_at FROM training_record WHERE child_id = ? AND created_at >= ?',
        [childId, startDate]
      )

      // 获取历史全部数据
      const allRecords = await query<{
        duration_seconds: number
      }>(
        'SELECT duration_seconds FROM training_record WHERE child_id = ?',
        [childId]
      )

      // 计算统计指标
      const summary = {
        child_info: {
          name: child.name,
          age: child.age,
          age_group: child.age_group,
          level: child.level,
          experience: child.experience
        },
        recent_stats: {
          training_count_30d: recentRecords.length,
          total_duration_30d: recentRecords.reduce((sum, r) => sum + r.duration_seconds, 0),
          avg_focus_30d: recentRecords.length > 0
            ? Math.round(recentRecords.reduce((sum, r) => sum + Number(r.focus_score), 0) / recentRecords.length)
            : 0,
          avg_accuracy_30d: recentRecords.length > 0
            ? Math.round(recentRecords.reduce((sum, r) => sum + Number(r.accuracy), 0) / recentRecords.length * 100)
            : 0
        },
        overall_stats: {
          total_trainings: allRecords.length,
          total_duration: allRecords.reduce((sum, r) => sum + r.duration_seconds, 0),
          favorite_game: await this.getFavoriteGame(childId)
        },
        improvement_suggestions: this.generateSuggestions(recentRecords, child.age_group)
      }

      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      console.error('获取能力摘要失败:', error)
      res.status(500).json({
        success: false,
        message: '获取能力摘要失败'
      })
    }
  }

  /**
   * 获取最喜欢的游戏
   */
  private static async getFavoriteGame(childId: number): Promise<string> {
    try {
      const result = await queryOne<{ game_id: number; count: number }>(
        'SELECT game_id, COUNT(*) as count FROM training_record WHERE child_id = ? GROUP BY game_id ORDER BY count DESC LIMIT 1',
        [childId]
      )

      if (result) {
        const game = await GameModel.findById(result.game_id)
        return game?.game_name || '未知'
      }
      return '暂无'
    } catch {
      return '暂无'
    }
  }

  /**
   * 生成改进建议
   */
  private static generateSuggestions(records: { accuracy: number; focus_score: number; created_at: Date }[], ageGroup: string): string[] {
    const suggestions: string[] = []

    if (records.length === 0) {
      suggestions.push('今天还没有训练哦，快去开始专注力训练吧！')
      return suggestions
    }

    // 分析准确率
    const avgAccuracy = records.reduce((sum, r) => sum + Number(r.accuracy), 0) / records.length
    if (avgAccuracy < 0.7) {
      suggestions.push('准确率还有提升空间，建议从简单难度开始，循序渐进')
    }

    // 分析专注度
    const avgFocus = records.reduce((sum, r) => sum + Number(r.focus_score), 0) / records.length
    if (avgFocus < 70) {
      suggestions.push('专注力可以继续加强，建议每天坚持10-15分钟训练')
    }

    // 分析训练频率
    const today = new Date().toISOString().split('T')[0]
    const todayCount = records.filter(r => new Date(r.created_at).toISOString().split('T')[0] === today).length
    if (todayCount === 0) {
      suggestions.push('今天还没训练，今天的目标是完成1次训练！')
    } else if (todayCount >= 2) {
      suggestions.push('今天训练得很棒！适当休息也很重要哦')
    }

    // 根据年龄组给出建议
    if (ageGroup === '4-6') {
      suggestions.push('4-6岁建议每次训练5-10分钟，保护眼睛很重要')
    }

    return suggestions.slice(0, 3) // 最多返回3条建议
  }
}

export default AssessmentController