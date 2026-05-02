/**
 * 本地存储封装（同步方式，适合小程序）
 */

export function setStorage<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch (error) {
    console.error(`setStorage error [${key}]:`, error)
  }
}

export function getStorage<T>(key: string): T | null {
  try {
    const value = uni.getStorageSync(key)
    if (value === '' || value === null || value === undefined) {
      return null
    }
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`getStorage error [${key}]:`, error)
    return null
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    console.error(`removeStorage error [${key}]:`, error)
  }
}

export function clearStorage(): void {
  try {
    uni.clearStorageSync()
  } catch (error) {
    console.error('clearStorage error:', error)
  }
}

export function getStorageKeys(): string[] {
  try {
    const res = uni.getStorageInfoSync()
    return res.keys
  } catch (error) {
    console.error('getStorageKeys error:', error)
    return []
  }
}
