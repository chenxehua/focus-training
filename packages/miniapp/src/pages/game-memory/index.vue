<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { useAgeAdaptiveGame, type AgeGroup } from '@/composables/useAgeAdaptiveGame'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3

interface PatternItem {
  id: number
  color: string
  shape: string
  visible: boolean
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 页面参数
const props = defineProps<{
  assessmentId?: number
  ageGroup?: AgeGroup
}>()

// 游戏模式
const gameMode = computed(() => props.assessmentId ? 'assessment' : 'training')

// 年龄适配配置
const {
  patternCount: apiPatternCount,
  showTime: apiShowTime,
  timeLimit: apiTimeLimit,
  difficultyLevel: apiDifficulty,
  loadConfig,
} = useAgeAdaptiveGame('pattern_memory', gameMode.value as any)

// 游戏状态
type GameStatus = 'idle' | 'memorizing' | 'playing' | 'finished'
const gameStatus = ref<GameStatus>('idle')
const difficulty = ref<DifficultyLevel>(1)
const elapsedSeconds = ref(0)

// 本地计时器
let gameTimer: ReturnType<typeof setInterval> | null = null

// 图案配置（训练模式使用）
const difficultyConfig: Record<DifficultyLevel, { count: number; showTime: number; label: string }> = {
  1: { count: 4, showTime: 3000, label: '简单 (4个)' },
  2: { count: 6, showTime: 2500, label: '中等 (6个)' },
  3: { count: 9, showTime: 2000, label: '困难 (9个)' },
}

// 计算当前配置
const currentPatternCount = computed(() => {
  if (gameMode.value === 'assessment') {
    return apiPatternCount.value
  } else {
    return difficultyConfig[difficulty.value].count
  }
})

const currentShowTime = computed(() => {
  if (gameMode.value === 'assessment') {
    return apiShowTime.value
  } else {
    return difficultyConfig[difficulty.value].showTime
  }
})

const currentConfig = computed(() => ({
  count: currentPatternCount.value,
  showTime: currentShowTime.value,
  label: `${currentPatternCount.value}个图案`,
}))

// 颜色列表
const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43']
const shapes = ['●', '■', '▲', '◆', '★', '♦', '♠', '♣', '♥']

// 当前图案
const patterns = ref<PatternItem[]>([])
const selectedIds = ref<number[]>([])
const correctCount = ref<number>(0)
const showCount = ref<number>(0)

let memorizeTimer: ReturnType<typeof setTimeout> | null = null

// 结果数据
const resultScore = ref<number>(0)
const resultFocusScore = ref<number>(0)
const showResult = ref<boolean>(false)

function generatePatterns(count: number): PatternItem[] {
  const result: PatternItem[] = []
  const usedIndices = new Set<number>()
  
  for (let i = 0; i < count; i++) {
    let colorIndex: number
    let shapeIndex: number
    
    do {
      colorIndex = Math.floor(Math.random() * colors.length)
      shapeIndex = Math.floor(Math.random() * shapes.length)
    } while (usedIndices.has(colorIndex * 10 + shapeIndex))
    
    usedIndices.add(colorIndex * 10 + shapeIndex)
    
    result.push({
      id: i,
      color: colors[colorIndex],
      shape: shapes[shapeIndex],
      visible: true,
    })
  }
  
  return result
}

function initGame() {
  patterns.value = generatePatterns(currentPatternCount.value)
  selectedIds.value = []
  correctCount.value = 0
  showCount.value = 0
  showResult.value = false
}

function startGame() {
  initGame()
  gameStatus.value = 'memorizing'
  elapsedSeconds.value = 0

  // 启动本地计时器
  gameTimer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)

