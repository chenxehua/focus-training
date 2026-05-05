/**
 * 管理员 Controller
 */
import type { Request, Response } from 'express'
import { query, queryOne, execute } from '../config/database'
import { successResponse, errorResponse } from '../types'

interface AdminRequest extends Request {
  userId?: number
  userRole?: string
}

// ============================================================
// 统计概览
// ============================================================

/**
 * 获取仪表盘统计数据
 * GET /api/admin/dashboard
 */
export async function getDashboardStats(req: AdminRequest, res: Response) {
  try {
    // 用户统计
    const userCountSql = 'SELECT COUNT(*) as count FROM user WHERE status = 1'
    const userCountResult = await queryOne<{ count: number }>(userCountSql)
    
    // 儿童统计
    const childCountSql = 'SELECT COUNT(*) as count FROM child WHERE status = 1'
    const childCountResult = await queryOne<{ count: number }>(childCountSql)
    
    // 今日训练记录
    const todayTrainingSql = "SELECT COUNT(*) as count FROM training_record WHERE DATE(created_at) = CURDATE()"
    const todayTrainingResult = await queryOne<{ count: number }>(todayTrainingSql)
    
    // 本月订单数
    const monthOrderSql = "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount FROM `order` WHERE status = 'paid' AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
    const monthOrderResult = await queryOne<{ count: number; amount: number }>(monthOrderSql)
    
    // 活跃会员数 (查询 child_membership 而非 membership)
    const memberCountSql = "SELECT COUNT(*) as count FROM child_membership WHERE status = 1 AND end_date > CURDATE()"
    const memberCountResult = await queryOne<{ count: number }>(memberCountSql)
    
    // 本月新增用户趋势
    const userTrendSql = `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM user 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    const userTrend = await query<{ date: Date; count: number }>(userTrendSql)
    
    // 游戏使用排行
    const gameUsageSql = `
      SELECT g.game_name, g.game_code, COUNT(tr.id) as play_count
      FROM game g
      LEFT JOIN training_record tr ON tr.game_id = g.id
      GROUP BY g.id, g.game_name, g.game_code
      ORDER BY play_count DESC
      LIMIT 5
    `
    const gameUsage = await query<{ game_name: string; game_code: string; play_count: number }>(gameUsageSql)

    res.json(successResponse({
      stats: {
        totalUsers: userCountResult?.count ?? 0,
        totalChildren: childCountResult?.count ?? 0,
        todayTraining: todayTrainingResult?.count ?? 0,
        monthOrders: monthOrderResult?.count ?? 0,
        monthAmount: monthOrderResult?.amount ?? 0,
        activeMembers: memberCountResult?.count ?? 0
      },
      userTrend: userTrend.map(u => ({
        date: u.date,
        count: u.count
      })),
      gameUsage: gameUsage.map(g => ({
        name: g.game_name,
        code: g.game_code,
        count: g.play_count
      }))
    }))
  } catch (error) {
    console.error('获取仪表盘统计失败:', error)
    res.status(500).json(errorResponse('获取统计数据失败'))
  }
}

// ============================================================
// 用户管理
// ============================================================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
export async function getUserList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const keyword = req.query.keyword as string
    const status = req.query.status as string
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (keyword) {
      whereClause += ' AND (nickname LIKE ? OR phone LIKE ? OR openid LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      params.push(parseInt(status))
    }
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM user ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    // 获取列表
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT id, openid, nickname, avatar, phone, role, status, created_at
      FROM user ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json(errorResponse('获取用户列表失败'))
  }
}

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
export async function getUserDetail(req: AdminRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id)
    
    const userSql = 'SELECT * FROM user WHERE id = ?'
    const user = await queryOne(userSql, [userId])
    
    if (!user) {
      return res.status(404).json(errorResponse('用户不存在'))
    }
    
    // 获取关联的儿童
    const childrenSql = 'SELECT * FROM child WHERE user_id = ? AND status = 1 ORDER BY created_at DESC'
    const children = await query(childrenSql, [userId])
    
    // 获取订单统计
    const orderStatsSql = `
      SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as amount
      FROM \`order\` WHERE user_id = ? AND status = 'paid'
    `
    const orderStats = await queryOne<{ total: number; amount: number }>(orderStatsSql, [userId])
    
    res.json(successResponse({
      user,
      children,
      orderStats
    }))
  } catch (error) {
    console.error('获取用户详情失败:', error)
    res.status(500).json(errorResponse('获取用户详情失败'))
  }
}

/**
 * 获取用户下拉列表 (用于选择用户)
 * GET /api/admin/users/select
 */
