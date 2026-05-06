<template>
  <view class="game-play-container">
    <!-- 游戏头部信息 -->
    <view class="game-header">
      <view class="header-left">
        <text class="game-name">{{ gameName }}</text>
        <text class="game-tip">请按规则完成游戏</text>
      </view>
      <view class="header-right">
        <view class="timer-display">
          <text class="timer-label">剩余时间</text>
          <text class="timer-value" :class="{ warning: remainingTime <= 10 }">
            {{ formatTime(remainingTime) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 游戏内容区域 -->
    <view class="game-content">
      <!-- 舒尔特方格游戏 -->
      <view v-if="gameCode === 'schulte'" class="schulte-game">
        <view class="grid-container" :style="getGridStyle()">
          <view
            v-for="(cell, index) in schulteCells"
            :key="index"
            class="grid-cell"
            :class="{
              highlighted: cell.highlighted,
              found: cell.found,
              hint: showNumberHints
            }"
            @tap="handleSchulteTap(cell, index)"
          >
            <text class="cell-number" v-if="showNumberHints || cell.found">
              {{ cell.number }}
            </text>
            <text class="cell-target" v-else-if="cell.isTarget">
              {{ targetNumber }}
            </text>
          </view>
        </view>
        <view class="game-stats">
          <text class="stat-item">目标: {{ targetNumber }}</text>
          <text class="stat-item">已找到: {{ foundCount }}/{{ totalNumbers }}</text>
          <text class="stat-item">正确率: {{ accuracy }}%</text>
        </view>
      </view>

      <!-- 图案记忆游戏 -->
      <view v-else-if="gameCode === 'pattern_memory'" class="pattern-game">
        <view v-if="gamePhase === 'show'" class="phase-show">
          <text class="phase-title">记住这些图案</text>
          <view class="pattern-grid">
            <view
              v-for="(pattern, index) in patternItems"
              :key="index"
              class="pattern-item"
              :class="{ target: pattern.isTarget }"
            >
              <text class="pattern-icon">{{ pattern.icon }}</text>
            </view>
          </view>
          <text class="phase-hint">请记住带边框的图案</text>
        </view>
        <view v-else-if="gamePhase === 'select'" class="phase-select">
          <text class="phase-title">请选择记住的图案</text>
          <view class="pattern-grid">
            <view
              v-for="(pattern, index) in patternItems"
              :key="index"
              class="pattern-item"
              :class="{
                selected: pattern.selected,
                correct: showResult && pattern.isTarget,
                wrong: showResult && pattern.selected && !pattern.isTarget
              }"
              @tap="handlePatternSelect(pattern, index)"
            >
              <text class="pattern-icon">{{ pattern.icon }}</text>
            </view>
          </view>
          <text class="phase-hint">已选择: {{ selectedCount }}/{{ targetCount }}</text>
        </view>
        <view v-else-if="gamePhase === 'result'" class="phase-result">
          <text class="result-score">得分: {{ patternScore }}</text>
          <text class="result-accuracy">正确率: {{ patternAccuracy }}%</text>
        </view>
      </view>

      <!-- 听声辨数游戏 -->
      <view v-else-if="gameCode === 'audio_count'" class="audio-game">
        <view class="audio-display">
          <text class="audio-icon">🔊</text>
          <text class="audio-number" v-if="currentAudioNumber">{{ currentAudioNumber }}</text>
          <text class="audio-placeholder" v-else>点击开始</text>
        </view>
        <view class="audio-controls">
          <button class="audio-play-btn" @tap="playAudioSequence" v-if="!isPlaying">
            🎵 播放数字序列
          </button>
          <button class="audio-play-btn playing" v-else disabled>
            🔄 播放中...
          </button>
        </view>
        <view class="audio-input">
          <text class="input-label">请输入听到的数字（用逗号分隔）</text>
          <input
            class="audio-number-input"
            v-model="audioInputNumbers"
            placeholder="例如: 1,2,3,4"
            type="text"
            :disabled="isPlaying"
          />
        </view>
      </view>

      <!-- 快速分类游戏 -->
      <view v-else-if="gameCode === 'quick_sort'" class="sort-game">
        <view class="sort-display">
          <view class="category-labels">
            <view class="category-item category-a">
              <text>类别 A</text>
            </view>
            <view class="category-item category-b">
              <text>类别 B</text>
            </view>
          </view>
          <view class="current-item">
            <text class="item-label">当前项目</text>
            <view class="item-display" v-if="currentSortItem">
              <text class="item-icon">{{ currentSortItem.icon }}</text>
              <text class="item-name">{{ currentSortItem.name }}</text>
            </view>
          </view>
          <view class="sort-progress">
            <text>进度: {{ sortedCount }}/{{ totalSortItems }}</text>
          </view>
        </view>
      </view>

      <!-- 迷宫游戏 -->
      <view v-else-if="gameCode === 'maze'" class="maze-game">
        <view class="maze-grid">
          <view
            v-for="(row, rowIndex) in mazeGrid"
            :key="rowIndex"
            class="maze-row"
          >
            <view
              v-for="(cell, colIndex) in row"
              :key="colIndex"
              class="maze-cell"
              :class="{
                wall: cell === 1,
                path: cell === 0,
                player: isPlayerCell(rowIndex, colIndex),
                target: isTargetCell(rowIndex, colIndex)
              }"
              @tap="handleMazeMove(rowIndex, colIndex)"
            >
              <text v-if="isPlayerCell(rowIndex, colIndex)" class="player-icon">😊</text>
              <text v-else-if="isTargetCell(rowIndex, colIndex)" class="target-icon">🏆</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 其他游戏提示 -->
      <view v-else class="game-placeholder">
        <text class="placeholder-text">游戏加载中...</text>
      </view>
    </view>

    <!-- 游戏底部操作 -->
    <view class="game-footer">
      <button class="submit-btn" :disabled="!canSubmit" @tap="submitResult">
        {{ gamePhase === 'result' ? '查看结果' : '提交结果' }}
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载游戏配置...</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResultModal" class="result-modal">
      <view class="modal-content">
        <text class="modal-title">游戏完成!</text>
        <view class="result-stats">
          <view class="stat-row">
            <text class="stat-label">得分</text>
            <text class="stat-value">{{ resultData.score }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">正确率</text>
            <text class="stat-value">{{ resultData.accuracy }}%</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">用时</text>
            <text class="stat-value">{{ resultData.duration }}秒</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">百分位</text>
            <text class="stat-value">{{ resultData.percentile }}%</text>
          </view>
        </view>
        <button class="modal-btn" @tap="closeResultModal">继续</button>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 游戏进行页面
 * 功能：游戏加载、进行、完成、结果提交
 */
import { getGameConfig, submitGameResult } from '@/api/initialAssessment'

// 舒尔特方格游戏逻辑
const createSchulteGame = () => {
  const state = {
    gridSize: 5,
    cells: [],
    targetNumber: 1,
    foundCount: 0,
    totalNumbers: 25,
    startTime: null,
    errors: 0
  }
  
  // 初始化格子
  const initGrid = (size) => {
    const numbers = Array.from({ length: size * size }, (_, i) => i + 1)
    // Fisher-Yates 洗牌
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }
    
    state.cells = numbers.map((num, idx) => ({
      number: num,
      highlighted: num === 1,
      found: false,
      isTarget: num === 1
    }))
  }
  
  initGrid(state.gridSize)
  
  return state
}

