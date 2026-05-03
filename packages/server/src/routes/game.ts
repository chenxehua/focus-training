import { Router } from 'express'
import { GameController } from '../controllers'
import { authMiddleware } from '../middleware/auth'
import { recordLimiter } from '../middleware/rateLimit'

const router = Router()

/**
 * GET /api/game/list
 * 获取游戏列表（无需登录）
 */
router.get('/list', GameController.getGameList)

// 以下需要登录
router.use(authMiddleware)

/**
 * GET /api/game/records
 * 获取训练历史列表（必须在 /:gameId 之前注册，避免被动态参数路由拦截）
 */
router.get('/records', GameController.getRecords)

/**
 * POST /api/game/record
 * 提交游戏记录
 */
router.post('/record', recordLimiter, GameController.submitRecord)

/**
 * GET /api/game/:gameId
 * 获取游戏详情
 */
router.get('/:gameId', GameController.getGameDetail)

export default router