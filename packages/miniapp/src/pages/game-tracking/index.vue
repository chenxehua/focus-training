<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type ThemeMode = 'stars' | 'animals'

interface Star {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  isTarget: boolean
  state: 'normal' | 'flickering' | 'hidden' | 'colorChanged' | 'cloned'
  color: string
  size: number
  rotation: number
  blinkPattern: number
}

interface ChangeEvent {
  time: number
  type: string
  position: { x: number; y: number }
}

interface Animal {
  id: number
  type: string
  x: number
  y: number
  color: string
  size: number
  isTarget: boolean
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 本地计时器
let gameTimer: ReturnType<typeof setInterval> | null = null

// 音频上下文
let audioContext: AudioContext | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
})

// 游戏状态
type GameStatus = 'idle' | 'ready' | 'instruction' | 'playing' | 'finished'
const gameStatus = ref<GameStatus>('idle')
const difficulty = ref<DifficultyLevel>(1)
const themeMode = ref<ThemeMode>('stars')

// 难度配置
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  starCount: number
  targetCount: number
  speed: number
  interference: string[]
  duration: number
  hideDelay: number
}> = {
  1: { starCount: 3, targetCount: 1, speed: 0.8, interference: [], duration: 30, hideDelay: 0 },
  2: { starCount: 4, targetCount: 1, speed: 1.0, interference: ['flicker'], duration: 35, hideDelay: 0 },
  3: { starCount: 5, targetCount: 2, speed: 1.2, interference: ['flicker', 'color'], duration: 40, hideDelay: 800 },
  4: { starCount: 6, targetCount: 2, speed: 1.5, interference: ['flicker', 'color', 'disappear'], duration: 45, hideDelay: 1200 },
  5: { starCount: 8, targetCount: 2, speed: 1.8, interference: ['flicker', 'color', 'disappear', 'clone'], duration: 50, hideDelay: 1500 },
}

// 动物模式配置
const animalDifficultyConfig: Record<DifficultyLevel, {
  label: string
  animalCount: number
  targetCount: number
  task: string
  duration: number
}> = {
  1: { animalCount: 8, targetCount: 2, task: '找出所有蓝色的动物', duration: 45 },
  2: { animalCount: 12, targetCount: 3, task: '找出所有红色的动物', duration: 50 },
  3: { animalCount: 15, targetCount: 4, task: '找出所有大的动物', duration: 55 },
  4: { animalCount: 18, targetCount: 5, task: '找出所有特定种类', duration: 60 },
  5: { animalCount: 20, targetCount: 6, task: '复杂组合任务', duration: 65 },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])
const currentAnimalConfig = computed(() => animalDifficultyConfig[difficulty.value])

// 星星追踪模式数据
const stars = ref<Star[]>([])
const targetStarIds = ref<number[]>([])
const changeEvents = ref<ChangeEvent[]>([])
const reportedChanges = ref(0)
const totalChanges = ref(0)
const trackingLostTime = ref(0)
const trackingStartTime = ref(0)

// 动物寻找模式数据
const animals = ref<Animal[]>([])
const foundTargets = ref<number[]>([])
const wrongClicks = ref(0)
const taskStartTime = ref(0)

// 结果数据
const resultScore = ref(0)
const resultFocusScore = ref(0)
const showResult = ref(false)
const gameMode = ref<'tracking' | 'finding'>('tracking')

// 动画帧
let animationFrame: number | null = null
let interferenceTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

// 游戏区域尺寸
const areaWidth = 700
const areaHeight = 500

function generateStars(): Star[] {
  const config = currentConfig.value
  const result: Star[] = []
  
  for (let i = 0; i < config.starCount; i++) {
    let x: number, y: number
    let attempts = 0
    do {
      x = Math.random() * (areaWidth - 80) + 40
      y = Math.random() * (areaHeight - 80) + 40
      attempts++
    } while (result.some(s => Math.hypot(s.x - x, s.y - y) < 60) && attempts < 30)
    
    const angle = Math.random() * Math.PI * 2
    
    result.push({
      id: i,
      x,
      y,
      vx: Math.cos(angle) * config.speed,
      vy: Math.sin(angle) * config.speed,
      isTarget: false,
      state: 'normal',
      color: '#FFFFFF',
      size: 24,
      rotation: 0,
      blinkPattern: Math.random() > 0.5 ? 1 : 2,
    })
  }
  
  // 选择目标星星
  const targetIndices: number[] = []
  while (targetIndices.length < config.targetCount) {
    const idx = Math.floor(Math.random() * config.starCount)
    if (!targetIndices.includes(idx)) {
      targetIndices.push(idx)
    }
  }
  
  targetIndices.forEach(idx => {
    result[idx].isTarget = true
    result[idx].color = '#FFD700'
    result[idx].size = 32
  })
  
  return result
}

