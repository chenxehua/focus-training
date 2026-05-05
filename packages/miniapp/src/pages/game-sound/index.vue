<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import GameTimer from '@/components/GameTimer.vue'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type GameMode = 'sequential' | 'reverse' | 'mixed'
type GamePhase = 'start' | 'memorizing' | 'answering' | 'feedback' | 'finished'

interface Question {
  sequence: number[]
  mode: GameMode
  userAnswer: number[]
  isCorrect: boolean | null
  responseTime: number
}

const userStore = useUserStore()
const gameStore = useGameStore()
const timerRef = ref<InstanceType<typeof GameTimer> | null>(null)

// 音频上下文 - 使用 uni InnerAudioContext
let audioContext: any = null

onMounted(() => {
  if (typeof uni !== 'undefined' && !audioContext) {
    audioContext = uni.createInnerAudioContext()
    audioContext.obeyMuteSwitch = false
  }
})

// 游戏配置 - 按年龄分组
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  sequenceLength: number
  playbackSpeed: number // ms per number
  mode: GameMode
  timeLimit: number
  showVisualHint: boolean
  backgroundNoise: boolean
}> = {
  1: { label: '初级 (3位)', sequenceLength: 3, playbackSpeed: 1000, mode: 'sequential', timeLimit: 15, showVisualHint: true, backgroundNoise: false },
  2: { label: '中级 (4位)', sequenceLength: 4, playbackSpeed: 900, mode: 'sequential', timeLimit: 20, showVisualHint: true, backgroundNoise: false },
  3: { label: '进阶 (5位)', sequenceLength: 5, playbackSpeed: 800, mode: 'mixed', timeLimit: 25, showVisualHint: false, backgroundNoise: false },
  4: { label: '高级 (6位)', sequenceLength: 6, playbackSpeed: 700, mode: 'mixed', timeLimit: 30, showVisualHint: false, backgroundNoise: true },
  5: { label: '大师 (7位)', sequenceLength: 7, playbackSpeed: 600, mode: 'mixed', timeLimit: 35, showVisualHint: false, backgroundNoise: true },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏状态
const gamePhase = ref<GamePhase>('start')
const difficulty = ref<DifficultyLevel>(1)
const questions = ref<Question[]>([])
const currentQuestionIndex = ref(0)
const userInput = ref<number[]>([])
const isPlaying = ref(false)
const currentPlayIndex = ref(0)
const correctCount = ref(0)
const totalRounds = ref(5)
const elapsedSeconds = ref(0)
const questionStartTime = ref(0)
const showFeedback = ref(false)
const feedbackCorrect = ref(false)
const showAnswer = ref<number[]>([])

// 结果数据
const resultScore = ref(0)
const resultStars = ref(0)
const showResult = ref(false)

// 侦探角色动画
const detectiveState = ref<'idle' | 'listening' | 'thinking' | 'correct' | 'wrong'>('idle')

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateSequence(length: number): number[] {
  const sequence: number[] = []
  for (let i = 0; i < length; i++) {
    sequence.push(randomInt(1, 9))
  }
  return sequence
}

function generateQuestions() {
  const questionsList: Question[] = []
  const config = currentConfig.value
  
  for (let i = 0; i < totalRounds.value; i++) {
    const sequence = generateSequence(config.sequenceLength)
    const mode = config.mode === 'mixed' 
      ? (Math.random() > 0.5 ? 'sequential' : 'reverse')
      : config.mode
    
    questionsList.push({
      sequence,
      mode,
      userAnswer: [],
      isCorrect: null,
      responseTime: 0,
    })
  }
  
  return questionsList
}

function getCurrentQuestion(): Question | null {
  if (currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value]
  }
  return null
}

// 播放音效 - 使用不同音调
// 注意：uni InnerAudioContext无法生成音效，音效播放需要预置音频文件
function playDigitTone(_digit: number) {
  // 小程序不支持Web Audio API的Oscillator生成音调
  // 游戏仍可正常进行，听觉记忆训练主要依赖视觉提示
}

// 播放背景噪音 - uni InnerAudioContext不支持生成噪音
function playBackgroundNoise() {
  // 小程序不支持Web Audio API的噪音生成
}

