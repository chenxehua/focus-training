/**
 * 会员系统 API路由
 * 
 * 功能：
 * - 获取会员状态
 * - 创建订单
 * - 微信支付
 * - 支付回调
 */

import { Router } from 'express'
import { membershipController, paymentController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/membership/status
 * 获取会员状态（需登录）
 */
router.get('/status', authMiddleware, membershipController.getMembershipStatus)

/**
 * GET /api/membership/packages
 * 获取会员套餐列表（无需登录）
 */
router.get('/packages', membershipController.getMembershipPackages)

/**
 * POST /api/membership/create-order
 * 创建会员订单（需登录）
 */
router.post('/create-order', authMiddleware, paymentController.createOrder)

/**
 * GET /api/membership/order/:orderNo
 * 查询订单状态（需登录）
 */
router.get('/order/:orderNo', authMiddleware, paymentController.getOrderStatus)

/**
 * POST /api/membership/pay
 * 发起支付（需登录）
 */
router.post('/pay', authMiddleware, paymentController.initiatePayment)

/**
 * POST /api/membership/callback
 * 微信支付回调（无需登录，微信回调地址）
 */
router.post('/callback', paymentController.handleCallback)

/**
 * GET /api/membership/history
 * 获取购买历史（需登录）
 */
router.get('/history', authMiddleware, membershipController.getPurchaseHistory)

export default router