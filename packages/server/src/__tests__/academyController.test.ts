import { AcademyController } from '../controllers'

// Mock the database module
jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
}))

// Mock the models
jest.mock('../models/AcademyCategory', () => ({
  AcademyCategory: {
    findAll: jest.fn(),
    findById: jest.fn(),
    getCategoryWithArticles: jest.fn(),
  },
}))

jest.mock('../models/AcademyArticle', () => ({
  AcademyArticle: {
    getHotArticles: jest.fn(),
    getRecommendedArticles: jest.fn(),
    getArticles: jest.fn(),
    getAllTags: jest.fn(),
    findById: jest.fn(),
    incrementReadCount: jest.fn(),
  },
}))

jest.mock('../models/AcademyQuestion', () => ({
  AcademyQuestion: {
    getCategories: jest.fn(),
    getHotQuestions: jest.fn(),
    getQuestions: jest.fn(),
    getAnswers: jest.fn(),
    getExpertAnswers: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}))

// Import mocked models
import { AcademyCategory } from '../models/AcademyCategory'
import { AcademyArticle } from '../models/AcademyArticle'
import { AcademyQuestion } from '../models/AcademyQuestion'

// Mock request and response helpers
const mockRequest = (overrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides,
  } as any
  return req
}

const mockResponse = () => {
  const res = {} as any
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('AcademyController', () => {
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRes = mockResponse()
  })

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, category_name: '专注力科普', category_icon: '📚', article_count: 20 },
        { id: 2, category_name: '家庭训练', category_icon: '🏠', article_count: 30 },
      ]
      ;(AcademyCategory.findAll as jest.Mock).mockResolvedValue(mockCategories)

      const req = mockRequest()
      await AcademyController.getCategories(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          message: '获取成功',
        })
      )
      expect(AcademyCategory.findAll).toHaveBeenCalled()
    })

    it('should handle server error', async () => {
      ;(AcademyCategory.findAll as jest.Mock).mockRejectedValue(new Error('Database error'))

      const req = mockRequest()
      await AcademyController.getCategories(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 500,
          message: '服务器错误',
        })
      )
    })
  })

  describe('getCategoryDetail', () => {
    it('should return category with articles', async () => {
      const mockResult = {
        category: { id: 1, category_name: '专注力科普' },
        articles: [{ id: 1, title: '文章1' }],
        total: 1,
        page: 1,
        pageSize: 10,
      }
      ;(AcademyCategory.getCategoryWithArticles as jest.Mock).mockResolvedValue(mockResult)

      const req = mockRequest({ params: { id: '1' }, query: { page: '1', pageSize: '10' } })
      await AcademyController.getCategoryDetail(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockResult,
          message: '获取成功',
        })
      )
    })

    it('should return 404 for non-existent category', async () => {
      ;(AcademyCategory.getCategoryWithArticles as jest.Mock).mockResolvedValue(null)

      const req = mockRequest({ params: { id: '999' } })
      await AcademyController.getCategoryDetail(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: '分类不存在',
        })
      )
    })
  })

  describe('getHotArticles', () => {
    it('should return hot articles', async () => {
      const mockArticles = [
        { id: 1, title: '热门文章1', read_count: 1000 },
        { id: 2, title: '热门文章2', read_count: 800 },
      ]
      ;(AcademyArticle.getHotArticles as jest.Mock).mockResolvedValue(mockArticles)

      const req = mockRequest({ query: { limit: '5' } })
      await AcademyController.getHotArticles(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockArticles,
        })
      )
    })
  })

  describe('getRecommendedArticles', () => {
    it('should return recommended articles', async () => {
      const mockArticles = [{ id: 1, title: '推荐文章1' }]
      ;(AcademyArticle.getRecommendedArticles as jest.Mock).mockResolvedValue(mockArticles)

      const req = mockRequest({ query: { childId: '1' } })
      await AcademyController.getRecommendedArticles(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockArticles,
        })
      )
    })
  })

  describe('getArticleDetail', () => {
    it('should return article detail and increment read count', async () => {
      const mockArticle = { id: 1, title: '测试文章', read_count: 100 }
      ;(AcademyArticle.findById as jest.Mock).mockResolvedValue(mockArticle)
      ;(AcademyArticle.incrementReadCount as jest.Mock).mockResolvedValue(undefined)

      const req = mockRequest({ params: { id: '1' } })
      await AcademyController.getArticleDetail(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockArticle,
        })
      )
      expect(AcademyArticle.incrementReadCount).toHaveBeenCalledWith(1)
    })

    it('should return 404 for non-existent article', async () => {
      ;(AcademyArticle.findById as jest.Mock).mockResolvedValue(null)

      const req = mockRequest({ params: { id: '999' } })
      await AcademyController.getArticleDetail(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: '文章不存在',
        })
      )
    })
  })

  describe('getArticles', () => {
    it('should return paginated articles', async () => {
      const mockResult = {
        articles: [{ id: 1, title: '文章1' }],
        total: 50,
        page: 1,
        pageSize: 10,
        totalPages: 5,
      }
      ;(AcademyArticle.getArticles as jest.Mock).mockResolvedValue(mockResult)

      const req = mockRequest({ query: { page: '1', pageSize: '10' } })
      await AcademyController.getArticles(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockResult,
        })
      )
    })

    it('should filter articles by category', async () => {
      const mockResult = {
        articles: [{ id: 1, title: '文章1', category_id: 2 }],
        total: 10,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }
      ;(AcademyArticle.getArticles as jest.Mock).mockResolvedValue(mockResult)

      const req = mockRequest({ query: { categoryId: '2', page: '1', pageSize: '10' } })
      await AcademyController.getArticles(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockResult,
        })
      )
    })
  })

  describe('getTags', () => {
    it('should return all tags', async () => {
      const mockTags = ['专注力', '记忆力', '注意力', '家庭训练']
      ;(AcademyArticle.getAllTags as jest.Mock).mockResolvedValue(mockTags)

      const req = mockRequest()
      await AcademyController.getTags(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockTags,
        })
      )
    })
  })

  describe('getQuestionCategories', () => {
    it('should return question categories', async () => {
      const mockCategories = [
        { id: 1, category_name: '专注力问题', question_count: 10 },
        { id: 2, category_name: '学习问题', question_count: 15 },
      ]
      ;(AcademyQuestion.getCategories as jest.Mock).mockResolvedValue(mockCategories)

      const req = mockRequest()
      await AcademyController.getQuestionCategories(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockCategories,
        })
      )
    })
  })

  describe('getHotQuestions', () => {
    it('should return hot questions', async () => {
      const mockQuestions = [{ id: 1, question_title: '热门问题1', view_count: 500 }]
      ;(AcademyQuestion.getHotQuestions as jest.Mock).mockResolvedValue(mockQuestions)

      const req = mockRequest({ query: { limit: '5' } })
      await AcademyController.getHotQuestions(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockQuestions,
        })
      )
    })
  })

  describe('getQuestions', () => {
    it('should return paginated questions', async () => {
      const mockResult = {
        questions: [{ id: 1, question_title: '问题1' }],
        total: 20,
        page: 1,
        pageSize: 10,
      }
      ;(AcademyQuestion.getQuestions as jest.Mock).mockResolvedValue(mockResult)

      const req = mockRequest({ query: { page: '1', pageSize: '10' } })
      await AcademyController.getQuestions(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockResult,
        })
      )
    })
  })

  describe('getQuestionDetail', () => {
    it('should return question detail', async () => {
      const mockQuestion = { id: 1, question_title: '测试问题' }
      ;(AcademyQuestion.findById as jest.Mock).mockResolvedValue(mockQuestion)

      const req = mockRequest({ params: { id: '1' } })
      await AcademyController.getQuestionDetail(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockQuestion,
        })
      )
    })

    it('should return 404 for non-existent question', async () => {
      ;(AcademyQuestion.findById as jest.Mock).mockResolvedValue(null)

      const req = mockRequest({ params: { id: '999' } })
      await AcademyController.getQuestionDetail(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: '问题不存在',
        })
      )
    })
  })

  describe('createQuestion', () => {
    it('should return 401 if not logged in', async () => {
      const req = mockRequest({
        body: { questionTitle: '问题', questionContent: '内容', categoryId: 1 },
        user: null,
      })
      await AcademyController.createQuestion(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
          message: '请先登录',
        })
      )
    })

    it('should return 400 if required fields missing', async () => {
      const req = mockRequest({
        body: { questionTitle: '' },
        user: { id: 1 },
      })
      await AcademyController.createQuestion(req, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 400,
          message: '请填写完整的提问信息',
        })
      )
    })

    it('should create question successfully', async () => {
      ;(AcademyQuestion.create as jest.Mock).mockResolvedValue(123)

      const req = mockRequest({
        body: {
          questionTitle: '问题标题',
          questionContent: '问题内容',
          categoryId: 1,
        },
        user: { id: 1 },
      })
      await AcademyController.createQuestion(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: { id: 123 },
          message: '提问成功',
        })
      )
    })
  })

  describe('getAnswers', () => {
    it('should return answers for a question', async () => {
      const mockResult = {
        answers: [{ id: 1, answer_content: '回答内容' }],
        total: 1,
        page: 1,
        pageSize: 10,
      }
      ;(AcademyQuestion.getAnswers as jest.Mock).mockResolvedValue(mockResult)

      const req = mockRequest({ params: { id: '1' }, query: { page: '1', pageSize: '10' } })
      await AcademyController.getAnswers(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockResult,
        })
      )
    })
  })

  describe('getExpertAnswers', () => {
    it('should return expert answers', async () => {
      const mockAnswers = [{ id: 1, answer_content: '专家回答1', is_expert: 1 }]
      ;(AcademyQuestion.getExpertAnswers as jest.Mock).mockResolvedValue(mockAnswers)

      const req = mockRequest({ query: { limit: '5' } })
      await AcademyController.getExpertAnswers(req, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 0,
          data: mockAnswers,
        })
      )
    })
  })
})