export async function getUserSelectList(req: AdminRequest, res: Response) {
  try {
    const keyword = req.query.keyword as string
    
    let whereClause = 'WHERE status = 1'
    const params: any[] = []
    
    if (keyword) {
      whereClause += ' AND (nickname LIKE ? OR phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const sql = `
      SELECT id, nickname, phone 
      FROM user ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `
    const users = await query(sql, params)
    
    res.json(successResponse(users))
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json(errorResponse('获取用户列表失败'))
  }
}

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
export async function updateUserStatus(req: AdminRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id)
    const { status } = req.body
    
    if (status !== 0 && status !== 1) {
      return res.status(400).json(errorResponse('无效的状态值'))
    }
    
    const sql = 'UPDATE user SET status = ? WHERE id = ?'
    const result = await execute(sql, [status, userId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('用户不存在'))
    }
    
    res.json(successResponse({ message: '状态更新成功' }))
  } catch (error) {
    console.error('更新用户状态失败:', error)
    res.status(500).json(errorResponse('更新用户状态失败'))
  }
}

// ============================================================
// 儿童管理
// ============================================================

/**
 * 获取儿童列表
 * GET /api/admin/children
 */
export async function getChildList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const keyword = req.query.keyword as string
    const ageGroup = req.query.ageGroup as string
    
    let whereClause = 'WHERE c.status = 1'
    const params: any[] = []
    
    if (keyword) {
      whereClause += ' AND c.name LIKE ?'
      params.push(`%${keyword}%`)
    }
    
    if (ageGroup) {
      whereClause += ' AND c.age_group = ?'
      params.push(ageGroup)
    }
    
    const countSql = `SELECT COUNT(*) as total FROM child c ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT c.*, u.nickname as parent_name, u.phone as parent_phone,
             (SELECT COUNT(*) FROM training_record WHERE child_id = c.id) as training_count
      FROM child c
      LEFT JOIN user u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取儿童列表失败:', error)
    res.status(500).json(errorResponse('获取儿童列表失败'))
  }
}

// ============================================================
// 订单管理
// ============================================================

/**
 * 获取订单列表
 * GET /api/admin/orders
 */
export async function getOrderList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (status) {
      whereClause += ' AND o.status = ?'
      params.push(status)
    }
    
    if (startDate) {
      whereClause += ' AND o.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND o.created_at <= ?'
      params.push(endDate + ' 23:59:59')
    }
    
    const countSql = `SELECT COUNT(*) as total FROM \`order\` o ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT o.*, u.nickname as user_name, u.phone as user_phone
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.status(500).json(errorResponse('获取订单列表失败'))
  }
}

/**
 * 获取订单详情
 * GET /api/admin/orders/:id
 */
export async function getOrderDetail(req: AdminRequest, res: Response) {
  try {
    const orderId = req.params.id
    
    const orderSql = `
      SELECT o.*, u.nickname as user_name, u.phone as user_phone, u.openid
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
    `
    const order = await queryOne(orderSql, [orderId])
    
    if (!order) {
      return res.status(404).json(errorResponse('订单不存在'))
    }
    
    res.json(successResponse(order))
  } catch (error) {
    console.error('获取订单详情失败:', error)
    res.status(500).json(errorResponse('获取订单详情失败'))
  }
}

// ============================================================
// 会员管理
// ============================================================

/**
 * 获取会员列表
 * GET /api/admin/members
 */
export async function getMemberList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string // active, expired, pending

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (status === 'active') {
      whereClause += " AND m.status = 1 AND m.end_date > CURDATE()"
    } else if (status === 'expired') {
      whereClause += " AND (m.status != 1 OR m.end_date <= CURDATE())"
    }

    const countSql = `SELECT COUNT(*) as total FROM child_membership m ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)

    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT m.*, u.nickname as user_name, u.phone as user_phone,
             c.name as child_name, mt.name as membership_name, mt.tier
      FROM child_membership m
      LEFT JOIN child c ON m.child_id = c.id
      LEFT JOIN user u ON c.user_id = u.id
      LEFT JOIN membership mt ON m.membership_id = mt.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)

    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取会员列表失败:', error)
    res.status(500).json(errorResponse('获取会员列表失败'))
  }
}

/**
 * 更新会员状态
 * PUT /api/admin/members/:id
 */
export async function updateMember(req: AdminRequest, res: Response) {
  try {
    const memberId = parseInt(req.params.id)
    const { status, extendDays } = req.body

    if (extendDays) {
      // 延长会员时长
      const memberSql = 'SELECT * FROM child_membership WHERE id = ?'
      const member = await queryOne<any>(memberSql, [memberId])

      if (!member) {
        return res.status(404).json(errorResponse('会员不存在'))
      }

      const newEndDate = new Date(member.end_date || new Date())
      newEndDate.setDate(newEndDate.getDate() + extendDays)

      const updateSql = "UPDATE child_membership SET end_date = ?, status = 1 WHERE id = ?"
      await execute(updateSql, [newEndDate, memberId])
    } else if (status !== undefined) {
      const updateSql = 'UPDATE child_membership SET status = ? WHERE id = ?'
      await execute(updateSql, [status, memberId])
    }

    res.json(successResponse({ message: '更新成功' }))
  } catch (error) {
    console.error('更新会员失败:', error)
    res.status(500).json(errorResponse('更新会员失败'))
  }
}

/**
 * 为用户开通会员
 * POST /api/admin/members/grant
 */
