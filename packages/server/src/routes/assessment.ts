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
import { reportController, assessmentController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/report/list
 * 获取报告列表（需登录）
 */
router.get('/list', authMiddleware, reportController.getReportList)

/**
 * GET /api/report/:reportId
 * 获取报告详情（需登录）
 */
router.get('/:reportId', authMiddleware, reportController.getReportDetail)

/**
 * GET /api/report/child/:childId/latest
 * 获取儿童最新报告（需登录）
 */
router.get('/child/:childId/latest', authMiddleware, reportController.getLatestReport)

/**
 * POST /api/report/generate
 * 生成报告（需登录）
 */
router.post('/generate', authMiddleware, reportController.generateReport)

// 评估相关路由
/**
 * GET /api/assessment/child/:childId/dimensions
 * 获取儿童7维度评估数据（需登录）
 */
router.get('/child/:childId/dimensions', authMiddleware, assessmentController.getDimensionScores)

/**
 * GET /api/assessment/child/:childId/trend
 * 获取能力趋势数据（需登录）
 */
router.get('/child/:childId/trend', authMiddleware, assessmentController.getAbilityTrend)

/**
 * GET /api/assessment/child/:childId/summary
 * 获取能力综合摘要（需登录）
 */
router.get('/child/:childId/summary', authMiddleware, assessmentController.getAbilitySummary)

export default router