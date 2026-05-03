/**
 * 家长学院路由
 */
import { Router } from 'express';
import { AcademyController } from '../controllers/academyController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 分类相关
router.get('/categories', AcademyController.getCategories);
router.get('/categories/:id', AcademyController.getCategoryDetail);

// 文章相关
router.get('/articles', AcademyController.getArticles);
router.get('/articles/hot', AcademyController.getHotArticles);
router.get('/articles/recommended', AcademyController.getRecommendedArticles);
router.get('/articles/:id', AcademyController.getArticleDetail);
router.get('/articles/:id/related', AcademyController.getRelatedArticles);

// 标签
router.get('/tags', AcademyController.getTags);

// 问答相关
router.get('/questions/categories', AcademyController.getQuestionCategories);
router.get('/questions/hot', AcademyController.getHotQuestions);
router.get('/questions', AcademyController.getQuestions);
router.get('/questions/:id', AcademyController.getQuestionDetail);
router.get('/questions/:id/answers', AcademyController.getAnswers);

// 创建提问需要登录
router.post('/questions', authMiddleware, AcademyController.createQuestion);

// 专家回答
router.get('/expert-answers', AcademyController.getExpertAnswers);

export default router;