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