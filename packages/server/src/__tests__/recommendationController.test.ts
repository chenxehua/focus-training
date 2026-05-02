/**
 * AI推荐引擎单元测试
 */

import { RecommendationController } from '../controllers/recommendationController'

// Mock models
jest.mock('../models/Child', () => ({
  ChildModel: {
    isOwnedByUser: jest.fn(),
    findById: jest.fn(),
  }
}))

// Mock recommendation service
jest.mock('../services/recommendationService', () => ({
  generateUserProfile: jest.fn(),
  getGameRecommendations: jest.fn(),
  generateWeeklyPlan: jest.fn(),
  getDifficultySuggestion: jest.fn(),
}))

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

describe('RecommendationController', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: {},
      query: {},
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

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')
      const mockProfile = {
        childId: 1,
        ageGroup: '7-9',
        dimensionScores: {
          sustainedAttention: 75,
          selectiveAttention: 80,
        },
        trainingHistory: [],
        weaknessDimensions: ['workingMemory'],
        strengthDimensions: ['visualSearch'],
      }

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      ChildModel.findById.mockResolvedValueOnce({ id: 1, name: '小明', age: 8 })
      recommendationService.generateUserProfile.mockResolvedValueOnce(mockProfile)

      mockReq.params = { childId: '1' }

      await RecommendationController.getUserProfile(mockReq, mockRes, mockNext)

      expect(ChildModel.isOwnedByUser).toHaveBeenCalledWith(1, 1)
      expect(recommendationService.generateUserProfile).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockProfile,
        })
      )
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }

      await RecommendationController.getUserProfile(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权获取该用户画像'
      }))
    })

    it('should return 404 when child not found', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      ChildModel.findById.mockResolvedValueOnce(null)

      mockReq.params = { childId: '1' }

      await RecommendationController.getUserProfile(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getRecommendations', () => {
    it('should return game recommendations successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')
      const mockRecommendations = [
        {
          gameId: 1,
          gameCode: 'schulte',
          gameName: '舒尔特方格',
          reason: '提升视觉搜索能力',
          priority: 1,
        },
        {
          gameId: 4,
          gameCode: 'visual',
          gameName: '视觉追踪',
          reason: '增强视觉追踪能力',
          priority: 2,
        },
      ]

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.getGameRecommendations.mockResolvedValueOnce(mockRecommendations)

      mockReq.params = { childId: '1' }

      await RecommendationController.getRecommendations(mockReq, mockRes, mockNext)

      expect(recommendationService.getGameRecommendations).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockRecommendations,
        })
      )
    })

    it('should return empty array when no recommendations', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.getGameRecommendations.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }

      await RecommendationController.getRecommendations(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: [],
        })
      )
    })

    it('should support limit parameter', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.getGameRecommendations.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }
      mockReq.query = { limit: '3' }

      await RecommendationController.getRecommendations(mockReq, mockRes, mockNext)

      expect(recommendationService.getGameRecommendations).toHaveBeenCalledWith(1, 3)
    })
  })

  describe('getWeeklyPlan', () => {
    it('should return weekly training plan successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')
      const mockPlan = {
        dailyPlan: [
          { day: 1, games: [{ gameCode: 'schulte', rounds: 2 }] },
          { day: 2, games: [{ gameCode: 'memory', rounds: 2 }] },
        ],
        totalMinutes: 70,
        focusAdvice: '本周重点提升视觉搜索能力',
      }

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.generateWeeklyPlan.mockResolvedValueOnce(mockPlan)

      mockReq.params = { childId: '1' }

      await RecommendationController.getWeeklyPlan(mockReq, mockRes, mockNext)

      expect(recommendationService.generateWeeklyPlan).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockPlan,
        })
      )
    })

    it('should reject unauthorized access', async () => {
      const { ChildModel } = require('../models/Child')
      ChildModel.isOwnedByUser.mockResolvedValueOnce(false)

      mockReq.params = { childId: '999' }

      await RecommendationController.getWeeklyPlan(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: '无权获取该用户训练计划'
      }))
    })
  })

  describe('getDifficultySuggestion', () => {
    it('should return difficulty suggestion successfully', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')
      const mockSuggestion = {
        recommendedLevel: 3,
        reason: '表现稳定，建议提升难度',
        shouldIncrease: true,
        shouldDecrease: false,
      }

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.getDifficultySuggestion.mockResolvedValueOnce(mockSuggestion)

      mockReq.params = { childId: '1', gameId: '4' }

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes, mockNext)

      expect(recommendationService.getDifficultySuggestion).toHaveBeenCalledWith(1, 4)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockSuggestion,
        })
      )
    })

    it('should return suggestion to decrease difficulty', async () => {
      const { ChildModel } = require('../models/Child')
      const recommendationService = require('../services/recommendationService')
      const mockSuggestion = {
        recommendedLevel: 1,
        reason: '错误率较高，建议降低难度',
        shouldIncrease: false,
        shouldDecrease: true,
      }

      ChildModel.isOwnedByUser.mockResolvedValueOnce(true)
      recommendationService.getDifficultySuggestion.mockResolvedValueOnce(mockSuggestion)

      mockReq.params = { childId: '1', gameId: '4' }

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes, mockNext)

      expect(mockSuggestion.shouldDecrease).toBe(true)
    })

    it('should validate gameId parameter', async () => {
      mockReq.params = { childId: '1', gameId: 'invalid' }

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })
})