// 图案记忆游戏逻辑
const createPatternGame = () => {
  const patterns = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑']
  
  const state = {
    items: [],
    targetCount: 3,
    selectedCount: 0,
    phase: 'show', // show, select, result
    showResult: false,
    score: 0,
    accuracy: 0
  }
  
  // 随机选择图案
  const selected = patterns.sort(() => Math.random() - 0.5).slice(0, 6)
  state.items = selected.map((icon, idx) => ({
    icon,
    isTarget: idx < state.targetCount,
    selected: false
  }))
  
  // 随机打乱
  state.items.sort(() => Math.random() - 0.5)
  
  return state
}

export default {
  data() {
    return {
      assessmentId: null,
      gameCode: null,
      loading: false,
      
      // 游戏配置
      gameName: '',
      gameConfig: null,
      timeLimit: 0,
      remainingTime: 0,
      timer: null,
      
      // 游戏状态
      gamePhase: 'playing',
      
      // 舒尔特方格
      schulteState: null,
      
      // 图案记忆
      patternState: null,
      
      // 听声辨数
      audioNumbers: [],
      currentAudioNumber: null,
      audioInputNumbers: '',
      isPlaying: false,
      
      // 快速分类
      sortItems: [],
      currentSortItem: null,
      sortedCount: 0,
      totalSortItems: 10,
      
      // 迷宫
      playerPosition: { x: 0, y: 0 },
      targetPosition: { x: 8, y: 8 },
      mazeGrid: [],
      
      // 结果
      resultData: null,
      showResultModal: false
    }
  },

  computed: {
    schulteCells() {
      return this.schulteState?.cells || []
    },
    
    patternItems() {
      return this.patternState?.items || []
    },
    
    canSubmit() {
      return this.gamePhase === 'result' || this.remainingTime <= 0
    }
  },

  onLoad(options) {
    if (options.assessmentId && options.gameCode) {
      this.assessmentId = parseInt(options.assessmentId)
      this.gameCode = options.gameCode
      this.loadGameConfig()
    } else {
      uni.showToast({
        title: '缺少参数',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },

  onUnload() {
    this.stopTimer()
  },

  methods: {
    /**
     * 加载游戏配置
     */
    async loadGameConfig() {
      try {
        this.loading = true
        
        // 获取儿童年龄组（从页面参数或存储）
        let ageGroup = '8-9' // 默认值
        
        const res = await getGameConfig(this.gameCode, ageGroup)
        
        if (res.success && res.data) {
          this.gameConfig = res.data
          this.timeLimit = res.data.timeLimit || 60
          this.remainingTime = this.timeLimit
          
          // 根据游戏类型初始化
          this.initGame()
          
          // 启动计时器
          this.startTimer()
        } else {
          throw new Error(res.message || '加载游戏配置失败')
        }
        
      } catch (error) {
        console.error('加载游戏配置失败:', error)
        // 使用默认配置
        this.timeLimit = 60
        this.remainingTime = this.timeLimit
        this.initGame()
        this.startTimer()
      } finally {
        this.loading = false
      }
    },

    /**
     * 初始化游戏
     */
    initGame() {
      switch (this.gameCode) {
        case 'schulte':
          this.initSchulteGame()
          break
        case 'pattern_memory':
          this.initPatternGame()
          break
        case 'audio_count':
          this.initAudioGame()
          break
        case 'quick_sort':
          this.initSortGame()
          break
        case 'maze':
          this.initMazeGame()
          break
        default:
          this.gameName = '测评游戏'
      }
    },

    /**
     * 初始化舒尔特方格
     */
    initSchulteGame() {
      this.gameName = '舒尔特方格'
      const size = this.gameConfig?.parameters?.gridSize || 5
      const numbers = Array.from({ length: size * size }, (_, i) => i + 1)
      
      // 洗牌
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
      }
      
      this.schulteState = {
        cells: numbers.map((num) => ({
          number: num,
          highlighted: num === 1,
          found: false
        })),
        gridSize: size,
        targetNumber: 1,
        foundCount: 0,
        errors: 0
      }
      this.targetNumber = 1
      this.totalNumbers = size * size
      this.foundCount = 0
      this.accuracy = 100
    },

    /**
     * 处理舒尔特方格点击
     */
    handleSchulteTap(cell, index) {
      if (cell.found) return
      
      if (cell.number === this.targetNumber) {
        // 找对了
        this.schulteState.cells[index].found = true
        this.schulteState.cells[index].highlighted = false
        this.foundCount++
        this.targetNumber++
        
        // 高亮下一个目标
        this.schulteState.cells.forEach((c, i) => {
          if (c.number === this.targetNumber && !c.found) {
            c.highlighted = true
          }
        })
        
        // 检查是否完成
        if (this.foundCount >= this.totalNumbers) {
          this.gamePhase = 'result'
          this.stopTimer()
        }
      } else {
        // 找错了
        this.schulteState.errors++
        uni.showToast({
          title: '找错了，再试试',
          icon: 'none',
          duration: 500
        })
        this.accuracy = Math.round((this.foundCount / (this.foundCount + this.schulteState.errors)) * 100)
      }
    },

    /**
     * 获取网格样式
     */
    getGridStyle() {
      if (!this.schulteState) return {}
      const size = this.schulteState.gridSize
      return {
        'grid-template-columns': `repeat(${size}, 1fr)`
      }
    },

    /**
     * 初始化图案记忆游戏
     */
    initPatternGame() {
      this.gameName = '图案记忆'
      const patterns = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑']
      const targetCount = this.gameConfig?.parameters?.patternCount || 3
      
      const selected = [...patterns].sort(() => Math.random() - 0.5).slice(0, 6)
      this.patternState = {
        items: selected.map((icon, idx) => ({
          icon,
          isTarget: idx < targetCount,
          selected: false
        })),
        targetCount,
        showResult: false,
        score: 0,
        accuracy: 0
      }
      
      this.gamePhase = 'show'
      this.showNumberHints = false
      
      // 显示3秒后切换到选择阶段
      setTimeout(() => {
        this.gamePhase = 'select'
        this.patternState.items.sort(() => Math.random() - 0.5)
      }, 3000)
    },

    /**
     * 处理图案选择
     */
    handlePatternSelect(pattern, index) {
      if (this.patternState.items[index].selected) {
        this.patternState.items[index].selected = false
        this.patternState.selectedCount--
      } else {
        if (this.patternState.selectedCount < this.patternState.targetCount) {
          this.patternState.items[index].selected = true
          this.patternState.selectedCount++
        }
      }
    },

    get selectedCount() {
      return this.patternState?.selectedCount || 0
    },

    get patternScore() {
      if (!this.patternState) return 0
      const correct = this.patternState.items.filter(
        (p, i) => p.selected === p.isTarget
      ).length
      return Math.round((correct / this.patternState.items.length) * 100)
    },

    get patternAccuracy() {
      return this.patternScore
    },

    /**
     * 初始化听声辨数游戏
     */
    initAudioGame() {
      this.gameName = '听声辨数'
      const digitCount = this.gameConfig?.parameters?.digitCount || 4
      
      // 生成随机数字序列
      this.audioNumbers = Array.from({ length: digitCount }, () => 
        Math.floor(Math.random() * 9) + 1
      )
      this.currentAudioNumber = null
      this.isPlaying = false
    },

    /**
     * 播放音频序列
     */
    async playAudioSequence() {
      this.isPlaying = true
      for (const num of this.audioNumbers) {
        this.currentAudioNumber = num
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.currentAudioNumber = null
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      this.isPlaying = false
    },

    /**
     * 初始化快速分类游戏
     */
    initSortGame() {
      this.gameName = '快速分类'
      // 简化的分类数据
      this.sortItems = [
        { name: '苹果', category: 'A', icon: '🍎' },
        { name: '香蕉', category: 'B', icon: '🍌' },
        { name: '橙子', category: 'A', icon: '🍊' },
        { name: '葡萄', category: 'B', icon: '🍇' }
      ].sort(() => Math.random() - 0.5)
      
      this.currentSortItem = this.sortItems[0]
      this.sortedCount = 0
      this.totalSortItems = this.sortItems.length
    },

    /**
     * 初始化迷宫游戏
     */
    initMazeGame() {
      this.gameName = '迷宫寻路'
      // 简单的10x10迷宫
      const maze = [
        [0,0,1,0,0,0,0,1,0,0],
        [1,0,1,0,1,1,0,1,0,1],
        [0,0,0,0,0,1,0,0,0,0],
        [0,1,1,1,0,1,1,1,1,0],
        [0,0,0,1,0,0,0,0,1,0],
        [1,1,0,1,1,1,1,0,1,0],
        [0,0,0,0,0,0,1,0,0,0],
        [0,1,1,1,1,0,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,0,1,1,1,0,0]
      ]
      this.mazeGrid = maze
      this.playerPosition = { x: 0, y: 0 }
      this.targetPosition = { x: 9, y: 9 }
    },

    /**
     * 检查玩家位置
     */
    isPlayerCell(row, col) {
      return this.playerPosition.x === col && this.playerPosition.y === row
    },

    /**
     * 检查目标位置
     */
    isTargetCell(row, col) {
      return this.targetPosition.x === col && this.targetPosition.y === row
    },

    /**
     * 处理迷宫移动
     */
    handleMazeMove(row, col) {
      if (this.mazeGrid[row][col] === 1) {
        uni.showToast({ title: '这是墙', icon: 'none' })
        return
      }
      
      // 简单的路径检查（简化版本）
      this.playerPosition = { x: col, y: row }
      
      // 检查是否到达目标
      if (col === this.targetPosition.x && row === this.targetPosition.y) {
        this.gamePhase = 'result'
        this.stopTimer()
      }
    },

    /**
     * 启动计时器
     */
    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
        } else {
          this.stopTimer()
          this.gamePhase = 'result'
        }
      }, 1000)
    },

    /**
     * 停止计时器
     */
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },

    /**
     * 格式化时间
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    /**
     * 提交游戏结果
     */
    async submitResult() {
      try {
        this.loading = true
        
        // 计算游戏结果
        const resultData = this.calculateGameResult()
        
        // 提交到后端
        const res = await submitGameResult(this.assessmentId, this.gameCode, resultData)
        
        if (res.success && res.data) {
          this.resultData = {
            ...resultData,
            percentile: res.data.performance.percentile,
            rating: res.data.performance.rating
          }
          this.showResultModal = true
        } else {
          throw new Error(res.message || '提交结果失败')
        }
        
      } catch (error) {
        console.error('提交游戏结果失败:', error)
        uni.showToast({
          title: error.message || '提交结果失败',
          icon: 'none'
        })
        
        // 显示本地结果
        this.resultData = this.calculateGameResult()
        this.showResultModal = true
      } finally {
        this.loading = false
      }
    },

    /**
     * 计算游戏结果
     */
    calculateGameResult() {
      let score = 0
      let accuracy = 0
      const duration = this.timeLimit - this.remainingTime
      
      switch (this.gameCode) {
        case 'schulte':
          score = Math.round((this.foundCount / this.totalNumbers) * 100)
          accuracy = this.accuracy
          break
        case 'pattern_memory':
          score = this.patternScore
          accuracy = this.patternAccuracy
          break
        case 'audio_count':
          // 比较输入和实际数字
          const inputNumbers = this.audioInputNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
          const correctCount = inputNumbers.filter((n, i) => n === this.audioNumbers[i]).length
          score = Math.round((correctCount / this.audioNumbers.length) * 100)
          accuracy = score
          break
        case 'quick_sort':
          score = Math.round((this.sortedCount / this.totalSortItems) * 100)
          accuracy = score
          break
        case 'maze':
          score = this.gamePhase === 'result' ? 100 : Math.round((this.remainingTime / this.timeLimit) * 50)
          accuracy = score
          break
        default:
          score = 50
          accuracy = 50
      }
      
      return {
        score,
        accuracy,
        duration,
        rawData: {
          gameCode: this.gameCode,
          timeLimit: this.timeLimit,
          startedAt: new Date().toISOString()
        }
      }
    },

    /**
     * 关闭结果弹窗
     */
    closeResultModal() {
      this.showResultModal = false
      
      // 跳转到下一个游戏或结果页面
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.game-play-container {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 游戏头部 */
.game-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx;
  padding-top: calc(30rpx + env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.game-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.game-tip {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.timer-display {
  text-align: right;
}

.timer-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.timer-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffffff;
}

.timer-value.warning {
  color: #ff6b6b;
}

/* 游戏内容 */
.game-content {
  flex: 1;
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 舒尔特方格 */
.schulte-game {
  width: 100%;
  max-width: 600rpx;
}

.grid-container {
  display: grid;
  gap: 8rpx;
  background: #fff;
  padding: 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.grid-cell {
  aspect-ratio: 1;
  background: #f0f0f0;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  transition: all 0.2s ease;
}

.grid-cell.highlighted {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  transform: scale(1.05);
}

.grid-cell.found {
  background: #4cd964;
  color: #ffffff;
}

.game-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 30rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}

.stat-item {
  font-size: 26rpx;
  color: #666;
}

/* 图案记忆 */
.pattern-game {
  width: 100%;
}

.phase-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.phase-hint {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  margin-top: 30rpx;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  max-width: 500rpx;
  margin: 0 auto;
}

.pattern-item {
  aspect-ratio: 1;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  border: 4rpx solid transparent;
  transition: all 0.3s ease;
}

.pattern-item.target {
  border-color: #667eea;
}

.pattern-item.selected {
  background: #667eea20;
  border-color: #667eea;
}

.pattern-item.correct {
  background: #4cd96440;
  border-color: #4cd964;
}

.pattern-item.wrong {
  background: #ff6b6b40;
  border-color: #ff6b6b;
}

.phase-result {
  text-align: center;
}

.result-score {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 20rpx;
}

.result-accuracy {
  font-size: 32rpx;
  color: #666;
}

/* 听声辨数 */
.audio-game {
  width: 100%;
  max-width: 600rpx;
}

.audio-display {
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 40rpx;
}

.audio-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.audio-number {
  font-size: 120rpx;
  font-weight: bold;
  color: #667eea;
}

.audio-placeholder {
  font-size: 32rpx;
  color: #999;
}

.audio-controls {
  margin-bottom: 30rpx;
}

.audio-play-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 48rpx;
  border: none;
}

.audio-play-btn::after {
  border: none;
}

.audio-input {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.input-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
  display: block;
}

.audio-number-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 32rpx;
  text-align: center;
}

/* 快速分类 */
.sort-game {
  width: 100%;
}

.category-labels {
  display: flex;
  gap: 40rpx;
  margin-bottom: 40rpx;
}

.category-item {
  flex: 1;
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
}

.category-a {
  background: #667eea20;
  color: #667eea;
}

.category-b {
  background: #4cd96420;
  color: #4cd964;
}

.current-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.item-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  display: block;
}

.item-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.item-icon {
  font-size: 100rpx;
}

.item-name {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}

.sort-progress {
  text-align: center;
  font-size: 28rpx;
  color: #666;
}

/* 迷宫 */
.maze-game {
  width: 100%;
  max-width: 600rpx;
}

.maze-grid {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
}

.maze-row {
  display: flex;
}

.maze-cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f0f0f0;
}

.maze-cell.wall {
  background: #333;
}

.maze-cell.path {
  background: #fff;
}

.maze-cell.player,
.maze-cell.target {
  background: #667eea20;
}

.player-icon,
.target-icon {
  font-size: 32rpx;
}

/* 游戏底部 */
.game-footer {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
}

.submit-btn::after {
  border: none;
}

.submit-btn[disabled] {
  background: #ccc;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 结果弹窗 */
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: #ffffff;
  border-radius: 30rpx;
  padding: 50rpx;
  width: 80%;
  max-width: 600rpx;
}

.modal-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.result-stats {
  margin-bottom: 40rpx;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.stat-label {
  font-size: 28rpx;
  color: #666;
}

.stat-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
}

.modal-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
}

.modal-btn::after {
  border: none;
}
</style>