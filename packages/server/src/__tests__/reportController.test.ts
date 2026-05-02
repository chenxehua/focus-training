/**
 * 报告系统单元测试
 */

import { ReportController } from '../controllers/reportController'

// Mock models
jest.mock('../models/Child', () => ({
  ChildModel: {
    isOwnedByUser: jest.fn(),
  }
}))

jest.mock('../models/FocusReport', () => ({
  FocusReportModel: {
    generate: jest.fn(),
    getWeekly: jest.fn(),
    getDaily: jest.fn(),
    getHistory: jest.fn(),
    toPublic: jest.fn((r) => r),
  }
}))

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

describe('ReportController', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: {},
      query: {},
      body: {},
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

  describe('generateReport', () => {
    it('should generate daily report successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.generate.mockResolvedValueOnce(1)

      mockReq.params = { childId: '1' }
      mockReq.body = { reportType: 'daily' }

      await ReportController.generateReport(mockReq, mockRes, mockNext)

      expect(ChildModel.isOwnedByUser).toHaveBeenCalledWith(1, 1)
      expect(FocusReportModel.generate).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it('should generate weekly report successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.generate.mockResolvedValueOnce(1)

      mockReq.params = { childId: '1' }
      mockReq.body = { reportType: 'weekly' }

      await ReportController.generateReport(mockReq, mockRes, mockNext)

      expect(FocusReportModel.generate).toHaveBeenCalledWith(1, 'weekly')
      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }
      mockReq.body = { reportType: 'daily' }

      await ReportController.generateReport(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权操作该孩子报告'
      }))
    })

    it('should handle server errors', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockRejectedValueOnce(new Error('DB error'))

      mockReq.params = { childId: '1' }
      mockReq.body = { reportType: 'daily' }

      await ReportController.generateReport(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('getWeeklyReport', () => {
    it('should return weekly report successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      const mockReport = {
        id: 1,
        child_id: 1,
        report_type: 'weekly',
        training_count: 5,
        avg_focus_score: 85,
      }
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getWeekly.mockResolvedValueOnce(mockReport)

      mockReq.params = { childId: '1' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      expect(FocusReportModel.getWeekly).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })

    it('should return 404 when report not found', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getWeekly.mockResolvedValueOnce(null)

      mockReq.params = { childId: '1' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权查看该报告'
      }))
    })
  })

  describe('getDailyReport', () => {
    it('should return daily report successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      const mockReport = {
        id: 1,
        child_id: 1,
        report_type: 'daily',
        training_count: 2,
        avg_focus_score: 90,
      }
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getDaily.mockResolvedValueOnce(mockReport)

      mockReq.params = { childId: '1' }
      mockReq.query = { date: '2024-05-03' }

      await ReportController.getDailyReport(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })
  })

  describe('getReportHistory', () => {
    it('should return report history with pagination', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      const mockReports = [
        { id: 1, report_type: 'weekly' },
        { id: 2, report_type: 'daily' },
      ]
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getHistory.mockResolvedValueOnce({
        list: mockReports,
        total: 10,
        page: 1,
        pageSize: 20,
      })

      mockReq.params = { childId: '1' }
      mockReq.query = { page: '1', pageSize: '20' }

      await ReportController.getReportHistory(mockReq, mockRes, mockNext)

      expect(FocusReportModel.getHistory).toHaveBeenCalledWith(1, {
        page: 1,
        pageSize: 20,
      })
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            list: mockReports,
            total: 10,
          })
        })
      )
    })

    it('should use default pagination when not provided', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getHistory.mockResolvedValueOnce({
        list: [],
        total: 0,
        page: 1,
        pageSize: 20,
      })

      mockReq.params = { childId: '1' }
      mockReq.query = {}

      await ReportController.getReportHistory(mockReq, mockRes, mockNext)

      expect(FocusReportModel.getHistory).toHaveBeenCalledWith(1, {
        page: 1,
        pageSize: 20,
      })
    })

    it('should limit pageSize to 100', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getHistory.mockResolvedValueOnce({
        list: [],
        total: 0,
        page: 1,
        pageSize: 100,
      })

      mockReq.params = { childId: '1' }
      mockReq.query = { pageSize: '500' }

      await ReportController.getReportHistory(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pageSize: 100,
          })
        })
      )
    })
  })
})