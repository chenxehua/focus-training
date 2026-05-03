/**
 * 学校模型 - 学校/班级/教师管理
 */
import { query, execute } from '../config/database'

export interface DbSchool {
  id: number
  name: string
  province: string
  city: string
  district: string
  address: string
  contact_name: string
  contact_phone: string
  contact_email: string
  license_image: string
  status: number // 0待审核 1通过 2拒绝
  created_at: Date
  updated_at: Date
}

export interface DbClass {
  id: number
  school_id: number
  name: string
  grade: string
  year: number
  teacher_id: number
  student_count: number
  created_at: Date
  updated_at: Date
}

export interface DbTeacher {
  id: number
  user_id: number
  school_id: number
  name: string
  phone: string
  email: string
  role: number // 1管理员 2班主任 3任课教师 4心理老师
  status: number
  created_at: Date
  updated_at: Date
}

export interface DbClassStudent {
  id: number
  class_id: number
  name: string
  student_no: string
  gender: number
  birth_date: string
  parent_user_id: number
  created_at: Date
}

class SchoolModel {
  /**
   * 创建学校
   */
  static async create(data: {
    name: string
    province: string
    city: string
    district: string
    address: string
    contact_name: string
    contact_phone: string
    contact_email?: string
    license_image?: string
  }): Promise<number> {
    const sql = `
      INSERT INTO school (name, province, city, district, address, contact_name, contact_phone, contact_email, license_image, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `
    const result = await execute(sql, [
      data.name,
      data.province,
      data.city,
      data.district,
      data.address,
      data.contact_name,
      data.contact_phone,
      data.contact_email || null,
      data.license_image || null,
    ])
    return result.insertId
  }

  /**
   * 根据ID获取学校
   */
  static async findById(id: number): Promise<DbSchool | null> {
    const sql = 'SELECT * FROM school WHERE id = ?'
    const results = await query<DbSchool>(sql, [id])
    return results[0] || null
  }

  /**
   * 获取学校列表
   */
  static async findAll(options?: {
    status?: number
    page?: number
    pageSize?: number
  }): Promise<{ schools: DbSchool[]; total: number }> {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params: any[] = []

    if (options?.status !== undefined) {
      whereClause += ' AND status = ?'
      params.push(options.status)
    }

    const countSql = `SELECT COUNT(*) as total FROM school WHERE ${whereClause}`
    const countResult = await query<{ total: number }>(countSql, params) as { total: number }[]
    const total = countResult?.[0]?.total || 0

    const sql = `SELECT * FROM school WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    const schools = await query<DbSchool>(sql, [...params, pageSize, offset])

    return { schools: Array.isArray(schools) ? schools : [schools], total }
  }

  /**
   * 更新学校状态
   */
  static async updateStatus(id: number, status: number): Promise<void> {
    const sql = 'UPDATE school SET status = ?, updated_at = NOW() WHERE id = ?'
    await execute(sql, [status, id])
  }

  /**
   * 更新学校信息
   */
  static async update(id: number, data: Partial<{
    name: string
    province: string
    city: string
    district: string
    address: string
    contact_name: string
    contact_phone: string
    contact_email: string
  }>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.province !== undefined) {
      fields.push('province = ?')
      values.push(data.province)
    }
    if (data.city !== undefined) {
      fields.push('city = ?')
      values.push(data.city)
    }
    if (data.district !== undefined) {
      fields.push('district = ?')
      values.push(data.district)
    }
    if (data.address !== undefined) {
      fields.push('address = ?')
      values.push(data.address)
    }
    if (data.contact_name !== undefined) {
      fields.push('contact_name = ?')
      values.push(data.contact_name)
    }
    if (data.contact_phone !== undefined) {
      fields.push('contact_phone = ?')
      values.push(data.contact_phone)
    }
    if (data.contact_email !== undefined) {
      fields.push('contact_email = ?')
      values.push(data.contact_email)
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()')
      values.push(id)
      const sql = `UPDATE school SET ${fields.join(', ')} WHERE id = ?`
      await execute(sql, values)
    }
  }
}

export default SchoolModel