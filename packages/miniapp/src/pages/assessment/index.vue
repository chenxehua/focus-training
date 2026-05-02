<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { get } from '@/api/request'

const userStore = useUserStore()
const assessmentData = ref<AssessmentData | null>(null)
const isLoading = ref(false)

interface AssessmentData {
  childId: number
  childName: string
  assessmentDate: string
  ageGroup: string
  dimensions: {
    [key: string]: {
      score: number
      level: string
      levelColor: string
      games: { gameName: string; score: number }[]
    }
  }
  overallScore: number
  overallLevel: string
  summary: string
  recommendations: string[]
}

// 7维度定义
const dimensionNames: Record<string, { name: string; icon: string; desc: string }> = {
  sustained_attention: { name: '持续注意力', icon: '🎯', desc: '长时间保持专注的能力' },
  selective_attention: { name: '选择性注意', icon: '👁️', desc: '在干扰中筛选目标的能力' },
  divided_attention: { name: '分配注意力', icon: '🔀', desc: '同时处理多项任务的能力' },
  shifting_attention: { name: '转移注意力', icon: '🔄', desc: '切换注意焦点的能力' },
  working_memory: { name: '工作记忆', icon: '🧠', desc: '短时信息存储与加工' },
  impulse_control: { name: '冲动控制', icon: '⏸️', desc: '抑制冲动反应的能力' },
  reaction_speed: { name: '反应速度', icon: '⚡', desc: '对刺激的快速反应能力' },
}

// 等级标签
function getLevelLabel(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '中等'
  if (score >= 40) return '一般'
  return '需加强'
}

// 等级颜色
function getLevelColor(score: number): string {
  if (score >= 90) return '#6BCB77' // 绿色 - 优秀
  if (score >= 75) return '#4ECDC4' // 青色 - 良好
  if (score >= 60) return '#6C63FF' // 紫色 - 中等
  if (score >= 40) return '#FFD93D' // 黄色 - 一般
  return '#FF6B6B' // 红色 - 需加强
}

// 获取总体等级
function getOverallLevel(scores: number[]): { label: string; color: string } {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return {
    label: getLevelLabel(avg),
    color: getLevelColor(avg),
  }
}

// 计算雷达图数据
const radarData = computed(() => {
  if (!assessmentData.value) return []
  const dimensions = Object.entries(assessmentData.value.dimensions)
  return dimensions.map(([key, data]) => ({
    name: dimensionNames[key]?.name || key,
    value: data.score,
    max: 100,
  }))
})