export async function grantMembership(req: AdminRequest, res: Response) {
  try {
    const { userId, childId, tier, durationDays } = req.body

    if (!userId || !tier || !durationDays) {
      return res.status(400).json(errorResponse('缺少必要参数'))
    }

    // 查找或创建会员套餐
    let membershipSql = 'SELECT * FROM membership WHERE tier = ?'
    let membership = await queryOne<any>(membershipSql, [tier])

    if (!membership) {
      // 创建默认套餐
      const insertMembershipSql = `
        INSERT INTO membership (name, tier, price, duration_days, features, benefits)
        VALUES (?, ?, 0, ?, '["all_games"]', '["standard_support"]')
      `
      const result = await execute(insertMembershipSql, [`${tier.toUpperCase()}会员`, tier, durationDays])
      membership = { id: result.insertId, tier, duration_days: durationDays }
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    // 确定要开通的 child_id
    let targetChildId = childId
    if (!targetChildId) {
      // 如果没有指定 childId，获取用户的第一个孩子
      const childSql = 'SELECT id FROM child WHERE user_id = ? AND status = 1 LIMIT 1'
      const child = await queryOne<{ id: number }>(childSql, [userId])
      if (!child) {
        return res.status(400).json(errorResponse('该用户没有关联的儿童，请先添加儿童'))
      }
      targetChildId = child.id
    }

    // 检查是否已有有效会员，有则顺延
    const existingSql = 'SELECT * FROM child_membership WHERE child_id = ? AND status = 1 AND end_date > CURDATE()'
    const existing = await queryOne<any>(existingSql, [targetChildId])

    let finalStartDate = startDate
    let finalEndDate = endDate

    if (existing) {
      // 已有有效会员，顺延
      finalStartDate = new Date(existing.end_date)
      finalEndDate = new Date(existing.end_date)
      finalEndDate.setDate(finalEndDate.getDate() + durationDays)
    }

    // 插入或更新会员记录
    if (existing) {
      const extendSql = 'UPDATE child_membership SET end_date = ?, membership_id = ?, status = 1 WHERE id = ?'
      await execute(extendSql, [finalEndDate, membership.id, existing.id])
    } else {
      const insertSql = `
        INSERT INTO child_membership (child_id, membership_id, start_date, end_date, status)
        VALUES (?, ?, ?, ?, 1)
      `
      await execute(insertSql, [targetChildId, membership.id, finalStartDate, finalEndDate])
    }

    res.json(successResponse({
      childId: targetChildId,
      membershipId: membership.id,
      tier,
      startDate: finalStartDate.toISOString().split('T')[0],
      endDate: finalEndDate.toISOString().split('T')[0],
      status: 1
    }))
  } catch (error) {
    console.error('开通会员失败:', error)
    res.status(500).json(errorResponse('开通会员失败'))
  }
}

// ============================================================
// 内容管理 - 家长学院
// ============================================================

/**
 * 获取文章列表 (管理)
 * GET /api/admin/academy/articles
 */
export async function getArticleList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const categoryId = req.query.categoryId as string
    const keyword = req.query.keyword as string
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (categoryId) {
      whereClause += ' AND category_id = ?'
      params.push(parseInt(categoryId))
    }
    
    if (keyword) {
      whereClause += ' AND (title LIKE ? OR author LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const countSql = `SELECT COUNT(*) as total FROM academy_article ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT a.*, c.category_name
      FROM academy_article a
      LEFT JOIN academy_category c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.publish_date DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取文章列表失败:', error)
    res.status(500).json(errorResponse('获取文章列表失败'))
  }
}

/**
 * 创建文章
 * POST /api/admin/academy/articles
 */
export async function createArticle(req: AdminRequest, res: Response) {
  try {
    const { title, content, summary, coverImage, categoryId, author, tags, isFeatured, isPublished } = req.body
    
    if (!title || !content || !categoryId) {
      return res.status(400).json(errorResponse('请填写完整信息'))
    }
    
    const sql = `
      INSERT INTO academy_article (title, content, summary, cover_image, category_id, author, tags, is_featured, is_published, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `
    const result = await execute(sql, [
      title, content, summary || '', coverImage || '', 
      categoryId, author || '管理员', 
      tags ? JSON.stringify(tags) : null, 
      isFeatured ? 1 : 0, 
      isPublished ? 1 : 0
    ])
    
    res.status(201).json(successResponse({ id: result.insertId }))
  } catch (error) {
    console.error('创建文章失败:', error)
    res.status(500).json(errorResponse('创建文章失败'))
  }
}

/**
 * 更新文章
 * PUT /api/admin/academy/articles/:id
 */
