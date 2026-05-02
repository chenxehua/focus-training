/**
 * 成就系统 API路由
 * 
 * 功能：
 * - 获取成就列表
 * - 获取儿童成就状态
 * - 解锁成就
 * - 获取排行榜
 */

import { Router } from 'express'
import { achievementController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/achievement/list
 * 获取所有成就定义（无需登录）
 */
router.get('/list', achievementController.getAchievementList)

/**
 * GET /api/achievement/child/:childId
 * 获取儿童成就状态（需登录）
 */
router.get('/child/:childId', authMiddleware, achievementController.getChildAchievements)

/**
 * GET /api/achievement/leaderboard/:gameId
 * 获取游戏排行榜（需登录）
 */
router.get('/leaderboard/:gameId', authMiddleware, achievementController.getLeaderboard)

/**
 * POST /api/achievement/unlock
 * 手动解锁成就（系统自动调用）
 */
router.post('/unlock', authMiddleware, achievementController.unlockAchievement)

/**
 * GET /api/achievement/stats/:childId
 * 获取儿童成就统计
 */
router.get('/stats/:childId', authMiddleware, achievementController.getAchievementStats)

export default router