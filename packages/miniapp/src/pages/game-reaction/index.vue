<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3

interface ReactionResult {
  expected: number
  actual: number
  correct: boolean
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 游戏状态
type GameStatus = 'idle' | 'waiting' | 'ready' | '反应中' | 'finished'
const gameStatus = ref<GameStatus>('idle')
const difficulty = ref<DifficultyLevel>(1)

// 难度配置
const difficultyConfig: Record<DifficultyLevel, { rounds: number; maxTime: number; label: string }> = {
  1: { rounds: 5, maxTime: 2000, label: '简单 (5轮)' },
  2: { rounds: 8, maxTime: 1500, label: '中等 (8轮)' },
  3: { rounds: 12, maxTime: 1000, label: '困难 (12轮)' },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏变量
const currentRound = ref<number>(0)
const results = ref<ReactionResult[]>([])
const totalCorrect = ref<number>(0)
const avgReactionTime = ref<number>(0)

// 计时器
const startTime = ref<number>(0)
const waitTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const goTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 结果数据
const resultScore = ref<number>(0)
const resultFocusScore = ref<number>(0)
const showResult = ref<boolean>(false)

// 信号显示
const showGoSignal = ref<boolean>(false)

function resetTimers() {
  if (waitTimer) clearTimeout(waitTimer)
  if (goTimer) clearTimeout(setTimeout(() => {}))
  showGoSignal.value = false
}

function initGame() {
  currentRound.value = 0
  results.value = []
  totalCorrect.value = 0
  avgReactionTime.value = 0
  showResult.value = false
  resetTimers()
}

function startGame() {
  initGame()
  nextRound()
}

function nextRound() {
  if (currentRound.value >= currentConfig.value.rounds) {
    finishGame()
    return
  }
  
  currentRound.value++
  gameStatus.value = 'waiting'
  showGoSignal.value = false
  
  // 随机等待时间
  const waitTime = 1000 + Math.random() * 2000
  
  waitTimer.value = setTimeout(() => {
    gameStatus.value = 'ready'
    showGoSignal.value = true
    startTime.value = Date.now()
    
    // 超时检测
    goTimer.value = setTimeout(() => {
      if (showGoSignal.value) {
        // 超时未反应，记录为错误
        results.value.push({
          expected: currentConfig.value.maxTime,
          actual: currentConfig.value.maxTime,
          correct: false,
        })
        showGoSignal.value = false
        gameStatus.value = '反应中'
        
        setTimeout(() => {
          nextRound()
        }, 500)
      }
    }, currentConfig.value.maxTime)
  }, waitTime)
}

function handleTap() {
  if (gameStatus.value !== 'ready' || !showGoSignal.value) return
  
  const reactionTime = Date.now() - startTime.value
  showGoSignal.value = false
  
  if (goTimer.value) clearTimeout(goTimer.value)
  
  const isCorrect = reactionTime <= currentConfig.value.maxTime
  
  results.value.push({
    expected: currentConfig.value.maxTime,
    actual: reactionTime,
    correct: isCorrect,
  })
  
  if (isCorrect) {
    totalCorrect.value++
  }
  
  gameStatus.value = '反应中'
  
  setTimeout(() => {
    nextRound()
  }, 300)
}

function finishGame() {
  gameStatus.value = 'finished'
  
  // 计算平均反应时间
  const correctResults = results.value.filter(r => r.correct)
  if (correctResults.length > 0) {
    avgReactionTime.value = Math.round(
      correctResults.reduce((sum, r) => sum + r.actual, 0) / correctResults.length
    )
  }
  
  const { score, focusScore } = calculateScore()
  resultScore.value = score
  resultFocusScore.value = focusScore
  showResult.value = true
  
  if (userStore.currentChild) {
    submitRecord()
  }
}

function calculateScore(): { score: number; focusScore: number } {
  const accuracy = (totalCorrect.value / currentConfig.value.rounds) * 100
  
  // 速度得分：平均反应时间越快得分越高
  const avgTime = avgReactionTime.value || currentConfig.value.maxTime
  const speedScore = Math.max(0, 100 - (avgTime / 20))
  
  const score = Math.round(totalCorrect.value * 15 + speedScore * 5)
  const focusScore = Math.round(accuracy * 0.7 + speedScore * 0.3)
  
  return { score, focusScore }
}

async function submitRecord() {
  if (!userStore.currentChild) return
  
  try {
    const res = await submitGameRecord({
      childId: userStore.currentChild.id,
      gameId: 5, // G005 反应速度
      durationSeconds: Math.round(currentConfig.value.rounds * 2),
      accuracy: (Math.round((totalCorrect.value / currentConfig.value.rounds) * 100)) / 100,
      score: resultScore.value,
      focusScore: resultFocusScore.value,
      difficultyLevel: difficulty.value,
      gameConfig: { rounds: currentConfig.value.rounds, maxTime: currentConfig.value.maxTime },
      resultData: {
        correctCount: totalCorrect.value,
        totalRounds: currentConfig.value.rounds,
        avgReactionTime: avgReactionTime.value,
        reactionTimes: results.value.map(r => r.actual),
      },
    })
    gameStore.addTodayRecord(res.data)
  } catch (error) {
    console.error('submit record error:', error)
  }
}

function resetGame() {
  resetTimers()
  gameStatus.value = 'idle'
  showResult.value = false
  showGoSignal.value = false
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(3) + '秒'
}

onUnmounted(() => {
  resetTimers()
})
</script>

<template>
  <view class="page">
    <!-- 游戏选择界面 -->
    <view v-if="gameStatus === 'idle'" class="difficulty-select">
      <view class="game-intro">
        <text class="intro-icon">⚡</text>
        <text class="intro-title">反应速度</text>
        <text class="intro-desc">
          当看到绿色信号时快速点击，训练神经反应速度和警觉性！
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
            <text class="difficulty-hint">反应时限 {{ config.maxTime }}ms</text>
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
    <view v-else-if="gameStatus !== 'finished'" class="game-area">
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">第</text>
          <text class="status-value">{{ currentRound }}</text>
          <text class="status-label">轮</text>
        </view>
        <view class="status-item">
          <text class="status-label">正确</text>
          <text class="status-value correct">{{ totalCorrect }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">目标</text>
          <text class="status-value">{{ currentConfig.rounds }}</text>
        </view>
      </view>

      <!-- 反应区域 -->
      <view 
        class="reaction-area"
        :class="{
          waiting: gameStatus === 'waiting',
          ready: gameStatus === 'ready',
          tapped: gameStatus === '反应中'
        }"
        @tap="handleTap"
      >
        <text v-if="gameStatus === 'waiting'" class="reaction-text">等待信号...</text>
        <text v-else-if="gameStatus === 'ready' && showGoSignal" class="reaction-text go">⚡ 点击！</text>
        <text v-else-if="gameStatus === '反应中'" class="reaction-text tapped">
          {{ results[results.length - 1]?.correct ? '✅' : '❌' }}
        </text>
      </view>

      <view class="tips">
        <text v-if="gameStatus === 'waiting'" class="tip-text">⚠️ 看到绿色信号再点</text>
        <text v-else-if="gameStatus === 'ready'" class="tip-text go-tip">⚡ 快速点击！</text>
      </view>

      <view class="quit-btn" @tap="resetGame">
        <text class="quit-text">退出游戏</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">🎉 完成！</text>
        <text class="result-subtitle">反应速度训练</text>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ totalCorrect }}/{{ currentConfig.rounds }}</text>
            <text class="result-stat-label">正确次数</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ avgReactionTime ? formatTime(avgReactionTime) : '-' }}</text>
            <text class="result-stat-label">平均反应</text>
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
  background-color: #f5f5f5;
  padding: 32rpx;
}

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
  background-color: #FFD93D;
  border-radius: 99rpx;

  &:active { opacity: 0.85; }
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border: 2rpx solid #FFD93D;
  border-radius: 99rpx;
  background-color: transparent;

  &:active { opacity: 0.85; }
}