export async function updateArticle(req: AdminRequest, res: Response) {
  try {
    const articleId = parseInt(req.params.id)
    const { title, content, summary, coverImage, categoryId, author, tags, isFeatured, isPublished } = req.body
    
    // 检查文章是否存在
    const checkSql = 'SELECT id FROM academy_article WHERE id = ?'
    const existing = await queryOne<{ id: number }>(checkSql, [articleId])
    
    if (!existing) {
      return res.status(404).json(errorResponse('文章不存在'))
    }
    
    // 构建动态更新语句
    const updates: string[] = []
    const values: any[] = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (content !== undefined) {
      updates.push('content = ?')
      values.push(content)
    }
    if (summary !== undefined) {
      updates.push('summary = ?')
      values.push(summary || '')
    }
    if (coverImage !== undefined) {
      updates.push('cover_image = ?')
      values.push(coverImage || '')
    }
    if (categoryId !== undefined) {
      updates.push('category_id = ?')
      values.push(categoryId)
    }
    if (author !== undefined) {
      updates.push('author = ?')
      values.push(author || '管理员')
    }
    if (tags !== undefined) {
      updates.push('tags = ?')
      values.push(tags ? JSON.stringify(tags) : null)
    }
    if (isFeatured !== undefined) {
      updates.push('is_featured = ?')
      values.push(isFeatured ? 1 : 0)
    }
    if (isPublished !== undefined) {
      updates.push('is_published = ?')
      values.push(isPublished ? 1 : 0)
    }
    
    if (updates.length === 0) {
      return res.status(400).json(errorResponse('没有要更新的字段'))
    }
    
    values.push(articleId)
    
    const sql = `UPDATE academy_article SET ${updates.join(', ')} WHERE id = ?`
    const result = await execute(sql, values)
    
    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('文章不存在或未变更'))
    }
    
    res.json(successResponse({ message: '更新成功' }))
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json(errorResponse('更新文章失败'))
  }
}

/**
 * 删除文章
 * DELETE /api/admin/academy/articles/:id
 */
export async function deleteArticle(req: AdminRequest, res: Response) {
  try {
    const articleId = parseInt(req.params.id)
    
    const sql = "UPDATE academy_article SET is_deleted = 1 WHERE id = ?"
    const result = await execute(sql, [articleId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('文章不存在'))
    }
    
    res.json(successResponse({ message: '删除成功' }))
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json(errorResponse('删除文章失败'))
  }
}

// ============================================================
// 问题管理
// ============================================================

/**
 * 获取问题列表 (管理)
 * GET /api/admin/academy/questions
 */
export async function getQuestionList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const status = req.query.status as string // pending, answered, all
    
    let whereClause = 'WHERE q.is_deleted = 0'
    const params: any[] = []
    
    if (status === 'pending') {
      whereClause += " AND NOT EXISTS (SELECT 1 FROM academy_answer WHERE question_id = q.id)"
    } else if (status === 'answered') {
      whereClause += " AND EXISTS (SELECT 1 FROM academy_answer WHERE question_id = q.id)"
    }
    
    const countSql = `SELECT COUNT(*) as total FROM academy_question q ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT q.*, u.nickname as user_name, u.avatar as user_avatar,
             c.category_name,
             (SELECT COUNT(*) FROM academy_answer WHERE question_id = q.id) as answer_count
      FROM academy_question q
      LEFT JOIN user u ON q.user_id = u.id
      LEFT JOIN academy_question_category c ON q.category_id = c.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取问题列表失败:', error)
    res.status(500).json(errorResponse('获取问题列表失败'))
  }
}

/**
 * 回复问题
 * POST /api/admin/academy/questions/:id/answer
 */
export async function answerQuestion(req: AdminRequest, res: Response) {
  try {
    const questionId = parseInt(req.params.id)
    const { content, isExpert } = req.body
    
    if (!content) {
      return res.status(400).json(errorResponse('请填写回答内容'))
    }
    
    const sql = `
      INSERT INTO academy_answer (question_id, user_id, content, is_expert, created_at)
      VALUES (?, 0, ?, ?, NOW())
    `
    const result = await execute(sql, [questionId, content, isExpert ? 1 : 0])
    
    res.status(201).json(successResponse({ id: result.insertId }))
  } catch (error) {
    console.error('回复问题失败:', error)
    res.status(500).json(errorResponse('回复问题失败'))
  }
}

// ============================================================
// 游戏配置管理
// ============================================================

/**
 * 获取游戏列表 (管理)
 * GET /api/admin/games
 */
export async function getGameList(req: AdminRequest, res: Response) {
  try {
    const sql = 'SELECT * FROM game ORDER BY id ASC'
    const games = await query(sql)
    
    res.json(successResponse(games))
  } catch (error) {
    console.error('获取游戏列表失败:', error)
    res.status(500).json(errorResponse('获取游戏列表失败'))
  }
}

/**
 * 更新游戏配置
 * PUT /api/admin/games/:id
 */
export async function updateGame(req: AdminRequest, res: Response) {
  try {
    const gameId = parseInt(req.params.id)
    const { game_name, description, icon, difficulty_levels, min_age, max_age, training_focus, requires_vip, sort_order, status } = req.body
    
    // 检查游戏是否存在
    const checkSql = 'SELECT id FROM game WHERE id = ?'
    const existing = await queryOne<{ id: number }>(checkSql, [gameId])
    
    if (!existing) {
      return res.status(404).json(errorResponse('游戏不存在'))
    }
    
    // 构建动态更新语句
    const updates: string[] = []
    const values: any[] = []
    
    if (game_name !== undefined) {
      updates.push('game_name = ?')
      values.push(game_name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (icon !== undefined) {
      updates.push('icon = ?')
      values.push(icon)
    }
    if (difficulty_levels !== undefined) {
      updates.push('difficulty_levels = ?')
      values.push(difficulty_levels)
    }
    if (min_age !== undefined) {
      updates.push('min_age = ?')
      values.push(min_age)
    }
    if (max_age !== undefined) {
      updates.push('max_age = ?')
      values.push(max_age)
    }
    if (training_focus !== undefined) {
      updates.push('training_focus = ?')
      values.push(training_focus)
    }
    if (requires_vip !== undefined) {
      updates.push('requires_vip = ?')
      values.push(requires_vip ? 1 : 0)
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?')
      values.push(sort_order)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }
    
    if (updates.length === 0) {
      return res.status(400).json(errorResponse('没有要更新的字段'))
    }
    
    values.push(gameId)
    
    const sql = `UPDATE game SET ${updates.join(', ')} WHERE id = ?`
    const result = await execute(sql, values)
    
    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('游戏不存在或未变更'))
    }
    
    res.json(successResponse({ message: '更新成功' }))
  } catch (error) {
    console.error('更新游戏配置失败:', error)
    res.status(500).json(errorResponse('更新游戏配置失败'))
  }
}

// ============================================================
// 数据分析
// ============================================================

/**
 * 获取训练数据分析
 * GET /api/admin/analytics/training
 */
export async function getTrainingAnalytics(req: AdminRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30
    
    // 每日训练趋势
    const dailyTrendSql = `
      SELECT DATE(created_at) as date, 
             COUNT(*) as total_count,
             AVG(accuracy) as avg_accuracy,
             AVG(focus_score) as avg_focus_score,
             AVG(duration_seconds) as avg_duration
      FROM training_record
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    const dailyTrend = await query<any>(dailyTrendSql, [days])
    
    // 年龄段分布
    const ageGroupSql = `
      SELECT c.age_group, COUNT(*) as count, AVG(tr.accuracy) as avg_accuracy
      FROM training_record tr
      JOIN child c ON tr.child_id = c.id
      WHERE tr.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY c.age_group
    `
    const ageGroupStats = await query<any>(ageGroupSql, [days])
    
    // 游戏使用分布
    const gameStatsSql = `
      SELECT g.id, g.game_name, g.game_code,
             COUNT(*) as play_count,
             AVG(tr.accuracy) as avg_accuracy,
             AVG(tr.focus_score) as avg_focus_score
      FROM training_record tr
      JOIN game g ON tr.game_id = g.id
      WHERE tr.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY g.id, g.game_name, g.game_code
      ORDER BY play_count DESC
    `
    const gameStats = await query<any>(gameStatsSql, [days])
    
    res.json(successResponse({
      dailyTrend,
      ageGroupStats,
      gameStats
    }))
  } catch (error) {
    console.error('获取训练数据分析失败:', error)
    res.status(500).json(errorResponse('获取训练数据分析失败'))
  }
}

