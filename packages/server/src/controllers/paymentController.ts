/**
 * 支付系统控制器
 */

import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, execute } from '../config/database'
import { MembershipModel, OrderModel } from '../models'

interface AuthRequest extends Request {
  userId?: number
}

export class PaymentController {
  /**
   * 创建订单
   */
  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId
      const { membership_id, amount, months } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        })
      }

      // 生成订单号
      const orderNo = `ORDER_${Date.now()}_${uuidv4().substring(0, 8).toUpperCase()}`

      // 创建订单
      await OrderModel.create({
        order_no: orderNo,
        user_id: userId,
        membership_id: membership_id || undefined,
        amount: amount || 199
      })

      res.json({
        success: true,
        data: {
          order_no: orderNo,
          amount: amount || 199
        }
      })
    } catch (error) {
      console.error('创建订单失败:', error)
      res.status(500).json({
        success: false,
        message: '创建订单失败'
      })
    }
  }

  /**
   * 获取订单状态
   */
  static async getOrderStatus(req: AuthRequest, res: Response) {
    try {
      const { orderNo } = req.params
      const userId = req.userId

      const order = await queryOne<{
        order_no: string
        pay_status: number
        pay_amount: number
        created_at: Date
        pay_time: Date | null
      }>(
        'SELECT order_no, pay_status, pay_amount, created_at, pay_time FROM `order` WHERE order_no = ? AND user_id = ?',
        [orderNo, userId]
      )

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        })
      }

      res.json({
        success: true,
        data: {
          order_no: order.order_no,
          pay_status: order.pay_status,
          amount: order.pay_amount,
          created_at: order.created_at,
          pay_time: order.pay_time
        }
      })
    } catch (error) {
      console.error('获取订单状态失败:', error)
      res.status(500).json({
        success: false,
        message: '获取订单状态失败'
      })
    }
  }

  /**
   * 发起支付（微信支付）
   */
  static async initiatePayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId
      const { order_no } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未登录'
        })
      }

      // 获取订单信息
      const order = await queryOne<{
        order_no: string
        pay_status: number
        pay_amount: number
        product_name: string
      }>(
        'SELECT order_no, pay_status, pay_amount, product_name FROM `order` WHERE order_no = ? AND user_id = ?',
        [order_no, userId]
      )

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        })
      }

      if (order.pay_status === 1) {
        return res.json({
          success: true,
          message: '订单已支付',
          data: { pay_status: 'paid' }
        })
      }

      // TODO: 集成微信支付SDK
      // 这里返回模拟的支付参数
      const paymentParams = {
        order_no,
        total_fee: Math.round(order.pay_amount * 100), // 分
        subject: order.product_name,
        // 微信支付需要的参数将在集成时补充
      }

      res.json({
        success: true,
        data: {
          payment_params: paymentParams,
          // 微信支付的预支付会话标识
          prepay_id: `prepay_${Date.now()}`
        }
      })
    } catch (error) {
      console.error('发起支付失败:', error)
      res.status(500).json({
        success: false,
        message: '发起支付失败'
      })
    }
  }

  /**
   * 微信支付回调
   */
  static async handleCallback(req: Request, res: Response) {
    try {
      // 解析微信支付回调数据
      const { order_no, transaction_id, pay_status } = req.body

      if (pay_status === 'SUCCESS') {
        // 更新订单状态
        await OrderModel.updatePayStatus(order_no, 1, transaction_id)

        // 获取订单信息
        const order = await queryOne<{
          user_id: number
          product_type: string
          product_id: string
        }>(
          'SELECT user_id, product_type, product_id FROM `order` WHERE order_no = ?',
          [order_no]
        )

        if (order && order.product_type === 'membership') {
          // 创建或更新会员
          const startDate = new Date()
          const endDate = new Date(startDate)
          endDate.setFullYear(endDate.getFullYear() + 1) // 年卡加1年

          await MembershipModel.upsert({
            user_id: order.user_id,
            member_type: 'yearly',
            member_level: 'vip',
            start_date: startDate,
            end_date: endDate
          })
        }

        res.json({ success: true, message: '支付成功' })
      } else {
        res.json({ success: false, message: '支付失败' })
      }
    } catch (error) {
      console.error('支付回调处理失败:', error)
      res.status(500).json({
        success: false,
        message: '回调处理失败'
      })
    }
  }
}

export default PaymentController