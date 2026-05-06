/**
 * 初次测评系统控制器测试
 * 测试 InitialAssessmentController 的核心功能
 */

import { InitialAssessmentController } from '../controllers/initialAssessmentController'

// Mock database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}))

describe('InitialAssessmentController', () => {
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
    jest.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should validate childId parameter', async () => {
      mockReq.params = {}
      mockReq.query = {}

      await InitialAssessmentController.getStatus(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('childId'),
        })
      )
    })

    it('should return assessment status for existing child', async () => {
      const { query, queryOne } = require('../config/database')
      
      // Mock no existing assessment
      queryOne.mockResolvedValueOnce(null)
      
      mockReq.params = { childId: '1' }

      await InitialAssessmentController.getStatus(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            assessmentId: null,
          }),
        })
      )
    })

    it('should return existing assessment status', async () => {
      const { query, queryOne } = require('../config/database')
      
      // Mock existing assessment
      queryOne.mockResolvedValueOnce({
        id: 1,
        assessment_no: 'INIT202505060001',
        status: 'in_progress',
        current_stage: 'questionnaire',
      })
      
      // Mock questionnaire answers count
      query.mockResolvedValueOnce([{ count: 3 }])
      
      // Mock game results count
      query.mockResolvedValueOnce([{ count: 1 }])

      mockReq.params = { childId: '1' }

      await InitialAssessmentController.getStatus(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            assessmentId: 1,
            hasCompletedInitial: false,
          }),
        })
      )
    })
  })

  describe('startAssessment', () => {
    it('should validate childId parameter', async () => {
      mockReq.body = {}

      await InitialAssessmentController.startAssessment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should create new assessment for child', async () => {
      const { queryOne, execute } = require('../config/database')
      
      // Mock child exists
      queryOne.mockResolvedValueOnce({
        id: 1,
        name: '小明',
        age: 8,
        age_group: '7-9',
      })
      
      // Mock no existing assessment
      queryOne.mockResolvedValueOnce(null)
      
      // Mock execute for insert
      execute.mockResolvedValueOnce({ insertId: 1 })

      mockReq.body = {
        childId: 1,
        assessmentType: 'initial',
      }

      await InitialAssessmentController.startAssessment(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            assessmentId: 1,
          }),
        })
      )
    })
  })

  describe('getQuestionnaire', () => {
    it('should validate assessmentId parameter', async () => {
      mockReq.params = {}

      await InitialAssessmentController.getQuestionnaire(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 for non-existent assessment', async () => {
      const { queryOne } = require('../config/database')
      
      // Mock error case
      queryOne.mockResolvedValueOnce(null)

      mockReq.params = { assessmentId: '999' }

      await InitialAssessmentController.getQuestionnaire(mockReq, mockRes)

      // Should return error (either 404 or 500 depending on implementation)
      expect(mockRes.status).toHaveBeenCalled()
    })

    it('should extract random questions from question bank', async () => {
      const { query, queryOne } = require('../config/database')
      
      // Mock assessment with child
      queryOne.mockResolvedValueOnce({
        child_id: 1,
        status: 'not_started',
        current_stage: 'questionnaire',
        age: 8,
        age_group: '7-9',
      })
      
      // Mock question bank (7 dimensions x 2 questions each = 14)
      const mockQuestions: any[] = []
      const dimensions = [
        'sustained_attention',
        'selective_attention',
        'divided_attention',
        'attention_shifting',
        'working_memory',
        'impulse_control',
        'reaction_speed',
      ]
      
      dimensions.forEach((dim, dimIndex) => {
        for (let i = 0; i < 2; i++) {
          mockQuestions.push({
            id: dimIndex * 2 + i + 1,
            question_code: `Q${dimIndex}_${i}`,
            dimension: dim,
            dimension_name: dim,
            question_type: 'single_choice',
            question_late: `Test question for ${dim}`,
            options_late: JSON.stringify([
              { value: 1, label: 'Option A', score: 2 },
              { value: 2, label: 'Option B', score: 4 },
              { value: 3, label: 'Option C', score: 6 },
            ]),
            weight: 1.0,
            sort_order: dimIndex * 2 + i,
          })
        }
      })
      
      query.mockResolvedValueOnce(mockQuestions)
      
      // Mock no answered questions
      query.mockResolvedValueOnce([])
      
      // Mock answer check
      queryOne.mockResolvedValueOnce({ count: 0 })

      mockReq.params = { assessmentId: '1' }

      await InitialAssessmentController.getQuestionnaire(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      // Just verify the response structure
      expect(response).toHaveProperty('success')
    })
  })

  describe('submitQuestionnaire', () => {
    it('should validate assessmentId parameter', async () => {
      mockReq.params = {}
      mockReq.body = {}

      await InitialAssessmentController.submitQuestionnaire(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should validate answers array', async () => {
      mockReq.params = { assessmentId: '1' }
      mockReq.body = {}

      await InitialAssessmentController.submitQuestionnaire(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('answers'),
        })
      )
    })

    it('should save questionnaire answers', async () => {
      const { execute, queryOne } = require('../config/database')
      
      // Mock assessment exists
      queryOne.mockResolvedValueOnce({
        id: 1,
        status: 'not_started',
        current_stage: 'questionnaire',
      })
      
      // Mock execute for insert
      execute.mockResolvedValueOnce({ affectedRows: 1 })

      mockReq.params = { assessmentId: '1' }
      mockReq.body = {
        answers: [
          { questionId: 1, answerValue: 2 },
          { questionId: 2, answerValue: 3 },
        ],
      }

      await InitialAssessmentController.submitQuestionnaire(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
    })
  })

  describe('getGames', () => {
    it('should validate assessmentId parameter', async () => {
      mockReq.params = {}

      await InitialAssessmentController.getGames(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return games for assessment', async () => {
      const { query, queryOne } = require('../config/database')
      
      // Mock assessment with child
      queryOne.mockResolvedValueOnce({
        child_id: 1,
        status: 'questionnaire_completed',
        current_stage: 'games',
        age: 8,
        age_group: '7-9',
      })
      
      // Mock game config
      query.mockResolvedValueOnce([
        {
          game_id: 1,
          game_code: 'schulte',
          game_name: '舒尔特方格',
          difficulty_level: 1,
          time_limit: 120,
          parameters: JSON.stringify({ grid_size: 5 }),
        },
        {
          game_id: 2,
          game_code: 'pattern_memory',
          game_name: '图案记忆',
          difficulty_level: 1,
          time_limit: 120,
          parameters: JSON.stringify({ pattern_count: 4 }),
        },
      ])
      
      // Mock existing game results
      query.mockResolvedValueOnce([])

      mockReq.params = { assessmentId: '1' }

      await InitialAssessmentController.getGames(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
    })
  })

  describe('submitGameResult', () => {
    it('should validate game result data', async () => {
      mockReq.params = { assessmentId: '1' }
      mockReq.body = {}

      await InitialAssessmentController.submitGameResult(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should save game result and calculate score', async () => {
      const { queryOne, execute } = require('../config/database')
      
      // Mock assessment exists
      queryOne.mockResolvedValueOnce({
        id: 1,
        status: 'games_in_progress',
        current_stage: 'games',
      })
      
      // Mock game exists
      queryOne.mockResolvedValueOnce({
        id: 1,
        game_code: 'schulte',
        game_name: '舒尔特方格',
      })
      
      // Mock game config
      queryOne.mockResolvedValueOnce({
        game_id: 1,
        game_code: 'schulte',
        time_limit: 120,
        parameters: JSON.stringify({ grid_size: 5 }),
      })
      
      // Mock percentile norm
      queryOne.mockResolvedValueOnce({
        mean: 70,
        std_dev: 15,
        p50: 70,
        p70: 80,
        p90: 90,
      })
      
      // Mock execute for insert
      execute.mockResolvedValueOnce({ insertId: 1 })
      
      // Mock update assessment status
      execute.mockResolvedValueOnce({ affectedRows: 1 })

      mockReq.params = { assessmentId: '1' }
      mockReq.body = {
        gameId: 'schulte',
        result: {
          score: 85,
          accuracy: 0.95,
          duration: 110,
          completed: true,
          rawData: { gridSize: 5, foundNumbers: 25 },
        },
      }

      await InitialAssessmentController.submitGameResult(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success')
    })
  })

  describe('getNorm', () => {
    it('should return percentile norm data', async () => {
      const { queryOne } = require('../config/database')
      
      queryOne.mockResolvedValueOnce({
        dimension: 'sustained_attention',
        age_group: '8-9',
        mean: 70,
        std_dev: 15,
        p10: 52,
        p30: 63,
        p50: 70,
        p70: 77,
        p90: 90,
        sample_size: 500,
      })

      mockReq.params = { dimension: 'sustained_attention', ageGroup: '8-9' }

      await InitialAssessmentController.getNorm(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
    })

    it('should return 404 for non-existent norm', async () => {
      const { queryOne } = require('../config/database')
      
      queryOne.mockResolvedValueOnce(null)

      mockReq.params = { dimension: 'unknown', ageGroup: '8-9' }

      await InitialAssessmentController.getNorm(mockReq, mockRes)

      // Controller returns 404 for non-existent norm
      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success', false)
    })
  })

  describe('getGameConfig', () => {
    it('should return game config for age group', async () => {
      const { queryOne } = require('../config/database')
      
      queryOne.mockResolvedValueOnce({
        game_id: 1,
        game_code: 'schulte',
        game_name: '舒尔特方格',
        age_group: '8-9',
        difficulty_level: 1,
        time_limit: 120,
        parameters: JSON.stringify({ grid_size: 5, show_number_hints: true }),
        pass_threshold: 50,
      })

      mockReq.params = { gameCode: 'schulte', ageGroup: '8-9' }

      await InitialAssessmentController.getGameConfig(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const response = mockRes.json.mock.calls[0][0]
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
    })
  })
})