// 计算平均分
const avgScore = computed(() => {
  if (!assessmentData.value) return 0
  const scores = Object.values(assessmentData.value.dimensions).map(d => d.score)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

async function loadAssessment() {
  if (!userStore.currentChild) return
  isLoading.value = true
  try {
    const res = await get<AssessmentData>(`/api/assessment/${userStore.currentChild.id}`)
    assessmentData.value = res.data
  } catch (error) {
    console.error('加载评估报告失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchChildren().then(() => loadAssessment())
  }
})
</script>

<template>
  <view class="page">
    <!-- 头部信息 -->
    <view class="header-card">
      <view class="header-info">
        <view class="child-avatar-wrap">
          <image
            class="child-avatar"
            :src="userStore.currentChild?.avatar || '/static/avatar-default.png'"
            mode="aspectFill"
          />
        </view>
        <view class="child-details">
          <text class="child-name">{{ userStore.currentChild?.name || '小朋友' }}</text>
          <text class="child-age">年龄段：{{ userStore.currentChild?.ageGroup || '4-12岁' }}</text>
        </view>
      </view>
      <view class="assessment-date">
        <text class="date-label">评估日期</text>
        <text class="date-value">{{ assessmentData?.assessmentDate || '—' }}</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-area">
      <view v-for="i in 3" :key="i" class="skeleton-block" />
    </view>

    <!-- 评估内容 -->
    <template v-else-if="assessmentData">
      <!-- 总览卡片 -->
      <view class="overall-card">
        <view class="overall-header">
          <text class="overall-title">综合专注力评估</text>
          <view class="overall-badge" :style="{ backgroundColor: getOverallLevel(Object.values(assessmentData.dimensions).map(d => d.score)).color + '20' }">
            <text class="overall-badge-text" :style="{ color: getOverallLevel(Object.values(assessmentData.dimensions).map(d => d.score)).color }">
              {{ getOverallLevel(Object.values(assessmentData.dimensions).map(d => d.score)).label }}
            </text>
          </view>
        </view>
        <view class="overall-score-wrap">
          <text class="overall-score">{{ avgScore }}</text>
          <text class="overall-max">/100</text>
        </view>
        <view class="overall-summary">
          {{ assessmentData.summary || '继续加油训练专注力！' }}
        </view>
      </view>

      <!-- 七维度评估 -->
      <view class="dimensions-section">
        <text class="section-title">七维度能力评估</text>
        <view class="dimensions-grid">
          <view
            v-for="(info, key) in dimensionNames"
            :key="key"
            class="dimension-card"
          >
            <view class="dimension-header">
              <text class="dimension-icon">{{ info.icon }}</text>
              <view class="dimension-title-wrap">
                <text class="dimension-name">{{ info.name }}</text>
                <text class="dimension-desc">{{ info.desc }}</text>
              </view>
            </view>
            <view class="dimension-score-wrap">
              <text
                class="dimension-score"
                :style="{ color: assessmentData.dimensions[key]?.levelColor || '#6C63FF' }"
              >
                {{ assessmentData.dimensions[key]?.score || 0 }}
              </text>
              <text class="dimension-max">分</text>
            </view>
            <view class="dimension-level">
              <text
                class="level-badge"
                :style="{
                  backgroundColor: assessmentData.dimensions[key]?.levelColor + '20',
                  color: assessmentData.dimensions[key]?.levelColor
                }"
              >
                {{ assessmentData.dimensions[key]?.level || '未评估' }}
              </text>
            </view>
            <!-- 游戏来源 -->
            <view v-if="assessmentData.dimensions[key]?.games?.length > 0" class="dimension-games">
              <text class="games-label">相关游戏：</text>
              <text class="games-list">
                {{ assessmentData.dimensions[key].games.map(g => g.gameName).join('、') }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 训练建议 -->
      <view v-if="assessmentData.recommendations?.length > 0" class="recommendations-section">
        <text class="section-title">个性化训练建议</text>
        <view class="recommendations-list">
          <view
            v-for="(rec, index) in assessmentData.recommendations"
            :key="index"
            class="recommendation-item"
          >
            <view class="rec-number">{{ index + 1 }}</view>
            <text class="rec-text">{{ rec }}</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">📊</text>
      <text class="empty-text">暂无评估数据</text>
      <text class="empty-hint">完成足够的训练后，系统将自动生成专注力评估报告</text>
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

.header-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.child-avatar-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.child-avatar {
  width: 100%;
  height: 100%;
}

.child-details {
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

.assessment-date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rpx;
}

.date-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.date-value {
  font-size: 24rpx;
  color: #ffffff;
}

.loading-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-block {
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

.overall-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.overall-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.overall-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.overall-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.overall-badge-text {
  font-size: 22rpx;
  font-weight: 600;
}

.overall-score-wrap {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 16rpx;
}

.overall-score {
  font-size: 80rpx;
  font-weight: 700;
  color: #6C63FF;
}

.overall-max {
  font-size: 32rpx;
  color: #999999;
  margin-left: 8rpx;
}

.overall-summary {
  font-size: 26rpx;
  color: #666666;
  text-align: center;
  line-height: 1.6;
}

.dimensions-section {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.dimension-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.dimension-header {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.dimension-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.dimension-title-wrap {
  flex: 1;
  min-width: 0;
}

.dimension-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.dimension-desc {
  display: block;
  font-size: 20rpx;
  color: #999999;
  margin-top: 2rpx;
}

.dimension-score-wrap {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 8rpx;
}

.dimension-score {
  font-size: 40rpx;
  font-weight: 700;
}

.dimension-max {
  font-size: 22rpx;
  color: #999999;
}

.dimension-level {
  margin-bottom: 8rpx;
}

.level-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.dimension-games {
  padding-top: 8rpx;
  border-top: 1rpx solid #f0f0f0;
}

.games-label {
  font-size: 20rpx;
  color: #999999;
}

.games-list {
  font-size: 20rpx;
  color: #666666;
}

.recommendations-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recommendation-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
  padding: 16rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
}

.rec-number {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background-color: #6C63FF;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rec-text {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
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
  text-align: center;
}
</style>