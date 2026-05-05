/**
 * 评估报告系统 API路由
 * 
 * 功能：
 * - 获取报告列表
 * - 生成报告
 * - 获取报告详情
 * - 获取7维度评估数据
 */

import { Router } from 'express'
import { ReportController } from '../controllers'
import { AssessmentController } from '../controllers/assessmentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/report/list
 * 获取报告列表（需登录）
 */
router.get('/list', authMiddleware, ReportController.getReportList)

/**
 * GET /api/report/:reportId
 * 获取报告详情（需登录）
 */
router.get('/:reportId', authMiddleware, ReportController.getReportDetail)

/**
 * GET /api/report/child/:childId/latest
 * 获取儿童最新报告（需登录）
 */
router.get('/child/:childId/latest', authMiddleware, ReportController.getLatestReport)

/**
 * POST /api/report/generate
 * 生成报告（需登录）
 */
router.post('/generate', authMiddleware, ReportController.generateReport)

/**
 * GET /api/assessment/child/:childId/dimensions
 * 获取儿童7维度评估数据（需登录）
 */
router.get('/child/:childId/dimensions', authMiddleware, AssessmentController.getDimensionScores)

/**
 * GET /api/assessment/child/:childId/trend
 * 获取能力趋势数据（需登录）
 */
router.get('/child/:childId/trend', authMiddleware, AssessmentController.getAbilityTrend)

/**
 * GET /api/assessment/child/:childId/summary
 * 获取能力综合摘要（需登录）
 */
router.get('/child/:childId/summary', authMiddleware, AssessmentController.getAbilitySummary)

export default router