function updateStarPositions() {
  if (gameStatus.value !== 'playing' || gameMode.value !== 'tracking') return
  
  stars.value.forEach(star => {
    star.x += star.vx
    star.y += star.vy
    star.rotation = (star.rotation + 2) % 360
    
    // 边界反弹
    if (star.x <= star.size || star.x >= areaWidth - star.size) {
      star.vx = -star.vx
      star.x = Math.max(star.size, Math.min(areaWidth - star.size, star.x))
    }
    if (star.y <= star.size || star.y >= areaHeight - star.size) {
      star.vy = -star.vy
      star.y = Math.max(star.size, Math.min(areaHeight - star.size, star.y))
    }
    
    // 闪烁状态处理
    if (star.state === 'flickering') {
      star.color = Math.random() > 0.5 ? '#FFFFFF' : 'rgba(255,255,255,0.3)'
    }
  })
  
  animationFrame = wx.requestAnimationFrame ? wx.requestAnimationFrame(updateStarPositions) : null
}

function triggerInterference() {
  if (gameStatus.value !== 'playing' || gameMode.value !== 'tracking') return
  
  const config = currentConfig.value
  if (config.interference.length === 0) {
    interferenceTimer = setTimeout(triggerInterference, 5000)
    return
  }
  
  const type = config.interference[Math.floor(Math.random() * config.interference.length)]
  const targetStars = stars.value.filter(s => s.isTarget)
  
  if (targetStars.length === 0) return
  
  const targetStar = targetStars[Math.floor(Math.random() * targetStars.length)]
  
  switch (type) {
    case 'flicker':
      targetStar.state = 'flickering'
      setTimeout(() => {
        if (targetStar.state === 'flickering') {
          targetStar.state = 'normal'
          targetStar.color = '#FFD700'
        }
      }, 1000)
      break
      
    case 'color':
      targetStar.color = '#888888'
      changeEvents.value.push({
        time: Date.now() - trackingStartTime.value,
        type: 'colorChange',
        position: { x: targetStar.x, y: targetStar.y }
      })
      totalChanges.value++
      setTimeout(() => {
        if (gameStatus.value === 'playing') {
          targetStar.color = '#FFD700'
        }
      }, config.hideDelay || 1000)
      break
      
    case 'disappear':
      targetStar.state = 'hidden'
      changeEvents.value.push({
        time: Date.now() - trackingStartTime.value,
        type: 'disappear',
        position: { x: targetStar.x, y: targetStar.y }
      })
      totalChanges.value++
      setTimeout(() => {
        if (gameStatus.value === 'playing') {
          targetStar.state = 'normal'
        }
      }, config.hideDelay + 500 || 1500)
      break
      
    case 'clone':
      // 创建一个临时的假星星
      const cloneStar: Star = {
        id: 100 + targetStar.id,
        x: targetStar.x + (Math.random() > 0.5 ? 50 : -50),
        y: targetStar.y + (Math.random() > 0.5 ? 50 : -50),
        vx: -targetStar.vx,
        vy: -targetStar.vy,
        isTarget: false,
        state: 'cloned',
        color: '#FFD700',
        size: 28,
        rotation: 0,
        blinkPattern: 0,
      }
      stars.value.push(cloneStar)
      changeEvents.value.push({
        time: Date.now() - trackingStartTime.value,
        type: 'clone',
        position: { x: cloneStar.x, y: cloneStar.y }
      })
      totalChanges.value++
      setTimeout(() => {
        const idx = stars.value.findIndex(s => s.id === cloneStar.id)
        if (idx !== -1) {
          stars.value.splice(idx, 1)
        }
      }, 2000)
      break
  }
  
  const nextInterval = 4000 + Math.random() * 3000
  interferenceTimer = setTimeout(triggerInterference, nextInterval)
}