async function playSequence() {
  const question = getCurrentQuestion()
  if (!question) return
  
  isPlaying.value = true
  detectiveState.value = 'listening'
  currentPlayIndex.value = 0
  
  // 播放背景噪音（如果启用）
  if (currentConfig.value.backgroundNoise) {
    playBackgroundNoise()
  }
  
  for (let i = 0; i < question.sequence.length; i++) {
    currentPlayIndex.value = i + 1
    playDigitTone(question.sequence[i])
    await new Promise(resolve => setTimeout(resolve, currentConfig.value.playbackSpeed))
  }
  
  currentPlayIndex.value = 0
  isPlaying.value = false
  detectiveState.value = 'thinking'
  
  // 切换到答题模式
  gamePhase.value = 'answering'
  questionStartTime.value = Date.now()
}

function startGame() {
  questions.value = generateQuestions()
  currentQuestionIndex.value = 0
  correctCount.value = 0
  elapsedSeconds.value = 0
  userInput.value = []
  showResult.value = false
  showAnswer.value = []
  
  gamePhase.value = 'memorizing'
  detectiveState.value = 'idle'
  
  startQuestion()
}

async function startQuestion() {
  const question = getCurrentQuestion()
  if (!question) return
  
  userInput.value = []
  showFeedback.value = false
  showAnswer.value = []
  gamePhase.value = 'memorizing'
  
  // 播放序列
  await playSequence()
}

function inputDigit(digit: number) {
  if (gamePhase.value !== 'answering') return
  
  const question = getCurrentQuestion()
  if (!question) return
  
  userInput.value.push(digit)
}

function deleteDigit() {
  if (userInput.value.length > 0) {
    userInput.value.pop()
  }
}

function submitAnswer() {
  if (gamePhase.value !== 'answering') return
  
  const question = getCurrentQuestion()
  if (!question) return
  
  const responseTime = Date.now() - questionStartTime.value
  question.responseTime = responseTime
  question.userAnswer = [...userInput.value]
  
  // 检查答案
  let expectedAnswer: number[]
  if (question.mode === 'reverse') {
    expectedAnswer = [...question.sequence].reverse()
  } else {
    expectedAnswer = question.sequence
  }
  
  const isCorrect = userInput.value.length === expectedAnswer.length &&
    userInput.value.every((v, i) => v === expectedAnswer[i])
  
  question.isCorrect = isCorrect
  
  if (isCorrect) {
    correctCount.value++
    detectiveState.value = 'correct'
    feedbackCorrect.value = true
  } else {
    detectiveState.value = 'wrong'
    feedbackCorrect.value = false
    showAnswer.value = expectedAnswer
  }
  
  gamePhase.value = 'feedback'
  showFeedback.value = true
  
  setTimeout(() => {
    showFeedback.value = false
    nextQuestion()
  }, 1500)
}

function nextQuestion() {
  currentQuestionIndex.value++
  
  if (currentQuestionIndex.value >= questions.value.length) {
    finishGame()
  } else {
    startQuestion()
  }
}

function onTimerTick(seconds: number) {
  elapsedSeconds.value = seconds
}

function calculateScore(): { score: number; stars: number } {
  const total = questions.value.length
  const accuracy = correctCount.value / total
  
  // 基础分：正确率 * 100
  const baseScore = accuracy * 100
  
  // 速度分：平均反应时间
  const totalResponseTime = questions.value.reduce((sum, q) => sum + q.responseTime, 0)
  const avgResponseTime = totalResponseTime / total
  const timeLimit = currentConfig.value.timeLimit * 1000
  const speedRatio = Math.max(0, 1 - avgResponseTime / timeLimit)
  const speedBonus = speedRatio * 30
  
  // 难度系数
  const difficultyFactor = difficulty.value * 0.2 + 0.5
  
  const finalScore = Math.round((baseScore + speedBonus) * difficultyFactor)
  const score = Math.max(0, Math.min(finalScore, 999))
  
  // 计算星星
  const thresholds: Record<number, number[]> = {
    1: [40, 70, 95],
    2: [50, 80, 100],
    3: [60, 85, 110],
    4: [70, 90, 120],
    5: [80, 100, 130],
  }
  
  const levelThresholds = thresholds[difficulty.value]
  let stars = 0
  if (score >= levelThresholds[2]) stars = 3
  else if (score >= levelThresholds[1]) stars = 2
  else if (score >= levelThresholds[0]) stars = 1
  
  return { score, stars }
}

