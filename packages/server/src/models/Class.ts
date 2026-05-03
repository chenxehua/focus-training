/**
 * 班级模型 - 班级和学生管理
 */
import { query, execute } from '../config/database'

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

export interface DbClassStudentExt extends DbClassStudent {
  parent_phone?: string
}

class ClassModel {
  /**
   * 创建班级
   */
  static async create(data: {
    school_id: number
    name: string
    grade: string
    year: number
    teacher_id: number
  }): Promise<number> {
    const sql = `
      INSERT INTO class (school_id, name, grade, year, teacher_id, student_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
    `
    const result = await execute(sql, [
      data.school_id,
      data.name,
      data.grade,
      data.year,
      data.teacher_id,
    ])
    return result.insertId
  }

  /**
   * 根据ID获取班级
   */
  static async findById(id: number): Promise<DbClass | null> {
    const sql = 'SELECT * FROM class WHERE id = ?'
    const results = await query<DbClass>(sql, [id])
    return results[0] || null
  }

  /**
   * 获取学校的班级列表
   */
  static async findBySchoolId(schoolId: number, options?: {
    grade?: string
    page?: number
    pageSize?: number
  }): Promise<{ classes: DbClass[]; total: number }> {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const offset = (page - 1) * pageSize

    let whereClause = 'school_id = ?'
    const params: any[] = [schoolId]

    if (options?.grade !== undefined) {
      whereClause += ' AND grade = ?'
      params.push(options.grade)
    }

    const countSql = `SELECT COUNT(*) as total FROM class WHERE ${whereClause}`
    const countResult = await query<{ total: number }>(countSql, params) as { total: number }[]
    const total = countResult?.[0]?.total || 0

    const sql = `SELECT c.*, t.name as teacher_name 
                 FROM class c 
                 LEFT JOIN teacher t ON c.teacher_id = t.id 
                 WHERE ${whereClause} 
                 ORDER BY c.grade, c.name 
                 LIMIT ? OFFSET ?`
    const classes = await query<DbClass>(sql, [...params, pageSize, offset])

    return { classes: Array.isArray(classes) ? classes : [classes], total }
  }

  /**
   * 获取班级的学生列表
   */
  static async getStudents(classId: number, options?: {
    page?: number
    pageSize?: number
  }): Promise<{ students: DbClassStudentExt[]; total: number }> {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 50
    const offset = (page - 1) * pageSize

    const countSql = 'SELECT COUNT(*) as total FROM class_student WHERE class_id = ?'
    const countResult = await query<{ total: number }>(countSql, [classId]) as { total: number }[]
    const total = countResult?.[0]?.total || 0

    const sql = `SELECT cs.*, u.phone as parent_phone 
                 FROM class_student cs 
                 LEFT JOIN user u ON cs.parent_user_id = u.id 
                 WHERE cs.class_id = ? 
                 ORDER BY cs.student_no 
                 LIMIT ? OFFSET ?`
    const students = await query<DbClassStudentExt>(sql, [classId, pageSize, offset])

    return { students: Array.isArray(students) ? students : [students], total }
  }

  /**
   * 批量导入学生
   */
  static async importStudents(classId: number, students: Array<{
    name: string
    student_no: string
    gender: number
    birth_date: string
    parent_user_id?: number
  }>): Promise<number> {
    if (students.length === 0) return 0

    const values = students.map(s => [
      classId,
      s.name,
      s.student_no,
      s.gender,
      s.birth_date,
      s.parent_user_id || null,
      new Date(),
    ])

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
    const sql = `INSERT INTO class_student (class_id, name, student_no, gender, birth_date, parent_user_id, created_at) VALUES ${placeholders}`

    const flatValues = values.flat()
    const result = await execute(sql, flatValues)

    // 更新班级学生数量
    const countSql = 'SELECT COUNT(*) as count FROM class_student WHERE class_id = ?'
    const countResult = await query<{ count: number }>(countSql, [classId]) as { count: number }[]
    await execute('UPDATE class SET student_count = ?, updated_at = NOW() WHERE id = ?', [countResult?.[0]?.count || 0, classId])

    return result.affectedRows
  }

  /**
   * 更新班级信息
   */
  static async update(id: number, data: Partial<{
    name: string
    grade: string
    year: number
    teacher_id: number
  }>): Promise<void> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.grade !== undefined) {
      fields.push('grade = ?')
      values.push(data.grade)
    }
    if (data.year !== undefined) {
      fields.push('year = ?')
      values.push(data.year)
    }
    if (data.teacher_id !== undefined) {
      fields.push('teacher_id = ?')
      values.push(data.teacher_id)
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()')
      values.push(id)
      const sql = `UPDATE class SET ${fields.join(', ')} WHERE id = ?`
      await execute(sql, values)
    }
  }

  /**
   * 删除班级
   */
  static async delete(id: number): Promise<void> {
    // 先删除学生
    await execute('DELETE FROM class_student WHERE class_id = ?', [id])
    // 再删除班级
    await execute('DELETE FROM class WHERE id = ?', [id])
  }

  /**
   * 删除学生
   */
  static async deleteStudent(id: number, classId: number): Promise<void> {
    await execute('DELETE FROM class_student WHERE id = ? AND class_id = ?', [id, classId])

    // 更新班级学生数量
    const countSql = 'SELECT COUNT(*) as count FROM class_student WHERE class_id = ?'
    const countResult = await query<{ count: number }>(countSql, [classId]) as { count: number }[]
    await execute('UPDATE class SET student_count = ?, updated_at = NOW() WHERE id = ?', [countResult?.[0]?.count || 0, classId])
  }
}

export default ClassModel