  // 显示一段时间后隐藏
  if (memorizeTimer) clearTimeout(memorizeTimer)
  memorizeTimer = setTimeout(() => {
    patterns.value = patterns.value.map(p => ({ ...p, visible: false }))
    gameStatus.value = 'playing'
  }, currentShowTime.value)
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

function handlePatternTap(id: number) {
  if (gameStatus.value !== 'playing') return
  if (selectedIds.value.includes(id)) return

  selectedIds.value.push(id)
  showCount.value++

  const originalPattern = patterns.value.find(p => p.id === id)
  if (originalPattern) {
    correctCount.value++
    patterns.value = patterns.value.map(p =>
      p.id === id ? { ...p, visible: true } : p
    )

    if (selectedIds.value.length === currentPatternCount.value) {
      finishGame()
    }
  }
}

function calculateScore(correct: number, total: number): { score: number; focusScore: number } {
  const accuracy = (correct / total) * 100
  const baseScore = total * 20
  const score = Math.round(baseScore + accuracy * 0.5)
  const focusScore = Math.round(accuracy)

  return { score, focusScore }
}

// 页面加载
onMounted(() => {
  let targetAgeGroup: AgeGroup = '8-9'
  
  if (props.ageGroup) {
    targetAgeGroup = props.ageGroup
  } else if (userStore.currentChild?.birthDate) {
    const { inferAgeGroup } = useAgeAdaptiveGame('pattern_memory')
    targetAgeGroup = inferAgeGroup(userStore.currentChild.birthDate)
  }
  
  loadConfig(targetAgeGroup)
})

async function submitRecord(score: number, focusScore: number) {
  if (!userStore.currentChild) return
  
  try {
    const accuracy = Math.round((correctCount.value / currentPatternCount.value) * 100) / 100
    
    if (gameMode.value === 'assessment' && props.assessmentId) {
      const { submitGameResult } = await import('@/api/initialAssessment')
      await submitGameResult(props.assessmentId, 'pattern_memory', {
        score,
        accuracy,
        duration: Math.max(1, elapsedSeconds.value),
        focusScore,
        gameConfig: { 
          patternCount: currentPatternCount.value,
          showTime: currentShowTime.value,
        },
        rawData: {
          correctCount: correctCount.value,
          totalCount: currentPatternCount.value,
          elapsedSeconds: elapsedSeconds.value,
          difficultyLevel: apiDifficulty.value,
        },
      })
    } else {
      const res = await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 4,
        durationSeconds: Math.max(1, elapsedSeconds.value),
        accuracy,
        score,
        focusScore,
        difficultyLevel: difficulty.value,
        gameConfig: { patternCount: currentPatternCount.value },
        resultData: { correctCount: correctCount.value, totalCount: currentPatternCount.value },
      })
      gameStore.addTodayRecord(res.data)
    }
  } catch (error) {
    console.error('submit record error:', error)
  }
}

async function finishGame() {
  stopGameTimer()
  gameStatus.value = 'finished'

  const { score, focusScore } = calculateScore(correctCount.value, currentPatternCount.value)
  resultScore.value = score
  resultFocusScore.value = focusScore
  showResult.value = true

  await submitRecord(score, focusScore)
}

function resetGame() {
  stopGameTimer()
  if (memorizeTimer) clearTimeout(memorizeTimer)
  gameStatus.value = 'idle'
  showResult.value = false
  patterns.value = []
  selectedIds.value = []
  elapsedSeconds.value = 0
  
  if (gameMode.value === 'assessment') {
    loadConfig('8-9')
  }
}
        childId: userStore.currentChild.id,
        gameId: 4, // G004 图形记忆
        durationSeconds: Math.max(1, elapsedSeconds.value),
        accuracy: (Math.round((correctCount.value / currentPatternCount.value) * 100)) / 100,
        score,
        focusScore,
        difficultyLevel: difficulty.value,
        gameConfig: { patternCount: currentPatternCount.value },
        resultData: { correctCount: correctCount.value, totalCount: currentPatternCount.value },
      })
      gameStore.addTodayRecord(res.data)
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  stopGameTimer()
  if (memorizeTimer) clearTimeout(memorizeTimer)
  gameStatus.value = 'idle'
  showResult.value = false
  patterns.value = []
  selectedIds.value = []
  elapsedSeconds.value = 0
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

onUnmounted(() => {
  stopGameTimer()
  if (memorizeTimer) clearTimeout(memorizeTimer)
})
</script>

