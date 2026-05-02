/**
 * 会员系统控制器
 */

import { Request, Response } from 'express'
import { MembershipModel, OrderModel } from '../models'

interface AuthRequest extends Request {
  userId?: number
}

export class MembershipController {
  /**
   * 获取会员状态
   */
  static async getMembershipStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        })
      }

      const membership = await MembershipModel.findByUserId(userId)

      if (!membership) {
        return res.json({
          success: true,
          data: {
            is_vip: false,
            member_type: null,
            member_level: null,
            start_date: null,
            end_date: null,
            days_remaining: 0
          }
        })
      }

      const isVip = new Date(membership.end_date) > new Date()
      const daysRemaining = isVip
        ? Math.ceil((new Date(membership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

      res.json({
        success: true,
        data: {
          is_vip: isVip,
          member_type: membership.member_type,
          member_level: membership.member_level,
          start_date: membership.start_date,
          end_date: membership.end_date,
          days_remaining: daysRemaining
        }
      })
    } catch (error) {
      console.error('获取会员状态失败:', error)
      res.status(500).json({
        success: false,
        message: '获取会员状态失败'
      })
    }
  }

  /**
   * 获取会员套餐列表
   */
  static async getMembershipPackages(req: Request, res: Response) {
    try {
      // MVP阶段单一套餐
      const packages = [
        {
          id: 'yearly_basic',
          name: '年度会员',
          price: 199,
          original_price: 299,
          duration: '1年',
          features: [
            '畅玩全部9款训练游戏',
            '7维度专业评估报告',
            '个性化训练计划',
            '成就徽章系统',
            'AI智能推荐'
          ],
          recommended: true
        }
      ]

      res.json({
        success: true,
        data: packages
      })
    } catch (error) {
      console.error('获取套餐列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取套餐列表失败'
      })
    }
  }

  /**
   * 获取购买历史
   */
  static async getPurchaseHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        })
      }

      const orders = await OrderModel.findPaidByUserId(userId)

      res.json({
        success: true,
        data: orders
      })
    } catch (error) {
      console.error('获取购买历史失败:', error)
      res.status(500).json({
        success: false,
        message: '获取购买历史失败'
      })
    }
  }
}

export default MembershipController