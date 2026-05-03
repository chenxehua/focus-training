/**
 * AI推荐引擎单元测试
 */

import RecommendationController from '../controllers/recommendationController'

// Mock recommendation service
jest.mock('../services/recommendationService', () => ({
  RecommendationService: {
    buildUserProfile: jest.fn(),
    getRecommendations: jest.fn(),
    generateWeeklyPlan: jest.fn(),
    adjustDifficulty: jest.fn(),
  },
}))

describe('RecommendationController', () => {
  let mockReq: any
  let mockRes: any

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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const { RecommendationService } = require('../services/recommendationService')
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

      RecommendationService.buildUserProfile.mockResolvedValueOnce(mockProfile)

      mockReq.params = { childId: '1' }

      await RecommendationController.getUserProfile(mockReq, mockRes)

      expect(RecommendationService.buildUserProfile).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile,
        })
      )
    })

    it('should validate childId parameter', async () => {
      mockReq.params = {}

      await RecommendationController.getUserProfile(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '缺少 childId 参数',
        })
      )
    })

    it('should handle server errors', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      RecommendationService.buildUserProfile.mockRejectedValueOnce(new Error('DB error'))

      mockReq.params = { childId: '1' }

      await RecommendationController.getUserProfile(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '获取用户画像失败',
        })
      )
    })
  })

  describe('getRecommendations', () => {
    it('should return game recommendations successfully', async () => {
      const { RecommendationService } = require('../services/recommendationService')
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

      RecommendationService.getRecommendations.mockResolvedValueOnce(mockRecommendations)

      mockReq.params = { childId: '1' }

      await RecommendationController.getRecommendations(mockReq, mockRes)

      expect(RecommendationService.getRecommendations).toHaveBeenCalledWith(1, 3)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recommendations: mockRecommendations,
            generated_at: expect.any(String),
          }),
        })
      )
    })

    it('should return empty array when no recommendations', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      RecommendationService.getRecommendations.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }

      await RecommendationController.getRecommendations(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recommendations: [],
          }),
        })
      )
    })

    it('should support limit parameter', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      RecommendationService.getRecommendations.mockResolvedValueOnce([])

      mockReq.params = { childId: '1' }
      mockReq.query = { limit: '5' }

      await RecommendationController.getRecommendations(mockReq, mockRes)

      expect(RecommendationService.getRecommendations).toHaveBeenCalledWith(1, 5)
    })

    it('should validate childId parameter', async () => {
      mockReq.params = {}

      await RecommendationController.getRecommendations(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getWeeklyPlan', () => {
    it('should return weekly training plan successfully', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      const mockPlan = {
        dailyPlan: [
          { day: 1, games: [{ gameCode: 'schulte', rounds: 2 }] },
          { day: 2, games: [{ gameCode: 'memory', rounds: 2 }] },
        ],
        totalMinutes: 70,
        focusAdvice: '本周重点提升视觉搜索能力',
      }

      RecommendationService.generateWeeklyPlan.mockResolvedValueOnce(mockPlan)

      mockReq.params = { childId: '1' }

      await RecommendationController.getWeeklyPlan(mockReq, mockRes)

      expect(RecommendationService.generateWeeklyPlan).toHaveBeenCalledWith(1)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            plan: mockPlan,
            generated_at: expect.any(String),
          }),
        })
      )
    })

    it('should validate childId parameter', async () => {
      mockReq.params = {}

      await RecommendationController.getWeeklyPlan(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getDifficultySuggestion', () => {
    it('should return difficulty suggestion successfully', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      const mockSuggestion = {
        recommendedLevel: 3,
        reason: '表现稳定，建议提升难度',
        shouldIncrease: true,
        shouldDecrease: false,
      }

      RecommendationService.adjustDifficulty.mockResolvedValueOnce(mockSuggestion)

      mockReq.params = { childId: '1', gameId: '4' }

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes)

      expect(RecommendationService.adjustDifficulty).toHaveBeenCalledWith(1, 4, [])
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockSuggestion,
        })
      )
    })

    it('should return suggestion with recent scores', async () => {
      const { RecommendationService } = require('../services/recommendationService')
      const mockSuggestion = {
        recommendedLevel: 2,
        reason: '错误率较高，建议降低难度',
        shouldIncrease: false,
        shouldDecrease: true,
      }

      RecommendationService.adjustDifficulty.mockResolvedValueOnce(mockSuggestion)

      mockReq.params = { childId: '1', gameId: '4' }
      mockReq.body = { recentScores: [60, 65, 70] }

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes)

      expect(RecommendationService.adjustDifficulty).toHaveBeenCalledWith(1, 4, [60, 65, 70])
    })

    it('should validate required parameters', async () => {
      mockReq.params = { childId: '1' } // missing gameId

      await RecommendationController.getDifficultySuggestion(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '缺少必要参数',
        })
      )
    })
  })
})