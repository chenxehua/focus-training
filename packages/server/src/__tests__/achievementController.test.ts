import { AchievementController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

// Mock the models
jest.mock('../models', () => ({
  AchievementModel: {
    findAll: jest.fn(),
    getChildAchievements: jest.fn(),
    unlockAchievement: jest.fn(),
    getStats: jest.fn(),
  }
}))

describe('AchievementController', () => {
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1,
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  describe('getAchievementList', () => {
    it('should return list of achievements', async () => {
      const { AchievementModel } = require('../models')
      AchievementModel.findAll.mockResolvedValueOnce([
        { id: 1, achievement_name: '首次通关', achievement_type: 'milestone' },
        { id: 2, achievement_name: '坚持7天', achievement_type: 'streak' },
      ])

      await AchievementController.getAchievementList(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      )
    })

    it('should handle errors', async () => {
      const { AchievementModel } = require('../models')
      AchievementModel.findAll.mockRejectedValueOnce(new Error('DB error'))

      await AchievementController.getAchievementList(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getChildAchievements', () => {
    it('should validate childId parameter', async () => {
      mockReq.params = {}
      mockReq.query = {}

      await AchievementController.getChildAchievements(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return child achievements', async () => {
      const { AchievementModel } = require('../models')
      AchievementModel.getChildAchievements.mockResolvedValueOnce([
        { id: 1, achievement_name: '首次通关', is_unlocked: true, progress: 100 },
        { id: 2, achievement_name: '坚持7天', is_unlocked: false, progress: 50 },
      ])
      mockReq.params = { childId: '1' }

      await AchievementController.getChildAchievements(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      )
    })
  })

  describe('getAchievementStats', () => {
    it('should return achievement statistics', async () => {
      const { AchievementModel } = require('../models')
      AchievementModel.getStats.mockResolvedValueOnce({
        total: 10,
        unlocked: 5,
        progress: 50,
      })
      mockReq.params = { childId: '1' }

      await AchievementController.getAchievementStats(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: 10,
            unlocked: 5,
            progress: 50,
          }),
        })
      )
    })
  })

  describe('unlockAchievement', () => {
    it('should require childId and achievementId', async () => {
      mockReq.body = {}

      await AchievementController.unlockAchievement(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should unlock achievement successfully', async () => {
      const { AchievementModel } = require('../models')
      AchievementModel.unlockAchievement.mockResolvedValueOnce()
      mockReq.body = { childId: 1, achievementId: 2 }

      await AchievementController.unlockAchievement(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '成就解锁成功',
        })
      )
    })
  })
})