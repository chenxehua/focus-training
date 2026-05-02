import { AuthController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
  redis: {
    setex: jest.fn(),
  },
}))

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
}))

describe('AuthController', () => {
  let mockReq: any
  let mockRes: any
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    }
    mockNext = jest.fn()
  })

  describe('wxLogin', () => {
    it('should validate code parameter', async () => {
      mockReq.body = {}

      await AuthController.wxLogin(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1,
          message: '缺少微信 code 参数',
        })
      )
    })

    it('should handle WeChat API errors', async () => {
      const axios = require('axios')
      jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('WeChat API error'))
      mockReq.body = { code: 'test_code' }

      await AuthController.wxLogin(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should create user on successful login', async () => {
      const axios = require('axios')
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { openid: 'test_openid', session_key: 'test_session' },
      })
      const { queryOne, execute } = require('../config/database')
      queryOne.mockResolvedValueOnce(null) // No existing user
      execute.mockResolvedValueOnce({ insertId: 1 })
      queryOne.mockResolvedValueOnce({
        id: 1, openid: 'test_openid', nickname: null, avatar: null, role: 'parent', status: 'active'
      })
      mockReq.body = { code: 'test_code' }

      await AuthController.wxLogin(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            token: 'mock_token',
            isNew: true,
          }),
        })
      )
    })
  })
})