import { Router } from 'express'
import { ReportController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/report/today/:childId
 * 获取今日训练数据
 */
router.get('/today/:childId', ReportController.getTodayData)

/**
 * GET /api/report/weekly/:childId
 * 获取本周训练报告
 */
router.get('/weekly/:childId', ReportController.getWeeklyReport)

/**
 * GET /api/report/monthly/:childId
 * 获取本月训练报告
 */
router.get('/monthly/:childId', ReportController.getMonthlyReport)

/**
 * GET /api/report/list
 * 获取报告列表
 */
router.get('/list', ReportController.getReportList)

/**
 * GET /api/report/:reportId
 * 获取报告详情
 */
router.get('/:reportId', ReportController.getReportDetail)

/**
 * GET /api/report/child/:childId/latest
 * 获取儿童最新报告
 */
router.get('/child/:childId/latest', ReportController.getLatestReport)

/**
 * POST /api/report/generate
 * 生成报告
 */
router.post('/generate', ReportController.generateReport)

export default router