import { query, queryOne, execute } from '../config/database'
import type { DbTrainingRecord } from '../types'

interface RecordWithGame extends DbTrainingRecord {
  game_name: string
  game_code: string
}

export class TrainingRecordModel {
  static async create(data: {
    childId: number
    gameId: number
    durationSeconds: number
    accuracy: number
    score: number
    focusScore: number
    difficultyLevel: number
    gameConfig?: Record<string, unknown>
    resultData?: Record<string, unknown>
  }): Promise<number> {
    const result = await execute(
      `INSERT INTO training_record
       (child_id, game_id, duration_seconds, accuracy, score, focus_score, difficulty_level, game_config, result_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.childId,
        data.gameId,
        data.durationSeconds,
        data.accuracy,
        data.score,
        data.focusScore,
        data.difficultyLevel,
        data.gameConfig ? JSON.stringify(data.gameConfig) : null,
        data.resultData ? JSON.stringify(data.resultData) : null,
      ]
    )
    return result.insertId
  }

  static async findByChildId(
    childId: number,
    options: { page?: number; pageSize?: number; gameCode?: string } = {}
  ): Promise<{ list: RecordWithGame[]; total: number }> {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const offset = (page - 1) * pageSize

    let where = 'WHERE tr.child_id = ?'
    const params: unknown[] = [childId]

    if (options.gameCode) {
      where += ' AND g.game_code = ?'
      params.push(options.gameCode)
    }

    const countResult = await queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM training_record tr
       JOIN game g ON g.id = tr.game_id ${where}`,
      params
    )
    const total = countResult?.cnt ?? 0

    const list = await query<RecordWithGame>(
      `SELECT tr.*, g.game_name, g.game_code
       FROM training_record tr
       JOIN game g ON g.id = tr.game_id
       ${where}
       ORDER BY tr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return { list, total }
  }

  static async findTodayByChildId(childId: number): Promise<RecordWithGame[]> {
    return query<RecordWithGame>(
      `SELECT tr.*, g.game_name, g.game_code
       FROM training_record tr
       JOIN game g ON g.id = tr.game_id
       WHERE tr.child_id = ?
         AND DATE(tr.created_at) = CURDATE()
       ORDER BY tr.created_at DESC`,
      [childId]
    )
  }

  static async getStreak(childId: number): Promise<number> {
    // 计算连续打卡天数
    const rows = await query<{ date: string }>(
      `SELECT DATE(created_at) AS date
       FROM training_record
       WHERE child_id = ?
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [childId]
    )

    if (rows.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < rows.length; i++) {
      const recordDate = new Date(rows[i].date)
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (recordDate.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  static async getTotalCount(childId: number): Promise<number> {
    const row = await queryOne<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM training_record WHERE child_id = ?',
      [childId]
    )
    return row?.cnt ?? 0
  }

  static toPublic(record: RecordWithGame) {
    return {
      id: record.id,
      childId: record.child_id,
      gameId: record.game_id,
      gameName: record.game_name,
      gameCode: record.game_code,
      durationSeconds: record.duration_seconds,
      accuracy: record.accuracy,
      score: record.score,
      focusScore: record.focus_score,
      difficultyLevel: record.difficulty_level,
      createdAt: record.created_at,
    }
  }
}
