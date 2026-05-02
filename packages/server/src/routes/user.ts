import { Router } from 'express'
import { UserController } from '../controllers/userController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// 所有用户路由都需要鉴权
router.use(authMiddleware)

/**
 * GET /api/user/info
 * 获取当前用户信息
 */
router.get('/info', UserController.getInfo)

/**
 * PUT /api/user/info
 * 更新用户信息（昵称、头像）
 */
router.put('/info', UserController.updateInfo)

/**
 * GET /api/user/children
 * 获取家长名下的儿童列表
 */
router.get('/children', UserController.getChildren)

/**
 * POST /api/user/child
 * 添加儿童
 */
router.post('/child', UserController.addChild)

/**
 * PUT /api/user/child/:childId
 * 更新儿童信息
 */
router.put('/child/:childId', UserController.updateChild)

export default router
