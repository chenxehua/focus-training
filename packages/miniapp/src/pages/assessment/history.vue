<template>
  <view class="history-container">
    <!-- 顶部标题 -->
    <view class="header">
      <view class="header-content">
        <text class="header-title">📋 测评历史</text>
        <text class="header-subtitle">查看孩子的专注力发展轨迹</text>
      </view>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-area">
      <view class="filter-tabs">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: currentTab === tab.key }"
          @tap="switchTab(tab.key)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 报告列表 -->
    <view class="report-list" v-if="reports.length > 0">
      <view
        v-for="report in reports"
        :key="report.id"
        class="report-card"
        @tap="viewReport(report)"
      >
        <!-- 报告基本信息 -->
        <view class="report-header">
          <view class="report-date">
            <text class="date-value">{{ formatDate(report.assessmentDate) }}</text>
            <text class="date-day">{{ formatDay(report.assessmentDate) }}</text>
          </view>
          <view class="report-score">
            <text class="score-value">{{ report.overallScore }}</text>
            <text class="score-label">综合评分</text>
          </view>
        </view>

        <!-- 评分进度条 -->
        <view class="score-bar">
          <view
            class="bar-fill"
            :style="{
              width: report.overallPercentile + '%',
              background: getScoreColor(report.overallPercentile)
            }"
          ></view>
        </view>

        <!-- 评级标签 -->
        <view class="report-tags">
          <text class="rating-tag" :class="'rating-' + getRatingClass(report.overallRating)">
            {{ report.overallRating }}
          </text>
          <text class="age-tag">{{ report.ageGroup }}</text>
        </view>

        <!-- 维度预览 -->
        <view class="dimensions-preview">
          <view
            v-for="(dim, index) in report.dimensions.slice(0, 4)"
            :key="index"
            class="dim-item"
          >
            <text class="dim-name">{{ dim.dimensionName.replace('注意力', '').replace('记忆', '') }}</text>
            <text class="dim-value" :style="{ color: getScoreColor(dim.percentile) }">{{ dim.percentile }}%</text>
          </view>
        </view>

        <!-- 底部操作 -->
        <view class="report-actions">
          <button class="action-btn view-btn" @tap.stop="viewReport(report)">
            查看详情
          </button>
          <button class="action-btn compare-btn" @tap.stop="compareReport(report)" v-if="reports.length > 1">
            对比
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无测评记录</text>
      <text class="empty-desc">开始测评，了解孩子的专注力发展水平</text>
      <button class="start-btn" @tap="startAssessment">开始测评</button>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && reports.length > 0">
      <text v-if="loading" class="loading-text">加载中...</text>
      <text v-else class="load-text" @tap="loadMore">加载更多</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && reports.length === 0" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 测评历史页面
 * 功能：展示测评历史列表、筛选、对比
 */
import { getReportList } from '@/api/initialAssessment'