function generateAnimals() {
  const config = currentAnimalConfig.value
  const animalTypes = ['🐰', '🦊', '🐻', '🐱', '🐶', '🦁', '🐼', '🐨']
  const colors = ['blue', 'red', 'green', 'yellow', 'purple']
  const sizes = ['small', 'medium', 'large']
  const result: Animal[] = []
  
  // 生成目标动物
  const targetIndices: number[] = []
  for (let i = 0; i < config.targetCount; i++) {
    let idx: number
    do {
      idx = Math.floor(Math.random() * config.animalCount)
    } while (targetIndices.includes(idx))
    targetIndices.push(idx)
  }
  
  for (let i = 0; i < config.animalCount; i++) {
    let x: number, y: number
    let attempts = 0
    do {
      x = Math.random() * (areaWidth - 80) + 40
      y = Math.random() * (areaHeight - 80) + 40
      attempts++
    } while (result.some(a => Math.hypot(a.x - x, a.y - y) < 60) && attempts < 30)
    
    result.push({
      id: i,
      type: animalTypes[Math.floor(Math.random() * animalTypes.length)],
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 60 + Math.random() * 20,
      isTarget: targetIndices.includes(i),
    })
  }
  
  return result
}

function initGame() {
  if (gameMode.value === 'tracking') {
    stars.value = generateStars()
    targetStarIds.value = stars.value.filter(s => s.isTarget).map(s => s.id)
    changeEvents.value = []
    reportedChanges.value = 0
    totalChanges.value = 0
    trackingLostTime.value = 0
  } else {
    animals.value = generateAnimals()
    foundTargets.value = []
    wrongClicks.value = 0
  }
  showResult.value = false
  
  if (interferenceTimer) clearTimeout(interferenceTimer)
  if (hideTimer) clearTimeout(hideTimer)
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

function startGame() {
  initGame()
  gameStatus.value = 'ready'

  setTimeout(() => {
    gameStatus.value = 'instruction'
    // 显示目标指示
    setTimeout(() => {
      gameStatus.value = 'playing'
      trackingStartTime.value = Date.now()

      // 启动本地计时器
      elapsedSeconds.value = 0
      gameTimer = setInterval(() => {
        elapsedSeconds.value += 1
      }, 1000)

      if (gameMode.value === 'tracking') {
        updateStarPositions()
        setTimeout(triggerInterference, 2000)
      }
    }, 2000)
  }, 1000)
}

function reportChange() {
  if (gameStatus.value !== 'playing' || gameMode.value !== 'tracking') return
  
  // 检查最近是否有变化
  const recentChange = changeEvents.value.find(e => {
    const timeSinceChange = (Date.now() - trackingStartTime.value) - e.time
    return timeSinceChange < 1500 && !e.position.reported
  })
  
  if (recentChange) {
    reportedChanges.value++
    recentChange.position.reported = true
    playFeedbackSound(true)
  } else {
    // 误报
    trackingLostTime.value += 300
    playFeedbackSound(false)
  }
}

function clickAnimal(animal: Animal) {
  if (gameStatus.value !== 'playing' || gameMode.value !== 'finding') return
  
  if (animal.isTarget && !foundTargets.value.includes(animal.id)) {
    foundTargets.value.push(animal.id)
    playFeedbackSound(true)
  } else if (!animal.isTarget) {
    wrongClicks.value++
    playFeedbackSound(false)
  }
  
  // 检查是否找到所有目标
  const config = currentAnimalConfig.value
  if (foundTargets.value.length >= config.targetCount) {
    finishGame()
  }
}

function playFeedbackSound(isCorrect: boolean) {
  if (!audioContext) return
  
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  if (isCorrect) {
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
  } else {
    oscillator.frequency.value = 220
    oscillator.type = 'sawtooth'
  }
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
  
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.15)
}

