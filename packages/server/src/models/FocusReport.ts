import { query, queryOne, execute } from '../config/database'
import type { DbFocusReport } from '../types'

export class FocusReportModel {
  static async findByChildAndDate(
    childId: number,
    reportType: 'daily' | 'weekly',
    reportDate: string
  ): Promise<DbFocusReport | null> {
    return queryOne<DbFocusReport>(
      'SELECT * FROM focus_report WHERE child_id = ? AND report_type = ? AND report_date = ?',
      [childId, reportType, reportDate]
    )
  }

  static async upsert(data: {
    childId: number
    reportType: 'daily' | 'weekly'
    reportDate: string
    trainingCount: number
    totalDuration: number
    avgFocusScore: number
    trendData?: unknown
    highlights?: unknown
  }): Promise<void> {
    await execute(
      `INSERT INTO focus_report
       (child_id, report_type, report_date, training_count, total_duration, avg_focus_score, trend_data, highlights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         training_count = VALUES(training_count),
         total_duration = VALUES(total_duration),
         avg_focus_score = VALUES(avg_focus_score),
         trend_data = VALUES(trend_data),
         highlights = VALUES(highlights),
         updated_at = NOW()`,
      [
        data.childId,
        data.reportType,
        data.reportDate,
        data.trainingCount,
        data.totalDuration,
        data.avgFocusScore,
        data.trendData ? JSON.stringify(data.trendData) : null,
        data.highlights ? JSON.stringify(data.highlights) : null,
      ]
    )
  }

  static async getWeeklyStats(
    childId: number,
    weekStart: string
  ): Promise<
    Array<{ date: string; training_count: number; total_duration: number; avg_focus_score: number }>
  > {
    return query(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*) AS training_count,
         SUM(duration_seconds) AS total_duration,
         ROUND(AVG(focus_score)) AS avg_focus_score
       FROM training_record
       WHERE child_id = ?
         AND DATE(created_at) >= ?
         AND DATE(created_at) < DATE_ADD(?, INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [childId, weekStart, weekStart]
    )
  }

  static async getGameBreakdownForWeek(
    childId: number,
    weekStart: string
  ): Promise<Array<{ game_code: string; game_name: string; count: number; avg_score: number }>> {
    return query(
      `SELECT
         g.game_code,
         g.game_name,
         COUNT(*) AS count,
         ROUND(AVG(tr.score)) AS avg_score
       FROM training_record tr
       JOIN game g ON g.id = tr.game_id
       WHERE tr.child_id = ?
         AND DATE(tr.created_at) >= ?
         AND DATE(tr.created_at) < DATE_ADD(?, INTERVAL 7 DAY)
       GROUP BY g.id
       ORDER BY count DESC`,
      [childId, weekStart, weekStart]
    )
  }

  /**
   * 获取用户的报告列表
   */
  static async findByUserId(
    userId: number,
    page: number,
    pageSize: number,
    childId?: number
  ): Promise<{ reports: DbFocusReport[]; total: number }> {
    let sql = `
      SELECT fr.* FROM focus_report fr
      JOIN child c ON fr.child_id = c.id
      WHERE c.user_id = ?
    `
    const params: any[] = [userId]

    if (childId) {
      sql += ' AND fr.child_id = ?'
      params.push(childId)
    }

    // Get total count
    const countSql = sql.replace('SELECT fr.*', 'SELECT COUNT(*) as total')
    const countResult = await queryOne<{ total: number }>(countSql, params)
    const total = countResult?.total || 0

    // Get paginated results
    sql += ' ORDER BY fr.created_at DESC LIMIT ? OFFSET ?'
    params.push(pageSize, (page - 1) * pageSize)
    const reports = await query<DbFocusReport>(sql, params)

    return { reports, total }
  }

  /**
   * 根据ID和用户ID获取报告详情
   */
  static async findByIdWithAuth(reportId: number, userId: number): Promise<DbFocusReport | null> {
    return queryOne<DbFocusReport>(
      `SELECT fr.* FROM focus_report fr
       JOIN child c ON fr.child_id = c.id
       WHERE fr.id = ? AND c.user_id = ?`,
      [reportId, userId]
    )
  }

  /**
   * 获取孩子最新报告
   */
  static async findLatestByChildId(childId: number): Promise<DbFocusReport | null> {
    return queryOne<DbFocusReport>(
      `SELECT * FROM focus_report 
       WHERE child_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [childId]
    )
  }

  /**
   * 为孩子生成报告
   */
  static async generateForChild(
    childId: number,
    reportType: 'daily' | 'weekly'
  ): Promise<DbFocusReport> {
    const reportDate = reportType === 'daily'
      ? new Date().toISOString().split('T')[0]
      : getWeekStart(new Date())

    // 获取训练统计
    const startDate = reportType === 'daily'
      ? new Date().toISOString().split('T')[0]
      : getWeekStart(new Date())

    const stats = await queryOne<{
      training_count: number
      total_duration: number
      avg_focus_score: number
    }>(
      `SELECT 
         COUNT(*) as training_count,
         COALESCE(SUM(duration_seconds), 0) as total_duration,
         COALESCE(ROUND(AVG(focus_score)), 0) as avg_focus_score
       FROM training_record
       WHERE child_id = ?
         AND created_at >= ?
         ${reportType === 'daily' ? 'AND created_at < DATE_ADD(?, INTERVAL 1 DAY)' : ''}`,
      [childId, startDate, startDate]
    )

    // 插入/更新报告
    await this.upsert({
      childId,
      reportType,
      reportDate,
      trainingCount: stats?.training_count || 0,
      totalDuration: stats?.total_duration || 0,
      avgFocusScore: stats?.avg_focus_score || 0,
    })

    // 返回生成的报告
    return (await this.findByChildAndDate(childId, reportType, reportDate))!
  }
}

// 辅助函数：获取周开始日期
function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0] as string
}