export default {
  data() {
    return {
      childId: null,
      loading: false,
      
      // 筛选
      currentTab: 'all',
      tabs: [
        { key: 'all', label: '全部' },
        { key: 'initial', label: '初次测评' },
        { key: 'followup', label: '复测' }
      ],
      
      // 分页
      page: 1,
      pageSize: 10,
      total: 0,
      hasMore: false,
      
      // 报告列表
      reports: []
    }
  },

  onLoad(options) {
    if (options.childId) {
      this.childId = parseInt(options.childId)
    }
    this.loadReports()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.childId) {
      this.refreshReports()
    }
  },

  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },

  methods: {
    /**
     * 加载报告列表
     */
    async loadReports() {
      if (!this.childId) return
      
      try {
        this.loading = true
        
        const res = await getReportList(this.childId, this.page, this.pageSize)
        
        if (res.success && res.data) {
          if (this.page === 1) {
            this.reports = res.data.list || []
          } else {
            this.reports = [...this.reports, ...(res.data.list || [])]
          }
          this.total = res.data.total || 0
          this.hasMore = this.reports.length < this.total
        } else {
          throw new Error(res.message || '加载报告失败')
        }
        
      } catch (error) {
        console.error('加载报告失败:', error)
        uni.showToast({
          title: error.message || '加载报告失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    /**
     * 刷新报告列表
     */
    refreshReports() {
      this.page = 1
      this.reports = []
      this.loadReports()
    },

    /**
     * 切换标签
     */
    switchTab(tabKey) {
      if (this.currentTab === tabKey) return
      this.currentTab = tabKey
      this.page = 1
      this.reports = []
      this.loadReports()
    },

    /**
     * 加载更多
     */
    loadMore() {
      this.page++
      this.loadReports()
    },

    /**
     * 查看报告详情
     */
    viewReport(report) {
      uni.navigateTo({
        url: `/pages/assessment/report?reportId=${report.id}`
      })
    },

    /**
     * 对比报告
     */
    compareReport(report) {
      // 获取上一个报告进行对比
      const currentIndex = this.reports.findIndex(r => r.id === report.id)
      if (currentIndex < this.reports.length - 1) {
        const previousReport = this.reports[currentIndex + 1]
        uni.navigateTo({
          url: `/pages/assessment/compare?currentId=${report.id}&previousId=${previousReport.id}`
        })
      } else {
        uni.showToast({
          title: '请选择其他报告进行对比',
          icon: 'none'
        })
      }
    },

    /**
     * 开始测评
     */
    startAssessment() {
      uni.navigateTo({
        url: `/pages/assessment/welcome?childId=${this.childId}`
      })
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
    },

    /**
     * 格式化日期天数
     */
    formatDay(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },

    /**
     * 获取评分颜色
     */
    getScoreColor(percentile) {
      if (percentile >= 80) return '#4cd964'
      if (percentile >= 60) return '#667eea'
      if (percentile >= 40) return '#ff9500'
      return '#ff6b6b'
    },

    /**
     * 获取评级样式类
     */
    getRatingClass(rating) {
      const ratingMap = {
        '超越卓越': 'excellent',
        '良好发展': 'good',
        '普通范围': 'normal',
        '需要关注': 'concern',
        '建议专业评估': 'severe'
      }
      return ratingMap[rating] || 'normal'
    }
  }
}
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background: #f5f7fa;
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
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 筛选区域 */
.filter-area {
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
}

.tab-item {
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-text {
  font-size: 26rpx;
  color: #666;
}

.tab-item.active .tab-text {
  color: #ffffff;
}

/* 报告列表 */
.report-list {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.report-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.report-date {
  display: flex;
  flex-direction: column;
}

.date-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.date-day {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.report-score {
  text-align: right;
}

.score-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 22rpx;
  color: #999;
}

/* 评分进度条 */
.score-bar {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

/* 评级标签 */
.report-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.rating-tag {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.rating-excellent,
.rating-good {
  background: #4cd964;
}

.rating-normal {
  background: #667eea;
}

.rating-concern {
  background: #ff9500;
}

.rating-severe {
  background: #ff6b6b;
}

.age-tag {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background: #f5f5f5;
  color: #666;
}

/* 维度预览 */
.dimensions-preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.dim-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx 8rpx;
}

.dim-name {
  font-size: 20rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.dim-value {
  font-size: 26rpx;
  font-weight: bold;
}

/* 底部操作 */
.report-actions {
  display: flex;
  gap: 16rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  font-size: 26rpx;
  border-radius: 36rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn::after {
  border: none;
}

.view-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.compare-btn {
  background: #f5f5f5;
  color: #666;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 60rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  margin-bottom: 40rpx;
}

.start-btn {
  width: 300rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
}

.start-btn::after {
  border: none;
}

/* 加载更多 */
.load-more {
  padding: 30rpx;
  text-align: center;
}

.load-text {
  font-size: 28rpx;
  color: #667eea;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
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