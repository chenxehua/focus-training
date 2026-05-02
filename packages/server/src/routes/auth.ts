import { Router } from 'express'
import { authController } from '../controllers'
import { loginLimiter } from '../middleware/rateLimit'

const router = Router()

/**
 * POST /api/auth/wx-login
 * 微信小程序登录（code 换 token）
 */
router.post('/wx-login', loginLimiter, authController.wxLogin)

export default router
