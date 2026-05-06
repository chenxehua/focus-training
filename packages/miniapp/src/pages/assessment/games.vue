<template>
  <view class="games-container">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="header-content">
        <text class="header-title">🎮 游戏测评</text>
        <text class="header-subtitle">完成 {{ completedCount }}/{{ totalCount }} 款游戏</text>
      </view>
    </view>

    <!-- 游戏列表 -->
    <view class="games-list">
      <view
        v-for="(game, index) in games"
        :key="game.gameCode"
        class="game-card"
        :class="{
          completed: game.completed,
          current: !game.completed && index === currentGameIndex
        }"
        @tap="handleGameClick(game, index)"
      >
        <!-- 游戏图标 -->
        <view class="game-icon-wrapper">
          <text class="game-icon">{{ game.gameIcon }}</text>
          <view v-if="game.completed" class="completed-badge">
            <text class="badge-icon">✓</text>
          </view>
        </view>

        <!-- 游戏信息 -->
        <view class="game-info">
          <text class="game-name">{{ game.gameName }}</text>
          <text class="game-desc">{{ game.description }}</text>
          <view class="game-meta">
            <text class="meta-item">⏱ {{ game.duration }}秒</text>
            <text class="meta-item">{{ game.difficultyName }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="game-action">
          <button
            v-if="!game.completed"
            class="play-btn"
            @tap.stop="startGame(game)"
          >
            {{ index === currentGameIndex ? '开始' : '待完成' }}
          </button>
          <text v-else class="completed-text">已完成</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="action-area">
      <view class="progress-summary">
        <text class="summary-text">
          已完成 {{ completedCount }}/{{ totalCount }} 款游戏
        </text>
        <view class="progress-dots">
          <view
            v-for="i in totalCount"
            :key="i"
            class="dot"
            :class="{ active: i <= completedCount }"
          ></view>
        </view>
      </view>

      <button
        v-if="completedCount === totalCount"
        class="generate-btn"
        :loading="generating"
        @tap="generateReport"
      >
        查看报告 →
      </button>
      <button
        v-else
        class="continue-btn"
        @tap="continueNextGame"
      >
        继续游戏 →
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 游戏选择页面
 * 功能：展示测评游戏列表、开始游戏、查看进度
 */
import { getAssessmentGames, submitGameResult, generateReport as generateReportApi } from '@/api/initialAssessment'

export default {
  data() {
    return {
      assessmentId: null,
      loading: false,
      generating: false,

      // 游戏列表
      games: [],
      totalCount: 0,
      completedCount: 0,
      currentGameIndex: 0,

      // 当前游戏配置
      currentGameConfig: null
    }
  },

  onLoad(options) {
    if (options.assessmentId) {
      this.assessmentId = parseInt(options.assessmentId)
      this.loadGames()
    } else {
      uni.showToast({
        title: '缺少测评ID',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },

  methods: {
    /**
     * 加载游戏列表
     */
    async loadGames() {
      try {
        this.loading = true

        const res = await getAssessmentGames(this.assessmentId)

        if (res.success && res.data) {
          this.games = res.data.games || []
          this.totalCount = res.data.totalGames || 0
          this.completedCount = res.data.completedGames || 0

          // 找到第一个未完成的游戏
          this.currentGameIndex = this.games.findIndex(g => !g.completed)
          if (this.currentGameIndex === -1) {
            this.currentGameIndex = this.games.length
          }
        } else {
          throw new Error(res.message || '加载游戏列表失败')
        }

      } catch (error) {
        console.error('加载游戏列表失败:', error)
        uni.showToast({
          title: error.message || '加载游戏列表失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    /**
     * 处理游戏卡片点击
     */
    handleGameClick(game, index) {
      if (game.completed) {
        // 查看已完成游戏的结果
        uni.showModal({
          title: game.gameName,
          content: `得分: ${game.score || 0} | 用时: ${game.duration || 0}秒`,
          showCancel: false
        })
      }
    },

    /**
     * 开始游戏
     */
    startGame(game) {
      // 跳转到游戏进行页面
      uni.navigateTo({
        url: `/pages/assessment/game-play?assessmentId=${this.assessmentId}&gameCode=${game.gameCode}`
      })
    },

    /**
     * 继续下一个游戏
     */
    continueNextGame() {
      // 找到下一个未完成的游戏
      const nextGame = this.games.find(g => !g.completed)
      if (nextGame) {
        this.startGame(nextGame)
      }
    },

    /**
     * 生成报告
     */
    async generateReport() {
      try {
        this.generating = true

        const res = await generateReportApi(this.assessmentId)

        if (res.success && res.data) {
          uni.showToast({
            title: '报告生成成功',
            icon: 'success'
          })

          // 跳转到报告页面
          setTimeout(() => {
            uni.redirectTo({
              url: `/pages/assessment/report?reportId=${res.data.reportId}&assessmentId=${this.assessmentId}`
            })
          }, 1500)
        } else {
          throw new Error(res.message || '生成报告失败')
        }

      } catch (error) {
        console.error('生成报告失败:', error)
        uni.showToast({
          title: error.message || '生成报告失败',
          icon: 'none'
        })
        this.generating = false
      }
    }
  }
}
</script>

<style scoped>
.games-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  padding-bottom: 200rpx;
}

/* 顶部标题 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.header-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 游戏列表 */
.games-list {
  padding: 30rpx;
}

.game-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.game-card.current {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
}

.game-card.completed {
  opacity: 0.7;
}

/* 游戏图标 */
.game-icon-wrapper {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-icon {
  font-size: 50rpx;
}

.completed-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #4cd964;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-icon {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: bold;
}

/* 游戏信息 */
.game-info {
  flex: 1;
}

.game-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.game-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.game-meta {
  display: flex;
  gap: 16rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

/* 操作按钮 */
.game-action {
  flex-shrink: 0;
}

.play-btn {
  padding: 16rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
}

.play-btn::after {
  border: none;
}

.completed-text {
  font-size: 24rpx;
  color: #999;
}

/* 底部操作区 */
.action-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.progress-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #666;
}

.progress-dots {
  display: flex;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #e8e8e8;
  transition: all 0.3s ease;
}

.dot.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.continue-btn,
.generate-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.continue-btn::after,
.generate-btn::after {
  border: none;
}

.continue-btn {
  background: #f5f5f5;
  color: #333;
}

.generate-btn[loading] {
  opacity: 0.7;
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
</style>