import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { getUserInfo, getChildren, wxLogin as wxLoginApi } from '@/api/user'
import { sendCode as sendCodeApi, phoneLogin as phoneLoginApi } from '@/api/auth'
import { useGameStore } from './game'

export interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar: string
}

export interface Child {
  id: number
  name: string
  age: number
  ageGroup: '4-6' | '7-9' | '10-12'
  gender: 'male' | 'female'
  avatar: string
  level: number
  experience: number
}

const TOKEN_KEY = 'focus_token'
const USER_KEY = 'focus_user'
const CHILD_KEY = 'focus_current_child'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  const currentChild = ref<Child | null>(null)
  const children = ref<Child[]>([])

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const hasChild = computed(() => children.value.length > 0)

  function restoreSession() {
    const savedToken = getStorage<string>(TOKEN_KEY)
    const savedUser = getStorage<UserInfo>(USER_KEY)
    const savedChild = getStorage<Child>(CHILD_KEY)

    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser) {
      userInfo.value = savedUser
    }
    if (savedChild) {
      currentChild.value = savedChild
    }
  }

  function setToken(newToken: string) {
    token.value = newToken
    setStorage(TOKEN_KEY, newToken)
  }

  function setUserInfo(user: UserInfo) {
    userInfo.value = user
    setStorage(USER_KEY, user)
  }

  function setCurrentChild(child: Child) {
    currentChild.value = child
    setStorage(CHILD_KEY, child)
  }

  function setChildren(list: Child[]) {
    children.value = list
    if (list.length > 0 && !currentChild.value) {
      setCurrentChild(list[0])
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      setUserInfo(res.data)
    } catch (error) {
      console.error('fetchUserInfo error:', error)
    }
  }

  async function fetchChildren() {
    try {
      const res = await getChildren()
      setChildren(res.data)
    } catch (error) {
      console.error('fetchChildren error:', error)
    }
  }

  async function sendCode(phone: string) {
    return sendCodeApi(phone)
  }

  async function phoneLogin(phone: string, code: string) {
    const res = await phoneLoginApi(phone, code)
    setToken(res.data.token)
    setUserInfo(res.data.userInfo)
    await fetchChildren()
    return res.data
  }

  async function wxLogin(code: string) {
    const res = await wxLoginApi({ code })
    setToken(res.data.token)
    setUserInfo(res.data.userInfo)
    await fetchChildren()
    return res.data
  }

  function logout() {
    const gameStore = useGameStore()
    token.value = ''
    userInfo.value = null
    currentChild.value = null
    children.value = []
    removeStorage(TOKEN_KEY)
    removeStorage(USER_KEY)
    removeStorage(CHILD_KEY)
    // 清除游戏数据
    gameStore.clearAll()
    uni.reLaunch({ url: '/pages/profile/index' })
  }

  return {
    token,
    userInfo,
    currentChild,
    children,
    isLoggedIn,
    hasChild,
    restoreSession,
    setToken,
    setUserInfo,
    setCurrentChild,
    setChildren,
    fetchUserInfo,
    fetchChildren,
    sendCode,
    phoneLogin,
    wxLogin,
    logout,
  }
})
