/**
 * 用户管理模块单元测试
 */

import { UserController } from '../controllers/userController'

// Mock models
jest.mock('../models/User', () => ({
  UserModel: {
    findById: jest.fn(),
    update: jest.fn(),
    toPublic: jest.fn((user) => user),
  }
}))

jest.mock('../models/Child', () => ({
  ChildModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    isOwnedByUser: jest.fn(),
    toPublic: jest.fn((child) => child),
  }
}))

describe('UserController', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: {},
      params: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getInfo', () => {
    it('should return user info successfully', async () => {
      const { UserModel } = require('../models/User')
      const mockUser = { id: 1, nickname: '张三', phone: '13800000000' }
      UserModel.findById.mockResolvedValueOnce(mockUser)

      await UserController.getInfo(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0, data: mockUser })
      )
    })

    it('should return 404 when user not found', async () => {
      const { UserModel } = require('../models/User')
      UserModel.findById.mockResolvedValueOnce(null)

      await UserController.getInfo(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 1 })
      )
    })

    it('should handle server errors', async () => {
      const { UserModel } = require('../models/User')
      UserModel.findById.mockRejectedValueOnce(new Error('Database error'))

      await UserController.getInfo(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('updateInfo', () => {
    it('should update user info successfully', async () => {
      const { UserModel } = require('../models/User')
      const mockUser = { id: 1, nickname: '李四', phone: '13800000001' }
      UserModel.update.mockResolvedValueOnce(undefined)
      UserModel.findById.mockResolvedValueOnce(mockUser)

      mockReq.body = { nickname: '李四', phone: '13800000001' }

      await UserController.updateInfo(mockReq, mockRes, mockNext)

      expect(UserModel.update).toHaveBeenCalledWith(1, mockReq.body)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })

    it('should handle update without any fields', async () => {
      const { UserModel } = require('../models/User')
      const mockUser = { id: 1, nickname: '张三' }
      UserModel.update.mockResolvedValueOnce(undefined)
      UserModel.findById.mockResolvedValueOnce(mockUser)

      mockReq.body = {}

      await UserController.updateInfo(mockReq, mockRes, mockNext)

      expect(UserModel.update).toHaveBeenCalledWith(1, {})
    })
  })

  describe('addChild', () => {
    it('should create child successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const mockChild = { id: 1, name: '小明', age: 8, gender: 'male', ageGroup: '7-9' }
      ChildModel.create.mockResolvedValueOnce(1)
      ChildModel.findById.mockResolvedValueOnce(mockChild)

      mockReq.body = { name: '小明', age: 8, gender: 'male', ageGroup: '7-9' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(ChildModel.create).toHaveBeenCalledWith(1, mockReq.body)
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })

    it('should reject empty name', async () => {
      const { ChildModel } = require('../models/Child')
      mockReq.body = { name: '   ', age: 8, gender: 'male', ageGroup: '7-9' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '孩子姓名不能为空'
      }))
      expect(ChildModel.create).not.toHaveBeenCalled()
    })

    it('should reject invalid age range', async () => {
      mockReq.body = { name: '小明', age: 3, gender: 'male', ageGroup: '4-6' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '年龄需在 4-12 岁之间'
      }))
    })

    it('should reject invalid age (too old)', async () => {
      mockReq.body = { name: '小明', age: 13, gender: 'male', ageGroup: '10-12' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '年龄需在 4-12 岁之间'
      }))
    })

    it('should reject invalid gender', async () => {
      mockReq.body = { name: '小明', age: 8, gender: 'unknown', ageGroup: '7-9' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '性别参数错误'
      }))
    })

    it('should reject invalid ageGroup', async () => {
      mockReq.body = { name: '小明', age: 8, gender: 'male', ageGroup: '13-15' }

      await UserController.addChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '年龄段参数错误'
      }))
    })
  })

  describe('getChildren', () => {
    it('should return children list', async () => {
      const { ChildModel } = require('../models/Child')
      const mockChildren = [
        { id: 1, name: '小明', age: 8 },
        { id: 2, name: '小红', age: 6 },
      ]
      ChildModel.findByUserId.mockResolvedValueOnce(mockChildren)

      await UserController.getChildren(mockReq, mockRes, mockNext)

      expect(ChildModel.findByUserId).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockChildren,
        })
      )
    })

    it('should return empty array when no children', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.findByUserId.mockResolvedValueOnce([])

      await UserController.getChildren(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: [],
        })
      )
    })
  })

  describe('updateChild', () => {
    it('should update child successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const mockChild = { id: 1, name: '小明更新', age: 9 }
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      ChildModel.update.mockResolvedValueOnce(undefined)
      ChildModel.findById.mockResolvedValueOnce(mockChild)

      mockReq.params = { childId: '1' }
      mockReq.body = { name: '小明更新', age: 9 }

      await UserController.updateChild(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }
      mockReq.body = { name: '小明' }

      await UserController.updateChild(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权操作该孩子信息'
      }))
    })
  })
})