<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import GameTimer from '@/components/GameTimer.vue'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3

interface Cell {
  value: number
  state: 'idle' | 'correct' | 'error'
}

const userStore = useUserStore()
const gameStore = useGameStore()

const timerRef = ref<InstanceType<typeof GameTimer> | null>(null)

// 游戏状态
type GameStatus = 'idle' | 'playing' | 'finished'
const gameStatus = ref<GameStatus>('idle')
const difficulty = ref<DifficultyLevel>(1)
const cells = ref<Cell[]>([])
const nextTarget = ref<number>(1)
const errorCount = ref<number>(0)
const startTime = ref<number>(0)
const elapsedSeconds = ref<number>(0)

// 难度配置
const difficultyConfig: Record<DifficultyLevel, { size: number; label: string; timeLimit: number }> = {
  1: { size: 3, label: '简单 (3×3)', timeLimit: 60 },
  2: { size: 4, label: '中等 (4×4)', timeLimit: 120 },
  3: { size: 5, label: '困难 (5×5)', timeLimit: 180 },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])
const gridSize = computed(() => currentConfig.value.size)
const totalCells = computed(() => gridSize.value * gridSize.value)

// 计算布局
const cellSizePx = computed(() => {
  // 屏幕宽度 750rpx - 两侧 padding 64rpx - 间距
  const totalGap = (gridSize.value - 1) * 12 // 12rpx gap
  const availableWidth = 750 - 64 - totalGap
  return Math.floor(availableWidth / gridSize.value)
})

// 结果数据
const resultScore = ref<number>(0)
const resultFocusScore = ref<number>(0)
const showResult = ref<boolean>(false)

// 错误闪烁
let errorTimer: ReturnType<typeof setTimeout> | null = null

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function initGame() {
  const numbers = Array.from({ length: totalCells.value }, (_, i) => i + 1)
  cells.value = shuffle(numbers).map(value => ({ value, state: 'idle' }))
  nextTarget.value = 1
  errorCount.value = 0
  elapsedSeconds.value = 0
  showResult.value = false
}

function startGame() {
  initGame()
  gameStatus.value = 'playing'
  startTime.value = Date.now()
  timerRef.value?.reset()
  timerRef.value?.start()
}

function handleCellTap(index: number) {
  if (gameStatus.value !== 'playing') return
  const cell = cells.value[index]
  if (cell.state !== 'idle') return

  if (cell.value === nextTarget.value) {
    // 正确
    cells.value[index] = { ...cell, state: 'correct' }
    nextTarget.value += 1

    if (nextTarget.value > totalCells.value) {
      // 全部完成
      finishGame()
    }
  } else {
    // 错误 - 红色闪烁
    errorCount.value += 1
    cells.value[index] = { ...cell, state: 'error' }

    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = setTimeout(() => {
      if (cells.value[index].state === 'error') {
        cells.value[index] = { ...cells.value[index], state: 'idle' }
      }
    }, 600)
  }
}

function onTimerTick(seconds: number) {
  elapsedSeconds.value = seconds
}

function calculateScore(elapsed: number, errors: number, total: number): { score: number; focusScore: number } {
  const timeLimit = currentConfig.value.timeLimit
  const baseScore = total * 10
  const timeBonus = Math.max(0, ((timeLimit - elapsed) / timeLimit) * 50)
  const errorPenalty = errors * 5
  const score = Math.max(0, Math.round(baseScore + timeBonus - errorPenalty))

  // 专注分 0-100：正确率 60% + 时间效率 40%
  const accuracy = ((total - errors) / total) * 100
  const timeEfficiency = Math.max(0, ((timeLimit - elapsed) / timeLimit) * 100)
  const focusScore = Math.round(accuracy * 0.6 + timeEfficiency * 0.4)

  return { score, focusScore }
}

