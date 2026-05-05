import request from '@/utils/request'
import type { ApiResponse, PageResult, DashboardStats, User, Child, Order, Member, Article, Question, Game, TrainingTrend, GameStats, TrainingRecord, TodayTraining, AssessmentReport } from '@/types'

// 仪表盘统计
export function getDashboardStats() {
  return request.get<ApiResponse<{
    stats: DashboardStats
    userTrend: { date: string; count: number }[]
    gameUsage: { name: string; code: string; count: number }[]
  }>>('/admin/dashboard')
}

// 用户管理
export function getUserList(params: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
  return request.get<ApiResponse<PageResult<User>>>('/admin/users', { params })
}

export function getUserDetail(id: number) {
  return request.get<ApiResponse<{
    user: User
    children: Child[]
    orderStats: { total: number; amount: number }
  }>>(`/admin/users/${id}`)
}

export function updateUserStatus(id: number, status: number) {
  return request.put<ApiResponse<{ message: string }>>(`/admin/users/${id}/status`, { status })
}

// 儿童管理
export function getChildList(params: { page?: number; pageSize?: number; keyword?: string; ageGroup?: string }) {
  return request.get<ApiResponse<PageResult<Child>>>('/admin/children', { params })
}

// 订单管理
export function getOrderList(params: { page?: number; pageSize?: number; status?: string; startDate?: string; endDate?: string }) {
  return request.get<ApiResponse<PageResult<Order>>>('/admin/orders', { params })
}

export function getOrderDetail(id: number) {
  return request.get<ApiResponse<Order>>(`/admin/orders/${id}`)
}

// 会员管理
export function getMemberList(params: { page?: number; pageSize?: number; status?: string }) {
  return request.get<ApiResponse<PageResult<Member>>>('/admin/members', { params })
}

export function updateMember(id: number, data: { status?: string; extendDays?: number }) {
  return request.put<ApiResponse<{ message: string }>>(`/admin/members/${id}`, data)
}

// 开通会员
export function grantMembership(data: {
  userId: number
  childId?: number
  tier: 'free' | 'basic' | 'premium'
  durationDays: number
}) {
  return request.post<ApiResponse<{
    childId: number
    membershipId: number
    tier: string
    startDate: string
    endDate: string
    status: number
  }>>('/admin/members/grant', data)
}

// 获取用户列表 (用于开通会员时选择用户)
export function getUserSelectList(params: { keyword?: string }) {
  return request.get<ApiResponse<{ id: number; nickname: string; phone: string }[]>>('/admin/users/select', { params })
}

// 文章管理
export function getArticleList(params: { page?: number; pageSize?: number; categoryId?: string; keyword?: string }) {
  return request.get<ApiResponse<PageResult<Article>>>('/admin/academy/articles', { params })
}

export function createArticle(data: {
  title: string
  content: string
  summary?: string
  coverImage?: string
  categoryId: number
  author?: string
  isFeatured?: boolean
  isPublished?: boolean
}) {
  return request.post<ApiResponse<{ id: number }>>('/admin/academy/articles', data)
}

export function updateArticle(id: number, data: Partial<{
  title: string
  content: string
  summary: string
  coverImage: string
  categoryId: number
  author: string
  isFeatured: boolean
  isPublished: boolean
}>) {
  return request.put<ApiResponse<{ message: string }>>(`/admin/academy/articles/${id}`, data)
}

export function deleteArticle(id: number) {
  return request.delete<ApiResponse<{ message: string }>>(`/admin/academy/articles/${id}`)
}

// 问题管理
export function getQuestionList(params: { page?: number; pageSize?: number; status?: string }) {
  return request.get<ApiResponse<PageResult<Question>>>('/admin/academy/questions', { params })
}

export function answerQuestion(id: number, data: { content: string; isExpert?: boolean }) {
  return request.post<ApiResponse<{ id: number }>>(`/admin/academy/questions/${id}/answer`, data)
}

// 游戏配置
export function getGameList() {
  return request.get<ApiResponse<Game[]>>('/admin/games')
}

export function updateGame(id: number, data: {
  game_name?: string
  description?: string
  icon_url?: string
  difficulty_levels?: number
  target_age_group?: string
  is_free?: boolean
  status?: string
}) {
  return request.put<ApiResponse<{ message: string }>>(`/admin/games/${id}`, data)
}

// 数据分析
export function getTrainingAnalytics(params: { days?: number }) {
  return request.get<ApiResponse<{
    dailyTrend: TrainingTrend[]
    ageGroupStats: { age_group: string; count: number; avg_accuracy: number }[]
    gameStats: GameStats[]
  }>>('/admin/analytics/training', { params })
}

export function getRetentionAnalytics() {
  return request.get<ApiResponse<{
    date: string
    new_users: number
    d1_retained: number
    d7_retained: number
    d30_retained: number
  }[]>>('/admin/analytics/retention')
}

// 训练记录管理
export function getTrainingRecords(params: {
  page?: number
  pageSize?: number
  childId?: number
  gameId?: number
  startDate?: string
  endDate?: string
}) {
  return request.get<ApiResponse<PageResult<TrainingRecord>>>('/admin/training/records', { params })
}

export function getChildTrainingRecords(childId: number, params?: { page?: number; pageSize?: number }) {
  return request.get<ApiResponse<PageResult<TrainingRecord>>>(`/admin/training/child/${childId}`, { params })
}

export function getTrainingRecordDetail(id: number) {
  return request.get<ApiResponse<TrainingRecord>>(`/admin/training/records/${id}`)
}

// 今日训练数据
export function getTodayTraining() {
  return request.get<ApiResponse<TodayTraining>>('/admin/training/today')
}

// 评估报告
export function getChildAssessmentReport(childId: number) {
  return request.get<ApiResponse<AssessmentReport>>(`/admin/assessment/child/${childId}`)
}

export function getAssessmentReportList(params?: {
  page?: number
  pageSize?: number
  childId?: number
}) {
  return request.get<ApiResponse<PageResult<AssessmentReport>>>('/admin/assessment/list', { params })
}