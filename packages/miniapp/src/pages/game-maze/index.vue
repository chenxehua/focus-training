<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { submitGameRecord } from '@/api/game'
import StarRating from '@/components/StarRating.vue'

type DifficultyLevel = 1 | 2 | 3 | 4 | 5
type GamePhase = 'start' | 'playing' | 'finished'

interface MazeCell {
  type: 'wall' | 'path' | 'start' | 'end' | 'key'
  visited: boolean
}

interface Position {
  x: number
  y: number
}

const userStore = useUserStore()
const gameStore = useGameStore()

// 难度配置
const difficulty = ref<DifficultyLevel>(1)
const difficultyConfig: Record<DifficultyLevel, {
  label: string
  gridSize: number
  hasKey: boolean
  timeLimit: number
}> = {
  1: { label: '简单 (7×7)', gridSize: 7, hasKey: false, timeLimit: 90 },
  2: { label: '中等 (9×9)', gridSize: 9, hasKey: false, timeLimit: 120 },
  3: { label: '困难 (11×11)', gridSize: 11, hasKey: false, timeLimit: 150 },
  4: { label: '专家 (13×13)', gridSize: 13, hasKey: true, timeLimit: 180 },
  5: { label: '大师 (15×15)', gridSize: 15, hasKey: true, timeLimit: 240 },
}

const currentConfig = computed(() => difficultyConfig[difficulty.value])

// 游戏状态
const gamePhase = ref<GamePhase>('start')
const maze = ref<MazeCell[][]>([])
const playerPos = ref<Position>({ x: 0, y: 0 })
const endPos = ref<Position>({ x: 0, y: 0 })
const keyPos = ref<Position | null>(null)
const hasKey = ref(false)
const steps = ref(0)
const elapsedSeconds = ref(0)
const showResult = ref(false)
const resultScore = ref(0)
const resultStars = ref(0)
const bestPath = ref<Position[]>([])
const hintCount = ref(0)

// 路径记录
const pathHistory = ref<Position[]>([])

// 迷宫尺寸
const CELL_SIZE = 72 // rpx

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateMaze(): MazeCell[][] {
  const size = currentConfig.value.gridSize
  const maze: MazeCell[][] = []
  
  // 初始化为墙
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = { type: 'wall', visited: false }
    }
  }
  
  // 使用递归回溯生成路径
  function carve(x: number, y: number) {
    maze[y][x].type = 'path'
    maze[y][x].visited = true
    
    const directions = shuffleArray([
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ])
    
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && !maze[ny][nx].visited) {
        maze[y + dy / 2][x + dx / 2].type = 'path'
        carve(nx, ny)
      }
    }
  }
  
  // 从起点开始生成
  carve(1, 1)
  
  // 添加一些随机路径增加可玩性
  for (let i = 0; i < Math.floor(size * 0.5); i++) {
    const x = 1 + Math.floor(Math.random() * (size - 2))
    const y = 1 + Math.floor(Math.random() * (size - 2))
    if (maze[y][x].type === 'wall') {
      maze[y][x].type = 'path'
    }
  }
  
  // 设置起点和终点
  maze[1][1].type = 'start'
  playerPos.value = { x: 1, y: 1 }
  
  // 终点在角落
  maze[size - 2][size - 2].type = 'end'
  endPos.value = { x: size - 2, y: size - 2 }
  
  // 如果需要钥匙，在中间区域放置
  if (currentConfig.value.hasKey) {
    const keyX = Math.floor(size / 2) + Math.floor(Math.random() * 3) - 1
    const keyY = Math.floor(size / 2) + Math.floor(Math.random() * 3) - 1
    if (maze[keyY][keyX].type === 'path') {
      maze[keyY][keyX].type = 'key'
      keyPos.value = { x: keyX, y: keyY }
    }
  }
  
  // 计算最优路径（用于提示）
  bestPath.value = findPath(playerPos.value, endPos.value)
  
  return maze
}

function findPath(start: Position, end: Position): Position[] {
  const size = currentConfig.value.gridSize
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }]
  const visited = new Set<string>()
  
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!
    const key = `${pos.x},${pos.y}`
    
    if (visited.has(key)) continue
    visited.add(key)
    
    if (pos.x === end.x && pos.y === end.y) {
      return path
    }
    
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    
    for (const [dx, dy] of directions) {
      const nx = pos.x + dx
      const ny = pos.y + dy
      
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        const cell = maze.value[ny][nx]
        if (cell.type !== 'wall' && !visited.has(`${nx},${ny}`)) {
          queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] })
        }
      }
    }
  }
  
  return []
}