/**
 * 获取用户留存分析
 * GET /api/admin/analytics/retention
 */
export async function getRetentionAnalytics(req: AdminRequest, res: Response) {
  try {
    // 计算每日新增用户数和次日/7日/30日留存
    // 注意：training_record 通过 child_id 关联到 child，再关联到 user
    const retentionSql = `
      SELECT 
        DATE(u.created_at) as date,
        COUNT(DISTINCT u.id) as new_users,
        COUNT(DISTINCT CASE WHEN DATEDIFF(tr1.created_at, u.created_at) = 1 THEN u.id END) as d1_retained,
        COUNT(DISTINCT CASE WHEN DATEDIFF(tr7.created_at, u.created_at) = 7 THEN u.id END) as d7_retained,
        COUNT(DISTINCT CASE WHEN DATEDIFF(tr30.created_at, u.created_at) = 30 THEN u.id END) as d30_retained
      FROM user u
      LEFT JOIN training_record tr1 ON tr1.child_id IN (SELECT id FROM child WHERE user_id = u.id) AND DATEDIFF(tr1.created_at, u.created_at) = 1
      LEFT JOIN training_record tr7 ON tr7.child_id IN (SELECT id FROM child WHERE user_id = u.id) AND DATEDIFF(tr7.created_at, u.created_at) = 7
      LEFT JOIN training_record tr30 ON tr30.child_id IN (SELECT id FROM child WHERE user_id = u.id) AND DATEDIFF(tr30.created_at, u.created_at) = 30
      WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
      GROUP BY DATE(u.created_at)
      ORDER BY date ASC
    `
    const retention = await query<any>(retentionSql)
    
    res.json(successResponse(retention))
  } catch (error) {
    console.error('获取留存分析失败:', error)
    res.status(500).json(errorResponse('获取留存分析失败'))
  }
}

// ============================================================
// 训练记录管理
// ============================================================

/**
 * 获取训练记录列表
 * GET /api/admin/training/records
 */