function calculateScore(): { score: number; focusScore: number } {
  const config = currentConfig.value
  
  if (gameMode.value === 'tracking') {
    const trackingTime = config.duration * 1000
    const accuracy = Math.max(0, 1 - trackingLostTime.value / trackingTime)
    const changeDetectionRate = totalChanges.value > 0 ? reportedChanges.value / totalChanges.value : 1
    
    const focusScore = Math.round(accuracy * 0.6 * 100 + changeDetectionRate * 0.4 * 100)
    const score = Math.round(focusScore * (1 + reportedChanges.value * 0.1))
    
    return { score, focusScore: Math.min(100, focusScore) }
  } else {
    const config2 = currentAnimalConfig.value
    const accuracy = foundTargets.value.length / config2.targetCount
    const timeRatio = 1 - (elapsedSeconds.value / config2.duration)
    const wrongPenalty = wrongClicks.value * 0.05
    
    const focusScore = Math.round((accuracy * 0.7 + Math.max(0, timeRatio) * 0.3 - wrongPenalty) * 100)
    const score = Math.round(focusScore * (1 + (foundTargets.value.length - wrongClicks.value) * 0.1))
    
    return { score, focusScore: Math.min(100, focusScore) }
  }
}

const elapsedSeconds = ref(0)

async function finishGame() {
  stopGameTimer()

  if (animationFrame) wx.cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  if (hideTimer) clearTimeout(hideTimer)

  gameStatus.value = 'finished'

  const { score, focusScore } = calculateScore()
  resultScore.value = score
  resultFocusScore.value = focusScore
  showResult.value = true

  if (userStore.currentChild) {
    try {
      await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 9, // G009 追踪目标
        durationSeconds: Math.max(1, elapsedSeconds.value),
        accuracy: gameMode.value === 'tracking'
          ? Math.round((reportedChanges.value / Math.max(1, totalChanges.value)) * 100)
          : Math.round((foundTargets.value.length / currentAnimalConfig.value.targetCount) * 100),
        score,
        focusScore,
        difficultyLevel: difficulty.value,
        gameConfig: {
          mode: gameMode.value,
          ...(gameMode.value === 'tracking' ? {
            starCount: currentConfig.value.starCount,
            targetCount: currentConfig.value.targetCount,
            interference: currentConfig.value.interference,
          } : {
            animalCount: currentAnimalConfig.value.animalCount,
            targetCount: currentAnimalConfig.value.targetCount,
            task: currentAnimalConfig.value.task,
          }),
        },
        resultData: {
          reportedChanges: reportedChanges.value,
          totalChanges: totalChanges.value,
          trackingLostTime: trackingLostTime.value,
          foundTargets: foundTargets.value.length,
          wrongClicks: wrongClicks.value,
        },
      })
      gameStore.addTodayRecord({} as any)
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  if (animationFrame) wx.cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  if (hideTimer) clearTimeout(hideTimer)
  stopGameTimer()

  gameStatus.value = 'idle'
  showResult.value = false
  stars.value = []
  animals.value = []
  foundTargets.value = []
  elapsedSeconds.value = 0
}

function getStarStyle(star: Star): Record<string, string> {
  let opacity = 1
  let scale = 1
  
  if (star.state === 'flickering') {
    opacity = Math.random() > 0.5 ? 0.2 : 1
    scale = Math.random() > 0.5 ? 0.8 : 1
  } else if (star.state === 'hidden') {
    opacity = 0
  } else if (star.state === 'cloned') {
    opacity = 0.7
  }
  
  return {
    left: `${star.x - star.size / 2}rpx`,
    top: `${star.y - star.size / 2}rpx`,
    width: `${star.size * scale}rpx`,
    height: `${star.size * scale}rpx`,
    backgroundColor: star.color,
    opacity: String(opacity),
    transform: `rotate(${star.rotation}deg)`,
    boxShadow: star.isTarget ? `0 0 20rpx ${star.color}` : `0 0 10rpx rgba(255,255,255,0.5)`,
  }
}

function getAnimalStyle(animal: Animal): Record<string, string> {
  return {
    left: `${animal.x - animal.size / 2}rpx`,
    top: `${animal.y - animal.size / 2}rpx`,
    fontSize: `${animal.size * 0.6}rpx`,
    transform: foundTargets.value.includes(animal.id) ? 'scale(0.9)' : 'scale(1)',
    opacity: foundTargets.value.includes(animal.id) ? '0.5' : '1',
  }
}

