/**
 * 会员和订单模型
 * 提供会员和订单数据的增删改查操作
 */

import { query, queryOne, execute } from '../config/database'

export interface MembershipData {
  id?: number
  user_id: number
  member_type: string
  member_level?: string
  start_date: Date
  end_date: Date
  status: number
  auto_renew?: number
}

export interface OrderData {
  id?: number
  order_no: string
  user_id: number
  child_id?: number
  product_type: string
  product_id: string
  product_name: string
  amount: number
  pay_amount?: number
  pay_channel?: string
  pay_status?: number
  pay_time?: Date | null
  transaction_id?: string
  ext_data?: Record<string, unknown>
}

export class MembershipModel {
  /**
   * 获取用户会员状态
   */
  static async findByUserId(userId: number): Promise<MembershipData | null> {
    return queryOne<MembershipData>(
      'SELECT * FROM membership WHERE user_id = ? AND status = 1',
      [userId]
    )
  }

  /**
   * 检查用户是否为VIP
   */
  static async isVip(userId: number): Promise<boolean> {
    const membership = await this.findByUserId(userId)
    if (!membership) return false
    return new Date(membership.end_date) > new Date()
  }

  /**
   * 获取用户所有会员记录
   */
  static async findAllByUserId(userId: number): Promise<MembershipData[]> {
    return query<MembershipData>(
      'SELECT * FROM membership WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
  }

  /**
   * 创建或更新会员
   */
  static async upsert(data: {
    user_id: number
    member_type: string
    member_level?: string
    start_date: Date
    end_date: Date
  }): Promise<number> {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM membership WHERE user_id = ?',
      [data.user_id]
    )

    if (existing) {
      await execute(
        'UPDATE membership SET member_type = ?, member_level = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?',
        [data.member_type, data.member_level ?? 'vip', data.start_date, data.end_date, existing.id]
      )
      return existing.id
    } else {
      const result = await execute(
        'INSERT INTO membership (user_id, member_type, member_level, start_date, end_date, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.user_id, data.member_type, data.member_level ?? 'vip', data.start_date, data.end_date, 1, 0]
      )
      return result.insertId
    }
  }

  /**
   * 更新会员状态
   */
  static async updateStatus(id: number, status: number): Promise<void> {
    await execute('UPDATE membership SET status = ?, updated_at = NOW() WHERE id = ?', [status, id])
  }

  /**
   * 续费会员
   */
  static async renew(userId: number, memberType: string, days: number): Promise<void> {
    const existing = await this.findByUserId(userId)
    const now = new Date()

    if (existing && new Date(existing.end_date) > now) {
      // 续费：从当前结束日期延长
      const newEndDate = new Date(existing.end_date)
      newEndDate.setDate(newEndDate.getDate() + days)
      await execute(
        'UPDATE membership SET end_date = ?, member_type = ?, updated_at = NOW() WHERE user_id = ?',
        [newEndDate, memberType, userId]
      )
    } else {
      // 新购买：从现在计算
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)
      await this.upsert({
        user_id: userId,
        member_type: memberType,
        start_date: now,
        end_date: endDate
      })
    }
  }
}

export class OrderModel {
  /**
   * 根据订单号查询订单
   */
  static async findByOrderNo(orderNo: string): Promise<OrderData | null> {
    return queryOne<OrderData>('SELECT * FROM `order` WHERE order_no = ?', [orderNo])
  }

  /**
   * 获取用户的所有订单
   */
  static async findByUserId(userId: number, limit = 50): Promise<OrderData[]> {
    return query<OrderData>(
      'SELECT * FROM `order` WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    )
  }

  /**
   * 获取用户已支付的订单
   */
  static async findPaidByUserId(userId: number, limit = 50): Promise<OrderData[]> {
    return query<OrderData>(
      'SELECT * FROM `order` WHERE user_id = ? AND pay_status = 1 ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    )
  }

  /**
   * 创建订单
   */
  static async create(data: {
    order_no: string
    user_id: number
    child_id?: number
    membership_id?: number
    amount: number
    status?: 'pending' | 'paid' | 'cancelled' | 'refunded'
    pay_method?: string
    pay_time?: Date | null
    transaction_id?: string
    ext_data?: Record<string, unknown>
  }): Promise<number> {
    const result = await execute(
      'INSERT INTO `order` (order_no, user_id, child_id, membership_id, amount, status, pay_method, pay_time, transaction_id, ext_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.order_no,
        data.user_id,
        data.child_id ?? null,
        data.membership_id ?? null,
        data.amount,
        data.status ?? 'pending',
        data.pay_method ?? null,
        data.pay_time ?? null,
        data.transaction_id ?? null,
        JSON.stringify(data.ext_data ?? {})
      ]
    )
    return result.insertId
  }

  /**
   * 更新支付状态
   */
  static async updatePayStatus(orderNo: string, status: number, transactionId?: string): Promise<void> {
    if (status === 1) {
      await execute(
        'UPDATE `order` SET pay_status = 1, pay_time = NOW(), transaction_id = ?, updated_at = NOW() WHERE order_no = ?',
        [transactionId ?? null, orderNo]
      )
    } else {
      await execute(
        'UPDATE `order` SET pay_status = ?, updated_at = NOW() WHERE order_no = ?',
        [status, orderNo]
      )
    }
  }

  /**
   * 取消订单
   */
  static async cancel(orderNo: string): Promise<void> {
    await execute(
      'UPDATE `order` SET pay_status = 2, updated_at = NOW() WHERE order_no = ?',
      [orderNo]
    )
  }

  /**
   * 退款订单
   */
  static async refund(orderNo: string): Promise<void> {
    await execute(
      'UPDATE `order` SET pay_status = 3, updated_at = NOW() WHERE order_no = ?',
      [orderNo]
    )
  }
}

export default { MembershipModel, OrderModel }