/**
 * 教师模型 - 教师账号和权限管理
 */
import { query, execute } from '../config/database'

export interface DbTeacher {
  id: number
  user_id: number
  school_id: number
  name: string
  phone: string
  email: string
  role: number // 1管理员 2班主任 3任课教师 4心理老师
  status: number // 0待审核 1通过 2拒绝
  created_at: Date
  updated_at: Date
}

class TeacherModel {
  /**
   * 创建教师
   */
  static async create(data: {
    user_id: number
    school_id: number
    name: string
    phone: string
    email?: string
    role: number
  }): Promise<number> {
    const sql = `
      INSERT INTO teacher (user_id, school_id, name, phone, email, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `
    const result = await execute(sql, [
      data.user_id,
      data.school_id,
      data.name,
      data.phone,
      data.email || null,
      data.role,
    ])
    return result.insertId
  }

  /**
   * 根据ID获取教师
   */
  static async findById(id: number): Promise<DbTeacher | null> {
    const sql = 'SELECT * FROM teacher WHERE id = ?'
    const results = await query<DbTeacher>(sql, [id])
    return results[0] || null
  }

  /**
   * 根据用户ID获取教师
   */
  static async findByUserId(userId: number): Promise<DbTeacher | null> {
    const sql = 'SELECT * FROM teacher WHERE user_id = ?'
    const results = await query<DbTeacher>(sql, [userId])
    return results[0] || null
  }

  /**
   * 获取学校的教师列表
   */
  static async findBySchoolId(schoolId: number, options?: {
    role?: number
    page?: number
    pageSize?: number
  }): Promise<{ teachers: DbTeacher[]; total: number }> {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const offset = (page - 1) * pageSize

    let whereClause = 'school_id = ?'
    const params: any[] = [schoolId]

    if (options?.role !== undefined) {
      whereClause += ' AND role = ?'
      params.push(options.role)
    }

    const countSql = `SELECT COUNT(*) as total FROM teacher WHERE ${whereClause}`
    const countResult = await query<{ total: number }>(countSql, params) as { total: number }[]
    const total = countResult?.[0]?.total || 0

    const sql = `SELECT * FROM teacher WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    const teachers = await query<DbTeacher>(sql, [...params, pageSize, offset])

    return { teachers: Array.isArray(teachers) ? teachers : [teachers], total }
  }

  /**
   * 更新教师信息
   */
  static async update(id: number, data: Partial<{
    name: string
    phone: string
    email: string
    role: number
  }>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?')
      values.push(data.phone)
    }
    if (data.email !== undefined) {
      fields.push('email = ?')
      values.push(data.email)
    }
    if (data.role !== undefined) {
      fields.push('role = ?')
      values.push(data.role)
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()')
      values.push(id)
      const sql = `UPDATE teacher SET ${fields.join(', ')} WHERE id = ?`
      await execute(sql, values)
    }
  }

  /**
   * 更新教师状态
   */
  static async updateStatus(id: number, status: number): Promise<void> {
    const sql = 'UPDATE teacher SET status = ?, updated_at = NOW() WHERE id = ?'
    await execute(sql, [status, id])
  }
}

export default TeacherModel