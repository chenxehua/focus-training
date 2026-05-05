<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type GamePhase = 'start' | 'countdown' | 'playing' | 'finished'

interface ClickResult {
  beat: number
  clickTime: number
  targetTime: number
  offset: number
  rating: 'perfect' | 'good' | 'ok' | 'miss'
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 难度配置
const difficulty = ref<DifficultyLevel>(1)
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  bpm: number
  totalBeats: number
  tolerance: number
  mode: 'tap' | 'double'
}> = {
  1: { label: '简单 (60 BPM)', bpm: 60, totalBeats: 8, tolerance: 300, mode: 'tap' },
  2: { label: '中等 (80 BPM)', bpm: 80, totalBeats: 12, tolerance: 250, mode: 'tap' },
  3: { label: '困难 (100 BPM)', bpm: 100, totalBeats: 16, tolerance: 200, mode: 'tap' },
  4: { label: '专家 (120 BPM)', bpm: 120, totalBeats: 20, tolerance: 150, mode: 'tap' },
  5: { label: '大师 (140 BPM)', bpm: 140, totalBeats: 24, tolerance: 120, mode: 'double' },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏状态
const gamePhase = ref<GamePhase>('start')
const currentBeat = ref(0)
const clickResults = ref<ClickResult[]>([])
const startTime = ref(0)
const countdownValue = ref(3)
const isCountdown = ref(false)

// 统计数据
const perfectCount = ref(0)
const goodCount = ref(0)
const okCount = ref(0)
const missCount = ref(0)
const combo = ref(0)
const maxCombo = ref(0)

// 结果数据
const resultScore = ref(0)
const resultStars = ref(0)
const showResult = ref(false)

// 音频上下文 - 使用 uni-app InnerAudioContext
let audioContext: any = null

// 定时器
let beatTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let animationFrame: number | null = null

// 评分阈值(ms)
const PERFECT_THRESHOLD = 50
const GOOD_THRESHOLD = 100

function initAudio() {
  if (typeof uni !== 'undefined' && !audioContext) {
    audioContext = uni.createInnerAudioContext()
    audioContext.src = '' // 预加载用
  }
}

function playBeatSound() {
  if (!audioContext) return

  // 使用 uni 的 API 播放音频
  const innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.obeyMuteSwitch = false

  // 生成 beep 声音 - 使用480Hz短促音效
  // 由于无法直接生成音频，使用系统播放短提示音的方式
  // 在实际项目中可以预先放置音频文件
  innerAudioContext.src = '' // 预留
  innerAudioContext.play()

  // 延迟关闭
  setTimeout(() => {
    innerAudioContext.stop()
    innerAudioContext.destroy()
  }, 100)
}

function playPerfectSound() {
  if (!audioContext) return

  const innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.obeyMuteSwitch = false
  innerAudioContext.src = ''
  innerAudioContext.play()

  setTimeout(() => {
    innerAudioContext.stop()
    innerAudioContext.destroy()
  }, 150)
}

function playMissSound() {
  if (!audioContext) return

  const innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.obeyMuteSwitch = false
  innerAudioContext.src = ''
  innerAudioContext.play()

  setTimeout(() => {
    innerAudioContext.stop()
    innerAudioContext.destroy()
  }, 200)
}

function startGame() {
  initAudio()
  gamePhase.value = 'countdown'
  isCountdown.value = true
  countdownValue.value = 3
  
  // 重置数据
  currentBeat.value = 0
  clickResults.value = []
  perfectCount.value = 0
  goodCount.value = 0
  okCount.value = 0
  missCount.value = 0
  combo.value = 0
  maxCombo.value = 0
  showResult.value = false
  
  // 倒计时
  countdownTimer = setInterval(() => {
    countdownValue.value--
    if (countdownValue.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      isCountdown.value = false
      startPlaying()
    }
  }, 1000)
}

function startPlaying() {
  gamePhase.value = 'playing'
  startTime.value = Date.now()
  
  const interval = 60000 / currentConfig.value.bpm // ms per beat
  
  beatTimer = setInterval(() => {
    currentBeat.value++
    playBeatSound()
    
    // 检测这拍是否被点击
    setTimeout(() => {
      const hasClick = clickResults.value.some(r => r.beat === currentBeat.value)
      if (!hasClick) {
        // 这拍被错过了
        missCount.value++
        combo.value = 0
        clickResults.value.push({
          beat: currentBeat.value,
          clickTime: 0,
          targetTime: startTime.value + currentBeat.value * interval,
          offset: interval,
          rating: 'miss',
        })
      }
      
      // 游戏结束
      if (currentBeat.value >= currentConfig.value.totalBeats) {
        finishGame()
      }
    }, currentConfig.value.tolerance + 50)
  }, interval)
}

function handleTap(type: 'left' | 'right') {
  if (gamePhase.value !== 'playing') return
  
  const config = currentConfig.value
  const clickTime = Date.now()
  const interval = 60000 / config.bpm
  const targetTime = startTime.value + currentBeat.value * interval
  const offset = Math.abs(clickTime - targetTime)
  
  let rating: 'perfect' | 'good' | 'ok' | 'miss'
  
  if (offset <= PERFECT_THRESHOLD) {
    rating = 'perfect'
    perfectCount.value++
    combo.value++
    playPerfectSound()
  } else if (offset <= GOOD_THRESHOLD) {
    rating = 'good'
    goodCount.value++
    combo.value++
  } else if (offset <= config.tolerance) {
    rating = 'ok'
    okCount.value++
    combo.value++
  } else {
    rating = 'miss'
    missCount.value++
    combo.value = 0
    playMissSound()
  }
  
  if (combo.value > maxCombo.value) {
    maxCombo.value = combo.value
  }
  
  clickResults.value.push({
    beat: currentBeat.value,
    clickTime,
    targetTime,
    offset,
    rating,
  })
}

function getClickResultIcon(rating: string): string {
  switch (rating) {
    case 'perfect': return '✨'
    case 'good': return '👍'
    case 'ok': return '✓'
    case 'miss': return '✗'
    default: return ''
  }
}

function calculateScore(): { score: number; stars: number } {
  const config = currentConfig.value
  const total = clickResults.value.length
  
  // 计算准确率
  const accuracy = (perfectCount.value * 100 + goodCount.value * 70 + okCount.value * 40) / (total * 100)
  const baseScore = accuracy * 100
  
  // 完美加成
  const perfectBonus = perfectCount.value * 10
  
  // 难度系数
  const difficultyFactor = difficulty.value * 0.2 + 0.5
  
  // 连击加成
  const comboBonus = maxCombo.value * 2
  
  const finalScore = Math.round((baseScore + perfectBonus + comboBonus) * difficultyFactor)
  const score = Math.max(0, Math.min(finalScore, 999))
  
  // 计算星星 - 根据正确率
  const correctRate = (perfectCount.value + goodCount.value + okCount.value) / total
  let stars = 0
  if (correctRate >= 0.9 && perfectCount.value >= total * 0.6) stars = 3
  else if (correctRate >= 0.75) stars = 2
  else if (correctRate >= 0.5) stars = 1
  
  return { score, stars }
}

async function finishGame() {
  if (beatTimer) clearInterval(beatTimer)
  gamePhase.value = 'finished'
  
  const { score, stars } = calculateScore()
  resultScore.value = score
  resultStars.value = stars
  showResult.value = true
  
  // 提交记录
  if (userStore.currentChild) {
    try {
      await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 5, // G005 节奏点击
        durationSeconds: Math.round((Date.now() - startTime.value) / 1000),
        accuracy: (Math.round(((perfectCount.value + goodCount.value + okCount.value) / clickResults.value.length) * 100)) / 100),
        score: resultScore.value,
        focusScore: resultScore.value,
        difficultyLevel: difficulty.value,
        gameConfig: {
          bpm: currentConfig.value.bpm,
          totalBeats: currentConfig.value.totalBeats,
          tolerance: currentConfig.value.tolerance,
          mode: currentConfig.value.mode,
        },
        resultData: {
          perfectCount: perfectCount.value,
          goodCount: goodCount.value,
          okCount: okCount.value,
          missCount: missCount.value,
          maxCombo: maxCombo.value,
          totalBeats: clickResults.value.length,
        },
      })
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  if (beatTimer) clearInterval(beatTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  
  gamePhase.value = 'start'
  currentBeat.value = 0
  clickResults.value = []
  showResult.value = false
}

onUnmounted(() => {
  resetGame()
  if (audioContext) {
    audioContext.close()
  }
})
</script>

<template>
  <view class="page">
    <!-- 开始页面 -->
    <view v-if="gamePhase === 'start'" class="start-page">
      <view class="game-intro">
        <text class="intro-icon">🎵</text>
        <text class="intro-title">节奏点击</text>
        <text class="intro-desc">
          跟随节拍，在正确的时机点击按钮。训练节奏感和手眼协调能力！
        </text>
      </view>

      <view class="difficulty-list">
        <view class="difficulty-header">选择难度</view>
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
              {{ config.totalBeats }}拍 | 容差{{ config.tolerance }}ms
              {{ config.mode === 'double' ? '| 双键模式' : '' }}
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

    <!-- 倒计时 -->
    <view v-else-if="gamePhase === 'countdown'" class="countdown-page">
      <view class="countdown-display">
        <text class="countdown-number">{{ countdownValue }}</text>
      </view>
      <text class="countdown-hint">准备开始...</text>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="gamePhase === 'playing'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">节拍</text>
          <text class="status-value">{{ currentBeat }}/{{ currentConfig.totalBeats }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">连击</text>
          <text class="status-value combo">{{ combo }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">正确</text>
          <text class="status-value correct">{{ perfectCount + goodCount + okCount }}</text>
        </view>
      </view>

      <!-- 游戏区域 -->
      <view class="game-content">
        <!-- 节拍指示器 -->
        <view class="beat-indicator">
          <view
            v-for="i in currentConfig.totalBeats"
            :key="i"
            class="beat-dot"
            :class="{
              current: i === currentBeat,
              completed: i < currentBeat,
              perfect: clickResults[i-1]?.rating === 'perfect',
              good: clickResults[i-1]?.rating === 'good',
              ok: clickResults[i-1]?.rating === 'ok',
              miss: clickResults[i-1]?.rating === 'miss',
            }"
          >
            <text v-if="i === currentBeat" class="beat-text">{{ i }}</text>
          </view>
        </view>

        <!-- 点击按钮 -->
        <view class="tap-area" :class="{ 'double-mode': currentConfig.mode === 'double' }">
          <view
            v-if="currentConfig.mode === 'tap' || currentConfig.mode === 'double'"
            class="tap-btn"
            @touchstart.prevent="handleTap('left')"
          >
            <text class="tap-icon">👆</text>
            <text class="tap-hint">点击</text>
          </view>
        </view>

        <!-- 实时反馈 -->
        <view class="feedback-area">
          <view
            v-for="(result, index) in clickResults.slice(-5)"
            :key="index"
            class="feedback-item"
            :class="'feedback-' + result.rating"
          >
            <text class="feedback-icon">{{ getClickResultIcon(result.rating) }}</text>
            <text class="feedback-text">{{ result.rating === 'miss' ? 'MISS' : result.rating.toUpperCase() }}</text>
          </view>
        </view>
      </view>

      <!-- 退出按钮 -->
      <view class="quit-btn" @tap="resetGame">
        <text class="quit-text">退出游戏</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">{{ resultStars === 3 ? '🎉 太棒了！' : '👍 不错！' }}</text>
        <text class="result-subtitle">节奏点击 {{ currentConfig.label }}</text>

        <view class="result-stars">
          <StarRating :score="resultStars * 33" :size="64" />
        </view>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ maxCombo }}</text>
            <text class="result-stat-label">最大连击</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ currentConfig.totalBeats }}</text>
            <text class="result-stat-label">总节拍</text>
          </view>
        </view>

        <view class="result-detail">
          <view class="detail-item perfect">
            <text class="detail-icon">✨</text>
            <text class="detail-value">{{ perfectCount }}</text>
          </view>
          <view class="detail-item good">
            <text class="detail-icon">👍</text>
            <text class="detail-value">{{ goodCount }}</text>
          </view>
          <view class="detail-item ok">
            <text class="detail-icon">✓</text>
            <text class="detail-value">{{ okCount }}</text>
          </view>
          <view class="detail-item miss">
            <text class="detail-icon">✗</text>
            <text class="detail-value">{{ missCount }}</text>
          </view>
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
  background-color: #1a1a2e;
  padding: 32rpx;
}

