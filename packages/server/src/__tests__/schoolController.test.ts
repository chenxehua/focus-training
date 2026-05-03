/**
 * 学校管理控制器测试
 */
import { Request, Response } from 'express'
import SchoolController from '../controllers/schoolController'

// 模拟模型
jest.mock('../models/School', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  update: jest.fn(),
}))

jest.mock('../models/Teacher', () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findBySchoolId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}))

jest.mock('../models/Class', () => ({
  findById: jest.fn(),
  findBySchoolId: jest.fn(),
  getStudents: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteStudent: jest.fn(),
  importStudents: jest.fn(),
}))

jest.mock('../config/database', () => ({
  query: jest.fn(),
}))

import SchoolModel from '../models/School'
import TeacherModel from '../models/Teacher'
import ClassModel from '../models/Class'
import { query } from '../config/database'

describe('SchoolController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockRequest = {
      query: {},
      body: {},
      params: {},
    }
    mockResponse = {
      json: jest.fn(),
    }
    jest.clearAllMocks()
  })

  describe('getSchool', () => {
    it('should return school info when school exists', async () => {
      const mockSchool = { id: 1, name: '测试学校' }
      ;(SchoolModel.findById as jest.Mock).mockResolvedValue(mockSchool)

      mockRequest.query = { school_id: '1' }

      await SchoolController.getSchool(mockRequest as any, mockResponse as Response)

      expect(SchoolModel.findById).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockSchool,
      })
    })

    it('should return 400 when school_id is missing', async () => {
      mockRequest.query = {}

      await SchoolController.getSchool(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '学校ID不能为空',
        data: null,
      })
    })

    it('should return 404 when school not found', async () => {
      ;(SchoolModel.findById as jest.Mock).mockResolvedValue(null)
      mockRequest.query = { school_id: '999' }

      await SchoolController.getSchool(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 404,
        message: '学校不存在',
        data: null,
      })
    })
  })

  describe('createSchool', () => {
    it('should create school successfully', async () => {
      ;(SchoolModel.create as jest.Mock).mockResolvedValue(1)

      mockRequest.body = {
        name: '新学校',
        province: '广东',
        city: '深圳',
        district: '南山区',
        address: '科苑路1号',
        contact_name: '张三',
        contact_phone: '13800138000',
      }

      await SchoolController.createSchool(mockRequest as any, mockResponse as Response)

      expect(SchoolModel.create).toHaveBeenCalled()
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '学校创建成功',
        data: { school_id: 1 },
      })
    })

    it('should return 400 when required fields are missing', async () => {
      mockRequest.body = { name: '新学校' }

      await SchoolController.createSchool(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '缺少必填字段',
        data: null,
      })
    })
  })

  describe('getSchoolList', () => {
    it('should return school list with pagination', async () => {
      const mockResult = {
        schools: [{ id: 1, name: '学校1' }],
        total: 50,
        page: 1,
        pageSize: 20,
      }
      ;(SchoolModel.findAll as jest.Mock).mockResolvedValue(mockResult)

      mockRequest.query = { page: '1', page_size: '20' }

      await SchoolController.getSchoolList(mockRequest as any, mockResponse as Response)

      expect(SchoolModel.findAll).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        pageSize: 20,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockResult,
      })
    })
  })

  describe('approveSchool', () => {
    it('should approve school successfully', async () => {
      ;(SchoolModel.updateStatus as jest.Mock).mockResolvedValue(undefined)

      mockRequest.body = { school_id: 1, status: 1 }

      await SchoolController.approveSchool(mockRequest as any, mockResponse as Response)

      expect(SchoolModel.updateStatus).toHaveBeenCalledWith(1, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '学校已通过审核',
        data: null,
      })
    })

    it('should return 400 for invalid status', async () => {
      mockRequest.body = { school_id: 1, status: 5 }

      await SchoolController.approveSchool(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '状态值无效',
        data: null,
      })
    })
  })

  describe('getTeachers', () => {
    it('should return teachers list', async () => {
      const mockResult = {
        teachers: [{ id: 1, name: '张老师' }],
        total: 10,
      }
      ;(TeacherModel.findBySchoolId as jest.Mock).mockResolvedValue(mockResult)

      mockRequest.query = { school_id: '1', page: '1', page_size: '20' }

      await SchoolController.getTeachers(mockRequest as any, mockResponse as Response)

      expect(TeacherModel.findBySchoolId).toHaveBeenCalledWith(1, {
        role: undefined,
        page: 1,
        pageSize: 20,
      })
    })

    it('should return 400 when school_id is missing', async () => {
      mockRequest.query = {}

      await SchoolController.getTeachers(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '学校ID不能为空',
        data: null,
      })
    })
  })

  describe('createTeacher', () => {
    it('should create teacher successfully', async () => {
      ;(TeacherModel.findByUserId as jest.Mock).mockResolvedValue(null)
      ;(TeacherModel.create as jest.Mock).mockResolvedValue(1)

      mockRequest.body = {
        user_id: 1,
        school_id: 1,
        name: '新教师',
        phone: '13800138000',
        role: 1,
      }

      await SchoolController.createTeacher(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '教师创建成功',
        data: { teacher_id: 1 },
      })
    })

    it('should return 400 when user is already a teacher', async () => {
      ;(TeacherModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 })

      mockRequest.body = {
        user_id: 1,
        school_id: 1,
        name: '新教师',
        phone: '13800138000',
        role: 1,
      }

      await SchoolController.createTeacher(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '该用户已是教师',
        data: null,
      })
    })

    it('should return 400 for invalid role', async () => {
      mockRequest.body = {
        user_id: 1,
        school_id: 1,
        name: '新教师',
        phone: '13800138000',
        role: 5,
      }

      await SchoolController.createTeacher(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '角色值无效',
        data: null,
      })
    })
  })

  describe('updateTeacher', () => {
    it('should update teacher successfully', async () => {
      ;(TeacherModel.findById as jest.Mock).mockResolvedValue({ id: 1 })
      ;(TeacherModel.update as jest.Mock).mockResolvedValue(undefined)

      mockRequest.params = { id: '1' }
      mockRequest.body = { name: '更新后的教师' }

      await SchoolController.updateTeacher(mockRequest as any, mockResponse as Response)

      expect(TeacherModel.update).toHaveBeenCalledWith(1, {
        name: '更新后的教师',
        phone: undefined,
        email: undefined,
        role: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '教师信息已更新',
        data: null,
      })
    })

    it('should return 404 when teacher not found', async () => {
      ;(TeacherModel.findById as jest.Mock).mockResolvedValue(null)

      mockRequest.params = { id: '999' }

      await SchoolController.updateTeacher(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 404,
        message: '教师不存在',
        data: null,
      })
    })
  })

  describe('getClasses', () => {
    it('should return classes list', async () => {
      const mockResult = {
        classes: [{ id: 1, name: '一年级一班' }],
        total: 5,
      }
      ;(ClassModel.findBySchoolId as jest.Mock).mockResolvedValue(mockResult)

      mockRequest.query = { school_id: '1', page: '1', page_size: '20' }

      await SchoolController.getClasses(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockResult,
      })
    })
  })

  describe('createClass', () => {
    it('should create class successfully', async () => {
      ;(SchoolModel.findById as jest.Mock).mockResolvedValue({ id: 1 })
      ;(TeacherModel.findById as jest.Mock).mockResolvedValue({ id: 1 })
      ;(ClassModel.create as jest.Mock).mockResolvedValue(1)

      mockRequest.body = {
        school_id: 1,
        name: '一年级一班',
        grade: '一年级',
        year: '2024',
        teacher_id: 1,
      }

      await SchoolController.createClass(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '班级创建成功',
        data: { class_id: 1 },
      })
    })

    it('should return 404 when school not found', async () => {
      ;(SchoolModel.findById as jest.Mock).mockResolvedValue(null)

      mockRequest.body = {
        school_id: 999,
        name: '一年级一班',
        grade: '一年级',
        year: '2024',
        teacher_id: 1,
      }

      await SchoolController.createClass(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 404,
        message: '学校不存在',
        data: null,
      })
    })
  })

  describe('deleteClass', () => {
    it('should delete class successfully', async () => {
      ;(ClassModel.findById as jest.Mock).mockResolvedValue({ id: 1 })
      ;(ClassModel.delete as jest.Mock).mockResolvedValue(undefined)

      mockRequest.params = { id: '1' }

      await SchoolController.deleteClass(mockRequest as any, mockResponse as Response)

      expect(ClassModel.delete).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '班级已删除',
        data: null,
      })
    })

    it('should return 404 when class not found', async () => {
      ;(ClassModel.findById as jest.Mock).mockResolvedValue(null)

      mockRequest.params = { id: '999' }

      await SchoolController.deleteClass(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 404,
        message: '班级不存在',
        data: null,
      })
    })
  })

  describe('getClassStudents', () => {
    it('should return students list', async () => {
      const mockResult = {
        students: [{ id: 1, name: '张三' }],
        total: 35,
      }
      ;(ClassModel.getStudents as jest.Mock).mockResolvedValue(mockResult)

      mockRequest.params = { classId: '1' }
      mockRequest.query = { page: '1', page_size: '50' }

      await SchoolController.getClassStudents(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockResult,
      })
    })
  })

  describe('importStudents', () => {
    it('should import students successfully', async () => {
      ;(ClassModel.importStudents as jest.Mock).mockResolvedValue(10)

      mockRequest.params = { classId: '1' }
      mockRequest.body = {
        students: [
          { name: '学生1', gender: 1 },
          { name: '学生2', gender: 2 },
        ],
      }

      await SchoolController.importStudents(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '成功导入10名学生',
        data: { count: 10 },
      })
    })

    it('should return 400 when students array is empty', async () => {
      mockRequest.params = { classId: '1' }
      mockRequest.body = { students: [] }

      await SchoolController.importStudents(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '学生数据不能为空',
        data: null,
      })
    })
  })

  describe('deleteStudent', () => {
    it('should delete student successfully', async () => {
      ;(ClassModel.deleteStudent as jest.Mock).mockResolvedValue(undefined)

      mockRequest.params = { classId: '1', studentId: '5' }

      await SchoolController.deleteStudent(mockRequest as any, mockResponse as Response)

      expect(ClassModel.deleteStudent).toHaveBeenCalledWith(5, 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: '学生已从班级移除',
        data: null,
      })
    })
  })

  describe('getClassReport', () => {
    it('should return class report with student data', async () => {
      const mockStudents = {
        students: [{ id: 1, name: '张三' }],
        total: 1,
      }
      ;(ClassModel.getStudents as jest.Mock).mockResolvedValue(mockStudents)
      ;(query as jest.Mock).mockResolvedValue([
        { child_id: 1, training_count: 10, total_duration: 600, avg_accuracy: 0.85, avg_score: 85 },
      ])

      mockRequest.params = { classId: '1' }
      mockRequest.query = {}

      await SchoolController.getClassReport(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalled()
      const result = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(result.code).toBe(0)
      expect(result.data.students).toBeDefined()
      expect(result.data.summary).toBeDefined()
    })

    it('should return empty data when no students', async () => {
      const mockStudents = { students: [], total: 0 }
      ;(ClassModel.getStudents as jest.Mock).mockResolvedValue(mockStudents)

      mockRequest.params = { classId: '1' }

      await SchoolController.getClassReport(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: { students: [], summary: null },
      })
    })
  })

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      const mockTeachers = { teachers: [], total: 5 }
      const mockClasses = { classes: [{ id: 1, student_count: 30 }], total: 2 }
      
      ;(TeacherModel.findBySchoolId as jest.Mock).mockResolvedValue(mockTeachers)
      ;(ClassModel.findBySchoolId as jest.Mock).mockResolvedValue(mockClasses)
      ;(query as jest.Mock).mockResolvedValue([{ count: 100, avg_accuracy: 0.8 }])

      mockRequest.query = { school_id: '1' }

      await SchoolController.getDashboard(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalled()
      const result = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(result.code).toBe(0)
      expect(result.data.teacher_count).toBeDefined()
      expect(result.data.class_count).toBeDefined()
      expect(result.data.student_count).toBeDefined()
    })

    it('should return 400 when school_id is missing', async () => {
      mockRequest.query = {}

      await SchoolController.getDashboard(mockRequest as any, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 400,
        message: '学校ID不能为空',
        data: null,
      })
    })
  })
})