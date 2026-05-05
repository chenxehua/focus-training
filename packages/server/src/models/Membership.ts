/**
 * 会员和订单模型
 * 适配 focuskids 数据库结构
 */

import { query, queryOne, execute } from '../config/database'

export interface DbMembership {
  id: number
  name: string
  tier: 'free' | 'basic' | 'premium' | 'vip'
  price: number
  duration_days: number
  benefits: string | null
  features: string | null
  sort_order: number
  status: number
  created_at: Date
  updated_at: Date
}

export interface DbChildMembership {
  id: number
  child_id: number
  membership_id: number
  order_id: number | null
  start_date: Date
  end_date: Date
  status: number
  auto_renew: number
  created_at: Date
  updated_at: Date
}

export interface MembershipData {
  id?: number
  tier: string
  name: string
  start_date: Date
  end_date: Date
  status: number
  days_remaining?: number
  is_vip?: boolean
}

export interface OrderData {
  id?: number
  order_no: string
  user_id: number
  child_id?: number
  membership_id: number
  amount: number
  pay_status?: number
  pay_time?: Date | null
  transaction_id?: string
  created_at: Date
}

export class MembershipModel {
  /**
   * 获取用户的有效会员（通过孩子的会员关联）
   */
  static async findByUserId(userId: number): Promise<MembershipData | null> {
    // 通过 user -> child -> child_membership -> membership 查找用户的有效会员
    const sql = `
      SELECT cm.*, m.tier, m.name, m.benefits, m.features
      FROM child_membership cm
      JOIN membership m ON cm.membership_id = m.id
      JOIN child c ON cm.child_id = c.id
      WHERE c.user_id = ? AND cm.status = 1 AND cm.end_date >= CURDATE()
      ORDER BY cm.end_date DESC
      LIMIT 1
    `
    const result = await queryOne<any>(sql, [userId])
    if (!result) return null

    return {
      id: result.id,
      tier: result.tier,
      name: result.name,
      start_date: result.start_date,
      end_date: result.end_date,
      status: result.status
    }
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
   * 获取用户的会员列表
   */
  static async findAllByUserId(userId: number): Promise<MembershipData[]> {
    const sql = `
      SELECT cm.*, m.tier, m.name
      FROM child_membership cm
      JOIN membership m ON cm.membership_id = m.id
      JOIN child c ON cm.child_id = c.id
      WHERE c.user_id = ?
      ORDER BY cm.created_at DESC
    `
    return query(sql, [userId])
  }

  /**
   * 创建或更新会员（通过孩子）
   */
  static async upsertChildMembership(data: {
    childId: number
    membershipId: number
    startDate: Date
    endDate: Date
  }): Promise<number> {
    // 检查是否已有有效会员，有则顺延
    const existing = await queryOne<DbChildMembership>(
      'SELECT * FROM child_membership WHERE child_id = ? AND status = 1 AND end_date >= CURDATE()',
      [data.childId]
    )

    if (existing) {
      const newEndDate = new Date(existing.end_date)
      newEndDate.setDate(newEndDate.getDate() + Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)))

      await execute(
        'UPDATE child_membership SET end_date = ?, membership_id = ?, status = 1 WHERE id = ?',
        [newEndDate, data.membershipId, existing.id]
      )
      return existing.id
    } else {
      const result = await execute(
        'INSERT INTO child_membership (child_id, membership_id, start_date, end_date, status) VALUES (?, ?, ?, ?, 1)',
        [data.childId, data.membershipId, data.startDate, data.endDate]
      )
      return result.insertId
    }
  }

  /**
   * 获取会员套餐列表
   */
  static async findAllPackages(): Promise<DbMembership[]> {
    return query('SELECT * FROM membership WHERE status = 1 ORDER BY sort_order ASC')
  }

  /**
   * 获取会员套餐详情
   */
  static async findPackageById(id: number): Promise<DbMembership | null> {
    return queryOne<DbMembership>('SELECT * FROM membership WHERE id = ?', [id])
  }

  /**
   * 获取用户的所有孩子
   */
  static async getUserChildren(userId: number): Promise<any[]> {
    return query('SELECT * FROM child WHERE user_id = ? AND status = 1', [userId])
  }
}

export class OrderModel {
  /**
   * 创建订单
   */
  static async createOrder(data: {
    orderNo: string
    userId: number
    childId?: number
    membershipId: number
    amount: number
  }): Promise<number> {
    const result = await execute(
      `INSERT INTO \`order\` (order_no, user_id, child_id, membership_id, amount, pay_status, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [data.orderNo, data.userId, data.childId || null, data.membershipId, data.amount]
    )
    return result.insertId
  }

  /**
   * 更新订单支付状态
   */
  static async updatePayStatus(orderNo: string, status: number, transactionId?: string): Promise<void> {
    if (transactionId) {
      await execute(
        "UPDATE \`order\` SET pay_status = ?, transaction_id = ?, pay_time = NOW() WHERE order_no = ?",
        [status, transactionId, orderNo]
      )
    } else {
      await execute(
        "UPDATE \`order\` SET pay_status = ?, pay_time = NOW() WHERE order_no = ?",
        [status, orderNo]
      )
    }
  }

  /**
   * 获取用户订单列表
   */
  static async findByUserId(userId: number, limit = 50): Promise<OrderData[]> {
    return query(
      `SELECT * FROM \`order\` WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    )
  }

  /**
   * 获取订单详情
   */
  static async findByOrderNo(orderNo: string): Promise<OrderData | null> {
    return queryOne<OrderData>(
      'SELECT * FROM \`order\` WHERE order_no = ?',
      [orderNo]
    )
  }
}
