import { query, queryOne, execute } from '../config/database'
import type { DbChild } from '../types'

export class ChildModel {
  static async findById(id: number): Promise<DbChild | null> {
    return queryOne<DbChild>('SELECT * FROM child WHERE id = ?', [id])
  }

  static async findByUserId(userId: number): Promise<DbChild[]> {
    return query<DbChild>(
      `SELECT c.* FROM child c
       INNER JOIN parent_child pc ON pc.child_id = c.id
       WHERE pc.user_id = ?
       ORDER BY c.created_at ASC`,
      [userId]
    )
  }

  static async isOwnedByUser(childId: number, userId: number): Promise<boolean> {
    const row = await queryOne<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM parent_child WHERE child_id = ? AND user_id = ?',
      [childId, userId]
    )
    return (row?.cnt ?? 0) > 0
  }

  static async create(
    userId: number,
    data: {
      name: string
      age: number
      gender: 'male' | 'female'
      ageGroup: '4-6' | '7-9' | '10-12'
      avatar?: string
    }
  ): Promise<number> {
    const result = await execute(
      'INSERT INTO child (name, age, gender, age_group, avatar, level, experience) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.age, data.gender, data.ageGroup, data.avatar ?? null, 1, 0]
    )
    const childId = result.insertId

    // 建立家长-孩子关联
    await execute(
      'INSERT INTO parent_child (user_id, child_id) VALUES (?, ?)',
      [userId, childId]
    )

    return childId
  }

  static async update(
    id: number,
    data: { name?: string; age?: number; gender?: string; avatar?: string }
  ): Promise<void> {
    const fields: string[] = []
    const values: unknown[] = []

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
    if (data.age !== undefined) { fields.push('age = ?'); values.push(data.age) }
    if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender) }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar) }

    if (fields.length === 0) return

    values.push(id)
    await execute(`UPDATE child SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values)
  }

  static async addExperience(id: number, exp: number): Promise<void> {
    await execute(
      `UPDATE child
       SET experience = experience + ?,
           level = GREATEST(1, FLOOR((experience + ?) / 100) + 1),
           updated_at = NOW()
       WHERE id = ?`,
      [exp, exp, id]
    )
  }

  static toPublic(child: DbChild) {
    return {
      id: child.id,
      name: child.name,
      age: child.age,
      gender: child.gender,
      avatar: child.avatar,
      ageGroup: child.age_group,
      level: child.level,
      experience: child.experience,
    }
  }
}
