import { post } from './request'

export interface SendCodeParams {
  phone: string
}

export interface PhoneLoginParams {
  phone: string
  code: string
}

export interface WxLoginParams {
  code: string
}

export interface LoginResult {
  token: string
  userInfo: {
    id: number
    phone: string
    nickname: string
    avatar: string
  }
  isNew: boolean
}

export function sendCode(phone: string) {
  return post<void>('/api/auth/send-code', { phone })
}

export function phoneLogin(phone: string, code: string) {
  return post<LoginResult>('/api/auth/phone-login', { phone, code })
}

export function wxLogin(code: string) {
  return post<LoginResult>('/api/auth/wx-login', { code })
}
