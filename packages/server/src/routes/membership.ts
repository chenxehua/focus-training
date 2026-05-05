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
import { MembershipController, PaymentController } from '../controllers'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/membership/status
 * 获取会员状态（需登录）
 */
router.get('/status', authMiddleware, MembershipController.getMembershipStatus)

/**
 * GET /api/membership/info
 * 获取会员信息（需登录）
 */
router.get('/info', authMiddleware, MembershipController.getMembershipInfo)

/**
 * GET /api/membership/packages
 * 获取会员套餐列表（无需登录）
 */
router.get('/packages', MembershipController.getMembershipPackages)

/**
 * GET /api/membership/benefits
 * 获取会员权益说明（无需登录）
 */
router.get('/benefits', MembershipController.getMembershipBenefits)

/**
 * POST /api/membership/create-order
 * 创建会员订单（需登录）
 */
router.post('/create-order', authMiddleware, PaymentController.createOrder)

/**
 * GET /api/membership/order/:orderNo
 * 查询订单状态（需登录）
 */
router.get('/order/:orderNo', authMiddleware, PaymentController.getOrderStatus)

/**
 * POST /api/membership/pay
 * 发起支付（需登录）
 */
router.post('/pay', authMiddleware, PaymentController.initiatePayment)

/**
 * POST /api/membership/callback
 * 微信支付回调（无需登录，微信回调地址）
 */
router.post('/callback', PaymentController.handleCallback)

/**
 * GET /api/membership/history
 * 获取购买历史（需登录）
 */
router.get('/history', authMiddleware, MembershipController.getPurchaseHistory)

export default router