async function finishGame() {
  timerRef.value?.stop()
  gamePhase.value = 'finished'
  
  const { score, stars } = calculateScore()
  resultScore.value = score
  resultStars.value = stars
  showResult.value = true
  detectiveState.value = 'idle'
  
  // 提交记录
  if (userStore.currentChild) {
    try {
      const avgResponseTime = questions.value.reduce((sum, q) => sum + q.responseTime, 0) / questions.value.length
      
      await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 6, // G006 听觉记忆
        durationSeconds: elapsedSeconds.value,
        accuracy: (Math.round((correctCount.value / questions.value.length) * 100)) / 100),
        score: resultScore.value,
        focusScore: resultScore.value,
        difficultyLevel: difficulty.value,
        gameConfig: {
          sequenceLength: currentConfig.value.sequenceLength,
          mode: currentConfig.value.mode,
          showVisualHint: currentConfig.value.showVisualHint,
          backgroundNoise: currentConfig.value.backgroundNoise,
        },
        resultData: {
          totalRounds: questions.value.length,
          correctCount: correctCount.value,
          avgResponseTime: Math.round(avgResponseTime),
          sequences: questions.value.map(q => ({
            sequence: q.sequence,
            mode: q.mode,
            userAnswer: q.userAnswer,
            isCorrect: q.isCorrect,
          })),
        },
      })
      gameStore.addTodayRecord({} as any)
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  timerRef.value?.stop()
  timerRef.value?.reset()
  gamePhase.value = 'start'
  questions.value = []
  currentQuestionIndex.value = 0
  userInput.value = []
  correctCount.value = 0
  elapsedSeconds.value = 0
  showResult.value = false
  showAnswer.value = []
  detectiveState.value = 'idle'
}

function formatInputDisplay(): string {
  return userInput.value.length > 0 
    ? userInput.value.join(' → ')
    : '_'
}

function getDetectiveEmoji(): string {
  switch (detectiveState.value) {
    case 'listening': return '🕵️'
    case 'thinking': return '🤔'
    case 'correct': return '😎'
    case 'wrong': return '😅'
    default: return '🕵️'
  }
}

function getModeLabel(mode: GameMode): string {
  switch (mode) {
    case 'sequential': return '顺序回忆'
    case 'reverse': return '逆序回忆'
    case 'mixed': return '混合模式'
  }
}

onUnmounted(() => {
  timerRef.value?.stop()
  if (audioContext) {
    audioContext.destroy()
  }
})
</script>

<template>
  <view class="page">
    <!-- 开始页面 -->
    <view v-if="gamePhase === 'start'" class="start-page">
      <view class="game-intro">
        <view class="intro-icon">🕵️</view>
        <text class="intro-title">小侦探听口令</text>
        <text class="intro-desc">
          仔细听数字口令，然后按顺序（或逆序）说出数字！
          训练听觉注意力和工作记忆。
        </text>
      </view>

      <view class="difficulty-list">
        <view class="difficulty-header">🎯 选择难度</view>
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
              {{ config.sequenceLength }}位数 | {{ getModeLabel(config.mode) }}
              {{ config.backgroundNoise ? '| 背景噪音' : '' }}
            </text>
          </view>
          <view v-if="difficulty === Number(level)" class="difficulty-check">✓</view>
        </view>
      </view>

      <view class="start-section">
        <view class="btn-primary start-btn" @tap="startGame">
          <text class="btn-text">开始挑战</text>
        </view>
      </view>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="['memorizing', 'answering', 'feedback'].includes(gamePhase)" class="game-area">
      <!-- 顶部状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">回合</text>
          <text class="status-value">{{ currentQuestionIndex + 1 }}/{{ totalRounds }}</text>
        </view>
        <GameTimer
          ref="timerRef"
          :auto-start="false"
          @tick="onTimerTick"
        />
        <view class="status-item">
          <text class="status-label">正确</text>
          <text class="status-value correct">{{ correctCount }}</text>
        </view>
      </view>

      <!-- 侦探角色区域 -->
      <view class="detective-area">
        <view class="detective-card">
          <text class="detective-emoji">{{ getDetectiveEmoji() }}</text>
          <text class="detective-label">
            {{ gamePhase === 'memorizing' ? '认真听！' : '动动脑筋！' }}
          </text>
        </view>
        
        <!-- 模式标签 -->
        <view v-if="getCurrentQuestion()" class="mode-tag">
          {{ getModeLabel(getCurrentQuestion()!.mode) }}
        </view>
      </view>

      <!-- 播放指示器（记忆阶段） -->
      <view v-if="gamePhase === 'memorizing' && isPlaying" class="play-indicator">
        <text class="play-text">🔊 播放中...</text>
        <view class="digit-dots">
          <view
            v-for="(_, i) in getCurrentQuestion()?.sequence || []"
            :key="i"
            class="digit-dot"
            :class="{ played: i < currentPlayIndex }"
          />
        </view>
      </view>

      <!-- 数字键盘（答题阶段） -->
      <view v-if="gamePhase === 'answering'" class="input-area">
        <view class="input-display">
          <text class="input-label">你的答案：</text>
          <text class="input-value">{{ formatInputDisplay() }}</text>
        </view>
        
        <view class="keypad">
          <view
            v-for="digit in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="digit"
            class="key-btn"
            @tap="inputDigit(digit)"
          >
            <text class="key-value">{{ digit }}</text>
          </view>
          <view class="key-btn key-delete" @tap="deleteDigit">
            <text class="key-value">⌫</text>
          </view>
          <view class="key-btn key-zero" @tap="inputDigit(0)">
            <text class="key-value">0</text>
          </view>
          <view class="key-btn key-submit" @tap="submitAnswer">
            <text class="key-value">✓</text>
          </view>
        </view>
      </view>

      <!-- 反馈动画 -->
      <view v-if="showFeedback" class="feedback-overlay">
        <text class="feedback-emoji">{{ feedbackCorrect ? '✅' : '❌' }}</text>
        <text class="feedback-text">
          {{ feedbackCorrect ? '回答正确！' : '正确答案是：' }}
        </text>
        <text v-if="!feedbackCorrect" class="feedback-answer">
          {{ showAnswer.join(' → ') }}
        </text>
      </view>

      <!-- 退出按钮 -->
      <view class="quit-btn" @tap="resetGame">
        <text class="quit-text">退出游戏</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">{{ resultStars === 3 ? '🎉 太棒了！' : resultStars === 2 ? '👍 不错！' : '💪 继续加油！' }}</text>
        <text class="result-subtitle">小侦探听口令 {{ currentConfig.label }}</text>

        <view class="result-stars">
          <text v-for="i in 3" :key="i" class="star-icon">
            {{ i <= resultStars ? '⭐' : '☆' }}
          </text>
        </view>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ correctCount }}/{{ totalRounds }}</text>
            <text class="result-stat-label">正确数</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ Math.round(elapsedSeconds / totalRounds) }}s</text>
            <text class="result-stat-label">平均用时</text>
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
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 32rpx;
}

