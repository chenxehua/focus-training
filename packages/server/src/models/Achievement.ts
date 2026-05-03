/**
 * 成就模型
 * 提供成就数据的增删改查操作
 */

import { query, queryOne, execute } from '../config/database'

export interface AchievementData {
  id?: number
  achievement_code: string
  achievement_name: string
  achievement_type: string
  description?: string | null
  icon_url?: string | null
  requirement_type: string
  requirement_value: number
  experience_reward?: number
  is_active?: number
  sort_order?: number
}

export interface ChildAchievementData {
  id?: number
  child_id: number
  achievement_id: number
  progress?: number
  is_unlocked?: number
  unlocked_at?: Date | null
}

export class AchievementModel {
  /**
   * 根据ID查询成就
   */
  static async findById(id: number): Promise<AchievementData | null> {
    return queryOne<AchievementData>('SELECT * FROM achievement WHERE id = ?', [id])
  }

  /**
   * 根据代码查询成就
   */
  static async findByCode(code: string): Promise<AchievementData | null> {
    return queryOne<AchievementData>('SELECT * FROM achievement WHERE achievement_code = ?', [code])
  }

  /**
   * 获取所有启用的成就列表
   */
  static async findAll(where?: { achievement_type?: string; is_active?: number }): Promise<AchievementData[]> {
    let sql = 'SELECT * FROM achievement WHERE 1=1'
    const values: unknown[] = []

    if (where?.achievement_type) {
      sql += ' AND type = ?'
      values.push(where.achievement_type)
    }
    // 使用 status 字段代替 is_active (status = 1 表示启用)
    if (where?.is_active !== undefined) {
      sql += ' AND status = ?'
      values.push(where.is_active)
    }

    sql += ' ORDER BY sort_order ASC, id ASC'

    return query<AchievementData>(sql, values)
  }

  /**
   * 创建成就
   */
  static async create(data: AchievementData): Promise<number> {
    const result = await execute(
      `INSERT INTO achievement (achievement_code, achievement_name, achievement_type, description,
        icon_url, requirement_type, requirement_value, experience_reward, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.achievement_code,
        data.achievement_name,
        data.achievement_type,
        data.description ?? null,
        data.icon_url ?? null,
        data.requirement_type,
        data.requirement_value,
        data.experience_reward ?? 50,
        data.is_active ?? 1,
        data.sort_order ?? 0
      ]
    )
    return result.insertId
  }

  /**
   * 获取儿童的所有成就（包括已解锁和未解锁的）
   */
  static async getChildAchievements(childId: number): Promise<(AchievementData & { progress: number; is_unlocked: boolean; unlocked_at: Date | null })[]> {
    const achievements = await this.findAll({ is_active: 1 })

    const unlockedRecords = await query<ChildAchievementData>(
      'SELECT * FROM child_achievement WHERE child_id = ?',
      [childId]
    )

    return achievements.map(achievement => {
      const record = unlockedRecords.find(r => r.achievement_id === achievement.id!)
      return {
        ...achievement,
        progress: record?.progress ?? 0,
        is_unlocked: record?.is_unlocked === 1,
        unlocked_at: record?.unlocked_at ?? null
      }
    })
  }

  /**
   * 获取儿童已解锁的成就
   */
  static async getUnlockedByChild(childId: number): Promise<ChildAchievementData[]> {
    return query<ChildAchievementData>(
      'SELECT * FROM child_achievement WHERE child_id = ? AND is_unlocked = 1',
      [childId]
    )
  }

  /**
   * 创建或更新儿童成就进度
   */
  static async upsertChildAchievement(childId: number, achievementId: number, progress: number): Promise<void> {
    const existing = await queryOne<ChildAchievementData>(
      'SELECT * FROM child_achievement WHERE child_id = ? AND achievement_id = ?',
      [childId, achievementId]
    )

    if (existing) {
      await execute(
        'UPDATE child_achievement SET progress = ?, updated_at = NOW() WHERE id = ?',
        [progress, existing.id]
      )
    } else {
      await execute(
        'INSERT INTO child_achievement (child_id, achievement_id, progress, is_unlocked) VALUES (?, ?, ?, ?)',
        [childId, achievementId, progress, 0]
      )
    }
  }

  /**
   * 解锁儿童成就
   */
  static async unlockAchievement(childId: number, achievementId: number): Promise<void> {
    const existing = await queryOne<ChildAchievementData>(
      'SELECT * FROM child_achievement WHERE child_id = ? AND achievement_id = ?',
      [childId, achievementId]
    )

    if (existing) {
      await execute(
        'UPDATE child_achievement SET is_unlocked = 1, unlocked_at = NOW(), progress = 100, updated_at = NOW() WHERE id = ?',
        [existing.id]
      )
    } else {
      await execute(
        'INSERT INTO child_achievement (child_id, achievement_id, progress, is_unlocked, unlocked_at) VALUES (?, ?, ?, ?, ?)',
        [childId, achievementId, 100, 1, new Date()]
      )
    }
  }

  /**
   * 获取成就解锁统计
   */
  static async getStats(childId: number): Promise<{ total: number; unlocked: number; progress: number }> {
    const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM achievement WHERE status = 1')
    const unlocked = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM child_achievement WHERE child_id = ? AND is_unlocked = 1',
      [childId]
    )

    return {
      total: total?.count ?? 0,
      unlocked: unlocked?.count ?? 0,
      progress: total && total.count > 0 ? Math.round((unlocked?.count ?? 0) / total.count * 100) : 0
    }
  }
}

export default AchievementModel