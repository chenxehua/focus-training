/**
 * 游戏模型
 * 提供游戏数据的增删改查操作
 */

import { query, queryOne, execute } from '../config/database'
import type { DbGame } from '../types'

export interface GameData {
  id?: number
  game_code: string
  game_name: string
  game_type: string
  description?: string | null
  icon_url?: string | null
  thumbnail_url?: string | null
  difficulty_levels?: number
  target_age_group?: string
  training_focus?: string
  base_experience?: number
  is_active?: number
  is_vip?: number
  sort_order?: number
}

export class GameModel {
  /**
   * 根据ID查询游戏
   */
  static async findById(id: number): Promise<DbGame | null> {
    return queryOne<DbGame>('SELECT * FROM game WHERE id = ?', [id])
  }

  /**
   * 根据游戏代码查询游戏
   */
  static async findByCode(gameCode: string): Promise<DbGame | null> {
    return queryOne<DbGame>('SELECT * FROM game WHERE game_code = ?', [gameCode])
  }

  /**
   * 获取所有启用的游戏列表
   */
  static async findAll(where?: { is_active?: number; game_type?: string }): Promise<DbGame[]> {
    let sql = 'SELECT * FROM game'
    const conditions: string[] = []
    const values: unknown[] = []

    if (where?.is_active !== undefined) {
      conditions.push('is_active = ?')
      values.push(where.is_active)
    }
    if (where?.game_type) {
      conditions.push('game_type = ?')
      values.push(where.game_type)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY sort_order ASC, id ASC'

    return query<DbGame>(sql, values)
  }

  /**
   * 创建游戏
   */
  static async create(data: GameData): Promise<number> {
    const result = await execute(
      `INSERT INTO game (game_code, game_name, game_type, description, icon_url, thumbnail_url,
        difficulty_levels, target_age_group, training_focus, base_experience, is_active, is_vip, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.game_code,
        data.game_name,
        data.game_type,
        data.description ?? null,
        data.icon_url ?? null,
        data.thumbnail_url ?? null,
        data.difficulty_levels ?? 5,
        data.target_age_group ?? '["4-6","7-9","10-12"]',
        data.training_focus ?? '[]',
        data.base_experience ?? 10,
        data.is_active ?? 1,
        data.is_vip ?? 0,
        data.sort_order ?? 0
      ]
    )
    return result.insertId
  }

  /**
   * 更新游戏
   */
  static async update(id: number, data: Partial<GameData>): Promise<void> {
    const fields: string[] = []
    const values: unknown[] = []

    const allowedFields = [
      'game_name', 'game_type', 'description', 'icon_url', 'thumbnail_url',
      'difficulty_levels', 'target_age_group', 'training_focus',
      'base_experience', 'is_active', 'is_vip', 'sort_order'
    ]

    for (const field of allowedFields) {
      if (field in data) {
        fields.push(`${field} = ?`)
        values.push((data as Record<string, unknown>)[field])
      }
    }

    if (fields.length === 0) return

    values.push(id)
    await execute(`UPDATE game SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values)
  }

  /**
   * 删除游戏（软删除）
   */
  static async delete(id: number): Promise<void> {
    await execute('UPDATE game SET is_active = 0, updated_at = NOW() WHERE id = ?', [id])
  }

  /**
   * 获取免费游戏列表
   */
  static async findFreeGames(): Promise<DbGame[]> {
    return query<DbGame>('SELECT * FROM game WHERE is_active = 1 AND is_vip = 0 ORDER BY sort_order ASC')
  }

  /**
   * 获取VIP游戏列表
   */
  static async findVipGames(): Promise<DbGame[]> {
    return query<DbGame>('SELECT * FROM game WHERE is_active = 1 AND is_vip = 1 ORDER BY sort_order ASC')
  }
}

export default GameModel