<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type GamePhase = 'start' | 'ready' | 'playing' | 'finished'

// 物品分类
interface SortableItem {
  id: number
  name: string
  emoji: string
  category: 'fruit' | 'animal' | 'toy' | 'food'
  x: number
  y: number
  velocityY: number
  selected: boolean
  state: 'falling' | 'selected' | 'correct' | 'wrong'
}

interface CategoryBasket {
  category: 'fruit' | 'animal' | 'toy' | 'food'
  label: string
  emoji: string
  x: number
  y: number
  width: number
  height: number
}

// 类别物品映射
const CATEGORY_ITEMS: Record<string, { name: string; emoji: string }[]> = {
  fruit: [
    { name: '苹果', emoji: '🍎' },
    { name: '香蕉', emoji: '🍌' },
    { name: '橙子', emoji: '🍊' },
    { name: '葡萄', emoji: '🍇' },
    { name: '草莓', emoji: '🍓' },
    { name: '西瓜', emoji: '🍉' },
  ],
  animal: [
    { name: '猫', emoji: '🐱' },
    { name: '狗', emoji: '🐶' },
    { name: '鸟', emoji: '🐦' },
    { name: '鱼', emoji: '🐟' },
    { name: '兔子', emoji: '🐰' },
    { name: '熊', emoji: '🐻' },
  ],
  toy: [
    { name: '汽车', emoji: '🚗' },
    { name: '飞机', emoji: '✈️' },
    { name: '娃娃', emoji: '🧸' },
    { name: '积木', emoji: '🧱' },
    { name: '皮球', emoji: '⚽' },
    { name: '风筝', emoji: '🪁' },
  ],
  food: [
    { name: '面包', emoji: '🍞' },
    { name: '蛋糕', emoji: '🎂' },
    { name: '冰淇淋', emoji: '🍦' },
    { name: '汉堡', emoji: '🍔' },
    { name: '披萨', emoji: '🍕' },
    { name: '饮料', emoji: '🥤' },
  ],
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 难度配置
const difficulty = ref<DifficultyLevel>(1)
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  categories: string[]
  basketCount: number
  itemCount: number
  fallSpeed: number
  timeLimit: number
}> = {
  1: { label: '简单 (2类)', categories: ['fruit', 'animal'], basketCount: 2, itemCount: 10, fallSpeed: 1, timeLimit: 60 },
  2: { label: '中等 (3类)', categories: ['fruit', 'animal', 'toy'], basketCount: 3, itemCount: 12, fallSpeed: 1.2, timeLimit: 60 },
  3: { label: '困难 (3类)', categories: ['fruit', 'animal', 'toy'], basketCount: 3, itemCount: 15, fallSpeed: 1.5, timeLimit: 60 },
  4: { label: '专家 (4类)', categories: ['fruit', 'animal', 'toy', 'food'], basketCount: 4, itemCount: 16, fallSpeed: 1.8, timeLimit: 60 },
  5: { label: '大师 (4类)', categories: ['fruit', 'animal', 'toy', 'food'], basketCount: 4, itemCount: 20, fallSpeed: 2, timeLimit: 60 },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏状态
const gamePhase = ref<GamePhase>('start')
const items = ref<SortableItem[]>([])
const selectedItem = ref<SortableItem | null>(null)
const baskets = ref<CategoryBasket[]>([])
const correctCount = ref(0)
const errorCount = ref(0)
const totalItems = ref(0)
const elapsedSeconds = ref(0)
const showResult = ref(false)
const resultScore = ref(0)
const resultStars = ref(0)

// 游戏区域尺寸
const GAME_WIDTH = 686 // rpx
const GAME_HEIGHT = 800 // rpx
const BASKET_WIDTH = 150 // rpx
const BASKET_HEIGHT = 120 // rpx
const ITEM_SIZE = 80 // rpx

// 定时器
let gameTimer: ReturnType<typeof setInterval> | null = null
let dropTimer: ReturnType<typeof setInterval> | null = null

function initBaskets() {
  const config = currentConfig.value
  const basketList: CategoryBasket[] = []
  const spacing = GAME_WIDTH / (config.basketCount + 1)
  
  config.categories.forEach((category, index) => {
    basketList.push({
      category: category as CategoryBasket['category'],
      label: getCategoryLabel(category),
      emoji: getCategoryEmoji(category),
      x: spacing * (index + 1) - BASKET_WIDTH / 2,
      y: GAME_HEIGHT - BASKET_HEIGHT - 20,
      width: BASKET_WIDTH,
      height: BASKET_HEIGHT,
    })
  })
  
  baskets.value = basketList
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    fruit: '水果',
    animal: '动物',
    toy: '玩具',
    food: '食物',
  }
  return labels[category] || category
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    fruit: '🍎',
    animal: '🐾',
    toy: '🧸',
    food: '🍽️',
  }
  return emojis[category] || '📦'
}

