<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'
import { useAgeAdaptiveGame, inferAgeGroup, type AgeGroup } from '@/composables/useAgeAdaptiveGame'
import { adaptAudioCountConfig, getAudioCountConfig, type AudioCountGameConfig } from '@/composables/adapters/audioCountAdapter'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type GamePhase = 'start' | 'playing' | 'answering' | 'showing_result' | 'finished'

interface QuestionOption {
  value: number
  state: 'default' | 'selected' | 'correct' | 'wrong'
}

interface Question {
  targetNumber: number
  options: number[]
  selectedAnswer: number | null
  isCorrect: boolean | null
  responseTime: number
  replayCount: number
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 获取页面参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1] as any
const options = currentPage?.options || {}

// 评估模式参数
const isAssessmentMode = ref(options.assessmentId ? true : false)
const assessmentId = ref(options.assessmentId ? parseInt(options.assessmentId) : null)
const gameResultCallback = ref(options.onResult ? JSON.parse(decodeURIComponent(options.onResult)) : null)

// 年龄适配配置
const childAgeGroup = ref<AgeGroup>('6-7')
const ageAdaptiveConfig = ref<AudioCountGameConfig | null>(null)
const isLoadingConfig = ref(false)

// 年龄适配hook
const { config: apiConfig, loading: configLoading, error: configError } = useAgeAdaptiveGame('audio_count', childAgeGroup.value)

// 监听API配置变化
watch(apiConfig, (newConfig) => {
  if (newConfig) {
    ageAdaptiveConfig.value = adaptAudioCountConfig(newConfig.parameters, childAgeGroup.value)
  }
})

// 初始化年龄组
onMounted(() => {
  // 获取当前儿童的年龄组
  if (userStore.currentChild?.birthDate) {
    childAgeGroup.value = inferAgeGroup(userStore.currentChild.birthDate)
  }
  
  // 如果是评估模式且有API配置，使用API配置
  if (isAssessmentMode.value && apiConfig.value) {
    ageAdaptiveConfig.value = adaptAudioCountConfig(apiConfig.value.parameters, childAgeGroup.value)
  }
})

// 本地计时器
let gameTimer: ReturnType<typeof setInterval> | null = null

// 游戏配置
const difficulty = ref<DifficultyLevel>(1)
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  optionCount: number
  minNumber: number
  maxNumber: number
  soundType: 'beep' | 'voice' | 'drum'
  soundInterval: number
  totalQuestions: number
  timeLimit: number
  allowReplay: boolean
  maxReplayCount: number
}> = {
  1: { label: '简单 (3选项)', optionCount: 3, minNumber: 1, maxNumber: 5, soundType: 'beep', soundInterval: 800, totalQuestions: 8, timeLimit: 15, allowReplay: true, maxReplayCount: 3 },
  2: { label: '中等 (4选项)', optionCount: 4, minNumber: 1, maxNumber: 7, soundType: 'beep', soundInterval: 700, totalQuestions: 8, timeLimit: 12, allowReplay: true, maxReplayCount: 2 },
  3: { label: '困难 (4选项)', optionCount: 4, minNumber: 1, maxNumber: 10, soundType: 'voice', soundInterval: 600, totalQuestions: 10, timeLimit: 10, allowReplay: true, maxReplayCount: 2 },
  4: { label: '专家 (5选项)', optionCount: 5, minNumber: 2, maxNumber: 15, soundType: 'voice', soundInterval: 500, totalQuestions: 10, timeLimit: 8, allowReplay: true, maxReplayCount: 1 },
  5: { label: '大师 (6选项)', optionCount: 6, minNumber: 3, maxNumber: 20, soundType: 'drum', soundInterval: 400, totalQuestions: 12, timeLimit: 6, allowReplay: false, maxReplayCount: 0 },
}

const currentConfig = computed(() => {
  // 评估模式：使用年龄适配配置
  if (isAssessmentMode.value && ageAdaptiveConfig.value) {
    return ageAdaptiveConfig.value
  }
  // 训练模式：使用难度配置
  return difficultyConfig[difficulty.value]
})

// 游戏状态
const gamePhase = ref<GamePhase>('start')
const questions = ref<Question[]>([])
const currentQuestionIndex = ref(0)
const isPlaying = ref(false)
const currentSoundIndex = ref(0)
const replayCount = ref(0)
const correctCount = ref(0)
const errorCount = ref(0)
const elapsedSeconds = ref(0)
const questionStartTime = ref(0)
const showFeedback = ref(false)
const feedbackIsCorrect = ref(false)

// 结果数据
const resultScore = ref(0)
const resultStars = ref(0)
const showResult = ref(false)

// 音频上下文 - 使用 uni-app InnerAudioContext
let audioContext: any = null

