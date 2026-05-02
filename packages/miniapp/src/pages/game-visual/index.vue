<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import GameTimer from '@/components/GameTimer.vue'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5

interface Star {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  isTarget: boolean
  state: 'normal' | 'flickering' | 'hidden' | 'colorChanged'
  color: string
  size: number
}

interface ChangeEvent {
  starId: number
  time: number
  type: string
  reported: boolean
}

const userStore = useUserStore()
const gameStore = useGameStore()
const timerRef = ref<InstanceType<typeof GameTimer> | null>(null)

// 游戏状态
type GameStatus = 'idle' | 'ready' | 'playing' | 'finished'
const gameStatus = ref<GameStatus>('idle')
const difficulty = ref<DifficultyLevel>(1)

// 难度配置
const difficultyConfig: Record<DifficultyLevel, { starCount: number; targetCount: number; speed: string; interference: string[]; duration: number; label: string }> = {
  1: { starCount: 3, targetCount: 1, speed: 'slow', interference: [], duration: 30, label: '简单 (3颗星)' },
  2: { starCount: 4, targetCount: 1, speed: 'medium', interference: ['flicker'], duration: 35, label: '中等 (4颗星)' },
  3: { starCount: 5, targetCount: 1, speed: 'medium', interference: ['flicker', 'color'], duration: 40, label: '困难 (5颗星)' },
  4: { starCount: 6, targetCount: 2, speed: 'fast', interference: ['flicker', 'color', 'disappear'], duration: 45, label: '专家 (6颗星)' },
  5: { starCount: 8, targetCount: 2, speed: 'fast', interference: ['flicker', 'color', 'disappear', 'clone'], duration: 50, label: '大师 (8颗星)' },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏数据
const stars = ref<Star[]>([])
const targetStarIds = ref<number[]>([])
const changeEvents = ref<ChangeEvent[]>([])
const reportedChanges = ref<number>(0)
const totalChanges = ref<number>(0)
const trackingStartTime = ref<number>(0)
const trackingLostTime = ref<number>(0)

// 结果数据
const resultScore = ref<number>(0)
const resultFocusScore = ref<number>(0)
const showResult = ref<boolean>(false)

// 动画帧
let animationFrame: number | null = null
let interferenceTimer: ReturnType<typeof setTimeout> | null = null

// 区域尺寸
const areaWidth = 650
const areaHeight = 400
const starSize = 24

function generateStars(): Star[] {
  const config = currentConfig.value
  const result: Star[] = []
  
  // 生成普通星星
  for (let i = 0; i < config.starCount; i++) {
    let x: number, y: number
    let attempts = 0
    do {
      x = Math.random() * (areaWidth - 60) + 30
      y = Math.random() * (areaHeight - 60) + 30
      attempts++
    } while (result.some(s => Math.hypot(s.x - x, s.y - y) < 50) && attempts < 20)
    
    const speed = config.speed === 'slow' ? 0.5 : config.speed === 'medium' ? 1 : 1.5
    const angle = Math.random() * Math.PI * 2
    
    result.push({
      id: i,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      isTarget: false,
      state: 'normal',
      color: '#FFFFFF',
      size: starSize,
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
    result[idx].color = '#FFD700' // 金色
    result[idx].size = starSize + 8
  })
  
  return result
}

function updateStarPositions() {
  if (gameStatus.value !== 'playing') return
  
  stars.value.forEach(star => {
    star.x += star.vx
    star.y += star.vy
    
    // 边界反弹
    if (star.x <= star.size || star.x >= areaWidth - star.size) {
      star.vx = -star.vx
      star.x = Math.max(star.size, Math.min(areaWidth - star.size, star.x))
    }
    if (star.y <= star.size || star.y >= areaHeight - star.size) {
      star.vy = -star.vy
      star.y = Math.max(star.size, Math.min(areaHeight - star.size, star.y))
    }
    
    // 闪烁状态恢复
    if (star.state === 'flickering' && Math.random() > 0.7) {
      star.state = 'normal'
    }
  })
  
  animationFrame = requestAnimationFrame(updateStarPositions)
}

function triggerInterference() {
  if (gameStatus.value !== 'playing') return
  
  const config = currentConfig.value
  if (config.interference.length === 0) return
  
  const type = config.interference[Math.floor(Math.random() * config.interference.length)]
  
  if (type === 'flicker') {
    // 随机星星闪烁
    const normalStars = stars.value.filter(s => !s.isTarget)
    if (normalStars.length > 0) {
      const star = normalStars[Math.floor(Math.random() * normalStars.length)]
      star.state = 'flickering'
    }
  } else if (type === 'color' && targetStarIds.value.length > 0) {
    // 目标变色
    const targetStar = stars.value.find(s => s.isTarget)
    if (targetStar) {
      targetStar.color = '#FFFFFF'
      setTimeout(() => {
        if (gameStatus.value === 'playing') {
          targetStar.color = '#FFD700'
        }
      }, 800)
    }
  } else if (type === 'disappear' && targetStarIds.value.length > 0) {
    // 目标消失
    const targetStar = stars.value.find(s => s.isTarget)
    if (targetStar) {
      targetStar.state = 'hidden'
      totalChanges.value++
      setTimeout(() => {
        if (gameStatus.value === 'playing') {
          targetStar.state = 'normal'
        }
      }, 1500)
    }
  }
  
  // 安排下一次干扰
  const nextInterval = 3000 + Math.random() * 4000
  interferenceTimer = setTimeout(triggerInterference, nextInterval)
}

function initGame() {
  stars.value = generateStars()
  targetStarIds.value = stars.value.filter(s => s.isTarget).map(s => s.id)
  changeEvents.value = []
  reportedChanges.value = 0
  totalChanges.value = 0
  trackingLostTime.value = 0
  showResult.value = false
  
  if (interferenceTimer) clearTimeout(interferenceTimer)
}

function startGame() {
  initGame()
  gameStatus.value = 'ready'
  
  // 3秒准备时间
  setTimeout(() => {
    gameStatus.value = 'playing'
    trackingStartTime.value = Date.now()
    timerRef.value?.start()
    
    // 启动星星移动
    updateStarPositions()
    
    // 启动干扰系统
    setTimeout(triggerInterference, 2000)
  }, 3000)
}

function reportChange() {
  if (gameStatus.value !== 'playing') return
  
  // 检查是否有变化正在发生
  const activeChange = stars.value.find(s => 
    s.isTarget && (s.state === 'hidden' || s.state === 'colorChanged')
  )
  
  if (activeChange) {
    reportedChanges.value++
  } else {
    // 误报，扣分
    trackingLostTime.value += 500
  }
}

function calculateScore(): { score: number; focusScore: number } {
  const config = currentConfig.value
  const trackingTime = config.duration * 1000
  const accuracy = trackingTime > 0 ? Math.max(0, 1 - trackingLostTime.value / trackingTime) : 0
  
  // 追踪准确率权重70%，变化检测率权重30%
  const changeDetectionRate = totalChanges.value > 0 ? reportedChanges.value / totalChanges.value : 1
  const focusScore = Math.round(accuracy * 0.7 * 100 + changeDetectionRate * 0.3 * 100)
  const score = Math.round(focusScore * (1 + reportedChanges.value * 0.1))
  
  return { score, focusScore: Math.min(100, focusScore) }
}

async function finishGame() {
  timerRef.value?.stop()
  
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  
  gameStatus.value = 'finished'
  
  const { score, focusScore } = calculateScore()
  resultScore.value = score
  resultFocusScore.value = focusScore
  showResult.value = true
  
  if (userStore.currentChild) {
    try {
      const res = await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 4, // G004 视觉追踪
        durationSeconds: currentConfig.value.duration,
        accuracy: Math.round((reportedChanges.value / Math.max(1, totalChanges.value)) * 100),
        score,
        focusScore,
        difficultyLevel: difficulty.value,
        gameConfig: { 
          starCount: currentConfig.value.starCount,
          targetCount: currentConfig.value.targetCount,
          speed: currentConfig.value.speed,
          interference: currentConfig.value.interference
        },
        resultData: {
          reportedChanges: reportedChanges.value,
          totalChanges: totalChanges.value,
          trackingLostTime: trackingLostTime.value,
        },
      })
      gameStore.addTodayRecord(res.data)
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function onTimerTick(_seconds: number) {
  // 时间到自动结束
  finishGame()
}

function resetGame() {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  timerRef.value?.stop()
  timerRef.value?.reset()
  
  gameStatus.value = 'idle'
  showResult.value = false
  stars.value = []
}

function getStarStyle(star: Star): Record<string, string> {
  let opacity = 1
  if (star.state === 'flickering') {
    opacity = Math.random() > 0.5 ? '0.3' : '1'
  } else if (star.state === 'hidden') {
    opacity = '0'
  }
  
  return {
    left: `${star.x - star.size / 2}rpx`,
    top: `${star.y - star.size / 2}rpx`,
    width: `${star.size}rpx`,
    height: `${star.size}rpx`,
    backgroundColor: star.color,
    opacity,
    boxShadow: star.isTarget ? `0 0 20rpx ${star.color}` : `0 0 10rpx rgba(255,255,255,0.5)`,
  }
}

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (interferenceTimer) clearTimeout(interferenceTimer)
  timerRef.value?.stop()
})
</script>

<template>
  <view class="page">
    <!-- 游戏选择界面 -->
    <view v-if="gameStatus === 'idle'" class="difficulty-select">
      <view class="game-intro">
        <text class="intro-icon">⭐</text>
        <text class="intro-title">视觉追踪</text>
        <text class="intro-desc">
          追踪移动的星星，注意观察它们的变化！训练视觉注意力和抗干扰能力！
        </text>
      </view>

      <view class="difficulty-list">
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
              {{ config.starCount }}颗星 | {{ config.targetCount }}个目标 | {{ config.duration }}秒
            </text>
          </view>
          <view v-if="difficulty === Number(level)" class="difficulty-check">✓</view>
        </view>
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
        <text class="ready-icon">👀</text>
        <text class="ready-title">准备开始</text>
        <text class="ready-subtitle">仔细观察并记住目标星星</text>
        <text class="ready-hint">3秒后开始...</text>
      </view>
      
      <view class="preview-stars">
        <view class="target-preview">
          <text class="star-emoji">⭐</text>
          <text class="preview-label">这是目标星星</text>
        </view>
        <view class="normal-preview">
          <text class="star-emoji">✨</text>
          <text class="preview-label">普通星星</text>
        </view>
      </view>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="gameStatus === 'playing'" class="game-area">
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">已报告</text>
          <text class="status-value">{{ reportedChanges }}</text>
        </view>
        <GameTimer
          ref="timerRef"
          :auto-start="false"
          :time-limit="currentConfig.duration"
          @tick="onTimerTick"
        />
        <view class="status-item">
          <text class="status-label">目标</text>
          <text class="status-value">{{ currentConfig.targetCount }}</text>
        </view>
      </view>

      <!-- 星空区域 -->
      <view class="star-field">
        <view
          v-for="star in stars"
          :key="star.id"
          class="star"
          :class="{
            'star-target': star.isTarget,
            'star-normal': !star.isTarget
          }"
          :style="getStarStyle(star)"
        >
          <text v-if="star.state !== 'hidden'" class="star-icon">{{ star.isTarget ? '⭐' : '✦' }}</text>
        </view>
      </view>

      <!-- 图例 -->
      <view class="legend">
        <view class="legend-item">
          <text class="legend-star target">⭐</text>
          <text class="legend-text">目标星星</text>
        </view>
        <view class="legend-item">
          <text class="legend-star">✦</text>
          <text class="legend-text">普通星星</text>
        </view>
      </view>

      <!-- 报告按钮 -->
      <view class="report-section">
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
        <text class="result-subtitle">视觉追踪训练</text>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ reportedChanges }}/{{ totalChanges }}</text>
            <text class="result-stat-label">检测次数</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
        </view>

        <view class="result-focus">
          <text class="result-focus-label">专注力评分</text>
          <text class="result-focus-score">{{ resultFocusScore }}</text>
          <StarRating :score="resultFocusScore" :size="48" />
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
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 32rpx;
}

