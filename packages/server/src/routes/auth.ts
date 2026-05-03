import { Router } from 'express'
import { AuthController } from '../controllers'
import { loginLimiter } from '../middleware/rateLimit'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * POST /api/auth/wx-login
 * 微信小程序登录（code 换 token）
 */
router.post('/wx-login', loginLimiter, AuthController.wxLogin)

/**
 * POST /api/auth/admin-login
 * 管理员账号密码登录
 */
router.post('/admin-login', loginLimiter, AuthController.adminLogin)

/**
 * GET /api/auth/admin-info
 * 获取管理员信息
 */
router.get('/admin-info', authMiddleware, AuthController.getAdminInfo)

export default router