onMounted(() => {
  if (typeof uni !== 'undefined') {
    audioContext = uni.createInnerAudioContext()
    audioContext.obeyMuteSwitch = false
  }
})

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateQuestions() {
  const config = currentConfig.value
  const questionsList: Question[] = []
  
  for (let i = 0; i < config.totalQuestions; i++) {
    const targetNumber = randomInt(config.minNumber, config.maxNumber)
    const options = generateOptions(targetNumber, config.optionCount, config)
    
    questionsList.push({
      targetNumber,
      options,
      selectedAnswer: null,
      isCorrect: null,
      responseTime: 0,
      replayCount: 0,
    })
  }
  
  return questionsList
}

function generateOptions(correct: number, count: number, config: typeof difficultyConfig[DifficultyLevel]): number[] {
  const options = new Set<number>([correct])
  
  while (options.size < count) {
    const offset = randomInt(1, Math.max(2, Math.floor(correct * 0.5)))
    const wrongAnswer = Math.random() > 0.5 ? correct + offset : Math.max(config.minNumber, correct - offset)
    
    if (wrongAnswer >= config.minNumber && wrongAnswer <= config.maxNumber) {
      options.add(wrongAnswer)
    }
  }
  
  return shuffle(Array.from(options))
}

function generateOptionsLayout(optionsCount: number): string {
  if (optionsCount <= 3) return 'row3'
  if (optionsCount <= 4) return 'row4'
  if (optionsCount <= 6) return 'row6'
  return 'row6'
}

function getCurrentQuestion(): Question | null {
  if (currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value]
  }
  return null
}

async function playSound(count: number) {
  if (!audioContext) return

  const config = currentConfig.value
  currentSoundIndex.value = 0
  isPlaying.value = true

  for (let i = 0; i < count; i++) {
    currentSoundIndex.value = i + 1

    // 播放提示音
    playBeep(config.soundType)

    await new Promise(resolve => setTimeout(resolve, config.soundInterval))
  }

  currentSoundIndex.value = 0
  isPlaying.value = false
}

function playBeep(type: 'beep' | 'voice' | 'drum') {
  if (!audioContext) return

  // 使用 uni.showToast 模拟声音提示反馈（实际项目中应使用音频文件）
  // 这里使用 InnerAudioContext 播放预置音频
  const innerAudio = uni.createInnerAudioContext()
  innerAudio.obeyMuteSwitch = false

  // 根据类型选择频率（仅用于记录，实际需要音频文件）
  // 提示用户进行选择
  innerAudio.src = '' // 预留，实际项目需要音频文件
  innerAudio.play()

  setTimeout(() => {
    innerAudio.stop()
    innerAudio.destroy()
  }, 150)
}

function startGame() {
  questions.value = generateQuestions()
  currentQuestionIndex.value = 0
  correctCount.value = 0
  errorCount.value = 0
  elapsedSeconds.value = 0
  showResult.value = false
  gamePhase.value = 'playing'

  // 启动本地计时器
  gameTimer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)

  startQuestion()
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

async function startQuestion() {
  gamePhase.value = 'playing'
  isPlaying.value = false
  currentSoundIndex.value = 0
  replayCount.value = 0
  questionStartTime.value = Date.now()
  
  const question = getCurrentQuestion()
  if (question) {
    await playSound(question.targetNumber)
    gamePhase.value = 'answering'
  }
}

async function replay() {
  const config = currentConfig.value
  if (!config.allowReplay || replayCount.value >= config.maxReplayCount) return
  
  replayCount.value++
  
  const question = getCurrentQuestion()
  if (question) {
    isPlaying.value = true
    await playSound(question.targetNumber)
    isPlaying.value = false
  }
}

function selectAnswer(value: number) {
  if (gamePhase.value !== 'answering') return
  
  const question = getCurrentQuestion()
  if (!question || question.selectedAnswer !== null) return
  
  const responseTime = Date.now() - questionStartTime.value
  const isCorrect = value === question.targetNumber
  
  question.selectedAnswer = value
  question.isCorrect = isCorrect
  question.responseTime = responseTime
  question.replayCount = replayCount.value
  
  if (isCorrect) {
    correctCount.value++
    feedbackIsCorrect.value = true
  } else {
    errorCount.value++
    feedbackIsCorrect.value = false
  }
  
  // 显示反馈动画
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
    nextQuestion()
  }, 800)
}

function nextQuestion() {
  currentQuestionIndex.value++

  if (currentQuestionIndex.value >= questions.value.length) {
    finishGame()
  } else {
    startQuestion()
  }
}

