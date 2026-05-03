/**
 * 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Mock config before importing modules
const mockConfig = {
  jwt: {
    secret: 'test-secret-key',
    expiresIn: '24h',
  },
  isDev: true,
}

jest.mock('../config', () => ({
  config: mockConfig,
}))

// Mock database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
  pool: {},
}))

// Import after mocks are set up
import { authMiddleware, generateToken } from '../middleware/auth'
import { errorHandler, AppError } from '../middleware/errorHandler'

describe('Auth Middleware', () => {
  let mockReq: Partial<Request & { userId?: number }>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      headers: {},
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

  describe('authMiddleware', () => {
    it('should reject request without Authorization header', () => {
      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
          message: expect.any(String),
        })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject request with invalid token format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token123',
      }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
        })
      )
    })

    it('should reject request with invalid token', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
        })
      )
    })

    it('should accept request with valid token', () => {
      const token = jwt.sign({ userId: 1 }, 'test-secret-key')
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect((mockReq as any).userId).toBe(1)
    })

    it('should accept token with different secret', () => {
      // This test verifies token validation with different secret would fail
      const token = jwt.sign({ userId: 2 }, 'different-secret')
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should handle expired token', () => {
      const token = jwt.sign(
        { userId: 1 },
        'test-secret-key',
        { expiresIn: '-1s' } // Already expired
      )
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should pass query params to request', () => {
      const token = jwt.sign({ userId: 1 }, 'test-secret-key')
      mockReq.headers = {
        authorization: `Bearer ${token}`,
      }
      mockReq.query = { childId: '123' }

      authMiddleware(
        mockReq as any,
        mockRes as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect((mockReq as any).userId).toBe(1)
    })
  })

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken(123)
      const decoded = jwt.verify(token, 'test-secret-key') as { userId: number }
      expect(decoded.userId).toBe(123)
    })
  })
})

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/test',
      headers: {},
      params: {},
      query: {},
      body: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    mockNext = jest.fn()
    
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('errorHandler', () => {
    it('should handle AppError with custom status', () => {
      const error = new AppError('Custom error', 400, 1)

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 1,
        message: 'Custom error',
        data: null,
      })
    })

    it('should handle Error with default 500 status', () => {
      const error = new Error('Server error')

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 500,
        message: 'Server error',
        data: null,
      })
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle MySQL duplicate entry error', () => {
      const error = new Error('Duplicate entry') as any
      error.code = 'ER_DUP_ENTRY'

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      )

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 409,
        message: '数据已存在',
        data: null,
      })
    })

    it('should call console.error with stack trace for unhandled errors', () => {
      const error = new Error('Test error')

      errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      )

      expect(console.error).toHaveBeenCalledWith('Unhandled error:', error)
    })
  })

  describe('AppError class', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe(1)
    })

    it('should create error with custom statusCode and code', () => {
      const error = new AppError('Not found', 404, 404)
      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe(404)
    })
  })
})