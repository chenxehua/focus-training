/**
 * 学校端控制器 - 教师、班级、学生管理
 */
import { Request, Response } from 'express'
import SchoolModel from '../models/School'
import TeacherModel from '../models/Teacher'
import ClassModel from '../models/Class'
import { query } from '../config/database'

export interface AuthRequest extends Request {
  userId?: number
}

class SchoolController {
  /**
   * 获取学校信息
   */
  static async getSchool(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.query.school_id as string) || 0
      
      if (!schoolId) {
        res.json({ code: 400, message: '学校ID不能为空', data: null })
        return
      }

      const school = await SchoolModel.findById(schoolId)
      
      if (!school) {
        res.json({ code: 404, message: '学校不存在', data: null })
        return
      }

      res.json({ code: 0, message: 'success', data: school })
    } catch (error) {
      console.error('获取学校信息失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 创建学校
   */
  static async createSchool(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, province, city, district, address, contact_name, contact_phone, contact_email, license_image } = req.body

      if (!name || !province || !city || !district || !address || !contact_name || !contact_phone) {
        res.json({ code: 400, message: '缺少必填字段', data: null })
        return
      }

      const schoolId = await SchoolModel.create({
        name,
        province,
        city,
        district,
        address,
        contact_name,
        contact_phone,
        contact_email,
        license_image,
      })

      res.json({ code: 0, message: '学校创建成功', data: { school_id: schoolId } })
    } catch (error) {
      console.error('创建学校失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取学校列表（管理员）
   */
  static async getSchoolList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, page_size = 20 } = req.query

      const result = await SchoolModel.findAll({
        status: status !== undefined ? parseInt(status as string) : undefined,
        page: parseInt(page as string),
        pageSize: parseInt(page_size as string),
      })

      res.json({ code: 0, message: 'success', data: result })
    } catch (error) {
      console.error('获取学校列表失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 审核学校
   */
  static async approveSchool(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { school_id, status } = req.body

      if (!school_id || status === undefined) {
        res.json({ code: 400, message: '缺少必填字段', data: null })
        return
      }

      if (![1, 2].includes(status)) {
        res.json({ code: 400, message: '状态值无效', data: null })
        return
      }

      await SchoolModel.updateStatus(school_id, status)

      res.json({ code: 0, message: status === 1 ? '学校已通过审核' : '学校已拒绝', data: null })
    } catch (error) {
      console.error('审核学校失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取教师列表
   */
  static async getTeachers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.query.school_id as string) || 0
      const { role, page = 1, page_size = 20 } = req.query

      if (!schoolId) {
        res.json({ code: 400, message: '学校ID不能为空', data: null })
        return
      }

      const result = await TeacherModel.findBySchoolId(schoolId, {
        role: role !== undefined ? parseInt(role as string) : undefined,
        page: parseInt(page as string),
        pageSize: parseInt(page_size as string),
      })

      res.json({ code: 0, message: 'success', data: result })
    } catch (error) {
      console.error('获取教师列表失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 创建教师
   */
  static async createTeacher(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { user_id, school_id, name, phone, email, role } = req.body

      if (!user_id || !school_id || !name || !phone || !role) {
        res.json({ code: 400, message: '缺少必填字段', data: null })
        return
      }

      if (![1, 2, 3, 4].includes(role)) {
        res.json({ code: 400, message: '角色值无效', data: null })
        return
      }

      // 检查用户是否已是教师
      const existingTeacher = await TeacherModel.findByUserId(user_id)
      if (existingTeacher) {
        res.json({ code: 400, message: '该用户已是教师', data: null })
        return
      }

      const teacherId = await TeacherModel.create({
        user_id,
        school_id,
        name,
        phone,
        email,
        role,
      })

      res.json({ code: 0, message: '教师创建成功', data: { teacher_id: teacherId } })
    } catch (error) {
      console.error('创建教师失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 更新教师
   */
  static async updateTeacher(req: AuthRequest, res: Response): Promise<void> {
    try {
      const teacherId = parseInt(req.params.id)
      const { name, phone, email, role } = req.body

      if (!teacherId) {
        res.json({ code: 400, message: '教师ID不能为空', data: null })
        return
      }

      const teacher = await TeacherModel.findById(teacherId)
      if (!teacher) {
        res.json({ code: 404, message: '教师不存在', data: null })
        return
      }

      await TeacherModel.update(teacherId, {
        name,
        phone,
        email,
        role,
      })

      res.json({ code: 0, message: '教师信息已更新', data: null })
    } catch (error) {
      console.error('更新教师失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取班级列表
   */
  static async getClasses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.query.school_id as string) || 0
      const { grade, page = 1, page_size = 20 } = req.query

      if (!schoolId) {
        res.json({ code: 400, message: '学校ID不能为空', data: null })
        return
      }

      const result = await ClassModel.findBySchoolId(schoolId, {
        grade: grade as string,
        page: parseInt(page as string),
        pageSize: parseInt(page_size as string),
      })

      res.json({ code: 0, message: 'success', data: result })
    } catch (error) {
      console.error('获取班级列表失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 创建班级
   */
  static async createClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { school_id, name, grade, year, teacher_id } = req.body

      if (!school_id || !name || !grade || !year || !teacher_id) {
        res.json({ code: 400, message: '缺少必填字段', data: null })
        return
      }

      // 验证学校存在
      const school = await SchoolModel.findById(school_id)
      if (!school) {
        res.json({ code: 404, message: '学校不存在', data: null })
        return
      }

      // 验证教师存在
      const teacher = await TeacherModel.findById(teacher_id)
      if (!teacher) {
        res.json({ code: 404, message: '教师不存在', data: null })
        return
      }

      const classId = await ClassModel.create({
        school_id,
        name,
        grade,
        year: parseInt(year as string),
        teacher_id,
      })

      res.json({ code: 0, message: '班级创建成功', data: { class_id: classId } })
    } catch (error) {
      console.error('创建班级失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 更新班级
   */
  static async updateClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.id)
      const { name, grade, year, teacher_id } = req.body

      if (!classId) {
        res.json({ code: 400, message: '班级ID不能为空', data: null })
        return
      }

      const cls = await ClassModel.findById(classId)
      if (!cls) {
        res.json({ code: 404, message: '班级不存在', data: null })
        return
      }

      await ClassModel.update(classId, {
        name,
        grade,
        year: year ? parseInt(year as string) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id as string) : undefined,
      })

      res.json({ code: 0, message: '班级信息已更新', data: null })
    } catch (error) {
      console.error('更新班级失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 删除班级
   */
  static async deleteClass(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.id)

      if (!classId) {
        res.json({ code: 400, message: '班级ID不能为空', data: null })
        return
      }

      const cls = await ClassModel.findById(classId)
      if (!cls) {
        res.json({ code: 404, message: '班级不存在', data: null })
        return
      }

      await ClassModel.delete(classId)

      res.json({ code: 0, message: '班级已删除', data: null })
    } catch (error) {
      console.error('删除班级失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取班级学生列表
   */
  static async getClassStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.classId)
      const { page = 1, page_size = 50 } = req.query

      if (!classId) {
        res.json({ code: 400, message: '班级ID不能为空', data: null })
        return
      }

      const result = await ClassModel.getStudents(classId, {
        page: parseInt(page as string),
        pageSize: parseInt(page_size as string),
      })

      res.json({ code: 0, message: 'success', data: result })
    } catch (error) {
      console.error('获取学生列表失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 批量导入学生
   */
  static async importStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.classId)
      const { students } = req.body

      if (!classId) {
        res.json({ code: 400, message: '班级ID不能为空', data: null })
        return
      }

      if (!Array.isArray(students) || students.length === 0) {
        res.json({ code: 400, message: '学生数据不能为空', data: null })
        return
      }

      const result = await ClassModel.importStudents(classId, students)

      res.json({ code: 0, message: `成功导入${result}名学生`, data: { count: result } })
    } catch (error) {
      console.error('导入学生失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 删除学生
   */
  static async deleteStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { classId, studentId } = req.params

      if (!classId || !studentId) {
        res.json({ code: 400, message: '参数不完整', data: null })
        return
      }

      await ClassModel.deleteStudent(parseInt(studentId), parseInt(classId))

      res.json({ code: 0, message: '学生已从班级移除', data: null })
    } catch (error) {
      console.error('删除学生失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取班级专注力报告
   */
  static async getClassReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.classId)
      const { start_date, end_date } = req.query

      if (!classId) {
        res.json({ code: 400, message: '班级ID不能为空', data: null })
        return
      }

      // 获取班级学生
      const { students } = await ClassModel.getStudents(classId, { pageSize: 1000 })
      
      if (students.length === 0) {
        res.json({ code: 0, message: 'success', data: { students: [], summary: null } })
        return
      }

      const studentIds = students.map(s => s.id)
      const placeholders = studentIds.map(() => '?').join(', ')

      // 查询班级学生的训练数据
      const sql = `
        SELECT 
          child_id,
          COUNT(*) as training_count,
          SUM(duration_seconds) as total_duration,
          AVG(accuracy) as avg_accuracy,
          AVG(score) as avg_score
        FROM training_record
        WHERE child_id IN (${placeholders})
          AND training_date BETWEEN ? AND ?
        GROUP BY child_id
      `
      
      const startDate = (start_date as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = (end_date as string) || new Date().toISOString().split('T')[0]

      // 合并数据
      interface TrainingData {
        child_id: number
        training_count: number
        total_duration: number
        avg_accuracy: number
        avg_score: number
      }
      const trainingData = await query<TrainingData>(sql, [...studentIds, startDate, endDate])
      const studentReport = students.map((student: any) => {
        const data = trainingData.find(t => t.child_id === student.id)
        return {
          ...student,
          training_count: data?.training_count || 0,
          total_duration: data?.total_duration || 0,
          avg_accuracy: data?.avg_accuracy || 0,
          avg_score: data?.avg_score || 0,
        }
      })

      // 计算班级平均
      const totalStudents = studentReport.length
      const summary = {
        total_students: totalStudents,
        active_students: studentReport.filter((s: any) => s.training_count > 0).length,
        avg_training_count: totalStudents > 0 
          ? studentReport.reduce((sum: number, s: any) => sum + s.training_count, 0) / totalStudents 
          : 0,
        avg_accuracy: totalStudents > 0
          ? studentReport.reduce((sum: number, s: any) => sum + s.avg_accuracy, 0) / totalStudents
          : 0,
      }

      res.json({ code: 0, message: 'success', data: { students: studentReport, summary } })
    } catch (error) {
      console.error('获取班级报告失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }

  /**
   * 获取学校仪表盘数据
   */
  static async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schoolId = parseInt(req.query.school_id as string) || 0

      if (!schoolId) {
        res.json({ code: 400, message: '学校ID不能为空', data: null })
        return
      }

      // 获取教师数量
      const { teachers, total: teacherCount } = await TeacherModel.findBySchoolId(schoolId, { pageSize: 1000 })

      // 获取班级数量
      const { classes, total: classCount } = await ClassModel.findBySchoolId(schoolId, { pageSize: 1000 })

      // 获取学生总数
      let studentCount = 0
      for (const cls of classes) {
        studentCount += cls.student_count || 0
      }

      // 获取本月训练数据
      const startDate = new Date()
      startDate.setDate(1)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = new Date().toISOString().split('T')[0]

      const studentIds = classes.flatMap((c: any) => {
        return Array(c.student_count || 0).fill(0).map((_, i) => c.id + i)
      })

      let monthTrainingCount = 0
      let monthAvgAccuracy = 0

      if (studentIds.length > 0) {
        const placeholders = studentIds.slice(0, 100).map(() => '?').join(', ') || '0'
        const sql = `
          SELECT COUNT(*) as count, AVG(accuracy) as avg_accuracy
          FROM training_record
          WHERE child_id IN (${placeholders})
            AND training_date >= ?
        `
        interface MonthData {
          count: number
          avg_accuracy: number
        }
        const result = await query<MonthData>(sql, [...studentIds.slice(0, 100), startDateStr])
        const firstRow = result[0]
        monthTrainingCount = firstRow ? firstRow.count : 0
        monthAvgAccuracy = firstRow ? firstRow.avg_accuracy : 0
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          teacher_count: teacherCount,
          class_count: classCount,
          student_count: studentCount,
          month_training_count: monthTrainingCount,
          month_avg_accuracy: monthAvgAccuracy,
        },
      })
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
      res.json({ code: 500, message: '服务器错误', data: null })
    }
  }
}

export default SchoolController