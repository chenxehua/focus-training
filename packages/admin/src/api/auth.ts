import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface LoginData {
  username: string
  password: string
}

export interface AdminUser {
  id: number
  username: string
  nickname: string
  role: string
  avatar: string
}

export interface LoginResult {
  token: string
  user: AdminUser
}

export function adminLogin(data: LoginData) {
  return request.post<ApiResponse<LoginResult>>('/auth/admin-login', data)
}

export function getAdminInfo() {
  return request.get<ApiResponse<AdminUser>>('/auth/admin-info')
}