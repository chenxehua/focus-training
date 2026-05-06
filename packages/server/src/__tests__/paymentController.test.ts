/**
 * 支付系统单元测试
 */

import PaymentController from '../controllers/paymentController'

// Mock models
jest.mock('../models', () => ({
  MembershipModel: {
    create: jest.fn(),
    upsert: jest.fn(),
    upsertChildMembership: jest.fn(),
    findOne: jest.fn(),
    toPublic: jest.fn((m) => m),
  },
  OrderModel: {
    create: jest.fn(),
    createOrder: jest.fn(),
    updatePayStatus: jest.fn(),
    findById: jest.fn(),
    toPublic: jest.fn((m) => m),
  },
}))

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
}))

describe('PaymentController', () => {
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

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const { OrderModel } = require('../models')
      OrderModel.createOrder.mockResolvedValueOnce({ id: 1, order_no: 'ORD123' })

      mockReq.body = {
        membership_id: 1,
        amount: 199,
      }

      await PaymentController.createOrder(mockReq, mockRes)

      expect(OrderModel.createOrder).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            order_no: expect.stringContaining('ORDER_'),
            amount: 199,
          }),
        })
      )
    })

    it('should reject unauthenticated request', async () => {
      mockReq.userId = undefined
      mockReq.body = { amount: 199 }

      await PaymentController.createOrder(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '未登录',
        })
      )
    })

    it('should use default values when body is empty', async () => {
      const { OrderModel } = require('../models')
      OrderModel.createOrder.mockResolvedValueOnce({ id: 1, order_no: 'ORD123' })

      mockReq.body = {}

      await PaymentController.createOrder(mockReq, mockRes)

      expect(OrderModel.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 199,
          membershipId: 1,
        })
      )
    })
  })

  describe('getOrderStatus', () => {
    it('should return order details successfully', async () => {
      const db = require('../config/database')
      db.queryOne.mockResolvedValueOnce({
        order_no: 'ORD123',
        pay_status: 0,
        pay_amount: 199,
        created_at: new Date(),
        pay_time: null,
      })

      mockReq.params = { orderNo: 'ORD123' }
      mockReq.userId = 1

      await PaymentController.getOrderStatus(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            order_no: 'ORD123',
            pay_status: 0,
          }),
        })
      )
    })

    it('should return 404 when order not found', async () => {
      const db = require('../config/database')
      db.queryOne.mockResolvedValueOnce(null)

      mockReq.params = { orderNo: 'INVALID' }
      mockReq.userId = 1

      await PaymentController.getOrderStatus(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '订单不存在',
        })
      )
    })
  })

  describe('initiatePayment', () => {
    it('should return payment params for pending order', async () => {
      const db = require('../config/database')
      db.queryOne.mockResolvedValueOnce({
        order_no: 'ORD123',
        pay_status: 0,
        pay_amount: 199,
        product_name: '年度会员',
      })

      mockReq.userId = 1
      mockReq.body = { order_no: 'ORD123' }

      await PaymentController.initiatePayment(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            payment_params: expect.objectContaining({
              order_no: 'ORD123',
              total_fee: 19900,
            }),
            prepay_id: expect.stringContaining('prepay_'),
          }),
        })
      )
    })

    it('should return already paid for completed order', async () => {
      const db = require('../config/database')
      db.queryOne.mockResolvedValueOnce({
        order_no: 'ORD123',
        pay_status: 1,
        pay_amount: 199,
        product_name: '年度会员',
      })

      mockReq.userId = 1
      mockReq.body = { order_no: 'ORD123' }

      await PaymentController.initiatePayment(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '订单已支付',
          data: { pay_status: 'paid' },
        })
      )
    })

    it('should reject unauthenticated request', async () => {
      mockReq.userId = undefined
      mockReq.body = { order_no: 'ORD123' }

      await PaymentController.initiatePayment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '未登录',
        })
      )
    })

    it('should return 404 for non-existent order', async () => {
      const db = require('../config/database')
      db.queryOne.mockResolvedValueOnce(null)

      mockReq.userId = 1
      mockReq.body = { order_no: 'INVALID' }

      await PaymentController.initiatePayment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('handleCallback', () => {
    it('should handle successful payment callback', async () => {
      const { OrderModel, MembershipModel } = require('../models')
      const db = require('../config/database')

      OrderModel.updatePayStatus.mockResolvedValueOnce(undefined)
      MembershipModel.upsertChildMembership.mockResolvedValueOnce(undefined)

      // Mock queryOne calls in order:
      // 1. Get order info (needs product_type = 'membership')
      db.queryOne.mockResolvedValueOnce({
        user_id: 1,
        product_type: 'membership',
        product_id: 'yearly',
      })
      // 2. Get membership id
      db.queryOne.mockResolvedValueOnce({
        id: 1,
      })
      // 3. Get child id
      db.queryOne.mockResolvedValueOnce({
        id: 1,
      })

      mockReq.body = {
        order_no: 'ORD123',
        transaction_id: 'WX20240503001',
        pay_status: 'SUCCESS',
      }

      await PaymentController.handleCallback(mockReq, mockRes)

      expect(OrderModel.updatePayStatus).toHaveBeenCalledWith('ORD123', 1, 'WX20240503001')
      expect(MembershipModel.upsertChildMembership).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '支付成功',
        })
      )
    })

    it('should handle failed payment callback', async () => {
      const { OrderModel } = require('../models')

      mockReq.body = {
        order_no: 'ORD123',
        transaction_id: 'WX20240503001',
        pay_status: 'FAIL',
      }

      await PaymentController.handleCallback(mockReq, mockRes)

      expect(OrderModel.updatePayStatus).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '支付失败',
        })
      )
    })

    it('should not activate membership for non-membership orders', async () => {
      const { OrderModel, MembershipModel } = require('../models')

      mockReq.body = {
        order_no: 'ORD123',
        transaction_id: 'WX20240503001',
        pay_status: 'SUCCESS',
      }

      await PaymentController.handleCallback(mockReq, mockRes)

      expect(MembershipModel.upsertChildMembership).not.toHaveBeenCalled()
    })
  })
})