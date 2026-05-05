<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getReportDetail } from '@/api/report'
import type { FocusReport } from '@/api/report'

const userStore = useUserStore()
const report = ref<FocusReport | null>(null)
const isLoading = ref(false)

// 获取页面参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
const reportId = currentPage?.options?.id || 0

// 维度名称映射
const dimensionNames: Record<string, string> = {
  attentionScore: '注意力',
  perceptionScore: '感知能力',
  memoryScore: '记忆力',
  reactionScore: '反应速度',
  meditationScore: '冥想放松',
  observationScore: '观察力',
  calculationScore: '计算力',
}

// 维度图标
const dimensionIcons: Record<string, string> = {
  attentionScore: '👁️',
  perceptionScore: '🎨',
  memoryScore: '🧠',
  reactionScore: '⚡',
  meditationScore: '🧘',
  observationScore: '🔍',
  calculationScore: '🔢',
}

// 获取维度数据
const dimensionList = computed(() => {
  if (!report.value) return []
  const dims = [
    { key: 'attentionScore', score: report.value.attentionScore },
    { key: 'perceptionScore', score: report.value.perceptionScore },
    { key: 'memoryScore', score: report.value.memoryScore },
    { key: 'reactionScore', score: report.value.reactionScore },
    { key: 'meditationScore', score: report.value.meditationScore },
    { key: 'observationScore', score: report.value.observationScore },
    { key: 'calculationScore', score: report.value.calculationScore },
  ]
  return dims.map(d => ({
    ...d,
    name: dimensionNames[d.key] || d.key,
    icon: dimensionIcons[d.key] || '📊',
  }))
})

// 获取等级标签
function getLevelLabel(score: number): string {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '一般'
  return '需加强'
}

// 获取等级颜色
function getLevelColor(score: number): string {
  if (score >= 85) return '#6BCB77'
  if (score >= 70) return '#6C63FF'
  if (score >= 60) return '#FFD93D'
  return '#FF8A80'
}

// 获取总体等级
const overallLevel = computed(() => {
  if (!report.value) return '需加强'
  return getLevelLabel(report.value.overallScore)
})

// 获取报告类型标签
const reportTypeLabel = computed(() => {
  if (!report.value) return ''
  const labels: Record<string, string> = {
    daily: '日报告',
    weekly: '周报告',
    monthly: '月报告',
  }
  return labels[report.value.reportType] || '报告'
})

// 加载报告数据
async function loadReport() {
  if (!reportId) {
    uni.showToast({ title: '报告不存在', icon: 'none' })
    return
  }

  isLoading.value = true
  try {
    const res = await getReportDetail(reportId)
    report.value = res.data
  } catch (error) {
    console.error(error)
    uni.showToast({ title: '加载报告失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

onMounted(() => {
  loadReport()
})
</script>

<template>
  <view class="page">
    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-area">
      <view class="skeleton-block" />
      <view class="skeleton-block" />
      <view class="skeleton-block" />
    </view>

    <!-- 报告内容 -->
    <view v-else-if="report" class="report-content">
      <!-- 报告头部 -->
      <view class="report-header">
        <view class="header-top">
          <text class="report-type">{{ reportTypeLabel }}</text>
          <text class="report-date">{{ formatDate(report.createdAt) }}</text>
        </view>
        <view class="overall-score">
          <text class="score-value">{{ report.overallScore }}</text>
          <text class="score-label">综合得分</text>
          <text class="level-badge" :style="{ backgroundColor: getLevelColor(report.overallScore) }">
            {{ overallLevel }}
          </text>
        </view>
      </view>

      <!-- 7维度分析 -->
      <view class="section-card">
        <text class="section-title">七维度分析</text>
        <view class="dimensions-grid">
          <view
            v-for="dim in dimensionList"
            :key="dim.key"
            class="dimension-item"
          >
            <view class="dimension-icon">{{ dim.icon }}</view>
            <view class="dimension-info">
              <text class="dimension-name">{{ dim.name }}</text>
              <text class="dimension-score" :style="{ color: getLevelColor(dim.score) }">
                {{ dim.score }}分
              </text>
            </view>
            <view class="dimension-bar">
              <view
                class="dimension-bar-fill"
                :style="{
                  width: `${dim.score}%`,
                  backgroundColor: getLevelColor(dim.score)
                }"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 总评 -->
      <view class="section-card">
        <text class="section-title">总评</text>
        <view class="summary-content">
          <text class="summary-text">{{ report.summary }}</text>
        </view>
      </view>

      <!-- 建议 -->
      <view class="section-card">
        <text class="section-title">提升建议</text>
        <view class="suggestions-content">
          <text class="suggestion-text">{{ report.suggestions }}</text>
        </view>
      </view>

      <!-- 返回按钮 -->
      <view class="back-btn" @tap="uni.navigateBack()">
        <text class="back-text">返回报告列表</text>
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-else class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">报告不存在</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.loading-area {
  padding: 24rpx;
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

.report-content {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.report-header {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 24rpx;
  padding: 32rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.report-type {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.report-date {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.overall-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.score-value {
  font-size: 80rpx;
  font-weight: 700;
  color: #ffffff;
}

.score-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
}

.level-badge {
  padding: 8rpx 24rpx;
  border-radius: 99rpx;
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
  margin-top: 8rpx;
}

.section-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 24rpx;
}

.dimensions-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.dimension-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.dimension-icon {
  font-size: 36rpx;
  width: 48rpx;
  text-align: center;
}

.dimension-info {
  width: 140rpx;
  flex-shrink: 0;
}

.dimension-name {
  display: block;
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.dimension-score {
  display: block;
  font-size: 22rpx;
  margin-top: 4rpx;
}

.dimension-bar {
  flex: 1;
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.dimension-bar-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.summary-content {
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 24rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

.suggestions-content {
  background-color: #f0eeff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.suggestion-text {
  font-size: 28rpx;
  color: #6C63FF;
  line-height: 1.6;
}

.back-btn {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);

  &:active { opacity: 0.8; }
}

.back-text {
  font-size: 28rpx;
  color: #6C63FF;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 32rpx;
  gap: 16rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 30rpx; color: #333333; font-weight: 600; }
</style>