/**
 * AI推荐引擎路由
 */

import { Router } from 'express'
import { RecommendationController } from '../controllers/recommendationController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/recommendation/profile/:childId
 * @desc    获取用户画像
 * @access  Private
 */
router.get('/profile/:childId', authMiddleware, RecommendationController.getUserProfile)

/**
 * @route   GET /api/recommendation/:childId
 * @desc    获取推荐游戏列表
 * @access  Private
 */
router.get('/:childId', authMiddleware, RecommendationController.getRecommendations)

/**
 * @route   GET /api/recommendation/weekly-plan/:childId
 * @desc    获取周训练计划
 * @access  Private
 */
router.get('/weekly-plan/:childId', authMiddleware, RecommendationController.getWeeklyPlan)

/**
 * @route   GET /api/recommendation/difficulty/:childId/:gameId
 * @desc    获取难度建议
 * @access  Private
 */
router.get('/difficulty/:childId/:gameId', authMiddleware, RecommendationController.getDifficultySuggestion)

export default router