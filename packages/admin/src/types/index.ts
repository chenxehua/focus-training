export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  totalUsers: number
  totalChildren: number
  todayTraining: number
  monthOrders: number
  monthAmount: number
  activeMembers: number
}

export interface User {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone: string
  role: string
  status: number
  created_at: string
  last_login_at: string
}

export interface Child {
  id: number
  name: string
  age: number
  gender: string
  age_group: string
  parent_name: string
  parent_phone: string
  training_count: number
  created_at: string
}

export interface Order {
  id: number
  order_no: string
  user_name: string
  user_phone: string
  amount: number
  total_amount?: number
  status: string
  created_at: string
  pay_time?: string
}

export interface Member {
  id: number
  user_name: string
  user_phone: string
  member_type: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

export interface Article {
  id: number
  title: string
  content: string
  summary: string
  cover_image: string
  category_id: number
  category_name: string
  author: string
  tags: string
  is_featured: number
  is_published: number
  publish_date: string
  created_at: string
}

export interface Question {
  id: number
  title: string
  content: string
  user_name: string
  user_avatar: string
  category_name: string
  answer_count: number
  created_at: string
}

export interface Game {
  id: number
  game_code: string
  game_name: string
  game_type: string
  icon_url: string
  difficulty_levels: number
  target_age_group: string
  description: string
  is_free: number
  status: string
  sort_order: number
}

export interface TrainingTrend {
  date: string
  total_count: number
  avg_accuracy: number
  avg_focus_score: number
  avg_duration: number
}

export interface GameStats {
  id: number
  game_name: string
  game_code: string
  play_count: number
  avg_accuracy: number
  avg_focus_score: number
}