function startGame() {
  maze.value = generateMaze()
  playerPos.value = { x: 1, y: 1 }
  hasKey.value = false
  steps.value = 0
  elapsedSeconds.value = 0
  pathHistory.value = [{ x: 1, y: 1 }]
  hintCount.value = 0
  showResult.value = false
  
  gamePhase.value = 'playing'
}

function move(direction: 'up' | 'down' | 'left' | 'right') {
  if (gamePhase.value !== 'playing') return
  
  const newPos = { ...playerPos.value }
  
  switch (direction) {
    case 'up': newPos.y--; break
    case 'down': newPos.y++; break
    case 'left': newPos.x--; break
    case 'right': newPos.x++; break
  }
  
  // 检查边界
  const size = currentConfig.value.gridSize
  if (newPos.x < 0 || newPos.x >= size || newPos.y < 0 || newPos.y >= size) {
    return
  }
  
  // 检查是否是墙
  const cell = maze.value[newPos.y][newPos.x]
  if (cell.type === 'wall') {
    return
  }
  
  // 检查是否需要钥匙
  if (cell.type === 'key' && !hasKey.value) {
    return
  }
  
  // 移动
  playerPos.value = newPos
  steps.value++
  pathHistory.value.push(newPos)
  
  // 检查是否捡起钥匙
  if (cell.type === 'key') {
    hasKey.value = true
    maze.value[newPos.y][newPos.x].type = 'path'
    keyPos.value = null
  }
  
  // 检查是否到达终点
  if (newPos.x === endPos.value.x && newPos.y === endPos.value.y) {
    finishGame()
  }
}

function useHint() {
  if (hintCount.value >= 3) return
  if (bestPath.value.length === 0) return
  
  hintCount.value++
  // 简单提示：在最优路径上高亮下一步
  const nextPos = bestPath.value[pathHistory.value.length]
  if (nextPos) {
    // 可以在这里添加视觉提示效果
  }
}

function calculateScore(): { score: number; stars: number } {
  const config = currentConfig.value
  const optimalSteps = bestPath.value.length
  
  // 步数效率
  const stepEfficiency = Math.max(0, 1 - (steps.value - optimalSteps) / optimalSteps)
  const baseScore = stepEfficiency * 100
  
  // 时间效率
  const timeEfficiency = Math.max(0, 1 - (elapsedSeconds.value / config.timeLimit))
  const timeBonus = timeEfficiency * 30
  
  // 提示惩罚
  const hintPenalty = hintCount.value * 10
  
  // 难度系数
  const difficultyFactor = difficulty.value * 0.2 + 0.5
  
  const finalScore = Math.round((baseScore + timeBonus - hintPenalty) * difficultyFactor)
  const score = Math.max(0, Math.min(finalScore, 999))
  
  // 计算星星
  let stars = 0
  const efficiency = steps.value / optimalSteps
  if (efficiency <= 1.2) stars = 3
  else if (efficiency <= 1.5) stars = 2
  else if (efficiency <= 2) stars = 1
  
  return { score, stars }
}

async function finishGame() {
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
        gameId: 7, // G007 迷宫寻路
        durationSeconds: elapsedSeconds.value,
        accuracy: Math.round((bestPath.value.length / steps.value) * 100),
        score: resultScore.value,
        focusScore: resultScore.value,
        difficultyLevel: difficulty.value,
        gameConfig: {
          gridSize: currentConfig.value.gridSize,
          hasKey: currentConfig.value.hasKey,
        },
        resultData: {
          steps: steps.value,
          optimalSteps: bestPath.value.length,
          hasKey,
          hintCount: hintCount.value,
        },
      })
    } catch (error) {
      console.error('submit record error:', error)
    }
  }
}

function resetGame() {
  gamePhase.value = 'start'
  maze.value = []
  showResult.value = false
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

// 计时器
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  timer = setInterval(() => {
    elapsedSeconds.value++
    if (elapsedSeconds.value >= currentConfig.value.timeLimit) {
      finishGame()
    }
  }, 1000)
}

function stopTimer() {
  if (timer) clearInterval(timer)
}

