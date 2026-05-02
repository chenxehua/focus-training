/**
 * AI推荐引擎控制器
 */

import { Request, Response } from 'express'
import { RecommendationService } from '../services/recommendationService'

interface AuthRequest extends Request {
  userId?: number
}

export class RecommendationController {
  /**
   * 获取用户画像
   */
  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const profile = await RecommendationService.buildUserProfile(childId)

      res.json({
        success: true,
        data: profile
      })
    } catch (error) {
      console.error('获取用户画像失败:', error)
      res.status(500).json({
        success: false,
        message: '获取用户画像失败'
      })
    }
  }

  /**
   * 获取推荐游戏列表
   */
  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)
      const limit = parseInt(req.query.limit as string) || 3

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const recommendations = await RecommendationService.getRecommendations(childId, limit)

      res.json({
        success: true,
        data: {
          recommendations,
          generated_at: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('获取推荐失败:', error)
      res.status(500).json({
        success: false,
        message: '获取推荐失败'
      })
    }
  }

  /**
   * 获取周训练计划
   */
  static async getWeeklyPlan(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId || req.query.childId as string)

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: '缺少 childId 参数'
        })
      }

      const plan = await RecommendationService.generateWeeklyPlan(childId)

      res.json({
        success: true,
        data: {
          plan,
          generated_at: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('获取周计划失败:', error)
      res.status(500).json({
        success: false,
        message: '获取周计划失败'
      })
    }
  }

  /**
   * 获取难度建议
   */
  static async getDifficultySuggestion(req: AuthRequest, res: Response) {
    try {
      const childId = parseInt(req.params.childId as string)
      const gameId = parseInt(req.params.gameId as string)
      const recentScores = req.body.recentScores as number[]

      if (!childId || !gameId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      const suggestion = await RecommendationService.adjustDifficulty(childId, gameId, recentScores || [])

      res.json({
        success: true,
        data: suggestion
      })
    } catch (error) {
      console.error('获取难度建议失败:', error)
      res.status(500).json({
        success: false,
        message: '获取难度建议失败'
      })
    }
  }
}

export default RecommendationController