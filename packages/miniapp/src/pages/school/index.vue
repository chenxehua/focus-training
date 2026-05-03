/**
 * 学校端 - 仪表盘页面
 */
<template>
  <view class="dashboard">
    <!-- 头部信息 -->
    <view class="header">
      <text class="title">{{ schoolInfo?.name || '我的学校' }}</text>
      <text class="subtitle">专注力训练数据概览</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-value">{{ stats.teacher_count }}</text>
        <text class="stat-label">教师数量</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.class_count }}</text>
        <text class="stat-label">班级数量</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.student_count }}</text>
        <text class="stat-label">学生数量</text>
      </view>
      <view class="stat-card highlight">
        <text class="stat-value">{{ stats.month_training_count }}</text>
        <text class="stat-label">本月训练次数</text>
      </view>
    </view>

    <!-- 本月表现 -->
    <view class="section">
      <text class="section-title">本月表现</text>
      <view class="performance-card">
        <view class="performance-item">
          <text class="performance-value">{{ stats.month_avg_accuracy }}%</text>
          <text class="performance-label">平均准确率</text>
        </view>
        <view class="performance-progress">
          <view class="progress-bar" :style="{ width: stats.month_avg_accuracy + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 快速操作 -->
    <view class="section">
      <text class="section-title">快速操作</text>
      <view class="action-grid">
        <view class="action-item" @tap="navigateTo('/pages/school/teachers')">
          <text class="action-icon">👨‍🏫</text>
          <text class="action-text">教师管理</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/school/classes')">
          <text class="action-icon">🏫</text>
          <text class="action-text">班级管理</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/school/students')">
          <text class="action-icon">👨‍🎓</text>
          <text class="action-text">学生管理</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/school/reports')">
          <text class="action-icon">📊</text>
          <text class="action-text">数据报告</text>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="section">
      <text class="section-title">最近活动</text>
      <view class="activity-list" v-if="recentActivities.length > 0">
        <view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
          <view class="activity-icon">
            <text>{{ activity.icon }}</text>
          </view>
          <view class="activity-content">
            <text class="activity-title">{{ activity.title }}</text>
            <text class="activity-time">{{ activity.time }}</text>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text>暂无最近活动</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 统计数据
const stats = ref({
  teacher_count: 0,
  class_count: 0,
  student_count: 0,
  month_training_count: 0,
  month_avg_accuracy: 0,
})

// 学校信息
const schoolInfo = ref<any>(null)

// 最近活动
const recentActivities = ref([
  { icon: '🎮', title: '张三完成了舒尔特方格训练', time: '10分钟前' },
  { icon: '⭐', title: '李四获得"专注达人"成就', time: '30分钟前' },
  { icon: '📊', title: '王五的专注力评分提升了5分', time: '1小时前' },
])

// 获取仪表盘数据
const fetchDashboard = async () => {
  try {
    // const res = await schoolApi.getDashboard({ school_id: schoolId })
    // stats.value = res.data
    
    // 模拟数据
    stats.value = {
      teacher_count: 12,
      class_count: 8,
      student_count: 240,
      month_training_count: 1250,
      month_avg_accuracy: 78.5,
    }
    
    schoolInfo.value = {
      id: 1,
      name: '测试学校',
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

// 页面跳转
const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.header {
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  color: white;
  padding: 40rpx 30rpx;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  opacity: 0.8;
  display: block;
  margin-top: 10rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.stat-card {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
}

.stat-card.highlight {
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  color: white;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 10rpx;
}

.stat-card.highlight .stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.performance-card {
  padding: 20rpx 0;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.performance-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #6C63FF;
}

.performance-label {
  font-size: 24rpx;
  color: #666;
}

.performance-progress {
  height: 12rpx;
  background: #e0e0e0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6C63FF, #9D4EDD);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.action-icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.action-text {
  font-size: 22rpx;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.activity-icon {
  width: 60rpx;
  height: 60rpx;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 28rpx;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 26rpx;
  color: #333;
  display: block;
}

.activity-time {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 5rpx;
}

.empty-state {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}
</style>