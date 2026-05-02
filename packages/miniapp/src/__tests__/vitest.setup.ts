/**
 * Vitest Setup for FocusKids Miniapp
 */

// Mock global uni API for testing
global.uni = {
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  redirectTo: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showActionSheet: vi.fn(),
  getStorageSync: vi.fn(() => ({})),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    pixelRatio: 2,
    windowWidth: 375,
    windowHeight: 812,
    statusBarHeight: 44,
    platform: 'ios'
  })),
  createSelectorQuery: vi.fn(() => ({
    fields: vi.fn().mockReturnThis(),
    boundingClientRect: vi.fn().mockReturnThis(),
    scrollOffset: vi.fn().mockReturnThis(),
    context: vi.fn().mockReturnThis(),
    node: vi.fn().mockReturnThis(),
    exec: vi.fn((cb) => {
      if (cb) cb([{}])
      return []
    })
  })),
  createCanvasContext: vi.fn(() => ({
    setFillStyle: vi.fn(),
    fillRect: vi.fn(),
    draw: vi.fn(),
    createLinearGradient: vi.fn()
  })),
  getDeviceInfo: vi.fn(() => ({ platform: 'ios' })),
  getAppBaseInfo: vi.fn(() => ({
    appId: 'test-app-id',
    version: '1.0.0'
  })),
  request: vi.fn(),
  login: vi.fn(() => Promise.resolve({ code: 'test-code' })),
  getUserProfile: vi.fn(() => Promise.resolve({ userInfo: {} })),
  showShareMenu: vi.fn(),
  onShareAppMessage: vi.fn(),
  offShareAppMessage: vi.fn(),
  setClipboardData: vi.fn(),
  getClipboardData: vi.fn(),
  makePhoneCall: vi.fn(),
  scanCode: vi.fn(),
  chooseImage: vi.fn(),
  previewImage: vi.fn(),
  getLocation: vi.fn()
}

// Mock page lifecycle
export const mockPageInstance = {
  setData: vi.fn(),
  data: {}
}

// Mock component instance
export const mockComponentInstance = {
  setData: vi.fn(),
  data: {}
}

// Global test utilities
global.createMockPage = () => mockPageInstance
global.createMockComponent = () => mockComponentInstance