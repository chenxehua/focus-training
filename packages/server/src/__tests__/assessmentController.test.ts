import { AssessmentController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

// Mock the models
jest.mock('../models', () => ({
  TrainingRecordModel: {
    findByChildId: jest.fn(),
  },
  ChildModel: {
    findById: jest.fn(),
  },
  GameModel: {
    findById: jest.fn(),
  },
}))

describe('AssessmentController', () => {
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

  describe('getDimensionScores', () => {
    it('should validate childId parameter', async () => {
      mockReq.params = {}
      mockReq.query = {}

      await AssessmentController.getDimensionScores(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return dimension scores with default 30 days', async () => {
      const { query } = require('../config/database')
      query.mockResolvedValue([])
      mockReq.params = { childId: '1' }

      await AssessmentController.getDimensionScores(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            dimensions: expect.any(Object),
            period: '30天',
          }),
        })
      )
    })
  })

  describe('getAbilityTrend', () => {
    it('should validate childId parameter', async () => {
      mockReq.params = {}
      mockReq.query = {}

      await AssessmentController.getAbilityTrend(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return ability trend data', async () => {
      const { query } = require('../config/database')
      query.mockResolvedValueOnce([])
      mockReq.params = { childId: '1' }

      await AssessmentController.getAbilityTrend(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            trend: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('getAbilitySummary', () => {
    it('should validate childId parameter', async () => {
      mockReq.params = {}
      mockReq.query = {}

      await AssessmentController.getAbilitySummary(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 for non-existent child', async () => {
      const { ChildModel } = require('../models')
      ChildModel.findById.mockResolvedValueOnce(null)
      mockReq.params = { childId: '999' }

      await AssessmentController.getAbilitySummary(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should return ability summary', async () => {
      const { ChildModel } = require('../models')
      ChildModel.findById.mockResolvedValueOnce({
        id: 1,
        name: '小明',
        age: 8,
        age_group: '7-9',
        level: 5,
        experience: 500,
      })
      mockReq.params = { childId: '1' }

      await AssessmentController.getAbilitySummary(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            child_info: expect.objectContaining({
              name: '小明',
            }),
          }),
        })
      )
    })
  })
})