onUnmounted(() => {
  if (animationFrame) wx.cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  if (hideTimer) clearTimeout(hideTimer)
  stopGameTimer()
  if (audioContext) audioContext.close()
})
</script>

<template>
  <view class="page">
    <!-- 开始页面 -->
    <view v-if="gameStatus === 'idle'" class="start-page">
      <view class="game-intro">
        <text class="intro-icon">✨</text>
        <text class="intro-title">追踪小星星</text>
        <text class="intro-desc">
          选择游戏模式：追踪移动的星星，或在场景中寻找目标动物。
        </text>
      </view>

      <!-- 模式选择 -->
      <view class="mode-selector">
        <view
          class="mode-btn"
          :class="{ active: gameMode === 'tracking' }"
          @tap="gameMode = 'tracking'"
        >
          <text class="mode-icon">⭐</text>
          <text class="mode-label">星星追踪</text>
          <text class="mode-desc">追踪移动的星星</text>
        </view>
        <view
          class="mode-btn"
          :class="{ active: gameMode === 'finding' }"
          @tap="gameMode = 'finding'"
        >
          <text class="mode-icon">🐾</text>
          <text class="mode-label">动物寻找</text>
          <text class="mode-desc">找出目标动物</text>
        </view>
      </view>

      <!-- 难度选择 -->
      <view class="difficulty-list">
        <view class="difficulty-header">
          {{ gameMode === 'tracking' ? '星星难度' : '动物难度' }}
        </view>
        
        <template v-if="gameMode === 'tracking'">
          <view
            v-for="(config, level) in difficultyConfig"
            :key="level"
            class="difficulty-item"
            :class="{ selected: difficulty === Number(level) }"
            @tap="difficulty = Number(level) as DifficultyLevel"
          >
            <view class="difficulty-left">
              <text class="difficulty-label">{{ config.label }}</text>
              <text class="difficulty-hint">
                {{ config.starCount }}颗星 | {{ config.targetCount }}个目标
                {{ config.interference.length > 0 ? `| ${config.interference.length}种干扰` : '' }}
              </text>
            </view>
            <view v-if="difficulty === Number(level)" class="difficulty-check">✓</view>
          </view>
        </template>
        
        <template v-else>
          <view
            v-for="(config, level) in animalDifficultyConfig"
            :key="level"
            class="difficulty-item"
            :class="{ selected: difficulty === Number(level) }"
            @tap="difficulty = Number(level) as DifficultyLevel"
          >
            <view class="difficulty-left">
              <text class="difficulty-label">{{ config.label }}</text>
              <text class="difficulty-hint">
                {{ config.animalCount }}只动物 | {{ config.targetCount }}个目标
              </text>
            </view>
            <view v-if="difficulty === Number(level)" class="difficulty-check">✓</view>
          </view>
        </template>
      </view>

      <view class="start-section">
        <view class="btn-primary start-btn" @tap="startGame">
          <text class="btn-text">开始游戏</text>
        </view>
      </view>
    </view>

    <!-- 准备阶段 -->
    <view v-else-if="gameStatus === 'ready'" class="ready-area">
      <view class="ready-content">
        <text class="ready-icon">{{ gameMode === 'tracking' ? '⭐' : '🐾' }}</text>
        <text class="ready-title">准备开始</text>
        <text class="ready-hint">即将开始...</text>
      </view>
    </view>

    <!-- 指示阶段 -->
    <view v-else-if="gameStatus === 'instruction'" class="instruction-area">
      <view class="instruction-card">
        <text class="instruction-icon">{{ gameMode === 'tracking' ? '⭐' : '🎯' }}</text>
        <text class="instruction-title">
          {{ gameMode === 'tracking' ? '记住目标星星！' : currentAnimalConfig.task }}
        </text>
        <text class="instruction-subtitle">
          {{ gameMode === 'tracking' ? '金色星星是你的目标' : '点击找到所有目标' }}
        </text>
      </view>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="gameStatus === 'playing'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view v-if="gameMode === 'tracking'" class="status-item">
          <text class="status-label">检测到</text>
          <text class="status-value">{{ reportedChanges }}</text>
        </view>
        <view v-else class="status-item">
          <text class="status-label">已找到</text>
          <text class="status-value">{{ foundTargets.length }}/{{ currentAnimalConfig.targetCount }}</text>
        </view>

        <view class="timer-display">
          <text class="timer-text">{{ String(Math.floor(elapsedSeconds / 60)).padStart(2, '0') }}:{{ String(elapsedSeconds % 60).padStart(2, '0') }}</text>
        </view>

        <view v-if="gameMode === 'tracking'" class="status-item">
          <text class="status-label">干扰</text>
          <text class="status-value">{{ totalChanges }}</text>
        </view>
        <view v-else class="status-item">
          <text class="status-label">错误</text>
          <text class="status-value wrong">{{ wrongClicks }}</text>
        </view>
      </view>

      <!-- 游戏区域 -->
      <view v-if="gameMode === 'tracking'" class="game-field star-field">
        <view
          v-for="star in stars"
          :key="star.id"
          class="star"
          :class="{
            'star-target': star.isTarget,
            'star-cloned': star.state === 'cloned'
          }"
          :style="getStarStyle(star)"
        >
          <text class="star-icon">{{ star.isTarget ? '⭐' : '✦' }}</text>
        </view>
        
        <!-- 干扰提示 -->
        <view v-if="totalChanges > 0" class="change-counter">
          <text class="change-text">变化: {{ totalChanges }}</text>
        </view>
      </view>

      <view v-else class="game-field animal-field">
        <view
          v-for="animal in animals"
          :key="animal.id"
          class="animal"
          :class="{
            'animal-target': animal.isTarget,
            'animal-found': foundTargets.includes(animal.id)
          }"
          :style="getAnimalStyle(animal)"
          @tap="clickAnimal(animal)"
        >
          <text class="animal-icon">{{ animal.type }}</text>
        </view>
      </view>

      <!-- 图例 -->
      <view v-if="gameMode === 'tracking'" class="legend">
        <view class="legend-item">
          <text class="legend-star target">⭐</text>
          <text class="legend-text">目标星星</text>
        </view>
        <view class="legend-item">
          <text class="legend-star">✦</text>
          <text class="legend-text">普通星星</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="gameMode === 'tracking'" class="action-section">
        <view class="btn-report" @tap="reportChange">
          <text class="btn-report-text">📍 发现变化</text>
        </view>
      </view>

      <view class="quit-btn" @tap="resetGame">
        <text class="quit-text">退出游戏</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">🎉 完成！</text>
        <text class="result-subtitle">
          {{ gameMode === 'tracking' ? '星星追踪' : '动物寻找' }}
          {{ gameMode === 'tracking' ? currentConfig.label : currentAnimalConfig.label }}
        </text>

        <view class="result-stars">
          <StarRating :score="resultFocusScore" :size="64" />
        </view>

        <view class="result-stats">
          <view v-if="gameMode === 'tracking'" class="result-stat">
            <text class="result-stat-value">{{ reportedChanges }}/{{ totalChanges || '-' }}</text>
            <text class="result-stat-label">检测次数</text>
          </view>
          <view v-else class="result-stat">
            <text class="result-stat-value">{{ foundTargets.length }}/{{ currentAnimalConfig.targetCount }}</text>
            <text class="result-stat-label">找到目标</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view v-if="gameMode === 'finding'" class="result-stat">
            <text class="result-stat-value">{{ wrongClicks }}</text>
            <text class="result-stat-label">误点</text>
          </view>
        </view>

        <view class="result-focus">
          <text class="result-focus-label">专注力评分</text>
          <text class="result-focus-score">{{ resultFocusScore }}</text>
        </view>

        <view class="result-actions">
          <view class="btn-primary result-btn" @tap="startGame">
            <text class="btn-text">再来一局</text>
          </view>
          <view class="btn-outline result-btn" @tap="resetGame">
            <text class="btn-text-outline">换难度</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  padding: 32rpx;
}

