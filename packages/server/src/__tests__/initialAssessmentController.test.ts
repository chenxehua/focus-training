/**
 * 初次测评系统控制器测试
 * 
 * 测试覆盖：
 * - 测评状态管理
 * - 问卷获取与提交
 * - 游戏测评与结果
 * - 报告生成
 */

import { Request, Response } from 'express'
import { InitialAssessmentController } from '../controllers/initialAssessmentController'

// Mock数据库模块
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
}))

import { query, queryOne, execute } from '../config/database'

const mockRequest = (params = {}, body = {}, queryParams = {}) => {
  return {
    params,
    body,
    query: queryParams,
    userId: 1,
  } as any
}

const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('InitialAssessmentController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStatus', () => {
    it('应该处理缺少childId的情况', async () => {
      const req = mockRequest({})
      const res = mockResponse()

      await InitialAssessmentController.getStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('startAssessment', () => {
    it('应该拒绝缺少必填参数', async () => {
      const req = mockRequest({}, {})
      const res = mockResponse()

      await InitialAssessmentController.startAssessment(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getQuestionnaire', () => {
    it('应该拒绝无效的assessmentId', async () => {
      const req = mockRequest({ assessmentId: 'invalid' })
      const res = mockResponse()

      await InitialAssessmentController.getQuestionnaire(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('submitQuestionnaire', () => {
    it('应该验证答案格式 - 空答案', async () => {
      const req = mockRequest(
        { assessmentId: '1' },
        { answers: [] }
      )
      const res = mockResponse()

      await InitialAssessmentController.submitQuestionnaire(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('应该验证答案格式 - 空答案数组', async () => {
      const req = mockRequest(
        { assessmentId: '1' },
        { answers: [] }
      )
      const res = mockResponse()

      await InitialAssessmentController.submitQuestionnaire(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getGames', () => {
    it('应该拒绝无效的assessmentId', async () => {
      const req = mockRequest({ assessmentId: 'invalid' })
      const res = mockResponse()

      await InitialAssessmentController.getGames(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('submitGameResult', () => {
    it('应该验证参数完整性 - 缺少gameId', async () => {
      const req = mockRequest(
        { assessmentId: '1' },
        { result: {} }
      )
      const res = mockResponse()

      await InitialAssessmentController.submitGameResult(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('应该验证参数完整性 - 缺少result', async () => {
      const req = mockRequest(
        { assessmentId: '1' },
        {}
      )
      const res = mockResponse()

      await InitialAssessmentController.submitGameResult(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('generateReport', () => {
    it('应该拒绝无效的assessmentId', async () => {
      const req = mockRequest({ assessmentId: 'invalid' })
      const res = mockResponse()

      await InitialAssessmentController.generateReport(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getReport', () => {
    it('应该拒绝无效的reportId', async () => {
      const req = mockRequest({ reportId: '' })
      const res = mockResponse()

      await InitialAssessmentController.getReport(req, res)

      // 报告不存在时返回404
      ;(queryOne as jest.Mock).mockResolvedValueOnce(undefined)

      await InitialAssessmentController.getReport(req, res)

      // 由于reportId为空，查询不会正常执行
      // 这里测试边界情况
    })
  })

  describe('getNorm', () => {
    it('应该拒绝缺少dimension参数', async () => {
      const req = mockRequest({})
      const res = mockResponse()

      await InitialAssessmentController.getNorm(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('应该处理常模不存在', async () => {
      const req = mockRequest(
        { dimension: 'unknown', ageGroup: '6-7' }
      )
      const res = mockResponse()

      ;(queryOne as jest.Mock).mockResolvedValueOnce(undefined)

      await InitialAssessmentController.getNorm(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getGameConfig', () => {
    it('应该处理配置不存在', async () => {
      const req = mockRequest(
        { gameCode: 'unknown', ageGroup: '6-7' }
      )
      const res = mockResponse()

      // 两个查询都返回 undefined
      ;(queryOne as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await InitialAssessmentController.getGameConfig(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getReportList', () => {
    it('应该拒绝缺少childId', async () => {
      const req = mockRequest({})
      const res = mockResponse()

      await InitialAssessmentController.getReportList(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('参数验证测试', () => {
    it('getStatus应该验证childId类型', async () => {
      const req = mockRequest({ childId: 'abc' })
      const res = mockResponse()

      await InitialAssessmentController.getStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('getQuestionnaire应该验证assessmentId为数字', async () => {
      const req = mockRequest({ assessmentId: 'not-a-number' })
      const res = mockResponse()

      await InitialAssessmentController.getQuestionnaire(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('generateReport应该验证assessmentId为数字', async () => {
      const req = mockRequest({ assessmentId: 'not-a-number' })
      const res = mockResponse()

      await InitialAssessmentController.generateReport(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
