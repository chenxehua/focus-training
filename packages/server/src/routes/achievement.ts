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
import { AchievementController, achievementController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/achievement/list
 * 获取所有成就定义（无需登录）
 */
router.get('/list', AchievementController.getAchievementList)

/**
 * GET /api/achievement/child/:childId
 * 获取儿童成就状态（需登录）
 */
router.get('/child/:childId', authMiddleware, AchievementController.getChildAchievements)

/**
 * GET /api/achievement/leaderboard/:gameId
 * 获取游戏排行榜（需登录）
 */
router.get('/leaderboard/:gameId', authMiddleware, AchievementController.getLeaderboard)

/**
 * POST /api/achievement/unlock
 * 手动解锁成就（系统自动调用）
 */
router.post('/unlock', authMiddleware, AchievementController.unlockAchievement)

/**
 * GET /api/achievement/stats/:childId
 * 获取儿童成就统计
 */
router.get('/stats/:childId', authMiddleware, AchievementController.getAchievementStats)

export default router