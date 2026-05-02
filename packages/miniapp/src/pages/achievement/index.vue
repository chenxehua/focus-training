<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { get } from '@/api/request'

const userStore = useUserStore()
const achievements = ref<Achievement[]>([])
const stats = ref({ total: 0, unlocked: 0, progress: 0 })
const isLoading = ref(false)

interface Achievement {
  id: number
  achievement_code: string
  achievement_name: string
  achievement_type: string
  description: string
  icon_url?: string
  requirement_type: string
  requirement_value: number
  experience_reward: number
  progress: number
  is_unlocked: boolean
  unlocked_at?: string
}

// 成就类型对应的图标
const typeIcons: Record<string, string> = {
  training: '🎮',
  streak: '🔥',
  milestone: '🏆',
  score: '⭐',
  speed: '⚡',
}

// 成就类型对应的颜色
const typeColors: Record<string, string> = {
  training: '#6C63FF',
  streak: '#FF6B6B',
  milestone: '#FFD93D',
  score: '#6BCB77',
  speed: '#00D9FF',
}

function getIcon(achievement: Achievement): string {
  return typeIcons[achievement.achievement_type] || '🎖️'
}

function getColor(achievement: Achievement): string {
  return typeColors[achievement.achievement_type] || '#6C63FF'
}

function getProgressPercent(achievement: Achievement): number {
  if (achievement.is_unlocked) return 100
  if (!achievement.requirement_value) return 0
  return Math.min(Math.round((achievement.progress / achievement.requirement_value) * 100), 99)
}

// 按类型分组
const groupedAchievements = computed(() => {
  const groups: Record<string, Achievement[]> = {}
  achievements.value.forEach(achievement => {
    const type = achievement.achievement_type || 'other'
    if (!groups[type]) groups[type] = []
    groups[type].push(achievement)
  })
  return groups
})

const typeLabels: Record<string, string> = {
  training: '训练成就',
  streak: '连续打卡',
  milestone: '里程碑',
  score: '高分成就',
  speed: '速度之星',
}

async function loadAchievements() {
  if (!userStore.currentChild) return
  isLoading.value = true
  try {
    const [listRes, statsRes] = await Promise.all([
      get<Achievement[]>(`/api/achievement/child/${userStore.currentChild.id}`),
      get(`/api/achievement/stats/${userStore.currentChild.id}`),
    ])
    achievements.value = listRes.data
    stats.value = statsRes.data
  } catch (error) {
    console.error('加载成就失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchChildren().then(() => loadAchievements())
  }
})
</script>

<template>
  <view class="page">
    <!-- 成就统计 -->
    <view class="stats-card">
      <view class="stats-main">
        <view class="stats-circle">
          <text class="stats-percent">{{ stats.progress }}%</text>
          <text class="stats-label">完成度</text>
        </view>
        <view class="stats-info">
          <view class="stats-item">
            <text class="stats-value">{{ stats.unlocked }}</text>
            <text class="stats-name">已解锁</text>
          </view>
          <view class="stats-divider" />
          <view class="stats-item">
            <text class="stats-value">{{ stats.total - stats.unlocked }}</text>
            <text class="stats-name">进行中</text>
          </view>
          <view class="stats-divider" />
          <view class="stats-item">
            <text class="stats-value">{{ stats.total }}</text>
            <text class="stats-name">总数</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-area">
      <view v-for="i in 4" :key="i" class="skeleton-card" />
    </view>

    <!-- 成就列表 -->
    <view v-else class="achievement-list">
      <view
        v-for="(list, type) in groupedAchievements"
        :key="type"
        class="achievement-group"
      >
        <!-- 分组标题 -->
        <view class="group-header">
          <text class="group-icon">{{ typeIcons[type] || '🎖️' }}</text>
          <text class="group-title">{{ typeLabels[type] || '其他成就' }}</text>
          <text class="group-count">{{ list.filter(a => a.is_unlocked).length }}/{{ list.length }}</text>
        </view>

        <!-- 成就卡片 -->
        <view class="achievement-grid">
          <view
            v-for="achievement in list"
            :key="achievement.id"
            class="achievement-card"
            :class="{ unlocked: achievement.is_unlocked }"
          >
            <!-- 图标区 -->
            <view
              class="card-icon-wrap"
              :style="{ backgroundColor: achievement.is_unlocked ? getColor(achievement) + '20' : '#f0f0f0' }"
            >
              <text class="card-icon" :class="{ grayscale: !achievement.is_unlocked }">
                {{ getIcon(achievement) }}
              </text>
            </view>

            <!-- 成就信息 -->
            <view class="card-info">
              <text class="card-name" :class="{ dimmed: !achievement.is_unlocked }">
                {{ achievement.achievement_name }}
              </text>
              <text class="card-desc">{{ achievement.description }}</text>
            </view>

            <!-- 状态/进度 -->
            <view class="card-status">
              <template v-if="achievement.is_unlocked">
                <text class="status-badge unlocked">✓</text>
              </template>
              <template v-else>
                <view class="progress-wrap">
                  <view class="progress-track">
                    <view
                      class="progress-fill"
                      :style="{ width: getProgressPercent(achievement) + '%', backgroundColor: getColor(achievement) }"
                    />
                  </view>
                  <text class="progress-text">{{ achievement.progress }}/{{ achievement.requirement_value }}</text>
                </view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="achievements.length === 0" class="empty-state">
        <text class="empty-icon">🏅</text>
        <text class="empty-text">还没有任何成就</text>
        <text class="empty-hint">完成训练任务解锁成就</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.stats-card {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.stats-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 32rpx;
}

.stats-circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-percent {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.stats-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}

.stats-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stats-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
}

.stats-name {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.loading-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-card {
  height: 180rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  border-radius: 24rpx;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.achievement-group {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.group-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.group-icon {
  font-size: 32rpx;
}

.group-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.group-count {
  font-size: 24rpx;
  color: #999999;
}

.achievement-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.achievement-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  transition: all 0.2s;

  &.unlocked {
    background-color: #f0fef0;
  }
}

.card-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  font-size: 40rpx;

  &.grayscale {
    filter: grayscale(1);
    opacity: 0.5;
  }
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4rpx;

  &.dimmed {
    color: #999999;
  }
}

.card-desc {
  display: block;
  font-size: 22rpx;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-status {
  flex-shrink: 0;
  width: 100rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.status-badge {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;

  &.unlocked {
    background-color: #6BCB77;
    color: #ffffff;
  }
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.progress-track {
  width: 80rpx;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 18rpx;
  color: #999999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 32rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #333333;
  font-weight: 600;
}

.empty-hint {
  font-size: 26rpx;
  color: #999999;
}
</style>