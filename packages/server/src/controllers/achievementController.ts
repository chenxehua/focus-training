/**
 * 成就系统控制器
 */

import type { Request, Response } from 'express'
import { query } from '../config/database'
import { AchievementModel } from '../models'

interface AuthRequest extends Request {
  userId?: number
  childId?: number
}

export class AchievementController {
  /**
   * 获取所有成就定义
   */
  static async getAchievementList(req: Request, res: Response) {
    try {
      const achievements = await AchievementModel.findAll({ is_active: 1 })

      res.json({
        success: true,
        data: achievements
      })
    } catch (error) {
      console.error('获取成就列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取成就列表失败'
      })
    }
  }

  /**
   * 获取儿童成就状态
   */
  static async getChildAchievements(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      // 获取该儿童的所有成就（包括未解锁的）
      const achievements = await AchievementModel.getChildAchievements(childId)

      res.json({
        success: true,
        data: achievements
      })
    } catch (error) {
      console.error('获取儿童成就失败:', error)
      res.status(500).json({
        success: false,
        message: '获取儿童成就失败'
      })
    }
  }

  /**
   * 获取游戏排行榜
   */
  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const gameId = req.params.gameId || req.query.gameId as string
      const limit = parseInt(req.query.limit as string) || 20

      if (!gameId) {
        return res.status(400).json({
          success: false,
          message: '缺少 gameId 参数'
        })
      }

      // 获取某游戏的最高分排行
      const records = await query<{ child_id: number; score: number }>(
        'SELECT child_id, MAX(score) as score FROM training_record WHERE game_id = ? GROUP BY child_id ORDER BY score DESC LIMIT ?',
        [gameId, limit]
      )

      // 转换为排行数据
      const leaderboard = records.map((record, index) => ({
        rank: index + 1,
        child_id: record.child_id,
        score: record.score
      }))

      res.json({
        success: true,
        data: leaderboard
      })
    } catch (error) {
      console.error('获取排行榜失败:', error)
      res.status(500).json({
        success: false,
        message: '获取排行榜失败'
      })
    }
  }

  /**
   * 解锁成就
   */
  static async unlockAchievement(req: AuthRequest, res: Response) {
    try {
      const { childId, achievementId } = req.body

      if (!childId || !achievementId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      await AchievementModel.unlockAchievement(childId, achievementId)

      res.json({
        success: true,
        message: '成就解锁成功'
      })
    } catch (error) {
      console.error('解锁成就失败:', error)
      res.status(500).json({
        success: false,
        message: '解锁成就失败'
      })
    }
  }

  /**
   * 获取成就统计
   */
  static async getAchievementStats(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const stats = await AchievementModel.getStats(childId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('获取成就统计失败:', error)
      res.status(500).json({
        success: false,
        message: '获取成就统计失败'
      })
    }
  }
}

export default AchievementController