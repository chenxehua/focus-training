<template>
  <view class="welcome-container">
    <!-- 顶部欢迎区 -->
    <view class="welcome-header">
      <view class="welcome-icon">
        <text class="icon-star">⭐</text>
      </view>
      <view class="welcome-title">
        <text class="title-main">专注力初次测评</text>
        <text class="title-sub">了解孩子的专注力发展水平</text>
      </view>
    </view>

    <!-- 测评介绍卡片 -->
    <view class="intro-card">
      <view class="card-header">
        <text class="card-title">📋 测评内容</text>
      </view>
      <view class="card-content">
        <view class="content-item">
          <text class="item-icon">🔢</text>
          <text class="item-text">简短问卷（5-7道题目）</text>
        </view>
        <view class="content-item">
          <text class="item-icon">🎮</text>
          <text class="item-text">趣味游戏（2款适配游戏）</text>
        </view>
        <view class="content-item">
          <text class="item-icon">📊</text>
          <text class="item-text">专属报告（7维度分析）</text>
        </view>
      </view>
    </view>

    <!-- 预估时长 -->
    <view class="time-card">
      <view class="time-icon">
        <text>⏱️</text>
      </view>
      <view class="time-info">
        <text class="time-label">预计用时</text>
        <text class="time-value">5-10分钟</text>
      </view>
    </view>

    <!-- 评估维度 -->
    <view class="dimensions-card">
      <view class="card-header">
        <text class="card-title">🎯 7大评估维度</text>
      </view>
      <view class="dimensions-grid">
        <view 
          v-for="dim in dimensions" 
          :key="dim.code"
          class="dimension-item"
        >
          <text class="dim-icon">{{ dim.icon }}</text>
          <text class="dim-name">{{ dim.name }}</text>
        </view>
      </view>
    </view>

    <!-- 注意事项 -->
    <view class="tips-card">
      <view class="card-header">
        <text class="card-title">💡 测评须知</text>
      </view>
      <view class="tips-list">
        <text class="tip-item">• 请在安静环境下进行</text>
        <text class="tip-item">• 请使用手机/平板等设备</text>
        <text class="tip-item">• 可中途保存，随时继续</text>
        <text class="tip-item">• 结果仅供参考，不能替代专业诊断</text>
      </view>
    </view>

    <!-- 开始按钮 -->
    <view class="action-area">
      <button 
        class="start-btn" 
        :loading="loading"
        :disabled="loading"
        @tap="startAssessment"
      >
        {{ loading ? '加载中...' : '开始测评 →' }}
      </button>
      <text class="consent-hint">点击开始即表示同意《隐私政策》和《测评须知》</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在准备测评...</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 欢迎引导页
 * 功能：测评入口、时长说明、内容介绍
 */
import { initialAssessmentApi } from '@/api/assessment'

export default {
  data() {
    return {
      loading: false,
      childId: null,
      dimensions: [
        { code: 'sustained_attention', name: '持续注意力', icon: '🎯' },
        { code: 'selective_attention', name: '选择性注意力', icon: '🔍' },
        { code: 'divided_attention', name: '分配注意力', icon: '🔀' },
        { code: 'attention_shifting', name: '转移注意力', icon: '🔄' },
        { code: 'working_memory', name: '工作记忆', icon: '🧠' },
        { code: 'impulse_control', name: '冲动控制', icon: '⏸️' },
        { code: 'reaction_speed', name: '反应速度', icon: '⚡' }
      ]
    }
  },
  
  onLoad(options) {
    if (options.childId) {
      this.childId = parseInt(options.childId)
    }
  },
  
  methods: {
    /**
     * 开始测评
     */
    async startAssessment() {
      if (this.loading) return
      
      try {
        this.loading = true
        
        // 获取儿童信息
        if (!this.childId) {
          // TODO: 从全局状态或storage获取当前儿童ID
          const userInfo = uni.getStorageSync('userInfo')
          if (userInfo && userInfo.children && userInfo.children.length > 0) {
            this.childId = userInfo.children[0].id
          }
        }
        
        if (!this.childId) {
          uni.showToast({
            title: '请先添加孩子信息',
            icon: 'none'
          })
          uni.navigateTo({
            url: '/pages/children/add'
          })
          return
        }
        
        // 检查是否有未完成的测评
        const statusRes = await initialAssessmentApi.getStatus(this.childId)
        
        if (statusRes.data && statusRes.data.hasInProgress) {
          // 有未完成的测评，询问是否继续
          uni.showModal({
            title: '检测到未完成的测评',
            content: '是否继续上次的测评？',
            confirmText: '继续',
            cancelText: '重新开始',
            success: (res) => {
              if (res.confirm) {
                // 继续上次测评
                this.navigateToAssessment(statusRes.data.assessmentId)
              } else {
                // 开始新测评
                this.createNewAssessment()
              }
            }
          })
        } else {
          // 开始新测评
          this.createNewAssessment()
        }
        
      } catch (error) {
        console.error('检查测评状态失败:', error)
        // 出错时也允许开始新测评
        this.createNewAssessment()
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 创建新测评
     */
    async createNewAssessment() {
      try {
        uni.showLoading({ title: '创建测评...' })
        
        const res = await initialAssessmentApi.start(this.childId)
        
        if (res.success && res.data) {
          uni.hideLoading()
          uni.showToast({
            title: '测评已创建',
            icon: 'success'
          })
          this.navigateToAssessment(res.data.assessmentId)
        } else {
          throw new Error(res.message || '创建测评失败')
        }
        
      } catch (error) {
        console.error('创建测评失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: error.message || '创建测评失败',
          icon: 'none'
        })
      }
    },
    
    /**
     * 跳转到测评页面
     */
    navigateToAssessment(assessmentId) {
      // 跳转到知情同意页
      uni.navigateTo({
        url: `/pages/assessment/consent?assessmentId=${assessmentId}&childId=${this.childId}`
      })
    }
  }
}
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  padding-bottom: 120rpx;
}

/* 头部欢迎区 */
.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 60rpx 0;
}

.welcome-icon {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.icon-star {
  font-size: 80rpx;
}

.welcome-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-main {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.title-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 介绍卡片 */
.intro-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  font-size: 40rpx;
}

.item-text {
  font-size: 28rpx;
  color: #666;
}

/* 时长卡片 */
.time-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.time-icon {
  font-size: 60rpx;
}

.time-info {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.time-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b6b;
}

/* 评估维度卡片 */
.dimensions-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  margin-top: 20rpx;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.dim-icon {
  font-size: 40rpx;
}

.dim-name {
  font-size: 20rpx;
  color: #666;
  text-align: center;
}

/* 注意事项卡片 */
.tips-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tip-item {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
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

.start-btn {
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

.start-btn::after {
  border: none;
}

.start-btn[loading] {
  opacity: 0.7;
}

.consent-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #999;
  margin-top: 16rpx;
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
