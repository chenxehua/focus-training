import { get, post, put } from './request'
import type { UserInfo, Child } from '@/store/user'

export interface WxLoginParams {
  code: string
}

export interface WxLoginResult {
  token: string
  userInfo: UserInfo
  isNew: boolean
}

export interface AddChildParams {
  name: string
  age: number
  gender: 'male' | 'female'
  ageGroup: '4-6' | '7-9' | '10-12'
}

export interface UpdateUserParams {
  nickname?: string
  avatar?: string
  phone?: string
}

export function wxLogin(params: WxLoginParams) {
  return post<WxLoginResult>('/api/auth/wx-login', params)
}

export function getUserInfo() {
  return get<UserInfo>('/api/user/info')
}

export function updateUserInfo(params: UpdateUserParams) {
  return put<UserInfo>('/api/user/info', params)
}

export function addChild(params: AddChildParams) {
  return post<Child>('/api/user/child', params)
}

export function getChildren() {
  return get<Child[]>('/api/user/children')
}

export function updateChild(childId: number, params: Partial<AddChildParams>) {
  return put<Child>(`/api/user/child/${childId}`, params)
}