/* 开始页面 */
.start-page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.game-intro {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.intro-icon { font-size: 80rpx; }

.intro-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
}

.intro-desc {
  font-size: 26rpx;
  color: #666666;
  text-align: center;
  line-height: 1.6;
}

/* 模式选择 */
.mode-selector {
  display: flex;
  gap: 16rpx;
}

.mode-btn {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  border: 3rpx solid transparent;
  
  &.active {
    border-color: #6C63FF;
    background-color: #f0eeff;
  }
  
  &:active { transform: scale(0.98); }
}

.mode-icon { font-size: 48rpx; }

.mode-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
}

.mode-desc {
  font-size: 22rpx;
  color: #999999;
}

/* 难度列表 */
.difficulty-list {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  overflow: hidden;
}

.difficulty-header {
  padding: 20rpx 32rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #666666;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #f0f0f0;
}

.difficulty-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child { border-bottom: none; }
  &.selected { background-color: #f0eeff; }
  &:active { background-color: #f8f8f8; }
}

.difficulty-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
}

.difficulty-hint {
  font-size: 22rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.difficulty-check {
  width: 44rpx;
  height: 44rpx;
  background-color: #6C63FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
}

.start-section { padding: 0 8rpx; }

/* 按钮样式 */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  background-color: #6C63FF;
  border-radius: 99rpx;

  &:active { opacity: 0.85; }
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border: 2rpx solid #6C63FF;
  border-radius: 99rpx;
  background-color: transparent;

  &:active { opacity: 0.85; }
}

.btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-text-outline {
  color: #6C63FF;
  font-size: 32rpx;
  font-weight: 700;
}

.start-btn {
  height: 100rpx;
  font-size: 34rpx;
}

/* 准备/指示阶段 */
.ready-area, .instruction-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.ready-content, .instruction-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 64rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.ready-icon {
  font-size: 120rpx;
  animation: pulse 1s infinite;
}

.ready-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
}

.ready-hint {
  font-size: 32rpx;
  color: #6C63FF;
  font-weight: 600;
}

.instruction-icon {
  font-size: 80rpx;
}

.instruction-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  text-align: center;
}

.instruction-subtitle {
  font-size: 26rpx;
  color: #666666;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

/* 游戏区域 */
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.status-bar {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.status-label {
  font-size: 20rpx;
  color: #999999;
}

.status-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #6C63FF;

  &.wrong { color: #FF5252; }
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-text {
  font-size: 64rpx;
  font-weight: 700;
  color: #6C63FF;
  font-variant-numeric: tabular-nums;
  letter-spacing: 4rpx;
}

.game-field {
  width: 710rpx;
  height: 550rpx;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
}

.star {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.star-icon { font-size: 28rpx; }

.star-target {
  z-index: 10;
}

.star-cloned {
  opacity: 0.7;
}

.change-counter {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background-color: rgba(255, 152, 0, 0.8);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

.change-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

.animal {
  position: absolute;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active { transform: scale(0.9); }
}

.animal-icon { font-size: 40rpx; }

.animal-target {
  animation: glow 1.5s infinite;
}

.animal-found {
  opacity: 0.5;
}

@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.legend {
  display: flex;
  gap: 32rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 12rpx 24rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-star {
  font-size: 24rpx;
  color: #ffffff;
  
  &.target {
    color: #FFD700;
    text-shadow: 0 0 10rpx #FFD700;
  }
}

.legend-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.action-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.btn-report {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 280rpx;
  height: 80rpx;
  background-color: #FFD93D;
  border-radius: 99rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 217, 61, 0.4);

  &:active { transform: scale(0.95); }
}

.btn-report-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
}

.quit-btn {
  padding: 12rpx 48rpx;
  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 结果弹窗 */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.result-modal {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  width: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.result-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #333333;
}

.result-subtitle {
  font-size: 26rpx;
  color: #666666;
  margin-top: -12rpx;
}

.result-stars {
  display: flex;
  gap: 8rpx;
}

.result-stats {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-around;
  background-color: #f8f8f8;
  border-radius: 20rpx;
  padding: 20rpx 0;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.result-stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #6C63FF;
}

.result-stat-label {
  font-size: 20rpx;
  color: #999999;
}

.result-focus {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.result-focus-label {
  font-size: 24rpx;
  color: #666666;
}

.result-focus-score {
  font-size: 56rpx;
  font-weight: 700;
  color: #6C63FF;
}

.result-actions {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.result-btn {
  box-sizing: border-box; width: 100%; }
</style>