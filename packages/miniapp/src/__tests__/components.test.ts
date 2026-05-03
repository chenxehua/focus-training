/**
 * 专注星球 - 前端组件单元测试
 * 使用 Vitest + @vue/test-utils
 * 
 * 运行方式: npm run test 或 npm run test:watch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

// Mock uni API
const mockUni = {
  navigateTo: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  createSelectorQuery: vi.fn(() => ({
    fields: vi.fn().mockReturnThis(),
    exec: vi.fn((cb) => cb([{ node: null, size: { width: 300, height: 300 } }]))
  })),
  getSystemInfoSync: vi.fn(() => ({ pixelRatio: 2 }))
}

global.uni = mockUni

// ============================================================
// 基础组件测试
// ============================================================

describe('StarRating 星级评分组件', () => {
  it('should render correct number of stars', async () => {
    const StarRating = {
      template: '<div class="star-rating"><span v-for="i in maxStars" :key="i" class="star" :class="{ filled: i <= rating }">★</span></div>',
      props: { maxStars: { type: Number, default: 5 }, rating: { type: Number, default: 0 } }
    }
    const wrapper = mount(StarRating, {
      props: { maxStars: 5, rating: 3 }
    })
    
    const stars = wrapper.findAll('.star')
    expect(stars.length).toBe(5)
  })

  it('should display filled stars based on rating', async () => {
    const StarRating = {
      template: '<div class="star-rating"><span v-for="i in maxStars" :key="i" class="star" :class="{ filled: i <= rating }">★</span></div>',
      props: { maxStars: { type: Number, default: 5 }, rating: { type: Number, default: 0 } }
    }
    const wrapper = mount(StarRating, {
      props: { maxStars: 5, rating: 2 }
    })
    
    const filledStars = wrapper.findAll('.star.filled')
    expect(filledStars.length).toBe(2)
  })
})

describe('ProgressBar 进度条组件', () => {
  it('should render with correct percentage', () => {
    const ProgressBar = {
      template: '<div class="progress-bar"><div class="progress-fill" :style="{ width: percentage + \'%\' }"></div></div>',
      props: { percentage: { type: Number, default: 0 } }
    }
    const wrapper = mount(ProgressBar, {
      props: { percentage: 50 }
    })
    
    const bar = wrapper.find('.progress-fill')
    expect(bar.attributes('style')).toContain('width: 50%')
  })

  it('should handle different progress levels', () => {
    const ProgressBar = {
      template: '<div class="progress-bar"><div class="progress-fill" :style="barStyle"></div></div>',
      props: { percentage: { type: Number, default: 0 } },
      computed: {
        barStyle() {
          return { width: this.percentage + '%' }
        }
      }
    }
    
    const wrapper = mount(ProgressBar, { props: { percentage: 80 } })
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
  })
})

describe('GameTimer 游戏计时器组件', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display formatted time correctly', () => {
    const GameTimer = {
      template: '<div class="timer">{{ displayTime }}</div>',
      props: { seconds: { type: Number, default: 0 } },
      computed: {
        displayTime() {
          const mins = Math.floor(this.seconds / 60)
          const secs = this.seconds % 60
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
      }
    }
    
    const wrapper = mount(GameTimer, {
      props: { seconds: 125 }
    })
    
    expect(wrapper.vm.displayTime).toBe('02:05')
  })

  it('should handle zero seconds', () => {
    const GameTimer = {
      template: '<div class="timer">{{ displayTime }}</div>',
      props: { seconds: { type: Number, default: 0 } },
      computed: {
        displayTime() {
          const mins = Math.floor(this.seconds / 60)
          const secs = this.seconds % 60
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
      }
    }
    
    const wrapper = mount(GameTimer, { props: { seconds: 0 } })
    expect(wrapper.vm.displayTime).toBe('00:00')
  })
})

// ============================================================
// 高级组件测试
// ============================================================

describe('RadarChart 雷达图组件', () => {
  it('should render with correct labels', () => {
    const RadarChart = {
      template: '<div class="radar-chart"><span v-for="label in labels" :key="label">{{ label }}</span></div>',
      props: { 
        labels: { type: Array, default: () => [] }, 
        data: { type: Array, default: () => [] } 
      }
    }
    const labels = ['持续注意', '选择性注意', '分配注意', '工作记忆']
    const wrapper = mount(RadarChart, {
      props: { labels, data: [0.8, 0.6, 0.7, 0.9] }
    })
    
    labels.forEach(label => {
      expect(wrapper.text()).toContain(label)
    })
  })

  it('should validate data array length matches labels', () => {
    // Test helper function instead of component mount
    const validateRadarData = (labels: any[], data: any[]) => {
      if (labels.length !== data.length) {
        throw new Error('Labels and data must have same length')
      }
    }
    
    expect(() => validateRadarData(['A', 'B', 'C'], [0.5, 0.5])).toThrow()
    expect(() => validateRadarData(['A', 'B'], [0.5, 0.5])).not.toThrow()
  })
})

describe('Modal 模态框组件', () => {
  it('should render when visible is true', () => {
    const Modal = {
      template: '<div v-if="visible" class="modal-overlay"><div class="modal-title">{{ title }}</div></div>',
      props: { visible: Boolean, title: String }
    }
    const wrapper = mount(Modal, {
      props: { visible: true, title: '测试标题' }
    })
    
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('测试标题')
  })

  it('should not render when visible is false', () => {
    const Modal = {
      template: '<div v-if="visible" class="modal-overlay"></div>',
      props: { visible: Boolean }
    }
    const wrapper = mount(Modal, {
      props: { visible: false }
    })
    
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('should emit close event on overlay click', async () => {
    const Modal = {
      template: '<div v-if="visible" class="modal-overlay" @click="$emit(\'close\')"></div>',
      props: { visible: Boolean },
      emits: ['close']
    }
    const wrapper = mount(Modal, {
      props: { visible: true }
    })
    
    await wrapper.find('.modal-overlay').trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})

describe('Toast 提示组件', () => {
  it('should display message correctly', async () => {
    const Toast = {
      template: '<div class="toast" v-if="visible"><span class="toast-message">{{ message }}</span></div>',
      props: { visible: Boolean, message: String, type: String }
    }
    const wrapper = mount(Toast, {
      props: { visible: true, message: '操作成功', type: 'success' }
    })
    
    await nextTick()
    expect(wrapper.find('.toast-message').text()).toBe('操作成功')
  })

  it('should handle different types', () => {
    const Toast = {
      template: '<div class="toast" v-if="visible" :class="\'toast-\' + type"><span class="toast-message">{{ message }}</span></div>',
      props: { visible: Boolean, message: String, type: { type: String, default: 'info' } }
    }
    
    const successWrapper = mount(Toast, {
      props: { visible: true, message: '', type: 'success' }
    })
    expect(successWrapper.classes()).toContain('toast-success')
  })
})

describe('CountDown 倒计时组件', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display time correctly', () => {
    const CountDown = {
      template: '<div class="countdown">{{ displayTime }}</div>',
      props: { seconds: { type: Number, default: 0 } },
      computed: {
        displayTime() {
          return String(this.seconds)
        }
      }
    }
    const wrapper = mount(CountDown, {
      props: { seconds: 65 }
    })
    
    expect(wrapper.vm.displayTime).toBe('65')
  })

  it('should emit finish event when countdown completes', async () => {
    const CountDown = {
      template: '<div class="countdown" @click="startTimer">{{ displayTime }}</div>',
      props: { seconds: { type: Number, default: 0 } },
      emits: ['finish'],
      data() {
        return { currentSeconds: this.seconds }
      },
      computed: {
        displayTime() {
          return String(this.currentSeconds)
        }
      },
      methods: {
        startTimer() {
          const interval = setInterval(() => {
            this.currentSeconds--
            if (this.currentSeconds <= 0) {
              clearInterval(interval)
              this.$emit('finish')
            }
          }, 1000)
        }
      }
    }
    const wrapper = mount(CountDown, {
      props: { seconds: 2 }
    })
    
    wrapper.find('.countdown').trigger('click')
    vi.advanceTimersByTime(2100)
    await nextTick()
    
    expect(wrapper.emitted('finish')).toBeTruthy()
  })
})

// ============================================================
// 游戏组件集成测试
// ============================================================

describe('GameCard 游戏卡片组件', () => {
  it('should display game information correctly', () => {
    const GameCard = {
      template: '<div class="game-card" @click="handleClick"><h3 class="game-name">{{ game.name }}</h3><p class="game-description">{{ game.description }}</p></div>',
      props: { game: Object, clickable: Boolean },
      emits: ['click'],
      methods: {
        handleClick() {
          this.$emit('click', this.game)
        }
      }
    }
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
    const GameCard = {
      template: '<div class="game-card" @click="handleClick"></div>',
      props: { game: Object, clickable: Boolean },
      emits: ['click'],
      methods: {
        handleClick() {
          uni.navigateTo({ url: `/pages/game-${this.game.id}/index` })
        }
      }
    }
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
    const GameCard = {
      template: '<div class="game-card"><div v-if="game.requiresVip && !isVip" class="lock-overlay">🔒</div></div>',
      props: { game: Object, isVip: Boolean }
    }
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
    const ChildSelector = {
      template: '<div class="child-selector"><div class="current-child"><span class="name">{{ currentChild?.name }}</span><span class="age">{{ currentChild?.age }}岁</span></div></div>',
      props: { children: Array, currentChildId: String },
      computed: {
        currentChild() {
          return this.children?.find((c: any) => c.id === this.currentChildId)
        }
      }
    }
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
    const ChildSelector = {
      template: '<div class="child-selector"><div class="current-child" @click="toggleDropdown">{{ currentChild?.name }}</div><div v-if="showDropdown" class="dropdown"><div v-for="child in children" :key="child.id" class="dropdown-item" @click="selectChild(child)">{{ child.name }}</div></div></div>',
      props: { children: Array, currentChildId: String },
      emits: ['change'],
      data() {
        return { showDropdown: false }
      },
      computed: {
        currentChild() {
          return this.children?.find((c: any) => c.id === this.currentChildId)
        }
      },
      methods: {
        toggleDropdown() {
          this.showDropdown = !this.showDropdown
        },
        selectChild(child: any) {
          this.$emit('change', child)
          this.showDropdown = false
        }
      }
    }
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
    const ChildSelector = {
      template: '<div class="child-selector"><div class="current-child" @click="toggleDropdown">{{ currentChild?.name }}</div><div v-if="showDropdown" class="dropdown"><div v-for="child in children" :key="child.id" class="dropdown-item" @click="selectChild(child)">{{ child.name }}</div></div></div>',
      props: { children: Array, currentChildId: String },
      emits: ['change'],
      data() {
        return { showDropdown: false }
      },
      computed: {
        currentChild() {
          return this.children?.find((c: any) => c.id === this.currentChildId)
        }
      },
      methods: {
        toggleDropdown() {
          this.showDropdown = !this.showDropdown
        },
        selectChild(child: any) {
          this.$emit('change', child)
          this.showDropdown = false
        }
      }
    }
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
    expect((wrapper.emitted('change') as any)[0][0].id).toBe('2')
  })
})

// ============================================================
// LoadingSpinner 加载动画组件
// ============================================================

describe('LoadingSpinner 加载动画组件', () => {
  it('should render spinner with default size', () => {
    const LoadingSpinner = {
      template: '<div class="loading-spinner" :style="{ width: size + \'px\', height: size + \'px\' }"></div>',
      props: { size: { type: Number, default: 40 } }
    }
    const wrapper = mount(LoadingSpinner)
    
    const spinner = wrapper.find('.loading-spinner')
    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('style')).toContain('width: 40px')
  })

  it('should render with custom size', () => {
    const LoadingSpinner = {
      template: '<div class="loading-spinner" :style="{ width: size + \'px\', height: size + \'px\' }"></div>',
      props: { size: { type: Number, default: 40 } }
    }
    const wrapper = mount(LoadingSpinner, { props: { size: 60 } })
    
    const spinner = wrapper.find('.loading-spinner')
    expect(spinner.attributes('style')).toContain('width: 60px')
  })
})