/* 开始页面 */
.start-page {
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

.intro-icon {
  font-size: 100rpx;
}

.intro-title {
  font-size: 44rpx;
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
  &.selected { background-color: #fff3e0; }
  &:active { background-color: #f5f5f5; }
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
  background-color: #FF9800;
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

/* 按钮样式 */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  background-color: #FF9800;
  border-radius: 99rpx;

  &:active { opacity: 0.85; }
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border: 2rpx solid #FF9800;
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
  color: #FF9800;
  font-size: 32rpx;
  font-weight: 700;
}

.start-btn {
  height: 100rpx;
  font-size: 34rpx;
}

/* 游戏区域 */
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
  font-size: 36rpx;
  font-weight: 700;
  color: #FF9800;
  
  &.correct { color: #4CAF50; }
}

/* 侦探区域 */
.detective-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.detective-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.detective-emoji {
  font-size: 80rpx;
}

.detective-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.mode-tag {
  background-color: rgba(255, 152, 0, 0.2);
  color: #FF9800;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

/* 播放指示器 */
.play-indicator {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  width: 100%;
}

.play-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FF9800;
}

.digit-dots {
  display: flex;
  gap: 12rpx;
}

.digit-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: all 0.2s;

  &.played {
    background-color: #FF9800;
    transform: scale(1.2);
  }
}

/* 输入区域 */
.input-area {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.input-display {
  text-align: center;
  padding: 16rpx;
  background-color: #f5f5f5;
  border-radius: 16rpx;
}

.input-label {
  font-size: 24rpx;
  color: #666666;
}

.input-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #FF9800;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.key-btn {
  height: 100rpx;
  background-color: #f5f5f5;
  border: 2rpx solid #e0e0e0;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active { transform: scale(0.95); background-color: #e8e8e8; }
}

.key-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
}

.key-delete, .key-zero {
  background-color: #f8f8f8;
}

.key-submit {
  background-color: #FF9800;
  border-color: #FF9800;
  
  .key-value { color: #ffffff; }
}

/* 反馈动画 */
.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  z-index: 100;
}

.feedback-emoji {
  font-size: 100rpx;
}

.feedback-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.feedback-answer {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFD700;
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
  background-color: rgba(0, 0, 0, 0.5);
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

.result-stars {
  display: flex;
  gap: 8rpx;
}

.star-icon {
  font-size: 56rpx;
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
  color: #FF9800;
}

.result-stat-label {
  font-size: 22rpx;
  color: #999999;
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