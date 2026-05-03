/**
 * 家长学院 Controller
 */
import { Request, Response } from 'express';
import { AcademyCategory } from '../models/AcademyCategory';
import { AcademyArticle } from '../models/AcademyArticle';
import { AcademyQuestion } from '../models/AcademyQuestion';

// 家长学院 Controller
export class AcademyController {
  /**
   * 获取所有分类
   * GET /api/academy/categories
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await AcademyCategory.findAll();
      res.json({
        code: 0,
        data: categories,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取分类失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取分类详情及文章列表
   * GET /api/academy/categories/:id
   */
  static async getCategoryDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await AcademyCategory.getCategoryWithArticles(parseInt(id), page, pageSize);
      
      if (!result) {
        return res.status(404).json({
          code: 404,
          data: null,
          message: '分类不存在'
        });
      }

      res.json({
        code: 0,
        data: result,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取分类详情失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取热门文章
   * GET /api/academy/articles/hot
   */
  static async getHotArticles(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await AcademyArticle.getHotArticles(limit);
      res.json({
        code: 0,
        data: articles,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取热门文章失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取推荐文章
   * GET /api/academy/articles/recommended
   */
  static async getRecommendedArticles(req: Request, res: Response) {
    try {
      const childId = parseInt(req.query.childId as string) || 0;
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await AcademyArticle.getRecommendedArticles(childId, limit);
      res.json({
        code: 0,
        data: articles,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取推荐文章失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取文章详情
   * GET /api/academy/articles/:id
   */
  static async getArticleDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const article = await AcademyArticle.findById(parseInt(id));
      
      if (!article) {
        return res.status(404).json({
          code: 404,
          data: null,
          message: '文章不存在'
        });
      }

      // 增加阅读数
      await AcademyArticle.incrementReadCount(parseInt(id));

      res.json({
        code: 0,
        data: article,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取文章详情失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取文章列表
   * GET /api/academy/articles
   */
  static async getArticles(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const tag = req.query.tag as string;
      const keyword = req.query.keyword as string;

      const result = await AcademyArticle.getArticles({
        page,
        pageSize,
        categoryId,
        tag,
        keyword
      });

      res.json({
        code: 0,
        data: result,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取文章列表失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取相关文章
   * GET /api/academy/articles/:id/related
   */
  static async getRelatedArticles(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await AcademyArticle.getRelatedArticles(parseInt(id), limit);
      res.json({
        code: 0,
        data: articles,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取相关文章失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取所有标签
   * GET /api/academy/tags
   */
  static async getTags(req: Request, res: Response) {
    try {
      const tags = await AcademyArticle.getAllTags();
      res.json({
        code: 0,
        data: tags,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取问答分类
   * GET /api/academy/questions/categories
   */
  static async getQuestionCategories(req: Request, res: Response) {
    try {
      const categories = await AcademyQuestion.getCategories();
      res.json({
        code: 0,
        data: categories,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取问答分类失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取热门问题
   * GET /api/academy/questions/hot
   */
  static async getHotQuestions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await AcademyQuestion.getHotQuestions(limit);
      res.json({
        code: 0,
        data: questions,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取热门问题失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取问题详情
   * GET /api/academy/questions/:id
   */
  static async getQuestionDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const question = await AcademyQuestion.findById(parseInt(id));
      
      if (!question) {
        return res.status(404).json({
          code: 404,
          data: null,
          message: '问题不存在'
        });
      }

      res.json({
        code: 0,
        data: question,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取问题详情失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取问题列表
   * GET /api/academy/questions
   */
  static async getQuestions(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const status = req.query.status !== undefined ? parseInt(req.query.status as string) : undefined;

      const result = await AcademyQuestion.getQuestions({
        page,
        pageSize,
        categoryId,
        status
      });

      res.json({
        code: 0,
        data: result,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取问题列表失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 创建提问
   * POST /api/academy/questions
   */
  static async createQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          data: null,
          message: '请先登录'
        });
      }

      const { questionTitle, questionContent, categoryId, images } = req.body;

      if (!questionTitle || !questionContent || !categoryId) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '请填写完整的提问信息'
        });
      }

      const id = await AcademyQuestion.create(userId, {
        questionTitle,
        questionContent,
        categoryId,
        images
      });

      res.json({
        code: 0,
        data: { id },
        message: '提问成功'
      });
    } catch (error) {
      console.error('创建提问失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取问题回答
   * GET /api/academy/questions/:id/answers
   */
  static async getAnswers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await AcademyQuestion.getAnswers(parseInt(id), page, pageSize);
      res.json({
        code: 0,
        data: result,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取回答失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }

  /**
   * 获取专家回答
   * GET /api/academy/expert-answers
   */
  static async getExpertAnswers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const answers = await AcademyQuestion.getExpertAnswers(limit);
      res.json({
        code: 0,
        data: answers,
        message: '获取成功'
      });
    } catch (error) {
      console.error('获取专家回答失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '服务器错误'
      });
    }
  }
}

export default AcademyController;