.btn-text {
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-text-outline {
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.start-btn {
  height: 100rpx;
  font-size: 34rpx;
}

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
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 20rpx 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.status-item {
  display: flex;
  flex-direction: row;
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
  color: #333333;
  
  &.correct { color: #6BCB77; }
}

.reaction-area {
  width: 500rpx;
  height: 500rpx;
  border-radius: 50%;
  background-color: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);

  &.waiting {
    background-color: #E8E8E8;
  }

  &.ready {
    background-color: #6BCB77;
    box-shadow: 0 0 60rpx rgba(107, 203, 119, 0.6);
    transform: scale(1.05);
  }

  &:active { transform: scale(0.98); }
}

.reaction-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #999999;

  &.go {
    font-size: 48rpx;
    color: #ffffff;
  }

  &.tapped {
    font-size: 80rpx;
  }
}

.tips {
  text-align: center;
}

.tip-text {
  font-size: 28rpx;
  color: #999999;

  &.go-tip {
    color: #6BCB77;
    font-weight: 600;
  }
}

.quit-btn {
  padding: 16rpx 48rpx;
  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 26rpx;
  color: #999999;
}

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
  width: 85%;
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
  font-size: 32rpx;
  font-weight: 700;
  color: #FFD93D;
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
  color: #FFD93D;
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