function createItem(): SortableItem | null {
  const config = currentConfig.value
  const category = config.categories[Math.floor(Math.random() * config.categories.length)]
  const itemsList = CATEGORY_ITEMS[category]
  const itemData = itemsList[Math.floor(Math.random() * itemsList.length)]
  
  // 检查是否还有未生成的物品
  const remainingItems = getRemainingItemsCount()
  if (remainingItems <= 0) return null
  
  return {
    id: Date.now() + Math.random(),
    name: itemData.name,
    emoji: itemData.emoji,
    category: category as SortableItem['category'],
    x: Math.random() * (GAME_WIDTH - ITEM_SIZE),
    y: -ITEM_SIZE,
    velocityY: 0,
    selected: false,
    state: 'falling',
  }
}

function getRemainingItemsCount(): number {
  const correct = correctCount.value
  const maxPerCategory = Math.ceil(currentConfig.value.itemCount / currentConfig.value.categories.length)
  return currentConfig.value.itemCount - correct
}

function startGame() {
  // 初始化
  initBaskets()
  items.value = []
  selectedItem.value = null
  correctCount.value = 0
  errorCount.value = 0
  totalItems.value = currentConfig.value.itemCount
  elapsedSeconds.value = 0
  showResult.value = false
  
  gamePhase.value = 'ready'
  
  // 准备阶段显示提示
  setTimeout(() => {
    gamePhase.value = 'playing'
    startTimers()
  }, 1500)
}

function startTimers() {
  // 游戏计时器
  gameTimer = setInterval(() => {
    elapsedSeconds.value++
    if (elapsedSeconds.value >= currentConfig.value.timeLimit) {
      finishGame()
    }
  }, 1000)
  
  // 物品掉落定时器
  const dropInterval = 1500 / currentConfig.value.fallSpeed
  dropTimer = setInterval(() => {
    if (items.value.filter(i => i.state === 'falling').length < 3) {
      const newItem = createItem()
      if (newItem) {
        items.value.push(newItem)
      }
    }
  }, dropInterval)
}

function updateItems() {
  if (gamePhase.value !== 'playing') return
  
  const config = currentConfig.value
  const gravity = 0.3 * config.fallSpeed
  const maxVelocity = 8 * config.fallSpeed
  
  items.value.forEach(item => {
    if (item.state !== 'falling') return
    
    // 施加重力
    item.velocityY = Math.min(item.velocityY + gravity, maxVelocity)
    item.y += item.velocityY
    
    // 边界检测
    if (item.y > GAME_HEIGHT - ITEM_SIZE) {
      item.y = GAME_HEIGHT - ITEM_SIZE
      item.velocityY = 0
    }
  })
  
  // 更新动画
  requestAnimationFrame(updateItems)
}

function handleItemClick(item: SortableItem) {
  if (gamePhase.value !== 'playing' || item.state !== 'falling') return
  if (selectedItem.value) return
  
  // 选中物品
  items.value.forEach(i => {
    if (i.id === item.id) {
      i.selected = true
      i.state = 'selected'
    }
  })
  selectedItem.value = item
}

