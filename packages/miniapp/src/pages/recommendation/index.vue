<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { get } from '@/api/request'
import { getRecommendations, getWeeklyPlan, getUserProfile, type GameRecommendation, type WeeklyPlan, type UserProfile } from '@/api/recommendation'

const userStore = useUserStore()
const recommendations = ref<GameRecommendation[]>([])
const weeklyPlan = ref<WeeklyPlan | null>(null)
const userProfile = ref<UserProfile | null>(null)
const isLoading = ref(false)

// 维度中文映射
const dimensionNames: Record<string, string> = {
  sustained_attention: '持续注意力',
  selective_attention: '选择性注意力',
  divided_attention: '分配注意力',
  shifting_attention: '转移注意力',
  working_memory: '工作记忆',
  impulse_control: '冲动控制',
  reaction_speed: '反应速度',
  spatial_cognition: '空间认知'
}

// 维度图标
const dimensionIcons: Record<string, string> = {
  sustained_attention: '🎯',
  selective_attention: '👁️',
  divided_attention: '🔀',
  shifting_attention: '🔄',
  working_memory: '🧠',
  impulse_control: '⏸️',
  reaction_speed: '⚡',
  spatial_cognition: '🗺️'
}

// 星期标签
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 计算强弱项
const strengthWeakness = computed(() => {
  if (!userProfile.value) return { strengths: [], weaknesses: [] }
  
  const { dimensionScores } = userProfile.value
  const entries = Object.entries(dimensionScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
  
  return {
    strengths: entries.slice(0, 2).map(([key, score]) => ({
      dimension: key,
      name: dimensionNames[key] || key,
      icon: dimensionIcons[key] || '📊',
      score
    })),
    weaknesses: entries.slice(-2).map(([key, score]) => ({
      dimension: key,
      name: dimensionNames[key] || key,
      icon: dimensionIcons[key] || '📊',
      score
    }))
  }
})

async function loadData() {
  if (!userStore.currentChild) return
  isLoading.value = true
  
  try {
    const childId = userStore.currentChild.id
    
    // 并行加载数据
    const [profileRes, recsRes, planRes] = await Promise.all([
      getUserProfile(childId).catch(() => null),
      getRecommendations(childId, 5).catch(() => null),
      getWeeklyPlan(childId).catch(() => null)
    ])
    
    if (profileRes) userProfile.value = profileRes.data
    if (recsRes) recommendations.value = recsRes.data.recommendations
    if (planRes) weeklyPlan.value = planRes.data.plan
  } catch (error) {
    console.error('加载推荐数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

function getGameIcon(gameCode: string): string {
  const icons: Record<string, string> = {
    'schulte': '🔢',
    'audio_count': '🔊',
    'pattern_memory': '🃏',
    'visual_tracking': '👀',
    'rhythm_tap': '🎵',
    'auditory_memory': '👂',
    'maze_navigation': '🧭',
    'quick_sort': '🏷️',
    'target_tracking': '⭐'
  }
  return icons[gameCode] || '🎮'
}

function navigateToGame(gameCode: string) {
  const pageMap: Record<string, string> = {
    'schulte': '/pages/game-schulte/index',
    'audio_count': '/pages/game-audio/index',
    'pattern_memory': '/pages/game-memory/index',
    'visual_tracking': '/pages/game-visual/index',
    'rhythm_tap': '/pages/game-rhythm/index',
    'auditory_memory': '/pages/game-sound/index',
    'maze_navigation': '/pages/game-maze/index',
    'quick_sort': '/pages/game-sort/index',
    'target_tracking': '/pages/game-tracking/index'
  }
  
  const page = pageMap[gameCode]
  if (page) {
    uni.navigateTo({ url: page })
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchChildren().then(() => loadData())
  }
})
</script>

<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-area">
      <view class="skeleton-card" v-for="i in 3" :key="i" />
    </view>

    <template v-else>
      <!-- 头部信息 -->
      <view class="header-card">
        <view class="header-left">
          <view class="avatar-wrap">
            <image 
              class="avatar" 
              :src="userStore.currentChild?.avatar || '/static/avatar-default.png'"
              mode="aspectFill"
            />
          </view>
          <view class="child-info">
            <text class="child-name">{{ userStore.currentChild?.name || '小朋友' }}</text>
            <text class="child-age">年龄段：{{ userStore.currentChild?.ageGroup || '4-12岁' }}</text>
          </view>
        </view>
        <view class="header-right">
          <text class="refresh-time">智能推荐</text>
        </view>
      </view>

      <!-- 能力分析卡片 -->
      <view class="analysis-card" v-if="userProfile">
        <view class="card-title">
          <text class="title-icon">📊</text>
          <text class="title-text">能力分析</text>
        </view>
        
        <!-- 强项 -->
        <view class="ability-section" v-if="strengthWeakness.strengths.length > 0">
          <text class="section-label">💪 强项</text>
          <view class="ability-tags">
            <view 
              class="ability-tag strong" 
              v-for="item in strengthWeakness.strengths" 
              :key="item.dimension"
            >
              <text>{{ item.icon }}</text>
              <text class="tag-name">{{ item.name }}</text>
              <text class="tag-score">{{ item.score }}分</text>
            </view>
          </view>
        </view>
        
        <!-- 弱项 -->
        <view class="ability-section" v-if="strengthWeakness.weaknesses.length > 0">
          <text class="section-label">📈 提升空间</text>
          <view class="ability-tags">
            <view 
              class="ability-tag weak" 
              v-for="item in strengthWeakness.weaknesses" 
              :key="item.dimension"
            >
              <text>{{ item.icon }}</text>
              <text class="tag-name">{{ item.name }}</text>
              <text class="tag-score">{{ item.score }}分</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 推荐游戏 -->
      <view class="recommendations-section">
        <view class="section-header">
          <text class="section-title">🎯 为你推荐</text>
          <text class="section-subtitle">基于你的训练记录定制</text>
        </view>
        
        <view class="recommendation-list" v-if="recommendations.length > 0">
          <view 
            class="recommendation-card"
            v-for="(rec, index) in recommendations"
            :key="rec.gameId"
            @tap="navigateToGame(rec.gameCode)"
          >
            <view class="rec-rank">{{ index + 1 }}</view>
            <view class="rec-icon">{{ getGameIcon(rec.gameCode) }}</view>
            <view class="rec-info">
              <text class="rec-name">{{ rec.gameName }}</text>
              <text class="rec-reason">{{ rec.reason }}</text>
              <text class="rec-improvement">{{ rec.expectedImprovement }}</text>
            </view>
            <view class="rec-action">
              <text class="action-text">开始</text>
              <text class="action-arrow">→</text>
            </view>
          </view>
        </view>
        
        <view class="empty-recommendation" v-else>
          <text class="empty-icon">🎮</text>
          <text class="empty-text">完成更多训练解锁个性化推荐</text>
        </view>
      </view>

      <!-- 周计划 -->
      <view class="weekly-plan-section" v-if="weeklyPlan">
        <view class="section-header">
          <text class="section-title">📅 本周训练计划</text>
          <text class="section-subtitle">约{{ weeklyPlan.totalMinutes }}分钟</text>
        </view>
        
        <view class="plan-list">
          <view 
            class="plan-item" 
            v-for="(day, index) in weeklyPlan.dailyPlan" 
            :key="index"
            :class="{ 'is-today': day.day === new Date().getDay() }"
          >
            <view class="day-label">
              <text class="day-name">{{ dayNames[day.day] }}</text>
              <view class="today-badge" v-if="day.day === new Date().getDay()">今日</view>
            </view>
            <view class="day-games" v-if="day.games.length > 0">
              <view 
                class="game-chip" 
                v-for="(game, gi) in day.games" 
                :key="gi"
              >
                <text>{{ getGameIcon(game.gameCode) }}</text>
                <text class="chip-name">{{ game.gameCode }}</text>
                <text class="chip-rounds" v-if="game.rounds > 1">×{{ game.rounds }}</text>
              </view>
            </view>
            <text class="rest-tip" v-else>休息日</text>
          </view>
        </view>
        
        <view class="plan-advice">
          <text class="advice-icon">💡</text>
          <text class="advice-text">{{ weeklyPlan.focusAdvice }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.loading-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-card {
  height: 200rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  border-radius: 24rpx;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.header-card {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.avatar-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
}

.child-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.child-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.child-age {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.refresh-time {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.analysis-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.title-icon {
  font-size: 32rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.ability-section {
  margin-bottom: 16rpx;
}

.section-label {
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 12rpx;
  display: block;
}

.ability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.ability-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.ability-tag.strong {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.ability-tag.weak {
  background-color: #FFF3E0;
  color: #FF9800;
}

.tag-name {
  font-weight: 500;
}

.tag-score {
  font-size: 20rpx;
  opacity: 0.8;
}

.recommendations-section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.section-subtitle {
  font-size: 24rpx;
  color: #999999;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recommendation-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.rec-rank {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #6C63FF;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.rec-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.rec-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.rec-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.rec-reason {
  font-size: 22rpx;
  color: #666666;
}

.rec-improvement {
  font-size: 20rpx;
  color: #999999;
}

.rec-action {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 20rpx;
  background-color: #6C63FF;
  border-radius: 24rpx;
}

.action-text {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 500;
}

.action-arrow {
  font-size: 24rpx;
  color: #ffffff;
}

.empty-recommendation {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

.weekly-plan-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.plan-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
}

.plan-item.is-today {
  background-color: #EDE7F6;
}

.day-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  width: 80rpx;
}

.day-name {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.today-badge {
  font-size: 18rpx;
  padding: 4rpx 8rpx;
  background-color: #6C63FF;
  color: #ffffff;
  border-radius: 8rpx;
}

.day-games {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.game-chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 12rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  font-size: 22rpx;
}

.chip-name {
  color: #333333;
}

.chip-rounds {
  color: #6C63FF;
  font-weight: 600;
}

.rest-tip {
  font-size: 22rpx;
  color: #999999;
  font-style: italic;
}

.plan-advice {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8rpx;
  padding: 16rpx;
  background-color: #FFF8E1;
  border-radius: 12rpx;
}

.advice-icon {
  font-size: 28rpx;
}

.advice-text {
  flex: 1;
  font-size: 24rpx;
  color: #795548;
  line-height: 1.5;
}
</style>