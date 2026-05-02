import { GameController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

// Mock the models
jest.mock('../models/Child', () => ({
  ChildModel: {
    isOwnedByUser: jest.fn().mockResolvedValue(true),
    addExperience: jest.fn().mockResolvedValue(undefined),
  }
}))

jest.mock('../models/TrainingRecord', () => ({
  TrainingRecordModel: {
    create: jest.fn().mockResolvedValue(1),
    findByChildId: jest.fn().mockResolvedValue({ list: [], total: 0 }),
    toPublic: jest.fn((r) => r),
  }
}))

describe('GameController', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: jest.Mock

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
    mockNext = jest.fn()
  })

  describe('getGameList', () => {
    it('should return list of active games', async () => {
      const { query } = require('../config/database')
      query.mockResolvedValueOnce([
        { id: 1, game_code: 'schulte', game_name: '舒尔特方格', game_type: 'visual' },
        { id: 2, game_code: 'memory', game_name: '图案记忆', game_type: 'memory' },
      ])

      await GameController.getGameList(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.any(Array),
        })
      )
    })
  })

  describe('getGameDetail', () => {
    it('should validate gameId parameter', async () => {
      mockReq.params = { gameId: '0' }

      await GameController.getGameDetail(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should return game details for valid id', async () => {
      const { queryOne } = require('../config/database')
      queryOne.mockResolvedValueOnce({
        id: 1, game_code: 'schulte', game_name: '舒尔特方格', game_type: 'visual'
      })
      mockReq.params = { gameId: '1' }

      await GameController.getGameDetail(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
        })
      )
    })

    it('should return 404 for non-existent game', async () => {
      const { queryOne } = require('../config/database')
      queryOne.mockResolvedValueOnce(null)
      mockReq.params = { gameId: '999' }

      await GameController.getGameDetail(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('submitRecord', () => {
    it('should create training record with valid data', async () => {
      const { queryOne } = require('../config/database')
      queryOne.mockResolvedValueOnce({ id: 1 }) // Game exists

      const { TrainingRecordModel } = require('../models/TrainingRecord')
      TrainingRecordModel.findByChildId.mockResolvedValueOnce({
        list: [{ id: 1, child_id: 1, score: 100 }],
        total: 1
      })

      mockReq.body = {
        childId: 1,
        gameId: 1,
        durationSeconds: 60,
        accuracy: 85,
        score: 100,
        focusScore: 90,
        difficultyLevel: 2,
      }
      mockReq.userId = 1

      await GameController.submitRecord(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(TrainingRecordModel.create).toHaveBeenCalled()
    })
  })

  describe('getRecords', () => {
    it('should validate childId parameter', async () => {
      mockReq.query = { childId: '0' }

      await GameController.getRecords(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should return training history for valid childId', async () => {
      const { TrainingRecordModel } = require('../models/TrainingRecord')
      TrainingRecordModel.findByChildId.mockResolvedValueOnce({
        list: [{ id: 1, child_id: 1, score: 100, accuracy: 85, focus_score: 90 }],
        total: 1
      })
      mockReq.query = { childId: '1' }

      await GameController.getRecords(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            list: expect.any(Array),
          })
        })
      )
    })
  })
})