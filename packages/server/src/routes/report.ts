import { Router } from 'express'
import { reportController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/report/today/:childId
 * 获取今日训练数据
 */
router.get('/today/:childId', reportController.getTodayData)

/**
 * GET /api/report/weekly/:childId
 * 获取本周训练报告
 */
router.get('/weekly/:childId', reportController.getWeeklyReport)

export default router