import { getStorage } from '@/utils/storage'

// 开发环境地址 - 微信开发者工具和真机调试使用 localhost
const BASE_URL = 'http://localhost:3000'

const TOKEN_KEY = 'focus_token'

export interface ApiResponse<T = unknown> {
  code?: number
  success?: boolean
  message: string
  data: T
}

function getToken(): string {
  return getStorage<string>(TOKEN_KEY) || ''
}

function navigateToLogin() {
  uni.showToast({ title: '请先登录', icon: 'none' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/profile/index' })
  }, 1500)
}

export function request<T = unknown>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown> | unknown
  header?: Record<string, string>
}): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    }

    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data as Record<string, unknown>,
      header,
      success(res: UniApp.RequestSuccessCallbackResult) {
        const response = res.data as ApiResponse<T>

        if (res.statusCode === 401) {
          navigateToLogin()
          reject(new Error('Unauthorized'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 支持 {code: 0} 或 {success: true} 两种响应格式
          if (response.code === 0 || response.code === 200 || response.success === true) {
            resolve(response)
          } else {
            uni.showToast({ title: response.message || '请求失败', icon: 'none' })
            reject(new Error(response.message || '请求失败'))
          }
        } else {
          uni.showToast({ title: `网络错误 ${res.statusCode}`, icon: 'none' })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail(err: UniApp.GeneralCallbackResult) {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function get<T = unknown>(url: string, params?: Record<string, unknown>) {
  const queryString = params
    ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  return request<T>({ url: url + queryString, method: 'GET' })
}

export function post<T = unknown>(url: string, data?: Record<string, unknown> | unknown) {
  return request<T>({ url, method: 'POST', data })
}

export function put<T = unknown>(url: string, data?: Record<string, unknown> | unknown) {
  return request<T>({ url, method: 'PUT', data })
}

export function del<T = unknown>(url: string) {
  return request<T>({ url, method: 'DELETE' })
}