export async function getTrainingRecords(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const childId = req.query.childId as string
    const gameId = req.query.gameId as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (childId) {
      whereClause += ' AND tr.child_id = ?'
      params.push(parseInt(childId))
    }
    
    if (gameId) {
      whereClause += ' AND tr.game_id = ?'
      params.push(parseInt(gameId))
    }
    
    if (startDate) {
      whereClause += ' AND tr.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND tr.created_at <= ?'
      params.push(endDate + ' 23:59:59')
    }
    
    const countSql = `SELECT COUNT(*) as total FROM training_record tr ${whereClause}`
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT tr.*, c.name as child_name, g.game_name, g.game_code
      FROM training_record tr
      LEFT JOIN child c ON tr.child_id = c.id
      LEFT JOIN game g ON tr.game_id = g.id
      ${whereClause}
      ORDER BY tr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取训练记录失败:', error)
    res.status(500).json(errorResponse('获取训练记录失败'))
  }
}

/**
 * 获取指定儿童的训练记录
 * GET /api/admin/training/child/:childId
 */
export async function getChildTrainingRecords(req: AdminRequest, res: Response) {
  try {
    const childId = parseInt(req.params.childId)
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    
    // 检查儿童是否存在
    const childSql = 'SELECT * FROM child WHERE id = ? AND status = 1'
    const child = await queryOne<any>(childSql, [childId])
    
    if (!child) {
      return res.status(404).json(errorResponse('儿童不存在'))
    }
    
    const countSql = 'SELECT COUNT(*) as total FROM training_record WHERE child_id = ?'
    const countResult = await queryOne<{ total: number }>(countSql, [childId])
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT tr.*, g.game_name, g.game_code
      FROM training_record tr
      LEFT JOIN game g ON tr.game_id = g.id
      WHERE tr.child_id = ?
      ORDER BY tr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, [childId])
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize,
      child
    }))
  } catch (error) {
    console.error('获取儿童训练记录失败:', error)
    res.status(500).json(errorResponse('获取儿童训练记录失败'))
  }
}

/**
 * 获取训练记录详情
 * GET /api/admin/training/records/:id
 */
export async function getTrainingRecordDetail(req: AdminRequest, res: Response) {
  try {
    const recordId = parseInt(req.params.id)
    
    const sql = `
      SELECT tr.*, c.name as child_name, c.age as child_age, c.age_group,
             g.game_name, g.game_code, g.description as game_description
      FROM training_record tr
      LEFT JOIN child c ON tr.child_id = c.id
      LEFT JOIN game g ON tr.game_id = g.id
      WHERE tr.id = ?
    `
    const record = await queryOne(sql, [recordId])
    
    if (!record) {
      return res.status(404).json(errorResponse('训练记录不存在'))
    }
    
    res.json(successResponse(record))
  } catch (error) {
    console.error('获取训练记录详情失败:', error)
    res.status(500).json(errorResponse('获取训练记录详情失败'))
  }
}

/**
 * 获取今日训练数据
 * GET /api/admin/training/today
 */
