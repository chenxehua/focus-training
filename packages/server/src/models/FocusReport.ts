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
}
