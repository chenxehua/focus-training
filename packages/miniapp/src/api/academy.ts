/**
 * 家长学院 API
 */
import request from './request'

/**
 * 获取所有分类
 */
export function getAcademyCategories() {
  return request.get('/academy/categories')
}

/**
 * 获取分类详情及文章列表
 */
export function getCategoryDetail(categoryId: number, page = 1, pageSize = 10) {
  return request.get(`/academy/categories/${categoryId}`, { page, pageSize })
}

/**
 * 获取热门文章
 */
export function getHotArticles(limit = 5) {
  return request.get('/academy/articles/hot', { limit })
}

/**
 * 获取推荐文章
 */
export function getRecommendedArticles(childId?: number, limit = 5) {
  return request.get('/academy/articles/recommended', { childId, limit })
}

/**
 * 获取文章详情
 */
export function getArticleDetail(articleId: number) {
  return request.get(`/academy/articles/${articleId}`)
}

/**
 * 获取文章列表
 */
export function getArticles(params: {
  page?: number
  pageSize?: number
  categoryId?: number
  tag?: string
  keyword?: string
}) {
  return request.get('/academy/articles', params)
}

/**
 * 获取相关文章
 */
export function getRelatedArticles(articleId: number, limit = 5) {
  return request.get(`/academy/articles/${articleId}/related`, { limit })
}

/**
 * 获取所有标签
 */
export function getAcademyTags() {
  return request.get('/academy/tags')
}

/**
 * 获取问答分类
 */
export function getQuestionCategories() {
  return request.get('/academy/questions/categories')
}

/**
 * 获取热门问题
 */
export function getHotQuestions(limit = 10) {
  return request.get('/academy/questions/hot', { limit })
}

/**
 * 获取问题列表
 */
export function getQuestions(params: {
  page?: number
  pageSize?: number
  categoryId?: number
  status?: number
}) {
  return request.get('/academy/questions', params)
}

/**
 * 获取问题详情
 */
export function getQuestionDetail(questionId: number) {
  return request.get(`/academy/questions/${questionId}`)
}

/**
 * 创建提问
 */
export function createQuestion(data: {
  questionTitle: string
  questionContent: string
  categoryId: number
  images?: string
}) {
  return request.post('/academy/questions', data)
}

/**
 * 获取问题回答
 */
export function getAnswers(questionId: number, page = 1, pageSize = 10) {
  return request.get(`/academy/questions/${questionId}/answers`, { page, pageSize })
}

/**
 * 获取专家回答
 */
export function getExpertAnswers(limit = 5) {
  return request.get('/academy/expert-answers', { limit })
}