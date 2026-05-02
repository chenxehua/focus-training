/**
 * 支付系统单元测试
 */

import { PaymentController } from '../controllers/paymentController'

// Mock models
jest.mock('../models/Child', () => ({
  ChildModel: {
    isOwnedByUser: jest.fn(),
  }
}))

jest.mock('../models/Membership', () => ({
  MembershipModel: {
    createOrder: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    activateMembership: jest.fn(),
    getChildMembership: jest.fn(),
    toPublic: jest.fn((m) => m),
  }
}))

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

describe('PaymentController', () => {
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

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const { MembershipModel } = require('../models/Membership')
      const mockOrder = {
        id: 1,
        order_no: 'ORD20240503001',
        package_id: 1,
        amount: 19900,
        status: 'pending',
      }
      MembershipModel.createOrder.mockResolvedValueOnce(mockOrder)

      mockReq.body = {
        childId: 1,
        packageId: 1,
        paymentMethod: 'wechat',
      }

      await PaymentController.createOrder(mockReq, mockRes, mockNext)

      expect(MembershipModel.createOrder).toHaveBeenCalledWith(1, {
        childId: 1,
        packageId: 1,
        paymentMethod: 'wechat',
      })
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            orderNo: 'ORD20240503001',
          })
        })
      )
    })

    it('should reject missing childId', async () => {
      mockReq.body = {
        packageId: 1,
        paymentMethod: 'wechat',
      }

      await PaymentController.createOrder(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 1 })
      )
    })

    it('should reject missing packageId', async () => {
      mockReq.body = {
        childId: 1,
        paymentMethod: 'wechat',
      }

      await PaymentController.createOrder(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should reject invalid paymentMethod', async () => {
      mockReq.body = {
        childId: 1,
        packageId: 1,
        paymentMethod: 'bitcoin',
      }

      await PaymentController.createOrder(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '支付方式仅支持 wechat'
        })
      )
    })

    it('should handle server errors', async () => {
      const { MembershipModel } = require('../models/Membership')
      MembershipModel.createOrder.mockRejectedValueOnce(new Error('DB error'))

      mockReq.body = {
        childId: 1,
        packageId: 1,
        paymentMethod: 'wechat',
      }

      await PaymentController.createOrder(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('getOrder', () => {
    it('should return order details successfully', async () => {
      const { MembershipModel } = require('../models/Membership')
      const mockOrder = {
        id: 1,
        order_no: 'ORD20240503001',
        amount: 19900,
        status: 'pending',
      }
      MembershipModel.getOrder.mockResolvedValueOnce(mockOrder)

      mockReq.params = { orderId: '1' }

      await PaymentController.getOrder(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            orderNo: 'ORD20240503001',
          })
        })
      )
    })

    it('should return 404 when order not found', async () => {
      const { MembershipModel } = require('../models/Membership')
      MembershipModel.getOrder.mockResolvedValueOnce(null)

      mockReq.params = { orderId: '999' }

      await PaymentController.getOrder(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('notifyPayment', () => {
    it('should handle WeChat payment callback successfully', async () => {
      const { MembershipModel } = require('../models/Membership')
      MembershipModel.updateOrderStatus.mockResolvedValueOnce(undefined)
      MembershipModel.activateMembership.mockResolvedValueOnce(undefined)

      mockReq.body = {
        order_no: 'ORD20240503001',
        transaction_id: 'WX20240503001',
        status: 'SUCCESS',
      }

      await PaymentController.notifyPayment(mockReq, mockRes, mockNext)

      expect(MembershipModel.updateOrderStatus).toHaveBeenCalledWith(
        'ORD20240503001',
        'paid',
        'WX20240503001'
      )
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 0 })
      )
    })

    it('should handle payment failure callback', async () => {
      const { MembershipModel } = require('../models/Membership')
      MembershipModel.updateOrderStatus.mockResolvedValueOnce(undefined)

      mockReq.body = {
        order_no: 'ORD20240503001',
        status: 'FAIL',
      }

      await PaymentController.notifyPayment(mockReq, mockRes, mockNext)

      expect(MembershipModel.updateOrderStatus).toHaveBeenCalledWith(
        'ORD20240503001',
        'failed',
        undefined
      )
    })

    it('should handle missing order_no in callback', async () => {
      mockReq.body = {
        status: 'SUCCESS',
      }

      await PaymentController.notifyPayment(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      const { MembershipModel } = require('../models/Membership')
      const mockOrder = {
        id: 1,
        order_no: 'ORD20240503001',
        status: 'paid',
        transaction_id: 'WX20240503001',
      }
      MembershipModel.getOrder.mockResolvedValueOnce(mockOrder)

      mockReq.params = { orderId: '1' }

      await PaymentController.getPaymentStatus(mockReq, mockRes, mockNext)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: expect.objectContaining({
            status: 'paid',
            transactionId: 'WX20240503001',
          })
        })
      )
    })

    it('should return 404 when order not found', async () => {
      const { MembershipModel } = require('../models/Membership')
      MembershipModel.getOrder.mockResolvedValueOnce(null)

      mockReq.params = { orderId: '999' }

      await PaymentController.getPaymentStatus(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })
})