function calculateScore(): { score: number; stars: number } {
  const config = currentConfig.value
  const total = questions.value.length
  const accuracy = correctCount.value / total
  
  // 基础分
  const baseScore = accuracy * 100
  
  // 速度系数（平均反应时间）
  const totalResponseTime = questions.value.reduce((sum, q) => sum + q.responseTime, 0)
  const avgResponseTime = totalResponseTime / total
  const timeRatio = Math.max(0, 1 - (avgResponseTime / (config.timeLimit * 1000)))
  const speedBonus = timeRatio * 30
  
  // 重播惩罚
  const totalReplay = questions.value.reduce((sum, q) => sum + q.replayCount, 0)
  const replayPenalty = totalReplay * 5
  
  // 难度系数
  const difficultyFactor = difficulty.value * 0.15 + 0.5
  
  const finalScore = Math.round((baseScore + speedBonus - replayPenalty) * difficultyFactor)
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
  stopGameTimer()
  gamePhase.value = 'finished'

  const { score, stars } = calculateScore()
  resultScore.value = score
  resultStars.value = stars
  showResult.value = true

  // 提交记录
  if (userStore.currentChild) {
    try {
      const totalResponseTime = questions.value.reduce((sum, q) => sum + q.responseTime, 0)
      const avgResponseTime = totalResponseTime / questions.value.length

      await submitGameRecord({
        childId: userStore.currentChild.id,
        gameId: 2, // G002 听声辨数
        durationSeconds: Math.max(1, elapsedSeconds.value),
        accuracy: (Math.round((correctCount.value / questions.value.length) * 100)) / 100,
        score: resultScore.value,
        focusScore: resultScore.value,
        difficultyLevel: difficulty.value,
        gameConfig: {
          optionCount: currentConfig.value.optionCount,
          minNumber: currentConfig.value.minNumber,
          maxNumber: currentConfig.value.maxNumber,
          soundType: currentConfig.value.soundType,
        },
        resultData: {
          totalQuestions: questions.value.length,
          correctCount: correctCount.value,
          errorCount: errorCount.value,
          avgResponseTime: Math.round(avgResponseTime),
          totalReplayCount: questions.value.reduce((sum, q) => sum + q.replayCount, 0),
        },
      })
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  stopGameTimer()
  gamePhase.value = 'start'
  questions.value = []
  currentQuestionIndex.value = 0
  correctCount.value = 0
  errorCount.value = 0
  elapsedSeconds.value = 0
  showResult.value = false
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function getButtonLabel(count: number): string {
  if (isPlaying.value) return '🔊 播放中...'
  if (gamePhase.value === 'answering') {
    if (currentConfig.value.allowReplay && replayCount.value < currentConfig.value.maxReplayCount) {
      return `🔄 重播 (${currentConfig.value.maxReplayCount - replayCount.value}次)`
    }
    return '🔊 播放'
  }
  return '🔊 播放'
}

/**
 * 处理评估完成
 */
function handleAssessmentComplete() {
  if (gameResultCallback.value) {
    // 调用回调函数返回结果
    const resultData = {
      gameCode: 'audio_count',
      score: resultScore.value,
      accuracy: correctCount.value / questions.value.length,
      duration: elapsedSeconds.value,
      difficultyLevel: isAssessmentMode.value ? apiConfig.value?.difficultyLevel || 1 : difficulty.value,
      details: {
        totalQuestions: questions.value.length,
        correctCount: correctCount.value,
        errorCount: errorCount.value,
        avgResponseTime: questions.value.reduce((sum, q) => sum + q.responseTime, 0) / questions.value.length,
      }
    }
    
    gameResultCallback.value(resultData)
  }
  
  // 返回上一页或跳转到报告页
  uni.navigateBack()
}

onUnmounted(() => {
  stopGameTimer()
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
        <text class="intro-icon">👂</text>
        <text class="intro-title">听声辨数</text>
        <text class="intro-desc">
          仔细听，数一数听到了多少声音。选择正确的数字答案。
        </text>
      </view>

      <!-- 评估模式信息 -->
      <view v-if="isAssessmentMode" class="assessment-info">
        <view class="assessment-badge">
          <text class="assessment-badge-text">评估模式</text>
        </view>
        <text class="assessment-desc">难度已根据年龄自动调整</text>
      </view>

      <!-- 训练模式难度选择 -->
      <view v-else class="difficulty-list">
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
              {{ config.optionCount }}选项 | 范围{{ config.minNumber }}-{{ config.maxNumber }}
              {{ config.allowReplay ? '| 可重播' : '' }}
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

    <!-- 游戏进行中 -->
    <view v-else-if="gamePhase === 'playing' || gamePhase === 'answering'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">题目</text>
          <text class="status-value">{{ currentQuestionIndex + 1 }}/{{ questions.length }}</text>
        </view>
        <view class="timer-display">
          <text class="timer-text">{{ String(Math.floor(elapsedSeconds / 60)).padStart(2, '0') }}:{{ String(elapsedSeconds % 60).padStart(2, '0') }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">正确</text>
          <text class="status-value correct">{{ correctCount }}</text>
        </view>
      </view>

      <!-- 游戏区域 -->
      <view class="game-content">
        <!-- 播放按钮 -->
        <view class="play-section">
          <view class="sound-display">
            <text class="sound-icon" :class="{ playing: isPlaying }">
              {{ isPlaying ? '🔊' : '👂' }}
            </text>
            <view v-if="isPlaying" class="sound-dots">
              <view
                v-for="i in questions[currentQuestionIndex]?.targetNumber || 0"
                :key="i"
                class="sound-dot"
                :class="{ active: i <= currentSoundIndex }"
              />
            </view>
          </view>
          
          <view
            v-if="gamePhase === 'answering' && currentConfig.allowReplay && replayCount < currentConfig.maxReplayCount"
            class="replay-btn"
            @tap="replay"
          >
            <text class="replay-text">{{ getButtonLabel(currentSoundIndex) }}</text>
          </view>
          
          <view v-else class="play-btn" @tap="startQuestion">
            <text class="play-text">{{ isPlaying ? '🔊 播放中...' : '🔊 播放' }}</text>
          </view>
        </view>

        <!-- 选项区域 -->
        <view class="options-section">
          <text class="options-label">选择正确答案</text>
          <view class="options-grid" :class="generateOptionsLayout(currentConfig.optionCount)">
            <view
              v-for="option in questions[currentQuestionIndex]?.options || []"
              :key="option"
              class="option-btn"
              :class="{
                selected: questions[currentQuestionIndex]?.selectedAnswer === option,
                correct: questions[currentQuestionIndex]?.selectedAnswer === option && questions[currentQuestionIndex]?.isCorrect,
                wrong: questions[currentQuestionIndex]?.selectedAnswer === option && !questions[currentQuestionIndex]?.isCorrect,
              }"
              @tap="selectAnswer(option)"
            >
              <text class="option-value">{{ option }}</text>
            </view>
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
        <text class="result-subtitle">听声辨数 {{ currentConfig.label }}</text>

        <view class="result-stars">
          <StarRating :score="resultStars * 33" :size="64" />
        </view>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ correctCount }}/{{ questions.length }}</text>
            <text class="result-stat-label">正确数</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ formatTime(elapsedSeconds) }}</text>
            <text class="result-stat-label">用时</text>
          </view>
        </view>

        <view class="result-actions">
          <view v-if="isAssessmentMode" class="btn-primary result-btn" @tap="handleAssessmentComplete">
            <text class="btn-text">完成评估</text>
          </view>
          <view v-else class="btn-primary result-btn" @tap="startGame">
            <text class="btn-text">再来一局</text>
          </view>
          <view class="btn-outline result-btn" @tap="resetGame">
            <text class="btn-text-outline">{{ isAssessmentMode ? '查看报告' : '换难度' }}</text>
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

/* 评估模式信息 */
.assessment-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.assessment-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
}

