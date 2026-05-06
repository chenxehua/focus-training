/**
 * 评估报告系统 API路由
 * 
 * 功能：
 * - 获取报告列表
 * - 生成报告
 * - 获取报告详情
 * - 获取7维度评估数据
 * - 初次测评系统 API
 */

import { Router } from 'express'
import { ReportController } from '../controllers'
import { AssessmentController } from '../controllers/assessmentController'
import { InitialAssessmentController } from '../controllers/initialAssessmentController'
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

/**
 * ==================== 初次测评系统 API ====================
 */

/**
 * GET /api/assessment/status/:childId
 * 获取儿童测评状态
 */
router.get('/status/:childId', authMiddleware, InitialAssessmentController.getStatus)

/**
 * POST /api/assessment/start
 * 开始测评
 */
router.post('/start', authMiddleware, InitialAssessmentController.startAssessment)

/**
 * GET /api/assessment/questionnaire/:assessmentId
 * 获取问卷题目
 */
router.get('/questionnaire/:assessmentId', authMiddleware, InitialAssessmentController.getQuestionnaire)

/**
 * POST /api/assessment/questionnaire/:assessmentId
 * 提交问卷答案
 */
router.post('/questionnaire/:assessmentId', authMiddleware, InitialAssessmentController.submitQuestionnaire)

/**
 * GET /api/assessment/games/:assessmentId
 * 获取测评游戏列表
 */
router.get('/games/:assessmentId', authMiddleware, InitialAssessmentController.getGames)

/**
 * POST /api/assessment/games/:assessmentId
 * 提交游戏测评结果
 */
router.post('/games/:assessmentId', authMiddleware, InitialAssessmentController.submitGameResult)

/**
 * POST /api/assessment/generate-report/:assessmentId
 * 生成测评报告
 */
router.post('/generate-report/:assessmentId', authMiddleware, InitialAssessmentController.generateReport)

/**
 * GET /api/assessment/report/:reportId
 * 获取测评报告详情
 */
router.get('/report/:reportId', authMiddleware, InitialAssessmentController.getReport)

/**
 * GET /api/assessment/report/child/:childId/list
 * 获取儿童测评报告列表
 */
router.get('/report/child/:childId/list', authMiddleware, InitialAssessmentController.getReportList)

/**
 * GET /api/assessment/norm/:dimension/:ageGroup
 * 获取百分位常模
 */
router.get('/norm/:dimension/:ageGroup', authMiddleware, InitialAssessmentController.getNorm)

/**
 * GET /api/assessment/game-config/:gameCode/:ageGroup
 * 获取游戏难度配置
 */
router.get('/game-config/:gameCode/:ageGroup', authMiddleware, InitialAssessmentController.getGameConfig)

export default router