function handleBasketClick(basket: CategoryBasket) {
  if (gamePhase.value !== 'playing' || !selectedItem.value) return
  
  const item = selectedItem.value
  const isCorrect = item.category === basket.category
  
  if (isCorrect) {
    correctCount.value++
    item.state = 'correct'
  } else {
    errorCount.value++
    item.state = 'wrong'
  }
  
  // 移除物品
  setTimeout(() => {
    items.value = items.value.filter(i => i.id !== item.id)
  }, 300)
  
  selectedItem.value = null
  
  // 检查是否完成
  if (correctCount.value >= totalItems.value) {
    finishGame()
  }
}

function handleDropZoneClick() {
  // 点击空白区域取消选择
  if (selectedItem.value) {
    items.value.forEach(i => {
      if (i.id === selectedItem.value!.id) {
        i.selected = false
        i.state = 'falling'
      }
    })
    selectedItem.value = null
  }
}

function calculateScore(): { score: number; stars: number } {
  const config = currentConfig.value
  const total = totalItems.value
  const accuracy = correctCount.value / total
  
  // 基础分
  const baseScore = accuracy * 100
  
  // 时间奖励
  const remainingTime = config.timeLimit - elapsedSeconds.value
  const timeBonus = (remainingTime / config.timeLimit) * 20
  
  // 错误惩罚
  const errorPenalty = errorCount.value * 5
  
  // 难度系数
  const difficultyFactor = difficulty.value * 0.15 + 0.5
  
  const finalScore = Math.round((baseScore + timeBonus - errorPenalty) * difficultyFactor)
  const score = Math.max(0, Math.min(finalScore, 999))
  
  // 计算星星
  let stars = 0
  if (accuracy >= 0.95 && errorCount.value <= 1) stars = 3
  else if (accuracy >= 0.85) stars = 2
  else if (accuracy >= 0.7) stars = 1
  
  return { score, stars }
}

async function finishGame() {
  if (gameTimer) clearInterval(gameTimer)
  if (dropTimer) clearInterval(dropTimer)
  
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
        gameId: 8, // G008 快速分类
        durationSeconds: elapsedSeconds.value,
        accuracy: Math.round((correctCount.value / totalItems.value) * 100),
        score: resultScore.value,
        focusScore: resultScore.value,
        difficultyLevel: difficulty.value,
        gameConfig: {
          categories: currentConfig.value.categories,
          basketCount: currentConfig.value.basketCount,
          fallSpeed: currentConfig.value.fallSpeed,
        },
        resultData: {
          totalItems: totalItems.value,
          correctCount: correctCount.value,
          errorCount: errorCount.value,
        },
      })
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  if (gameTimer) clearInterval(gameTimer)
  if (dropTimer) clearInterval(dropTimer)
  
  gamePhase.value = 'start'
  items.value = []
  selectedItem.value = null
  showResult.value = false
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

// 启动动画循环
let animationFrame: number | null = null
function startAnimation() {
  function loop() {
    updateItems()
    animationFrame = requestAnimationFrame(loop)
  }
  loop()
}

// 启动
startAnimation()