<template>
  <view class="page">
    <!-- 游戏选择界面 -->
    <view v-if="gameStatus === 'idle'" class="difficulty-select">
      <view class="game-intro">
        <text class="intro-icon">🎨</text>
        <text class="intro-title">图形记忆</text>
        <text class="intro-desc">
          记住图案的颜色和形状组合，训练视觉工作记忆和模式识别能力！
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
            <text class="difficulty-hint">显示 {{ config.showTime / 1000 }} 秒</text>
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

    <!-- 记忆阶段 -->
    <view v-else-if="gameStatus === 'memorizing'" class="memorize-area">
      <view class="memorize-header">
        <text class="memorize-title">👀 仔细记住这些图案</text>
        <text class="memorize-subtitle">记住颜色和形状的对应关系</text>
      </view>
      
      <view class="pattern-grid" :class="`grid-${currentPatternCount}`">
        <view
          v-for="pattern in patterns"
          :key="pattern.id"
          class="pattern-item memorize-item"
        >
          <text class="pattern-shape" :style="{ color: pattern.color }">
            {{ pattern.shape }}
          </text>
        </view>
      </view>
      
      <view class="memorize-progress">
        <text class="memorize-hint">记忆倒计时...</text>
      </view>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="gameStatus === 'playing'" class="game-area">
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">已选</text>
          <text class="status-value">{{ selectedIds.length }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">目标</text>
          <text class="status-value target">{{ currentPatternCount }}</text>
        </view>
      </view>

      <view class="pattern-grid" :class="`grid-${Math.ceil(Math.sqrt(currentPatternCount * 2))}`">
        <view
          v-for="pattern in patterns"
          :key="pattern.id"
          class="pattern-item"
          :class="{
            selected: selectedIds.includes(pattern.id),
            missed: !selectedIds.includes(pattern.id) && patterns.filter(p => p.visible && !selectedIds.includes(p.id)).length === 0
          }"
          @tap="handlePatternTap(pattern.id)"
        >
          <text 
            v-if="pattern.visible" 
            class="pattern-shape" 
            :style="{ color: pattern.color }"
          >
            {{ pattern.shape }}
          </text>
          <text v-else class="pattern-mask">?</text>
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
        <text class="result-subtitle">图形记忆训练</text>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ correctCount }}/{{ currentPatternCount }}</text>
            <text class="result-stat-label">正确数</text>
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
  background-color: #6BCB77;
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
  background-color: #6BCB77;
  border-radius: 99rpx;

  &:active { opacity: 0.85; }
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border: 2rpx solid #6BCB77;
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
  color: #6BCB77;
  font-size: 32rpx;
  font-weight: 700;
}

.start-btn {
  height: 100rpx;
  font-size: 34rpx;
}

// 记忆阶段
.memorize-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.memorize-header {
  text-align: center;
}

.memorize-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  display: block;
}

.memorize-subtitle {
  font-size: 26rpx;
  color: #666666;
  margin-top: 8rpx;
}

.memorize-progress {
  text-align: center;
}

.memorize-hint {
  font-size: 28rpx;
  color: #6BCB77;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 游戏区
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
  justify-content: center;
  gap: 80rpx;
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
  color: #6BCB77;

  &.target { color: #333333; }
}

.pattern-grid {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; }
.grid-6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.grid-9 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; }

.pattern-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  transition: all 0.2s ease;

  &.memorize-item {
    background-color: #ffffff;
    border: 2rpx solid #e8e8e8;
  }

  &.selected {
    background-color: #6BCB77;
    transform: scale(0.95);
  }

  &:active { transform: scale(0.92); }
}

.pattern-shape {
  font-size: 48rpx;
}

.pattern-mask {
  font-size: 48rpx;
  color: #cccccc;
}

.quit-btn {
  padding: 16rpx 48rpx;
  &:active { opacity: 0.7; }
}

.quit-text {
  font-size: 26rpx;
  color: #999999;
}

// 结果弹窗
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
  color: #6BCB77;
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
  color: #6BCB77;
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