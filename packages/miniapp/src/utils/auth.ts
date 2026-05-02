import { wxLogin } from '@/api/user'
import { useUserStore } from '@/store/user'

/**
 * 获取微信登录 code
 */
export function getWxLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res: UniApp.LoginRes) {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取登录 code 失败'))
        }
      },
      fail(err: UniApp.GeneralCallbackResult) {
        reject(err)
      },
    })
  })
}

/**
 * 完整微信登录流程：获取 code -> 换 token -> 保存用户信息
 */
export async function doWxLogin(): Promise<boolean> {
  try {
    const code = await getWxLoginCode()
    const res = await wxLogin({ code })

    const userStore = useUserStore()
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo)

    // 新用户需要创建儿童信息
    return res.data.isNew
  } catch (error) {
    console.error('doWxLogin error:', error)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    return false
  }
}

/**
 * 获取微信用户头像和昵称（需要用户授权）
 */
export function getWxUserProfile(): Promise<{ nickname: string; avatar: string }> {
  return new Promise((resolve, reject) => {
    uni.getUserProfile({
      desc: '用于完善个人信息',
      success(res: UniApp.GetUserProfileRes) {
        resolve({
          nickname: res.userInfo.nickName,
          avatar: res.userInfo.avatarUrl,
        })
      },
      fail(err: UniApp.GeneralCallbackResult) {
        reject(err)
      },
    })
  })
}

/**
 * 检查是否已登录，未登录则跳转登录
 */
export function requireLogin(): boolean {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/profile/index' })
    }, 1000)
    return false
  }
  return true
}