/* 开始页面 */
.start-page {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.game-intro {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
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
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.difficulty-header {
  padding: 24rpx 32rpx;
  font-size: 28rpx;
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
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

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

/* 倒计时页面 */
.countdown-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  gap: 32rpx;
}

.countdown-display {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C63FF, #8B5CF6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(108, 99, 255, 0.4);
}

.countdown-number {
  font-size: 120rpx;
  font-weight: 700;
  color: #ffffff;
  animation: countdownPulse 1s ease infinite;
}

@keyframes countdownPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.countdown-hint {
  font-size: 32rpx;
  color: #ffffff;
  opacity: 0.8;
}

/* 游戏区域 */
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.status-bar {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  background-color: rgba(255,255,255,0.1);
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
  color: rgba(255,255,255,0.6);
}

.status-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  
  &.combo { color: #FFD93D; }
  &.correct { color: #6BCB77; }
}

.game-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 48rpx;
  padding: 32rpx 0;
}

.beat-indicator {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
}

.beat-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  
  &.current {
    background-color: #6C63FF;
    transform: scale(1.3);
    box-shadow: 0 0 20rpx rgba(108, 99, 255, 0.6);
  }
  
  &.completed {
    background-color: rgba(255,255,255,0.4);
  }
  
  &.perfect {
    background-color: #FFD93D;
  }
  
  &.good {
    background-color: #6BCB77;
  }
  
  &.ok {
    background-color: #4ECDC4;
  }
  
  &.miss {
    background-color: #FF8A80;
  }
}

.beat-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.tap-area {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.tap-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C63FF, #8B5CF6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-shadow: 0 8rpx 32rpx rgba(108, 99, 255, 0.4);
  transition: all 0.1s;
  
  &:active {
    transform: scale(0.9);
    box-shadow: 0 4rpx 16rpx rgba(108, 99, 255, 0.4);
  }
}

.tap-icon {
  font-size: 64rpx;
}

.tap-hint {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
}

.feedback-area {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  min-height: 48rpx;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  background-color: rgba(255,255,255,0.1);
  
  &.feedback-perfect {
    background-color: rgba(255, 217, 61, 0.2);
    .feedback-icon { color: #FFD93D; }
    .feedback-text { color: #FFD93D; }
  }
  
  &.feedback-good {
    background-color: rgba(107, 203, 119, 0.2);
    .feedback-icon { color: #6BCB77; }
    .feedback-text { color: #6BCB77; }
  }
  
  &.feedback-ok {
    background-color: rgba(78, 205, 196, 0.2);
    .feedback-icon { color: #4ECDC4; }
    .feedback-text { color: #4ECDC4; }
  }
  
  &.feedback-miss {
    background-color: rgba(255, 138, 128, 0.2);
    .feedback-icon { color: #FF8A80; }
    .feedback-text { color: #FF8A80; }
  }
}

.feedback-icon {
  font-size: 24rpx;
}

.feedback-text {
  font-size: 20rpx;
  font-weight: 600;
}

.quit-btn {
  padding: 16rpx 48rpx;
  
  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 26rpx;
  color: rgba(255,255,255,0.6);
}

/* 结果弹窗 */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.result-modal {
  background-color: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  width: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.3);
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

.result-detail {
  display: flex;
  flex-direction: row;
  gap: 24rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  
  &.perfect .detail-icon { color: #FFD93D; }
  &.good .detail-icon { color: #6BCB77; }
  &.ok .detail-icon { color: #4ECDC4; }
  &.miss .detail-icon { color: #FF8A80; }
}

.detail-icon {
  font-size: 32rpx;
}

.detail-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
}

.result-actions {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-btn {
  box-sizing: border-box;
  width: 100%;
}
</style>