onUnmounted(() => {
  resetGame()
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <view class="page">
    <!-- 开始页面 -->
    <view v-if="gamePhase === 'start'" class="start-page">
      <view class="game-intro">
        <text class="intro-icon">📦</text>
        <text class="intro-title">快速分类</text>
        <text class="intro-desc">
          将掉落的物品快速分类到正确的箱子里。训练分类能力和反应速度！
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
              {{ config.itemCount }}个物品 | {{ config.categories.length }}个分类 | {{ config.timeLimit }}秒
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
    <view v-else-if="gamePhase === 'ready'" class="ready-page">
      <view class="ready-content">
        <text class="ready-icon">📦</text>
        <text class="ready-title">准备开始</text>
        <text class="ready-hint">请将物品分类到对应箱子</text>
      </view>
    </view>

    <!-- 游戏进行中 -->
    <view v-else-if="gamePhase === 'playing'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">剩余</text>
          <text class="status-value">{{ totalItems - correctCount }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">时间</text>
          <text class="status-value time" :class="{ warn: elapsedSeconds > 50 }">
            {{ currentConfig.timeLimit - elapsedSeconds }}s
          </text>
        </view>
        <view class="status-item">
          <text class="status-label">正确</text>
          <text class="status-value correct">{{ correctCount }}</text>
        </view>
      </view>

      <!-- 游戏区域 -->
      <view class="game-content" @tap="handleDropZoneClick">
        <!-- 分类箱子 -->
        <view class="baskets-area">
          <view
            v-for="basket in baskets"
            :key="basket.category"
            class="basket"
            :class="{ highlighted: selectedItem && selectedItem.category === basket.category }"
            :style="{
              left: `${basket.x}rpx`,
              top: `${basket.y}rpx`,
              width: `${basket.width}rpx`,
              height: `${basket.height}rpx`
            }"
            @tap.stop="handleBasketClick(basket)"
          >
            <text class="basket-emoji">{{ basket.emoji }}</text>
            <text class="basket-label">{{ basket.label }}</text>
          </view>
        </view>

        <!-- 掉落物品 -->
        <view class="items-area">
          <view
            v-for="item in items.filter(i => i.state !== 'correct' && i.state !== 'wrong')"
            :key="item.id"
            class="item"
            :class="{
              selected: item.selected,
              correct: item.state === 'correct',
              wrong: item.state === 'wrong'
            }"
            :style="{
              left: `${item.x}rpx`,
              top: `${item.y}rpx`,
              width: `${ITEM_SIZE}rpx`,
              height: `${ITEM_SIZE}rpx`
            }"
            @tap.stop="handleItemClick(item)"
          >
            <text class="item-emoji">{{ item.emoji }}</text>
          </view>
        </view>
      </view>

      <!-- 提示 -->
      <view class="hint-bar">
        <text class="hint-text">点击物品，再点击对应分类的箱子</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">{{ resultStars === 3 ? '🎉 太棒了！' : '👍 不错！' }}</text>
        <text class="result-subtitle">快速分类 {{ currentConfig.label }}</text>

        <view class="result-stars">
          <StarRating :score="resultStars * 33" :size="64" />
        </view>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ correctCount }}/{{ totalItems }}</text>
            <text class="result-stat-label">正确数</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ formatTime(elapsedSeconds) }}</text>
            <text class="result-stat-label">用时</text>
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

/* 准备页面 */
.ready-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80vh;
}

.ready-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.ready-icon {
  font-size: 120rpx;
  animation: bounce 0.5s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}

.ready-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
}

.ready-hint {
  font-size: 28rpx;
  color: #666666;
}

/* 游戏区域 */
.game-area {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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
  
  &.time.warn { color: #FF8A80; }
  &.correct { color: #6BCB77; }
}

.game-content {
  position: relative;
  width: 686rpx;
  height: 900rpx;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.baskets-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 160rpx;
}

.basket {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  background-color: rgba(255,255,255,0.9);
  border: 3rpx solid #ddd;
  border-radius: 16rpx 16rpx 24rpx 24rpx;
  transition: all 0.2s;
  
  &.highlighted {
    border-color: #6C63FF;
    box-shadow: 0 4rpx 16rpx rgba(108, 99, 255, 0.3);
    transform: scale(1.05);
  }
}

.basket-emoji {
  font-size: 48rpx;
}

.basket-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #333333;
}

.items-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 140rpx;
}

.item {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  transition: all 0.1s;
  animation: drop 0.3s ease;
  
  &.selected {
    border: 3rpx solid #6C63FF;
    box-shadow: 0 8rpx 24rpx rgba(108, 99, 255, 0.3);
    transform: scale(1.1);
    z-index: 10;
  }
  
  &.correct {
    animation: correctAnim 0.3s ease forwards;
  }
  
  &.wrong {
    animation: wrongAnim 0.3s ease forwards;
  }
}

@keyframes drop {
  from { transform: translateY(-100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes correctAnim {
  to { transform: scale(1.3); opacity: 0; }
}

@keyframes wrongAnim {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

.item-emoji {
  font-size: 56rpx;
}

.hint-bar {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  text-align: center;
}

.hint-text {
  font-size: 24rpx;
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
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-btn {
  width: 100%;
}
</style>