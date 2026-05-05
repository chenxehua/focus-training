<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getWeeklyReport, getReportList, generateReport } from '@/api/report'
import ProgressBar from '@/components/ProgressBar.vue'
import type { WeeklyReport, ReportListItem } from '@/api/report'

const userStore = useUserStore()
const weeklyReport = ref<WeeklyReport | null>(null)
const isLoading = ref(false)
const reportList = ref<ReportListItem[]>([])
const isGenerating = ref(false)

// Tab状态: 'weekly' | 'history'
const activeTab = ref<'weekly' | 'history'>('weekly')

const selectedChildId = computed(() => userStore.currentChild?.id)

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  const remainM = m % 60
  if (h > 0) return `${h}小时${remainM}分钟`
  return `${m}分钟`
}

function getLevelLabel(score: number): string {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '需加强'
}

function getLevelColor(score: number): string {
  if (score >= 80) return '#6BCB77'
  if (score >= 60) return '#6C63FF'
  if (score >= 40) return '#FFD93D'
  return '#FF8A80'
}

const trendMax = computed(() => {
  if (!weeklyReport.value) return 100
  const scores = weeklyReport.value.trendData.map(d => d.focusScore)
  return Math.max(...scores, 100)
})

async function loadReport() {
  if (!selectedChildId.value) return
  isLoading.value = true
  try {
    const res = await getWeeklyReport(selectedChildId.value)
    weeklyReport.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function loadReportList() {
  if (!selectedChildId.value) return
  isLoading.value = true
  try {
    const res = await getReportList({ childId: selectedChildId.value, page: 1, pageSize: 20 })
    reportList.value = res.data.list || []
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function handleGenerateReport() {
  if (!selectedChildId.value) return

  uni.showModal({
    title: '生成报告',
    content: '确定要为孩子生成一份专注力评估报告吗？',
    success: async (res) => {
      if (res.confirm) {
        isGenerating.value = true
        try {
          await generateReport(selectedChildId.value, 'weekly')
          uni.showToast({ title: '报告生成成功', icon: 'success' })
          loadReportList()
          loadReport()
        } catch (error) {
          console.error(error)
          uni.showToast({ title: '生成失败', icon: 'none' })
        } finally {
          isGenerating.value = false
        }
      }
    }
  })
}

function viewReportDetail(reportId: number) {
  uni.navigateTo({ url: `/pages/report-detail/index?id=${reportId}` })
}

function formatReportDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function switchTab(tab: 'weekly' | 'history') {
  activeTab.value = tab
  if (tab === 'weekly') {
    loadReport()
  } else {
    loadReportList()
  }
}

function switchChild(childId: number) {
  const child = userStore.children.find(c => c.id === childId)
  if (child) {
    userStore.setCurrentChild(child)
    if (activeTab.value === 'weekly') {
      loadReport()
    } else {
      loadReportList()
    }
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) return
  userStore.fetchChildren().then(() => {
    if (activeTab.value === 'weekly') {
      loadReport()
    } else {
      loadReportList()
    }
  })
})
</script>

<template>
  <view class="page">
    <!-- 未登录 -->
    <view v-if="!userStore.isLoggedIn" class="not-login">
      <text class="not-login-icon">👨‍👩‍👧</text>
      <text class="not-login-text">请先登录查看孩子的训练报告</text>
    </view>

    <template v-else>
      <!-- 儿童切换 -->
      <view v-if="userStore.children.length > 0" class="child-switch">
        <scroll-view scroll-x class="child-scroll">
          <view class="child-list">
            <view
              v-for="child in userStore.children"
              :key="child.id"
              class="child-tab"
              :class="{ active: userStore.currentChild?.id === child.id }"
              @tap="switchChild(child.id)"
            >
              <image class="child-tab-avatar" :src="child.avatar || '/static/avatar-default.png'" mode="aspectFill" />
              <text class="child-tab-name">{{ child.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 无孩子 -->
      <view v-if="userStore.children.length === 0" class="empty-state">
        <text class="empty-icon">👶</text>
        <text class="empty-text">还没有孩子信息</text>
        <text class="empty-hint">请前往「我的」页面添加孩子</text>
      </view>

      <template v-else>
        <!-- Tab切换 -->
        <view class="tab-bar">
          <view
            class="tab-item"
            :class="{ active: activeTab === 'weekly' }"
            @tap="switchTab('weekly')"
          >
            <text class="tab-text">本周报告</text>
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 'history' }"
            @tap="switchTab('history')"
          >
            <text class="tab-text">历史报告</text>
          </view>
        </view>

        <!-- 生成报告按钮 (历史报告Tab下显示) -->
        <view v-if="activeTab === 'history'" class="generate-section">
          <view class="btn-generate" @tap="handleGenerateReport">
            <text class="btn-icon">📊</text>
            <text class="btn-text">{{ isGenerating ? '生成中...' : '生成新评估报告' }}</text>
          </view>
        </view>

        <!-- 加载中 -->
        <view v-if="isLoading" class="loading-area">
          <view v-for="i in 3" :key="i" class="skeleton-block" />
        </view>

        <!-- 本周报告内容 -->
        <view v-else-if="activeTab === 'weekly' && weeklyReport" class="report-content">
          <!-- 本周概览 -->
          <view class="section-card">
            <text class="section-title">本周训练概览</text>
            <view class="overview-grid">
              <view class="overview-item">
                <text class="overview-value">{{ weeklyReport.trainingCount }}</text>
                <text class="overview-label">训练次数</text>
              </view>
              <view class="overview-item">
                <text class="overview-value">{{ formatDuration(weeklyReport.totalDuration) }}</text>
                <text class="overview-label">总训练时长</text>
              </view>
              <view class="overview-item" style="grid-column: 1 / -1">
                <text
                  class="overview-value"
                  :style="{ color: getLevelColor(weeklyReport.avgFocusScore) }"
                >
                  {{ weeklyReport.avgFocusScore }}
                </text>
                <text class="overview-label">平均专注得分 · {{ getLevelLabel(weeklyReport.avgFocusScore) }}</text>
              </view>
            </view>
          </view>

          <!-- 每日趋势 -->
          <view class="section-card">
            <text class="section-title">本周专注趋势</text>
            <view class="trend-chart">
              <view
                v-for="(day, index) in weeklyReport.trendData"
                :key="index"
                class="trend-bar-wrap"
              >
                <text class="trend-score">{{ day.focusScore || '-' }}</text>
                <view class="trend-bar-track">
                  <view
                    class="trend-bar-fill"
                    :style="{
                      height: day.focusScore ? `${(day.focusScore / trendMax) * 100}%` : '0%',
                      backgroundColor: getLevelColor(day.focusScore),
                    }"
                  />
                </view>
                <text class="trend-date">{{ day.date.slice(5) }}</text>
              </view>
            </view>
          </view>

          <!-- 游戏分布 -->
          <view v-if="weeklyReport.gameBreakdown.length > 0" class="section-card">
            <text class="section-title">游戏训练分布</text>
            <view class="game-breakdown">
              <view
                v-for="item in weeklyReport.gameBreakdown"
                :key="item.gameCode"
                class="breakdown-item"
              >
                <view class="breakdown-left">
                  <text class="breakdown-name">{{ item.gameName }}</text>
                  <text class="breakdown-count">{{ item.count }} 次</text>
                </view>
                <view class="breakdown-right">
                  <ProgressBar
                    :value="item.avgScore"
                    :color="'#6C63FF'"
                    :height="12"
                    :show-label="true"
                  />
                </view>
              </view>
            </view>
          </view>

          <!-- 成就亮点 -->
          <view v-if="weeklyReport.highlights.length > 0" class="section-card">
            <text class="section-title">本周亮点</text>
            <view class="highlights">
              <view
                v-for="(item, index) in weeklyReport.highlights"
                :key="index"
                class="highlight-item"
              >
                <view class="highlight-icon-wrap">
                  <text class="highlight-icon">🏆</text>
                </view>
                <view class="highlight-content">
                  <text class="highlight-title">{{ item.title }}</text>
                  <text class="highlight-desc">{{ item.description }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 历史报告列表 -->
        <view v-else-if="activeTab === 'history'" class="report-list">
          <view v-if="reportList.length === 0" class="empty-state">
            <text class="empty-icon">📋</text>
            <text class="empty-text">暂无历史报告</text>
            <text class="empty-hint">点击上方按钮生成评估报告</text>
          </view>
          <view
            v-else
            v-for="report in reportList"
            :key="report.id"
            class="report-item"
            @tap="viewReportDetail(report.id)"
          >
            <view class="report-item-left">
              <text class="report-item-type">
                {{ report.reportType === 'daily' ? '日报告' : report.reportType === 'weekly' ? '周报告' : '月报告' }}
              </text>
              <text class="report-item-date">{{ formatReportDate(report.createdAt) }}</text>
            </view>
            <view class="report-item-right">
              <view class="report-item-score">
                <text class="score-num">{{ report.overallScore }}</text>
                <text class="score-unit">分</text>
              </view>
              <text class="report-item-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 暂无数据 -->
        <view v-else-if="activeTab === 'weekly'" class="empty-state">
          <text class="empty-icon">📊</text>
          <text class="empty-text">本周暂无训练数据</text>
          <text class="empty-hint">完成游戏后查看专注力报告</text>
        </view>
      </template>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.not-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 32rpx;
  gap: 20rpx;
}

.not-login-icon { font-size: 80rpx; }
.not-login-text { font-size: 30rpx; color: #666666; text-align: center; }

.child-switch {
  background-color: #ffffff;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.child-scroll { width: 100%; }

.child-list {
  display: flex;
  flex-direction: row;
  padding: 0 24rpx;
  gap: 24rpx;
}

.child-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  flex-shrink: 0;

  &.active {
    background-color: #f0eeff;
    .child-tab-name { color: #6C63FF; font-weight: 600; }
  }
}

.child-tab-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.child-tab-name {
  font-size: 22rpx;
  color: #666666;
}

.tab-bar {
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
  padding: 0 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;

  &.active {
    border-bottom: 4rpx solid #6C63FF;
    .tab-text { color: #6C63FF; font-weight: 600; }
  }
}

.tab-text {
  font-size: 28rpx;
  color: #666666;
}

.generate-section {
  padding: 24rpx;
}

.btn-generate {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background-color: #6C63FF;
  border-radius: 99rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(108, 99, 255, 0.3);

  &:active { opacity: 0.85; }
}

.btn-icon { font-size: 32rpx; }

.btn-text {
  font-size: 30rpx;
  color: #ffffff;
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
.empty-hint { font-size: 26rpx; color: #999999; text-align: center; }

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

.report-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.report-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);

  &:active { background-color: #f8f8f8; }
}

.report-item-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.report-item-type {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
}

.report-item-date {
  font-size: 22rpx;
  color: #999999;
}

.report-item-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.report-item-score {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.score-num {
  font-size: 48rpx;
  font-weight: 700;
  color: #6C63FF;
}

.score-unit {
  font-size: 24rpx;
  color: #999999;
  margin-left: 4rpx;
}

.report-item-arrow {
  font-size: 36rpx;
  color: #cccccc;
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

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx;
  gap: 8rpx;
}

.overview-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #6C63FF;
}

.overview-label {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
}

.trend-chart {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  height: 200rpx;
  padding: 0 8rpx;
}

.trend-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  gap: 6rpx;
}

.trend-score {
  font-size: 20rpx;
  color: #333333;
  font-weight: 600;
  height: 28rpx;
}

.trend-bar-track {
  flex: 1;
  width: 32rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.trend-bar-fill {
  width: 100%;
  border-radius: 4rpx;
  transition: height 0.5s ease;
}

.trend-date {
  font-size: 20rpx;
  color: #999999;
  height: 28rpx;
}

.game-breakdown {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.breakdown-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.breakdown-left {
  width: 160rpx;
  flex-shrink: 0;
}

.breakdown-name {
  display: block;
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.breakdown-count {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.breakdown-right {
  flex: 1;
}

.highlights {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.highlight-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
}

.highlight-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  background-color: #fff9e6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.highlight-icon { font-size: 32rpx; }

.highlight-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.highlight-desc {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-top: 4rpx;
}
</style>