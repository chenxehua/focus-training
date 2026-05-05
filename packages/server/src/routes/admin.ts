/**
 * 管理员路由
 */
import { Router } from 'express'
import * as adminController from '../controllers/adminController'
import { adminAuth } from '../middleware/auth'

const router = Router()

// 所有管理接口都需要管理员权限
router.use(adminAuth)

// 仪表盘
router.get('/dashboard', adminController.getDashboardStats)

// 用户管理
router.get('/users', adminController.getUserList)
router.get('/users/select', adminController.getUserSelectList)
router.get('/users/:id', adminController.getUserDetail)
router.put('/users/:id/status', adminController.updateUserStatus)

// 儿童管理
router.get('/children', adminController.getChildList)

// 订单管理
router.get('/orders', adminController.getOrderList)
router.get('/orders/:id', adminController.getOrderDetail)

// 会员管理
router.get('/members', adminController.getMemberList)
router.put('/members/:id', adminController.updateMember)
router.post('/members/grant', adminController.grantMembership)

// 内容管理 - 家长学院
router.get('/academy/articles', adminController.getArticleList)
router.post('/academy/articles', adminController.createArticle)
router.put('/academy/articles/:id', adminController.updateArticle)
router.delete('/academy/articles/:id', adminController.deleteArticle)

// 问题管理
router.get('/academy/questions', adminController.getQuestionList)
router.post('/academy/questions/:id/answer', adminController.answerQuestion)

// 游戏配置
router.get('/games', adminController.getGameList)
router.put('/games/:id', adminController.updateGame)

// 数据分析
router.get('/analytics/training', adminController.getTrainingAnalytics)
router.get('/analytics/retention', adminController.getRetentionAnalytics)

// 训练记录管理
router.get('/training/records', adminController.getTrainingRecords)
router.get('/training/child/:childId', adminController.getChildTrainingRecords)
router.get('/training/records/:id', adminController.getTrainingRecordDetail)
router.get('/training/today', adminController.getTodayTraining)

// 评估报告
router.get('/assessment/child/:childId', adminController.getChildAssessmentReport)
router.get('/assessment/list', adminController.getAssessmentReportList)

export default router