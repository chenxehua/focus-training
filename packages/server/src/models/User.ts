import { query, queryOne, execute } from '../config/database'
import type { DbUser } from '../types'

export class UserModel {
  static async findById(id: number): Promise<DbUser | null> {
    return queryOne<DbUser>('SELECT * FROM user WHERE id = ?', [id])
  }

  static async findByOpenid(openid: string): Promise<DbUser | null> {
    return queryOne<DbUser>('SELECT * FROM user WHERE openid = ?', [openid])
  }

  static async findByPhone(phone: string): Promise<DbUser | null> {
    return queryOne<DbUser>('SELECT * FROM user WHERE phone = ?', [phone])
  }

  static async create(data: {
    openid: string
    nickname?: string
    avatar?: string
    phone?: string
  }): Promise<number> {
    const result = await execute(
      'INSERT INTO user (openid, nickname, avatar, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.openid, data.nickname ?? null, data.avatar ?? null, data.phone ?? null, 'parent', 1]
    )
    return result.insertId
  }

  static async update(
    id: number,
    data: { nickname?: string; avatar?: string; phone?: string }
  ): Promise<void> {
    const fields: string[] = []
    const values: unknown[] = []

    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname) }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar) }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone) }

    if (fields.length === 0) return

    values.push(id)
    await execute(`UPDATE user SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values)
  }

  static toPublic(user: DbUser) {
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
    }
  }
}
