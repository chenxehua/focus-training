import { MembershipController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}))

// Mock the models
jest.mock('../models', () => ({
  MembershipModel: {
    findByUserId: jest.fn(),
  },
  OrderModel: {
    findPaidByUserId: jest.fn(),
  }
}))

describe('MembershipController', () => {
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

  describe('getMembershipStatus', () => {
    it('should require authentication', async () => {
      mockReq.userId = undefined

      await MembershipController.getMembershipStatus(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should return null for non-member', async () => {
      const { MembershipModel } = require('../models')
      MembershipModel.findByUserId.mockResolvedValueOnce(null)
      mockReq.userId = 1

      await MembershipController.getMembershipStatus(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            is_vip: false,
          }),
        })
      )
    })

    it('should return VIP status for active member', async () => {
      const { MembershipModel } = require('../models')
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)
      MembershipModel.findByUserId.mockResolvedValueOnce({
        id: 1,
        user_id: 1,
        member_type: 'yearly',
        member_level: 'vip',
        start_date: new Date(),
        end_date: endDate,
        status: 1,
      })
      mockReq.userId = 1

      await MembershipController.getMembershipStatus(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            is_vip: true,
            member_type: 'yearly',
          }),
        })
      )
    })
  })

  describe('getMembershipPackages', () => {
    it('should return package list', async () => {
      await MembershipController.getMembershipPackages(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      )

      const calls = mockRes.json.mock.calls
      const data = calls[calls.length - 1][0].data
      expect(data[0].name).toBe('年度会员')
      expect(data[0].price).toBe(199)
    })
  })

  describe('getPurchaseHistory', () => {
    it('should require authentication', async () => {
      mockReq.userId = undefined

      await MembershipController.getPurchaseHistory(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('should return purchase history', async () => {
      const { OrderModel } = require('../models')
      OrderModel.findPaidByUserId.mockResolvedValueOnce([
        { order_no: 'ORDER_001', amount: 199, pay_status: 1 },
        { order_no: 'ORDER_002', amount: 199, pay_status: 1 },
      ])
      mockReq.userId = 1

      await MembershipController.getPurchaseHistory(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      )
    })
  })
})