<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useGameStore } from '@/store/game'
import { getGameList } from '@/api/game'
import GameCard from '@/components/GameCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import type { GameInfo } from '@/store/game'

const userStore = useUserStore()
const gameStore = useGameStore()

const featuredGames = ref<GameInfo[]>([])
const isLoading = ref(false)

// 今日打卡目标（分钟）
const dailyGoalMinutes = 15
const todayMinutes = computed(() => Math.floor(gameStore.todayDuration / 60))
const checkInProgress = computed(() => Math.min((todayMinutes.value / dailyGoalMinutes) * 100, 100))
const isCheckedIn = computed(() => todayMinutes.value >= dailyGoalMinutes)

// 格式化时长
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function navigateToGame(game: GameInfo) {
  const gamePageMap: Record<string, string> = {
    'schulte': '/pages/game-schulte/index',
    'audio_count': '/pages/game-audio/index',
    'pattern_memory': '/pages/game-memory/index',
    'visual_tracking': '/pages/game-visual/index',
    'reaction_speed': '/pages/game-reaction/index',
    'rhythm_tap': '/pages/game-rhythm/index',
    'auditory_memory': '/pages/game-sound/index',
    'maze_navigation': '/pages/game-maze/index',
    'quick_sort': '/pages/game-sort/index',
    'target_tracking': '/pages/game-tracking/index'
  }
  const url = gamePageMap[game.gameCode]
  if (url) {
    uni.navigateTo({ url })
  } else {
    uni.showToast({ title: '该游戏即将上线', icon: 'none' })
  }
}

function navigateToGames() {
  uni.navigateTo({ url: '/pages/games/index' })
}

async function loadData() {
  // 未登录或无孩子时不加载数据
  if (!userStore.currentChild || !userStore.isLoggedIn) {
    gameStore.clearAll()
    return
  }
  isLoading.value = true
  try {
    const [gamesRes] = await Promise.all([
      getGameList(),
      gameStore.fetchTodayData(userStore.currentChild.id),
    ])
    featuredGames.value = gamesRes.data.slice(0, 4)
    gameStore.setGameList(gamesRes.data)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onShow(() => {
  // 恢复session并根据登录状态加载数据
  userStore.restoreSession()
  if (userStore.currentChild && userStore.isLoggedIn) {
    gameStore.fetchTodayData(userStore.currentChild.id)
  } else {
    gameStore.clearAll()
  }
})
</script>

<template>
  <view class="page">
    <!-- 顶部欢迎区 -->
    <view class="header">
      <view class="header-left">
        <view class="child-avatar-wrap">
          <image
            class="child-avatar"
            :src="userStore.currentChild?.avatar || '/static/avatar-default.png'"
            mode="aspectFill"
          />
          <view v-if="isCheckedIn" class="checked-badge">✓</view>
        </view>
        <view class="greeting">
          <text class="greeting-name">{{ userStore.currentChild?.name || '小朋友' }}，你好！</text>
          <text class="greeting-sub">今天要一起训练专注力哦</text>
        </view>
      </view>
      <view class="streak-badge">
        <text class="streak-fire">🔥</text>
        <text class="streak-count">{{ gameStore.currentStreak }}</text>
        <text class="streak-label">天连续</text>
      </view>
    </view>

    <!-- 今日打卡进度 -->
    <view class="check-in-card card">
      <view class="check-in-header">
        <text class="check-in-title">今日训练打卡</text>
        <text class="check-in-status" :class="{ done: isCheckedIn }">
          {{ isCheckedIn ? '已完成 ✓' : `${todayMinutes}/${dailyGoalMinutes}分钟` }}
        </text>
      </view>
      <ProgressBar
        :value="checkInProgress"
        :color="isCheckedIn ? '#6BCB77' : '#6C63FF'"
        :height="20"
        :animated="true"
      />
      <view class="check-in-stats">
        <view class="stat-item">
          <text class="stat-value">{{ gameStore.todayGameCount }}</text>
          <text class="stat-label">游戏次数</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ formatDuration(gameStore.todayDuration) }}</text>
          <text class="stat-label">训练时长</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ gameStore.avgFocusScore }}</text>
          <text class="stat-label">专注得分</text>
        </view>
      </view>
    </view>

    <!-- 推荐游戏 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">推荐游戏</text>
        <text class="section-more" @tap="navigateToGames">查看全部 ›</text>
      </view>

      <view v-if="isLoading" class="loading-placeholder">
        <view v-for="i in 2" :key="i" class="skeleton-card" />
      </view>

      <view v-else class="games-grid">
        <GameCard
          v-for="game in featuredGames"
          :key="game.id"
          :game="game"
          @play="navigateToGame"
        />
      </view>
    </view>

    <!-- 今日训练记录 -->
    <view v-if="gameStore.todayRecords.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">今日记录</text>
      </view>
      <view class="records-list">
        <view
          v-for="record in gameStore.todayRecords.slice(0, 5)"
          :key="record.id"
          class="record-item"
        >
          <view class="record-left">
            <text class="record-game">{{ record.gameName }}</text>
            <text class="record-time">{{ record.createdAt.slice(11, 16) }}</text>
          </view>
          <view class="record-right">
            <text class="record-score">{{ record.score }}分</text>
            <text class="record-duration">{{ formatDuration(record.durationSeconds) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="!userStore.currentChild" class="empty-state">
      <text class="empty-icon">👶</text>
      <text class="empty-text">还没有添加孩子信息</text>
      <text class="empty-hint">前往「我的」页面添加孩子</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  padding: 48rpx 32rpx 40rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.child-avatar-wrap {
  position: relative;
}

.child-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.6);
}

.checked-badge {
  position: absolute;
  right: -4rpx;
  bottom: -4rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: #6BCB77;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #fff;
  font-weight: 700;
  border: 2rpx solid #fff;
}

.greeting-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.greeting-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 4rpx;
}

.streak-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(255,255,255,0.2);
  border-radius: 16rpx;
  padding: 12rpx 20rpx;
}

.streak-fire { font-size: 32rpx; }
.streak-count { font-size: 40rpx; font-weight: 700; color: #FFD93D; line-height: 1.2; }
.streak-label { font-size: 20rpx; color: rgba(255,255,255,0.8); }

.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  padding: 28rpx;
}

.check-in-card {
  margin: -20rpx 24rpx 0;
  position: relative;
  z-index: 10;
}

.check-in-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.check-in-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.check-in-status {
  font-size: 24rpx;
  color: #999999;

  &.done { color: #6BCB77; font-weight: 600; }
}

.check-in-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 20rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #6C63FF;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background-color: #f0f0f0;
}

.section {
  padding: 32rpx 24rpx 0;
}

.section-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.section-more {
  font-size: 26rpx;
  color: #6C63FF;
}

.games-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.loading-placeholder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.skeleton-card {
  height: 280rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  border-radius: 24rpx;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.records-list {
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}

.record-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child { border-bottom: none; }
}

.record-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.record-game { font-size: 28rpx; color: #333333; font-weight: 500; }
.record-time { font-size: 22rpx; color: #999999; }

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.record-score { font-size: 28rpx; color: #6C63FF; font-weight: 700; }
.record-duration { font-size: 22rpx; color: #999999; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  gap: 16rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 32rpx; color: #333333; font-weight: 600; }
.empty-hint { font-size: 26rpx; color: #999999; }
</style>
