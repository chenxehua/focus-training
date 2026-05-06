<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getReportList, getReportDetail } from '@/api/report'
import type { FocusReport, ReportListItem } from '@/api/report'

const userStore = useUserStore()

const reports = ref<ReportListItem[]>([])
const selectedReport = ref<FocusReport | null>(null)
const isLoading = ref(false)
const activeTab = ref<'weekly' | 'history'>('weekly')

// 周报告数据
const weeklyReport = ref<any>(null)
const isLoadingWeekly = ref(false)

const weeklyReports = computed(() => {
  return reports.value.filter(r => r.reportType === 'weekly').slice(0, 5)
})

async function loadWeeklyReport() {
  if (!userStore.currentChild) return

  isLoadingWeekly.value = true
  try {
    const res = await getReportList(userStore.currentChild.id, 'weekly')
    if (res.data && res.data.length > 0) {
      weeklyReport.value = res.data[0]
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingWeekly.value = false
  }
}

async function loadHistoryReports() {
  if (!userStore.currentChild) return

  isLoading.value = true
  try {
    const res = await getReportList(userStore.currentChild.id, 'weekly')
    reports.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function viewReportDetail(reportId: number) {
  try {
    const res = await getReportDetail(reportId)
    selectedReport.value = res.data
  } catch (error) {
    console.error(error)
  }
}

function closeDetail() {
  selectedReport.value = null
}

onMounted(() => {
  if (userStore.currentChild) {
    loadWeeklyReport()
    loadHistoryReports()
  }
})
</script>

<template>
  <view class="page">
    <!-- 标题 -->
    <view class="header">
      <text class="title">家长报告</text>
      <text class="subtitle">查看孩子的专注力训练情况</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        class="tab"
        :class="{ active: activeTab === 'weekly' }"
        @tap="activeTab = 'weekly'"
      >
        <text>周报</text>
      </view>
      <view
        class="tab"
        :class="{ active: activeTab === 'history' }"
        @tap="activeTab = 'history'"
      >
        <text>历史报告</text>
      </view>
    </view>

    <!-- 周报内容 -->
    <view v-if="activeTab === 'weekly'" class="tab-content">
      <view v-if="isLoadingWeekly" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="weeklyReport" class="weekly-report">
        <view class="report-card">
          <view class="report-header">
            <text class="report-title">本周专注力报告</text>
            <text class="report-date">{{ weeklyReport.reportDate }}</text>
          </view>

          <view class="score-overview">
            <view class="score-circle">
              <text class="score-value">{{ weeklyReport.avgFocusScore || 0 }}</text>
              <text class="score-label">平均分</text>
            </view>
            <view class="score-details">
              <view class="score-item">
                <text class="score-label">训练次数</text>
                <text class="score-num">{{ weeklyReport.trainingCount || 0 }}</text>
              </view>
              <view class="score-item">
                <text class="score-label">总时长</text>
                <text class="score-num">{{ weeklyReport.totalDuration || 0 }}分钟</text>
              </view>
            </view>
          </view>

          <view class="report-actions">
            <view class="btn-detail" @tap="viewReportDetail(weeklyReport.id)">
              <text>查看详情</text>
            </view>
          </view>
        </view>

        <!-- 周趋势图 -->
        <view class="trend-card">
          <text class="card-title">本周趋势</text>
          <view class="trend-placeholder">
            <text>📊 趋势图表</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无周报数据</text>
        <text class="empty-hint">完成更多训练后即可查看</text>
      </view>
    </view>

    <!-- 历史报告 -->
    <view v-if="activeTab === 'history'" class="tab-content">
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="reports.length > 0" class="history-list">
        <view
          v-for="report in weeklyReports"
          :key="report.id"
          class="history-item"
          @tap="viewReportDetail(report.id)"
        >
          <view class="history-left">
            <text class="history-title">{{ report.reportDate }} 周报</text>
            <text class="history-meta">{{ report.trainingCount }}次训练</text>
          </view>
          <view class="history-right">
            <text class="history-score">{{ report.avgFocusScore }}</text>
            <text class="history-arrow">›</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无历史报告</text>
        <text class="empty-hint">完成更多训练后可查看</text>
      </view>
    </view>

    <!-- 报告详情弹窗 -->
    <view v-if="selectedReport" class="detail-modal">
      <view class="detail-overlay" @tap="closeDetail" />
      <view class="detail-content">
        <view class="detail-header">
          <text class="detail-title">{{ selectedReport.reportDate }} 报告详情</text>
          <text class="detail-close" @tap="closeDetail">×</text>
        </view>

        <scroll-view class="detail-body" scroll-y>
          <view class="dimension-list">
            <view
              v-for="(dim, key) in selectedReport.dimensions"
              :key="key"
              class="dimension-item"
            >
              <view class="dimension-info">
                <text class="dimension-name">{{ dim.name }}</text>
                <text class="dimension-score">{{ dim.score }}分</text>
              </view>
              <view class="dimension-bar">
                <view
                  class="dimension-fill"
                  :style="{ width: `${dim.score}%` }"
                />
              </view>
            </view>
          </view>

          <view class="summary-section">
            <text class="section-title">总体评价</text>
            <text class="summary-text">{{ selectedReport.summary }}</text>
          </view>

          <view class="recommendation-section">
            <text class="section-title">建议</text>
            <view
              v-for="(rec, idx) in selectedReport.recommendations"
              :key="idx"
              class="recommendation-item"
            >
              <text>{{ idx + 1 }}. {{ rec }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.header {
  margin-bottom: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: #999999;
  margin-top: 8rpx;
}

.tab-bar {
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666666;

  &.active {
    background-color: #6C63FF;
    color: #ffffff;
  }
}

.tab-content {
  min-height: 400rpx;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx;
  color: #999999;
}

.report-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.report-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.report-date {
  font-size: 24rpx;
  color: #999999;
}

.score-overview {
  display: flex;
  align-items: center;
  gap: 32rpx;
  margin-bottom: 24rpx;
}

.score-circle {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
}

.score-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.score-item {
  display: flex;
  flex-direction: column;
}

.score-num {
  font-size: 32rpx;
  font-weight: 700;
  color: #6C63FF;
}

.report-actions {
  display: flex;
  justify-content: center;
}

.btn-detail {
  padding: 16rpx 48rpx;
  background-color: #6C63FF;
  border-radius: 99rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.trend-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

.trend-placeholder {
  height: 200rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
  gap: 12rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 32rpx; color: #333333; font-weight: 600; }
.empty-hint { font-size: 26rpx; color: #999999; }

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.history-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.history-meta {
  font-size: 24rpx;
  color: #999999;
}

.history-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.history-score {
  font-size: 36rpx;
  font-weight: 700;
  color: #6C63FF;
}

.history-arrow {
  font-size: 32rpx;
  color: #999999;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
}

.detail-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.detail-close {
  font-size: 48rpx;
  color: #999999;
  line-height: 1;
}

.detail-body {
  flex: 1;
  padding: 24rpx 32rpx;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dimension-info {
  display: flex;
  justify-content: space-between;
}

.dimension-name {
  font-size: 28rpx;
  color: #333333;
}

.dimension-score {
  font-size: 28rpx;
  font-weight: 700;
  color: #6C63FF;
}

.dimension-bar {
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.dimension-fill {
  height: 100%;
  background: linear-gradient(90deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 8rpx;
}

.summary-section,
.recommendation-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

.summary-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
}

.recommendation-item {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.8;
}
</style>