.assessment-badge-text {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
}

.assessment-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
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
  font-size: 36rpx;
  font-weight: 700;
  color: #6C63FF;

  &.correct { color: #6BCB77; }
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

.game-content {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.play-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.sound-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.sound-icon {
  font-size: 100rpx;
  
  &.playing {
    animation: pulse 0.5s ease infinite;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.sound-dots {
  display: flex;
  gap: 12rpx;
}

.sound-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: all 0.2s;
  
  &.active {
    background-color: #6C63FF;
    transform: scale(1.2);
  }
}

.replay-btn, .play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 48rpx;
  border-radius: 99rpx;
  background-color: #f0eeff;
  
  &:active { opacity: 0.85; }
}

.replay-text, .play-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #6C63FF;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.options-label {
  font-size: 26rpx;
  color: #666666;
  text-align: center;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16rpx;
  
  &.row3 .option-btn { width: 180rpx; }
  &.row4 .option-btn { width: 140rpx; }
  &.row6 .option-btn { width: 120rpx; }
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  background-color: #f5f5f5;
  border: 2rpx solid #e8e8e8;
  border-radius: 20rpx;
  transition: all 0.2s;
  
  &:active { transform: scale(0.95); }
  
  &.selected {
    background-color: #6C63FF;
    border-color: #6C63FF;
    
    .option-value { color: #ffffff; }
  }
  
  &.correct {
    background-color: #6BCB77;
    border-color: #6BCB77;
    animation: bounce 0.3s ease;
    
    .option-value { color: #ffffff; }
  }
  
  &.wrong {
    background-color: #FF8A80;
    border-color: #FF8A80;
    animation: shake 0.3s ease;
    
    .option-value { color: #ffffff; }
  }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8rpx); }
  75% { transform: translateX(8rpx); }
}

.option-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
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