// 监听游戏开始
watch(() => gamePhase.value, (newPhase) => {
  if (newPhase === 'playing') {
    startTimer()
  } else {
    stopTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})

import { watch } from 'vue'
</script>

<template>
  <view class="page">
    <!-- 开始页面 -->
    <view v-if="gamePhase === 'start'" class="start-page">
      <view class="game-intro">
        <text class="intro-icon">🐻</text>
        <text class="intro-title">迷宫寻路</text>
        <text class="intro-desc">
          帮助小熊找到蜂蜜！控制小熊穿越迷宫到达终点。训练空间认知和路径规划能力！
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
              {{ config.gridSize }}×{{ config.gridSize }}格子 | 时限{{ config.timeLimit }}秒
              {{ config.hasKey ? '| 需要钥匙' : '' }}
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
    <view v-else-if="gamePhase === 'playing'" class="game-area">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">步数</text>
          <text class="status-value">{{ steps }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">时间</text>
          <text class="status-value time" :class="{ warn: elapsedSeconds > currentConfig.timeLimit * 0.8 }">
            {{ elapsedSeconds }}s
          </text>
        </view>
        <view class="status-item">
          <text class="status-label">钥匙</text>
          <text class="status-value" :class="{ has: hasKey }">{{ hasKey ? '🔑' : '❌' }}</text>
        </view>
      </view>

      <!-- 迷宫区域 -->
      <view class="maze-container">
        <view
          class="maze-grid"
          :style="{
            gridTemplateColumns: `repeat(${currentConfig.gridSize}, ${CELL_SIZE}rpx)`,
            gridTemplateRows: `repeat(${currentConfig.gridSize}, ${CELL_SIZE}rpx)`
          }"
        >
          <view
            v-for="(row, y) in maze"
            :key="`row-${y}`"
          >
            <view
              v-for="(cell, x) in row"
              :key="`${x}-${y}`"
              class="maze-cell"
              :class="{
                wall: cell.type === 'wall',
                path: cell.type === 'path' || cell.type === 'start',
                end: cell.type === 'end',
                key: cell.type === 'key',
                player: playerPos.x === x && playerPos.y === y,
                visited: pathHistory.some(p => p.x === x && p.y === y)
              }"
              @tap="() => {}"
            >
              <text v-if="cell.type === 'end'" class="cell-icon">🍯</text>
              <text v-else-if="cell.type === 'key'" class="cell-icon">🔑</text>
              <text v-if="playerPos.x === x && playerPos.y === y" class="player-icon">🐻</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 控制按钮 -->
      <view class="control-area">
        <view class="control-row">
          <view class="control-btn" @tap="move('up')">
            <text class="control-icon">⬆️</text>
          </view>
        </view>
        <view class="control-row">
          <view class="control-btn" @tap="move('left')">
            <text class="control-icon">⬅️</text>
          </view>
          <view class="control-btn hint-btn" @tap="useHint">
            <text class="control-icon">💡</text>
          </view>
          <view class="control-btn" @tap="move('right')">
            <text class="control-icon">➡️</text>
          </view>
        </view>
        <view class="control-row">
          <view class="control-btn" @tap="move('down')">
            <text class="control-icon">⬇️</text>
          </view>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="hint-info">
        <text class="hint-text">提示次数: {{ hintCount }}/3</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="result-overlay">
      <view class="result-modal">
        <text class="result-title">{{ resultStars === 3 ? '🎉 太棒了！' : '👍 找到蜂蜜！' }}</text>
        <text class="result-subtitle">迷宫寻路 {{ currentConfig.label }}</text>

        <view class="result-stars">
          <StarRating :score="resultStars * 33" :size="64" />
        </view>

        <view class="result-stats">
          <view class="result-stat">
            <text class="result-stat-value">{{ resultScore }}</text>
            <text class="result-stat-label">得分</text>
          </view>
          <view class="result-stat">
            <text class="result-stat-value">{{ steps }}步</text>
            <text class="result-stat-label">用时步数</text>
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
  &.has { color: #FFD93D; }
}

.maze-container {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

.maze-grid {
  display: grid;
  gap: 2rpx;
  background-color: #4a3728;
  padding: 2rpx;
  border-radius: 8rpx;
}

.maze-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  
  &.wall {
    background-color: #4a3728;
  }
  
  &.path {
    background-color: #c4b7a6;
  }
  
  &.end {
    background-color: #FFD93D;
  }
  
  &.key {
    background-color: #FFD93D;
  }
  
  &.visited {
    background-color: rgba(108, 99, 255, 0.2);
  }
  
  &.player {
    z-index: 10;
  }
}

.cell-icon {
  font-size: 36rpx;
}

.player-icon {
  font-size: 48rpx;
  animation: bounce 0.5s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}

.control-area {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 16rpx;
}

.control-row {
  display: flex;
  gap: 12rpx;
  justify-content: center;
}

.control-btn {
  width: 100rpx;
  height: 100rpx;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  
  &:active {
    transform: scale(0.9);
    box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
  }
  
  &.hint-btn {
    background-color: #FFF3CD;
  }
}

.control-icon {
  font-size: 48rpx;
}

.hint-info {
  padding: 8rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
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