.difficulty-select {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
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

.difficulty-list {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  overflow: hidden;
}

.difficulty-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child { border-bottom: none; }
  &.selected { background-color: #f0eeff; }
  &:active { background-color: #f8f8f8; }
}

.difficulty-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
}

.difficulty-hint {
  font-size: 24rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.difficulty-check {
  width: 48rpx;
  height: 48rpx;
  background-color: #6C63FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.start-section {
  padding: 0 8rpx;
}

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

/* 准备阶段 */
.ready-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48rpx;
  padding-top: 80rpx;
}

.ready-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.ready-icon {
  font-size: 100rpx;
  animation: pulse 1s infinite;
}

.ready-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
}

.ready-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.ready-hint {
  font-size: 32rpx;
  color: #FFD700;
  font-weight: 600;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.preview-stars {
  display: flex;
  gap: 48rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 32rpx 48rpx;
}

.target-preview, .normal-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.star-emoji {
  font-size: 48rpx;
}

.preview-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 游戏区 */
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.status-bar {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 20rpx 32rpx;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.status-label {
  font-size: 22rpx;
  color: #999999;
}

.status-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #6C63FF;
}

.star-field {
  width: 710rpx;
  height: 500rpx;
  background-color: rgba(0, 0, 0, 0.3);
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
  transition: background-color 0.3s;
}

.star-icon {
  font-size: 32rpx;
}

.star-target {
  z-index: 10;
}

.star-normal {
  opacity: 0.7;
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

.report-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.btn-report {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300rpx;
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
  padding: 16rpx 48rpx;
  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 26rpx;
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
  padding: 48rpx 40rpx;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.result-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
}

.result-subtitle {
  font-size: 28rpx;
  color: #666666;
  margin-top: -16rpx;
}

.result-stats {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-around;
  background-color: #f8f8f8;
  border-radius: 20rpx;
  padding: 24rpx 0;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.result-stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #6C63FF;
}

.result-stat-label {
  font-size: 22rpx;
  color: #999999;
}

.result-focus {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.result-focus-label {
  font-size: 26rpx;
  color: #666666;
}

.result-focus-score {
  font-size: 64rpx;
  font-weight: 700;
  color: #6C63FF;
}

.result-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-btn {
  width: 100%;
}
</style>