export async function getTodayTraining(req: AdminRequest, res: Response) {
  try {
    // 今日统计
    const todayStatsSql = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT child_id) as total_children,
        COALESCE(SUM(duration_seconds), 0) as total_duration,
        AVG(accuracy) as avg_accuracy,
        AVG(focus_score) as avg_focus_score
      FROM training_record
      WHERE DATE(created_at) = CURDATE()
    `
    const todayStats = await queryOne<any>(todayStatsSql)
    
    // 今日热门游戏
    const topGamesSql = `
      SELECT g.game_name, COUNT(*) as count
      FROM training_record tr
      JOIN game g ON tr.game_id = g.id
      WHERE DATE(tr.created_at) = CURDATE()
      GROUP BY g.id, g.game_name
      ORDER BY count DESC
      LIMIT 5
    `
    const topGames = await query<{ game_name: string; count: number }>(topGamesSql)
    
    // 今日最新训练记录
    const todayRecordsSql = `
      SELECT tr.*, c.name as child_name, g.game_name, g.game_code
      FROM training_record tr
      LEFT JOIN child c ON tr.child_id = c.id
      LEFT JOIN game g ON tr.game_id = g.id
      WHERE DATE(tr.created_at) = CURDATE()
      ORDER BY tr.created_at DESC
      LIMIT 20
    `
    const records = await query(todayRecordsSql)
    
    res.json(successResponse({
      date: new Date().toISOString().split('T')[0],
      total_records: todayStats?.total_records ?? 0,
      total_children: todayStats?.total_children ?? 0,
      total_duration: todayStats?.total_duration ?? 0,
      avg_accuracy: todayStats?.avg_accuracy ?? 0,
      avg_focus_score: todayStats?.avg_focus_score ?? 0,
      top_games: topGames,
      records
    }))
  } catch (error) {
    console.error('获取今日训练数据失败:', error)
    res.status(500).json(errorResponse('获取今日训练数据失败'))
  }
}

// ============================================================
// 评估报告
// ============================================================

/**
 * 获取儿童评估报告
 * GET /api/admin/assessment/child/:childId
 */
export async function getChildAssessmentReport(req: AdminRequest, res: Response) {
  try {
    const childId = parseInt(req.params.childId)
    
    // 获取儿童信息
    const childSql = 'SELECT * FROM child WHERE id = ? AND status = 1'
    const child = await queryOne<any>(childSql, [childId])
    
    if (!child) {
      return res.status(404).json(errorResponse('儿童不存在'))
    }
    
    // 获取训练历史统计
    const historySql = `
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_duration,
        AVG(accuracy) as avg_accuracy,
        MIN(accuracy) as min_accuracy,
        MAX(accuracy) as max_accuracy
      FROM training_record
      WHERE child_id = ?
    `
    const history = await queryOne<any>(historySql, [childId])
    
    // 计算进步率 (最近10次 vs 最早10次)
    const improvementSql = `
      SELECT 
        (SELECT AVG(accuracy) FROM (
          SELECT accuracy FROM training_record WHERE child_id = ?
          ORDER BY created_at ASC LIMIT 10
        ) as early) as early_avg,
        (SELECT AVG(accuracy) FROM (
          SELECT accuracy FROM training_record WHERE child_id = ?
          ORDER BY created_at DESC LIMIT 10
        ) as recent) as recent_avg
    `
    const improvement = await queryOne<{ early_avg: number; recent_avg: number }>(improvementSql, [childId, childId])
    
    const improvementRate = improvement?.early_avg 
      ? ((improvement.recent_avg - improvement.early_avg) / improvement.early_avg * 100).toFixed(1)
      : 0
    
    // 获取各游戏表现
    const gamePerformanceSql = `
      SELECT g.game_name, g.game_code,
             COUNT(*) as play_count,
             AVG(tr.score) as avg_score,
             AVG(tr.accuracy) as avg_accuracy
      FROM training_record tr
      JOIN game g ON tr.game_id = g.id
      WHERE tr.child_id = ?
      GROUP BY g.id, g.game_name, g.game_code
      ORDER BY play_count DESC
    `
    const gamePerformance = await query(gamePerformanceSql, [childId])
    
    // 7维度评估 (基于训练数据计算)
    const dimensions = calculateDimensions(childId, history, gamePerformance)
    
    // 计算综合得分
    const overallScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
    const overallLevel = getLevelFromScore(overallScore)
    
    // 生成建议
    const recommendations = generateRecommendations(dimensions, gamePerformance)
    
    res.json(successResponse({
      child_id: child.id,
      child_name: child.name,
      age: child.age,
      age_group: child.age_group,
      generated_at: new Date().toISOString(),
      dimensions,
      overall_score: Math.round(overallScore * 100) / 100,
      overall_level: overallLevel,
      recommendations,
      training_history: {
        total_sessions: history?.total_sessions ?? 0,
        total_duration: history?.total_duration ?? 0,
        avg_accuracy: history?.avg_accuracy ?? 0,
        improvement_rate: parseFloat(improvementRate as string)
      },
      game_performance: gamePerformance
    }))
  } catch (error) {
    console.error('获取评估报告失败:', error)
    res.status(500).json(errorResponse('获取评估报告失败'))
  }
}

/**
 * 获取评估报告列表
 * GET /api/admin/assessment/list
 */
export async function getAssessmentReportList(req: AdminRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const childId = req.query.childId as string
    
    let whereClause = 'WHERE c.status = 1'
    const params: any[] = []
    
    if (childId) {
      whereClause += ' AND c.id = ?'
      params.push(parseInt(childId))
    }
    
    // 获取有训练记录的儿童
    const countSql = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM child c
      INNER JOIN training_record tr ON c.id = tr.child_id
      ${whereClause}
    `
    const countResult = await queryOne<{ total: number }>(countSql, params)
    
    const offset = (page - 1) * pageSize
    const listSql = `
      SELECT c.id as child_id, c.name as child_name, c.age, c.age_group,
             COUNT(tr.id) as total_sessions,
             AVG(tr.accuracy) as avg_accuracy,
             AVG(tr.focus_score) as avg_focus_score,
             MAX(tr.created_at) as last_training_at
      FROM child c
      LEFT JOIN training_record tr ON c.id = tr.child_id
      ${whereClause}
      GROUP BY c.id, c.name, c.age, c.age_group
      HAVING total_sessions > 0
      ORDER BY last_training_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const list = await query(listSql, params)
    
    res.json(successResponse({
      list,
      total: countResult?.total ?? 0,
      page,
      pageSize
    }))
  } catch (error) {
    console.error('获取评估报告列表失败:', error)
    res.status(500).json(errorResponse('获取评估报告列表失败'))
  }
}

// ============================================================
// 辅助函数
// ============================================================

interface Dimension {
  name: string
  score: number
  level: string
  description: string
}

function calculateDimensions(childId: number, history: any, gamePerformance: any[]): Dimension[] {
  // 基于游戏类型映射到7个维度
  const dimensionMapping: Record<string, string[]> = {
    '视觉搜索': ['visual_search', 'sustained_attention'],
    '舒尔特': ['visual_search', 'sustained_attention'],
    '听觉': ['auditory_attention', 'working_memory'],
    '听声': ['auditory_attention', 'auditory_memory'],
    '记忆': ['visual_memory', 'working_memory'],
    '图案': ['visual_memory', 'selective_attention'],
    '视觉': ['visual_tracking', 'selective_attention'],
    '追踪': ['visual_tracking', 'selective_attention'],
    '节奏': ['rhythm_perception', 'sustained_attention'],
    '迷宫': ['spatial_cognition', 'problem_solving'],
    '排序': ['working_memory', 'problem_solving'],
    '反应': ['response_speed', 'selective_attention']
  }
  
  // 初始化维度得分
  const dimensions: Record<string, { scores: number[]; count: number }> = {
    '视觉搜索': { scores: [], count: 0 },
    '听觉注意': { scores: [], count: 0 },
    '视觉记忆': { scores: [], count: 0 },
    '听觉记忆': { scores: [], count: 0 },
    '视觉追踪': { scores: [], count: 0 },
    '工作记忆': { scores: [], count: 0 },
    '注意力': { scores: [], count: 0 }
  }
  
  // 映射游戏表现到维度
  gamePerformance.forEach((game: any) => {
    const gameName = game.game_name || ''
    const accuracy = game.avg_accuracy || 0
    const mappedDimensions = Object.entries(dimensionMapping)
      .filter(([key]) => gameName.includes(key))
      .flatMap(([, dims]) => dims)
    
    if (mappedDimensions.length === 0) {
      // 默认添加到注意力维度
      dimensions['注意力'].scores.push(accuracy)
      dimensions['注意力'].count++
    } else {
      mappedDimensions.forEach(dim => {
        const dimName = getDimensionChineseName(dim)
        if (dimensions[dimName]) {
          dimensions[dimName].scores.push(accuracy)
          dimensions[dimName].count++
        }
      })
    }
  })
  
  // 计算维度得分
  const results: Dimension[] = []
  Object.entries(dimensions).forEach(([name, data]) => {
    if (data.count > 0) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.count
      results.push({
        name,
        score: Math.round(avgScore * 100),
        level: getLevelFromScore(avgScore * 100),
        description: getDimensionDescription(name, avgScore * 100)
      })
    } else {
      // 没有数据的维度给予默认值
      results.push({
        name,
        score: 0,
        level: '暂无数据',
        description: '暂无训练数据'
      })
    }
  })
  
  return results
}

function getDimensionChineseName(enName: string): string {
  const mapping: Record<string, string> = {
    'visual_search': '视觉搜索',
    'sustained_attention': '注意力',
    'auditory_attention': '听觉注意',
    'auditory_memory': '听觉记忆',
    'visual_memory': '视觉记忆',
    'working_memory': '工作记忆',
    'visual_tracking': '视觉追踪',
    'selective_attention': '注意力',
    'rhythm_perception': '注意力',
    'spatial_cognition': '工作记忆',
    'problem_solving': '工作记忆',
    'response_speed': '注意力'
  }
  return mapping[enName] || '注意力'
}

function getLevelFromScore(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '需提升'
}

function getDimensionDescription(name: string, score: number): string {
  if (score >= 90) {
    return `${name}能力优秀，表现突出`
  } else if (score >= 80) {
    return `${name}能力良好，继续保持`
  } else if (score >= 70) {
    return `${name}能力中等，建议加强练习`
  } else if (score >= 60) {
    return `${name}能力及格，需要更多训练`
  } else {
    return `${name}能力需提升，建议多进行相关训练`
  }
}

function generateRecommendations(dimensions: Dimension[], gamePerformance: any[]): string[] {
  const recommendations: string[] = []
  
  // 找出得分最低的维度
  const lowDimensions = dimensions
    .filter(d => d.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
  
  lowDimensions.forEach(dim => {
    if (dim.name === '视觉搜索') {
      recommendations.push('建议多玩舒尔特方格等视觉搜索类游戏，提升视觉搜索能力')
    } else if (dim.name === '听觉注意') {
      recommendations.push('建议多玩听声辨数等听觉类游戏，训练听觉注意力')
    } else if (dim.name === '视觉记忆') {
      recommendations.push('建议多玩图案记忆等记忆类游戏，增强视觉记忆力')
    } else if (dim.name === '听觉记忆') {
      recommendations.push('建议多进行听觉记忆训练，提升听觉记忆能力')
    } else if (dim.name === '视觉追踪') {
      recommendations.push('建议多玩视觉追踪类游戏，训练眼球追踪能力')
    } else if (dim.name === '工作记忆') {
      recommendations.push('建议多玩快速排序等游戏，锻炼工作记忆能力')
    } else if (dim.name === '注意力') {
      recommendations.push('建议加强专注力训练，可尝试节奏点击等游戏')
    }
  })
  
  // 基于游戏表现给出建议
  const lowGames = gamePerformance.filter(g => (g.avg_accuracy || 0) < 60).slice(0, 1)
  lowGames.forEach(game => {
    recommendations.push(`建议加强${game.game_name}游戏的练习，提高游戏表现`)
  })
  
  // 如果表现都不错
  if (recommendations.length === 0 && gamePerformance.length > 0) {
    recommendations.push('整体表现优秀，建议保持当前的训练频率和游戏组合')
    recommendations.push('可以尝试更多不同类型的游戏，全面提升各项能力')
  }
  
  return recommendations.slice(0, 5)
}