/**
 * 专注星球 - 前端组件单元测试
 * 使用 Vitest + @vue/test-utils
 * 
 * 运行方式: npm run test 或 npm run test:watch
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock uni API
const mockUni = {
  navigateTo: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  createSelectorQuery: jest.fn(() => ({
    fields: jest.fn().mockReturnThis(),
    exec: jest.fn((cb) => cb([{ node: null, size: { width: 300, height: 300 } }]))
  })),
  getSystemInfoSync: jest.fn(() => ({ pixelRatio: 2 }))
}

global.uni = mockUni

// ============================================================
// 基础组件测试
// ============================================================

describe('StarRating 星级评分组件', () => {
  it('should render correct number of stars', () => {
    const { default: StarRating } = require('../components/StarRating.vue')
    const wrapper = mount(StarRating, {
      props: { maxStars: 5, rating: 3 }
    })
    
    const stars = wrapper.findAll('.star')
    expect(stars.length).toBe(5)
  })

  it('should display filled stars based on rating', () => {
    const { default: StarRating } = require('../components/StarRating.vue')
    const wrapper = mount(StarRating, {
      props: { maxStars: 5, rating: 2 }
    })
    
    const filledStars = wrapper.findAll('.star.filled')
    expect(filledStars.length).toBe(2)
  })

  it('should emit rating-change event on click', async () => {
    const { default: StarRating } = require('../components/StarRating.vue')
    const wrapper = mount(StarRating, {
      props: { maxStars: 5, rating: 0, readonly: false }
    })
    
    const stars = wrapper.findAll('.star')
    await stars[2].trigger('click')
    
    expect(wrapper.emitted('rating-change')).toBeTruthy()
    expect(wrapper.emitted('rating-change')[0]).toEqual([3])
  })
})

describe('ProgressBar 进度条组件', () => {
  it('should render with correct percentage', () => {
    const { default: ProgressBar } = require('../components/ProgressBar.vue')
    const wrapper = mount(ProgressBar, {
      props: { percentage: 50 }
    })
    
    const bar = wrapper.find('.progress-fill')
    expect(bar.attributes('style')).toContain('width: 50%')
  })

  it('should apply correct color based on progress', () => {
    const { default: ProgressBar } = require('../components/ProgressBar.vue')
    
    // High progress should be green
    const wrapperHigh = mount(ProgressBar, { props: { percentage: 80 } })
    expect(wrapperHigh.vm.$props.color).toBeUndefined()
    
    // Low progress should be warning color
    const wrapperLow = mount(ProgressBar, { props: { percentage: 30 } })
    const barLow = wrapperLow.find('.progress-fill')
    expect(barLow.attributes('style')).toContain('#FF9F43')
  })
})

describe('GameTimer 游戏计时器组件', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('should start timer on mount when autoStart is true', () => {
    const { default: GameTimer } = require('../components/GameTimer.vue')
    const wrapper = mount(GameTimer, {
      props: { seconds: 60, autoStart: true }
    })
    
    expect(wrapper.vm.isRunning).toBe(true)
  })

  it('should display formatted time correctly', async () => {
    const { default: GameTimer } = require('../components/GameTimer.vue')
    const wrapper = mount(GameTimer, {
      props: { seconds: 125 }
    })
    
    expect(wrapper.vm.displayTime).toBe('02:05')
  })

  it('should emit timeup event when timer reaches zero', async () => {
    const { default: GameTimer } = require('../components/GameTimer.vue')
    const wrapper = mount(GameTimer, {
      props: { seconds: 2, autoStart: true }
    })
    
    jest.advanceTimersByTime(2000)
    await nextTick()
    
    expect(wrapper.emitted('timeup')).toBeTruthy()
  })

  it('should pause and resume timer correctly', async () => {
    const { default: GameTimer } = require('../components/GameTimer.vue')
    const wrapper = mount(GameTimer, {
      props: { seconds: 60, autoStart: true }
    })
    
    wrapper.vm.pause()
    expect(wrapper.vm.isPaused).toBe(true)
    
    wrapper.vm.resume()
    expect(wrapper.vm.isPaused).toBe(false)
  })
})

// ============================================================
// 高级组件测试
// ============================================================

describe('RadarChart 雷达图组件', () => {
  it('should render with correct labels', () => {
    const { default: RadarChart } = require('../components/RadarChart.vue')
    const labels = ['持续注意', '选择性注意', '分配注意', '工作记忆']
    const wrapper = mount(RadarChart, {
      props: { labels, data: [0.8, 0.6, 0.7, 0.9] }
    })
    
    labels.forEach(label => {
      expect(wrapper.text()).toContain(label)
    })
  })

  it('should validate data array length matches labels', () => {
    const { default: RadarChart } = require('../components/RadarChart.vue')
    
    expect(() => {
      mount(RadarChart, {
        props: { labels: ['A', 'B', 'C'], data: [0.5, 0.5] }
      })
    }).toThrow()
  })
})

describe('Modal 模态框组件', () => {
  it('should render when visible is true', () => {
    const { default: Modal } = require('../components/Modal.vue')
    const wrapper = mount(Modal, {
      props: { visible: true, title: '测试标题' }
    })
    
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('测试标题')
  })

  it('should not render when visible is false', () => {
    const { default: Modal } = require('../components/Modal.vue')
    const wrapper = mount(Modal, {
      props: { visible: false }
    })
    
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('should emit close event on overlay click', async () => {
    const { default: Modal } = require('../components/Modal.vue')
    const wrapper = mount(Modal, {
      props: { visible: true, closeOnOverlay: true }
    })
    
    await wrapper.find('.modal-overlay').trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit cancel/confirm events on button click', async () => {
    const { default: Modal } = require('../components/Modal.vue')
    const wrapper = mount(Modal, {
      props: { 
        visible: true, 
        showCancel: true, 
        showConfirm: true 
      }
    })
    
    await wrapper.findAll('.modal-btn')[0].trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    
    await wrapper.findAll('.modal-btn')[1].trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})

describe('Toast 提示组件', () => {
  it('should display message correctly', async () => {
    const { default: Toast } = require('../components/Toast.vue')
    const wrapper = mount(Toast, {
      props: { visible: true, message: '操作成功', type: 'success' }
    })
    
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('操作成功')
  })

  it('should show correct icon for different types', () => {
    const { default: Toast } = require('../components/Toast.vue')
    
    const successWrapper = mount(Toast, {
      props: { visible: true, message: '', type: 'success' }
    })
    expect(successWrapper.vm.getIcon).toBe('✓')
    
    const errorWrapper = mount(Toast, {
      props: { visible: true, message: '', type: 'error' }
    })
    expect(errorWrapper.vm.getIcon).toBe('✕')
  })
})

describe('CountDown 倒计时组件', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('should display time correctly', () => {
    const { default: CountDown } = require('../components/CountDown.vue')
    const wrapper = mount(CountDown, {
      props: { seconds: 65, autoStart: false }
    })
    
    expect(wrapper.vm.displayTime).toBe('65')
  })

  it('should emit finish event when countdown completes', async () => {
    const { default: CountDown } = require('../components/CountDown.vue')
    const wrapper = mount(CountDown, {
      props: { seconds: 2, autoStart: true }
    })
    
    jest.advanceTimersByTime(2000)
    await nextTick()
    
    expect(wrapper.emitted('finish')).toBeTruthy()
  })
})

// ============================================================
// 游戏组件集成测试
// ============================================================

describe('GameCard 游戏卡片组件', () => {
  it('should display game information correctly', () => {
    const { default: GameCard } = require('../components/GameCard.vue')
    const gameInfo = {
      id: 'G001',
      name: '舒尔特方格',
      description: '训练视觉搜索能力',
      difficulty: 3,
      stars: 4
    }
    
    const wrapper = mount(GameCard, {
      props: { game: gameInfo }
    })
    
    expect(wrapper.find('.game-name').text()).toBe('舒尔特方格')
    expect(wrapper.find('.game-description').text()).toBe('训练视觉搜索能力')
  })

  it('should navigate to game page on click', async () => {
    const { default: GameCard } = require('../components/GameCard.vue')
    const wrapper = mount(GameCard, {
      props: { 
        game: { id: 'G001', name: '测试游戏' },
        clickable: true
      }
    })
    
    await wrapper.trigger('click')
    
    // 验证 uni.navigateTo 被调用
    expect(mockUni.navigateTo).toHaveBeenCalled()
  })

  it('should show locked state for non-VIP games', () => {
    const { default: GameCard } = require('../components/GameCard.vue')
    const wrapper = mount(GameCard, {
      props: { 
        game: { id: 'G007', name: '迷宫', requiresVip: true },
        isVip: false
      }
    })
    
    expect(wrapper.find('.lock-overlay').exists()).toBe(true)
  })
})

describe('ChildSelector 儿童选择器组件', () => {
  it('should display current child info', () => {
    const { default: ChildSelector } = require('../components/ChildSelector.vue')
    const children = [
      { id: '1', name: '小明', age: 8, avatar: '' },
      { id: '2', name: '小红', age: 6, avatar: '' }
    ]
    
    const wrapper = mount(ChildSelector, {
      props: { children, currentChildId: '1' }
    })
    
    expect(wrapper.find('.name').text()).toBe('小明')
    expect(wrapper.find('.age').text()).toBe('8岁')
  })

  it('should toggle dropdown on click', async () => {
    const { default: ChildSelector } = require('../components/ChildSelector.vue')
    const wrapper = mount(ChildSelector, {
      props: { 
        children: [{ id: '1', name: '小明', age: 8 }] 
      }
    })
    
    await wrapper.find('.current-child').trigger('click')
    
    expect(wrapper.vm.showDropdown).toBe(true)
    expect(wrapper.find('.dropdown').exists()).toBe(true)
  })

  it('should emit change event when child is selected', async () => {
    const { default: ChildSelector } = require('../components/ChildSelector.vue')
    const children = [
      { id: '1', name: '小明', age: 8 },
      { id: '2', name: '小红', age: 6 }
    ]
    
    const wrapper = mount(ChildSelector, {
      props: { children, currentChildId: '1' }
    })
    
    await wrapper.find('.current-child').trigger('click')
    const dropdownItems = wrapper.findAll('.dropdown-item')
    await dropdownItems[1].trigger('click')
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')[0][0].id).toBe('2')
  })
})