async function finishGame() {
  timerRef.value?.stop()
  const elapsed = timerRef.value?.getElapsed() ?? elapsedSeconds.value
  elapsedSeconds.value = elapsed
  gameStatus.value = 'finished'

  const { score, focusScore } = calculateScore(elapsed, errorCount.value, totalCells.value)
  resultScore.value = score
  resultFocusScore.value = focusScore
  showResult.value = true

  // 提交记录
  if (userStore.currentChild) {
    try {
      const res = await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 1, // G001 舒尔特方格
        durationSeconds: elapsed,
        accuracy: Math.round(((totalCells.value - errorCount.value) / totalCells.value) * 100),
        score,
        focusScore,
        difficultyLevel: difficulty.value,
        gameConfig: { gridSize: gridSize.value },
        resultData: {
          errorCount: errorCount.value,
          totalCells: totalCells.value,
          elapsedSeconds: elapsed,
        },
      })
      gameStore.addTodayRecord(res.data)
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  timerRef.value?.stop()
  timerRef.value?.reset()
  gameStatus.value = 'idle'
  showResult.value = false
  cells.value = []
  nextTarget.value = 1
  errorCount.value = 0
  elapsedSeconds.value = 0
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

onUnmounted(() => {
  timerRef.value?.stop()
  if (errorTimer) clearTimeout(errorTimer)
})
</script>

<template>
  <view class="page">
    <!-- 游戏选择界面 -->
    <view v-if="gameStatus === 'idle'" class="difficulty-select">
      <view class="game-intro">
        <text class="intro-icon">🔢</text>
        <text class="intro-title">舒尔特方格</text>
        <text class="intro-desc">
          用最短的时间，按顺序点击方格中 1 到 N² 的所有数字。训练视觉注意力和眼动速度！
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
            <text class="difficulty-hint">时限 {{ config.timeLimit }} 秒</text>
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

    <!-- 游戏进行中 -->
    <view v-else-if="gameStatus === 'playing'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">目标</text>
          <text class="status-value target">{{ nextTarget }}</text>
        </view>
        <GameTimer
          ref="timerRef"
          :auto-start="false"
          @tick="onTimerTick"
        />
        <view class="status-item">
          <text class="status-label">错误</text>
          <text class="status-value error-count" :class="{ warn: errorCount > 0 }">{{ errorCount }}</text>
        </view>
      </view>

      <!-- 方格 -->
      <view class="grid-container">
        <view
          class="grid"
          :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }"
        >
          <view
            v-for="(cell, index) in cells"
            :key="index"
            class="cell"
            :class="[`cell-${cell.state}`]"
            :style="{ width: `${cellSizePx}rpx`, height: `${cellSizePx}rpx` }"
            @tap="handleCellTap(index)"
          >
            <text class="cell-number" :class="{ 'cell-number-small': gridSize >= 5 }">
              {{ cell.value }}
            </text>
          </view>
        </view>
      </view>

      <!-- 进度提示 -->
      <view class="progress-hint">
        <text class="progress-text">已完成 {{ nextTarget - 1 }} / {{ totalCells }}</text>
      </view>

      <view class="quit-btn" @tap="resetGame">
        <text class="quit-text">退出游戏</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">🎉 太棒了！</text>
        <text class="result-subtitle">{{ gridSize }}×{{ gridSize }} 方格完成</text>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ formatTime(elapsedSeconds) }}</text>
            <text class="result-stat-label">用时</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ errorCount }}</text>
            <text class="result-stat-label">错误次数</text>
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
  background-color: #f5f5f5;
  padding: 32rpx;
}

/* 难度选择 */
.difficulty-select {
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

/* 游戏区 */
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
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 20rpx 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
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
  font-size: 48rpx;
  font-weight: 700;
  color: #6C63FF;

  &.target { color: #6C63FF; }
  &.error-count { color: #333333; }
  &.warn { color: #FF8A80; }
}

.grid-container {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.grid {
  display: grid;
  gap: 12rpx;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  border: 2rpx solid #e8e8e8;
  transition: all 0.15s ease;

  &:active { transform: scale(0.94); }

  &.cell-correct {
    background-color: #6BCB77;
    border-color: #6BCB77;

    .cell-number { color: #ffffff; }
  }

  &.cell-error {
    background-color: #FF8A80;
    border-color: #FF8A80;
    animation: shake 0.3s ease;

    .cell-number { color: #ffffff; }
  }
}

.cell-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;

  &.cell-number-small { font-size: 32rpx; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6rpx); }
  75% { transform: translateX(6rpx); }
}

.progress-hint {
  text-align: center;
}

.progress-text {
  font-size: 26rpx;
  color: #999999;
}

.quit-btn {
  padding: 16rpx 48rpx;

  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 26rpx;
  color: #999999;
}

/* 结果弹窗 */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
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
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.2);
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
