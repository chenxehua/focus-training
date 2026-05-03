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

jest.mock('../models/TrainingRecord', () => ({
  TrainingRecordModel: {
    findTodayByChildId: jest.fn(),
    getStreak: jest.fn(),
    getTotalCount: jest.fn(),
    toPublic: jest.fn((r) => r),
  }
}))

jest.mock('../models/FocusReport', () => ({
  FocusReportModel: {
    getWeeklyStats: jest.fn(),
    getGameBreakdownForWeek: jest.fn(),
  }
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

  describe('getTodayData', () => {
    it('should return today training data successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { TrainingRecordModel } = require('../models/TrainingRecord')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      TrainingRecordModel.findTodayByChildId.mockResolvedValueOnce([
        { id: 1, duration_seconds: 300, focus_score: 85 },
        { id: 2, duration_seconds: 400, focus_score: 90 },
      ])
      TrainingRecordModel.getStreak.mockResolvedValueOnce(5)
      TrainingRecordModel.getTotalCount.mockResolvedValueOnce(100)

      mockReq.params = { childId: '1' }

      await ReportController.getTodayData(mockReq, mockRes, mockNext)

      expect(ChildModel.isOwnedByUser).toHaveBeenCalledWith(1, 1)
      expect(TrainingRecordModel.findTodayByChildId).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            currentStreak: 5,
            totalTrainingCount: 100,
            totalDuration: 700,
            avgFocusScore: 88,
          }),
        })
      )
    })

    it('should return 0 values when no records', async () => {
      const { ChildModel } = require('../models/Child')
      const { TrainingRecordModel } = require('../models/TrainingRecord')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      TrainingRecordModel.findTodayByChildId.mockResolvedValueOnce([])
      TrainingRecordModel.getStreak.mockResolvedValueOnce(0)
      TrainingRecordModel.getTotalCount.mockResolvedValueOnce(0)

      mockReq.params = { childId: '1' }

      await ReportController.getTodayData(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            totalDuration: 0,
            avgFocusScore: 0,
          }),
        })
      )
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }

      await ReportController.getTodayData(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权查看该孩子数据'
      }))
    })

    it('should handle server errors', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockRejectedValueOnce(new Error('DB error'))

      mockReq.params = { childId: '1' }

      await ReportController.getTodayData(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('getWeeklyReport', () => {
    it('should return weekly report successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getWeeklyStats.mockResolvedValueOnce([
        { date: '2024-05-06', training_count: 2, total_duration: 600, avg_focus_score: 85 },
        { date: '2024-05-07', training_count: 1, total_duration: 300, avg_focus_score: 90 },
      ])
      FocusReportModel.getGameBreakdownForWeek.mockResolvedValueOnce([
        { game_code: 'schulte', game_name: '舒尔特方格', count: 2, avg_score: 85 },
      ])

      mockReq.params = { childId: '1' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      expect(FocusReportModel.getWeeklyStats).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            trainingCount: 3,
            totalDuration: 900,
            avgFocusScore: 88,
            highlights: expect.any(Array),
          }),
        })
      )
    })

    it('should generate highlights for good performance', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getWeeklyStats.mockResolvedValueOnce([
        { date: '2024-05-06', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-07', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-08', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-09', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-10', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-11', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
        { date: '2024-05-12', training_count: 2, total_duration: 7200, avg_focus_score: 85 },
      ])
      FocusReportModel.getGameBreakdownForWeek.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      const response = mockRes.json.mock.calls[0][0]
      expect(response.code).toBe(0)
      expect(response.data.highlights.length).toBeGreaterThan(0)
      expect(response.data.highlights.some((h: any) => h.type === 'consistency')).toBe(true)
      expect(response.data.highlights.some((h: any) => h.type === 'focus')).toBe(true)
      expect(response.data.highlights.some((h: any) => h.type === 'duration')).toBe(true)
    })

    it('should return empty highlights when no data', async () => {
      const { ChildModel } = require('../models/Child')
      const { FocusReportModel } = require('../models/FocusReport')
      
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      FocusReportModel.getWeeklyStats.mockResolvedValueOnce([])
      FocusReportModel.getGameBreakdownForWeek.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      const response = mockRes.json.mock.calls[0][0]
      expect(response.code).toBe(0)
      expect(response.data.highlights).toEqual([])
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }

      await ReportController.getWeeklyReport(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权查看该孩子报告'
      }))
    })
  })
})