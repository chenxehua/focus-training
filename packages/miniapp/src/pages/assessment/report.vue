<template>
  <view class="report-container">
    <!-- 顶部报告标题 -->
    <view class="report-header">
      <view class="header-content">
        <text class="report-title">专注力评估报告</text>
        <text class="report-date">{{ reportData.assessmentDate }}</text>
      </view>
      <view class="child-info">
        <text class="child-name">{{ reportData.childName }}</text>
        <text class="child-age">年龄组: {{ reportData.ageGroup }}</text>
      </view>
    </view>

    <!-- 综合评分卡片 -->
    <view class="overall-card">
      <view class="overall-score">
        <text class="score-value">{{ reportData.overallScore }}</text>
        <text class="score-label">综合评分</text>
      </view>
      <view class="overall-percentile">
        <view class="percentile-ring" :style="getPercentileStyle()">
          <text class="percentile-value">{{ reportData.overallPercentile }}%</text>
          <text class="percentile-label">百分位</text>
        </view>
      </view>
      <view class="overall-rating">
        <text class="rating-badge" :class="'rating-' + reportData.overallLevel">
          {{ reportData.overallRating }}
        </text>
        <text class="rating-desc">{{ getRatingDescription() }}</text>
      </view>
    </view>

    <!-- 雷达图区域 -->
    <view class="radar-card">
      <view class="card-title">
        <text>📊 7维度能力分析</text>
      </view>
      <view class="radar-chart">
        <canvas canvas-id="radarChart" id="radarChart" class="radar-canvas"></canvas>
      </view>
      <view class="radar-legend">
        <view
          v-for="dim in reportData.dimensions"
          :key="dim.dimension"
          class="legend-item"
        >
          <view class="legend-color" :style="{ background: getDimensionColor(dim.percentile) }"></view>
          <text class="legend-name">{{ dim.dimensionName }}</text>
          <text class="legend-score">{{ dim.percentile }}%</text>
        </view>
      </view>
    </view>

    <!-- 各维度详情 -->
    <view class="dimensions-card">
      <view class="card-title">
        <text>📝 维度详细分析</text>
      </view>
      <view
        v-for="dim in reportData.dimensions"
        :key="dim.dimension"
        class="dimension-item"
      >
        <view class="dimension-header">
          <view class="dimension-info">
            <text class="dimension-icon">{{ getDimensionIcon(dim.dimension) }}</text>
            <text class="dimension-name">{{ dim.dimensionName }}</text>
          </view>
          <view class="dimension-score">
            <text class="score-num">{{ dim.score }}</text>
            <text class="score-percent">百位: {{ dim.percentile }}%</text>
          </view>
        </view>
        <view class="dimension-bar">
          <view
            class="bar-fill"
            :style="{
              width: dim.percentile + '%',
              background: getDimensionColor(dim.percentile)
            }"
          ></view>
        </view>
        <view class="dimension-analysis">
          <text>{{ dim.analysis }}</text>
        </view>
        <view class="dimension-games" v-if="dim.games && dim.games.length > 0">
          <text class="games-label">相关游戏表现:</text>
          <view
            v-for="game in dim.games"
            :key="game.gameName"
            class="game-item"
          >
            <text class="game-name">{{ game.gameName }}</text>
            <text class="game-score">得分: {{ game.score }}</text>
            <text class="game-percent">百位: {{ game.percentile }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 优势与建议 -->
    <view class="analysis-card">
      <view class="card-title">
        <text>🎯 综合分析</text>
      </view>
      
      <!-- 优势 -->
      <view class="strengths-section" v-if="reportData.strengths && reportData.strengths.length > 0">
        <view class="section-header">
          <text class="section-icon">💪</text>
          <text class="section-title">优势领域</text>
        </view>
        <view class="strength-list">
          <view
            v-for="(strength, index) in reportData.strengths"
            :key="index"
            class="strength-item"
          >
            <text class="strength-text">{{ strength }}</text>
          </view>
        </view>
      </view>

      <!-- 需关注 -->
      <view class="weaknesses-section" v-if="reportData.weaknesses && reportData.weaknesses.length > 0">
        <view class="section-header">
          <text class="section-icon">⚠️</text>
          <text class="section-title">需关注领域</text>
        </view>
        <view class="weakness-list">
          <view
            v-for="(weakness, index) in reportData.weaknesses"
            :key="index"
            class="weakness-item"
          >
            <text class="weakness-text">{{ weakness }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 训练建议 -->
    <view class="recommendations-card">
      <view class="card-title">
        <text>📚 训练建议</text>
      </view>
      <view class="recommendations-list">
        <view
          v-for="(rec, index) in reportData.trainingRecommendations"
          :key="index"
          class="recommendation-item"
        >
          <view class="rec-priority">
            <text class="priority-num">{{ rec.priority }}</text>
          </view>
          <view class="rec-content">
            <text class="rec-dimension">{{ rec.dimensionName }}</text>
            <text class="rec-game">推荐游戏: {{ rec.gameName }}</text>
            <text class="rec-reason">{{ rec.reason }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-area">
      <button class="share-btn" @tap="shareReport">
        分享报告
      </button>
      <button class="train-btn" @tap="startTraining">
        开始训练 →
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载报告中...</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 测评报告展示页面
 * 功能：展示7维度雷达图、综合评分、详细分析、训练建议
 */
import { getReport } from '@/api/initialAssessment'

// 维度图标映射
const DIMENSION_ICONS = {
  'sustained_attention': '🎯',
  'selective_attention': '🔍',
  'divided_attention': '🔀',
  'attention_shifting': '🔄',
  'working_memory': '🧠',
  'impulse_control': '⏸️',
  'reaction_speed': '⚡'
}

// 维度名称映射
const DIMENSION_NAMES = {
  'sustained_attention': '持续注意力',
  'selective_attention': '选择性注意力',
  'divided_attention': '分配注意力',
  'attention_shifting': '转移注意力',
  'working_memory': '工作记忆',
  'impulse_control': '冲动控制',
  'reaction_speed': '反应速度'
}

// 评级描述
const RATING_DESCRIPTIONS = {
  'excellent': '超越同龄儿童平均水平，表现卓越',
  'good': '高于同龄儿童平均水平，发展良好',
  'normal': '处于同龄儿童正常范围',
  'concern': '略低于同龄儿童平均水平，建议关注',
  'severe': '显著低于同龄儿童平均水平，建议咨询专业人士'
}

export default {
  data() {
    return {
      reportId: null,
      loading: false,
      
      // 报告数据
      reportData: {
        id: 0,
        assessmentId: 0,
        childId: 0,
        childName: '',
        assessmentDate: '',
        ageGroup: '',
        
        overallScore: 0,
        overallPercentile: 0,
        overallRating: '',
        overallLevel: 'normal',
        summary: '',
        
        questionnaireTotalScore: 0,
        gameTotalScore: 0,
        
        dimensions: [],
        
        strengths: [],
        weaknesses: [],
        recommendations: [],
        
        trainingRecommendations: [],
        
        questionnaireAnswersCount: 0,
        gamesCompleted: 0,
        actualDuration: 0
      }
    }
  },

  onLoad(options) {
    if (options.reportId) {
      this.reportId = parseInt(options.reportId)
      this.loadReport()
    } else {
      uni.showToast({
        title: '缺少报告ID',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },

  onReady() {
    // 页面Ready后绘制雷达图
    setTimeout(() => {
      this.drawRadarChart()
    }, 500)
  },

  methods: {
    /**
     * 加载报告数据
     */
    async loadReport() {
      try {
        this.loading = true

        const res = await getReport(this.reportId)

        if (res.success && res.data) {
          this.reportData = res.data
          
          // 绘制雷达图
          this.$nextTick(() => {
            this.drawRadarChart()
          })
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
     * 获取维度图标
     */
    getDimensionIcon(dimension) {
      return DIMENSION_ICONS[dimension] || '📝'
    },

    /**
     * 获取维度颜色
     */
    getDimensionColor(percentile) {
      if (percentile >= 80) return '#4cd964'
      if (percentile >= 60) return '#667eea'
      if (percentile >= 40) return '#ff9500'
      return '#ff6b6b'
    },

    /**
     * 获取百分位样式
     */
    getPercentileStyle() {
      const color = this.getDimensionColor(this.reportData.overallPercentile)
      return {
        borderColor: color
      }
    },

    /**
     * 获取评级描述
     */
    getRatingDescription() {
      return RATING_DESCRIPTIONS[this.reportData.overallLevel] || ''
    },

    /**
     * 绘制雷达图
     */
    drawRadarChart() {
      const query = uni.createSelectorQuery()
      query.select('#radarChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) return
          
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = uni.getSystemInfoSync().pixelRatio
          
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)
          
          const centerX = res[0].width / 2
          const centerY = res[0].height / 2
          const radius = Math.min(centerX, centerY) - 40
          
          const dimensions = this.reportData.dimensions
          const count = dimensions.length
          const angle = (2 * Math.PI) / count
          
          // 绘制背景网格
          ctx.strokeStyle = '#e0e0e0'
          ctx.lineWidth = 1
          
          for (let level = 1; level <= 5; level++) {
            const r = (radius / 5) * level
            ctx.beginPath()
            for (let i = 0; i <= count; i++) {
              const x = centerX + r * Math.cos(angle * i - Math.PI / 2)
              const y = centerY + r * Math.sin(angle * i - Math.PI / 2)
              if (i === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            }
            ctx.closePath()
            ctx.stroke()
          }
          
          // 绘制轴线
          ctx.beginPath()
          for (let i = 0; i < count; i++) {
            const x = centerX + radius * Math.cos(angle * i - Math.PI / 2)
            const y = centerY + radius * Math.sin(angle * i - Math.PI / 2)
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(x, y)
          }
          ctx.stroke()
          
          // 绘制数据区域
          const gradient = ctx.createLinearGradient(
            centerX - radius, centerY - radius,
            centerX + radius, centerY + radius
          )
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)')
          gradient.addColorStop(1, 'rgba(118, 75, 162, 0.5)')
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          
          dimensions.forEach((dim, i) => {
            const value = dim.percentile / 100
            const x = centerX + radius * value * Math.cos(angle * i - Math.PI / 2)
            const y = centerY + radius * value * Math.sin(angle * i - Math.PI / 2)
            
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          })
          
          ctx.closePath()
          ctx.fill()
          
          // 绘制数据点
          ctx.fillStyle = '#667eea'
          dimensions.forEach((dim, i) => {
            const value = dim.percentile / 100
            const x = centerX + radius * value * Math.cos(angle * i - Math.PI / 2)
            const y = centerY + radius * value * Math.sin(angle * i - Math.PI / 2)
            
            ctx.beginPath()
            ctx.arc(x, y, 6, 0, 2 * Math.PI)
            ctx.fill()
          })
          
          // 绘制标签
          ctx.fillStyle = '#666'
          ctx.font = '12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          dimensions.forEach((dim, i) => {
            const labelRadius = radius + 25
            const x = centerX + labelRadius * Math.cos(angle * i - Math.PI / 2)
            const y = centerY + labelRadius * Math.sin(angle * i - Math.PI / 2)
            
            // 维度简称
            const shortName = dim.dimensionName.replace('注意力', '').replace('记忆', '').replace('控制', '')
            ctx.fillText(shortName, x, y)
          })
        })
    },

    /**
     * 分享报告
     */
    shareReport() {
      uni.showShareMenu({
        withShareTicket: true
      })
      
      uni.showToast({
        title: '点击右上角分享',
        icon: 'none'
      })
    },

    /**
     * 开始训练
     */
    startTraining() {
      // 跳转到训练推荐页面
      uni.navigateTo({
        url: `/pages/recommendation/index?childId=${this.reportData.childId}`
      })
    }
  }
}
</script>

<style scoped>
.report-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 200rpx;
}

/* 报告头部 */
.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  padding-top: calc(40rpx + env(safe-area-inset-top));
}

.header-content {
  text-align: center;
  margin-bottom: 20rpx;
}

.report-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.report-date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.child-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-name {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 500;
}

.child-age {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 综合评分卡片 */
.overall-card {
  background: #ffffff;
  margin: 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.overall-score {
  text-align: center;
}

.score-value {
  font-size: 72rpx;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 24rpx;
  color: #999;
}

.overall-percentile {
  flex: 1;
}

.percentile-ring {
  width: 120rpx;
  height: 120rpx;
  border: 8rpx solid;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.percentile-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.percentile-label {
  font-size: 18rpx;
  color: #999;
}

.overall-rating {
  text-align: center;
}

.rating-badge {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: bold;
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

.rating-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 8rpx;
  max-width: 150rpx;
}

/* 卡片通用样式 */
.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.card-title text {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

/* 雷达图卡片 */
.radar-card {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.radar-chart {
  height: 400rpx;
  margin-bottom: 30rpx;
}

.radar-canvas {
  width: 100%;
  height: 100%;
}

.radar-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.legend-color {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx;
}

.legend-name {
  font-size: 24rpx;
  color: #666;
  flex: 1;
}

.legend-score {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}

/* 维度详情卡片 */
.dimensions-card {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.dimension-item {
  margin-bottom: 40rpx;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.dimension-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dimension-icon {
  font-size: 40rpx;
}

.dimension-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.dimension-score {
  text-align: right;
}

.score-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #667eea;
}

.score-percent {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.dimension-bar {
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.bar-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.dimension-analysis {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.dimension-games {
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 16rpx;
}

.games-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
  display: block;
}

.game-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.game-name {
  font-size: 24rpx;
  color: #333;
}

.game-score {
  font-size: 22rpx;
  color: #667eea;
}

.game-percent {
  font-size: 22rpx;
  color: #999;
}

/* 综合分析卡片 */
.analysis-card {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.section-icon {
  font-size: 36rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.strength-list,
.weakness-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 30rpx;
}

.strength-item,
.weakness-item {
  background: #f5f5f5;
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
}

.strength-text {
  font-size: 26rpx;
  color: #4cd964;
}

.weakness-text {
  font-size: 26rpx;
  color: #ff6b6b;
}

/* 训练建议卡片 */
.recommendations-card {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.recommendation-item {
  display: flex;
  gap: 20rpx;
  background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
  border-radius: 16rpx;
  padding: 24rpx;
}

.rec-priority {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.priority-num {
  font-size: 24rpx;
  font-weight: bold;
  color: #ffffff;
}

.rec-content {
  flex: 1;
}

.rec-dimension {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.rec-game {
  font-size: 24rpx;
  color: #667eea;
  margin-bottom: 8rpx;
  display: block;
}

.rec-reason {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
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
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.share-btn,
.train-btn {
  flex: 1;
  height: 96rpx;
  font-size: 30rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-btn::after,
.train-btn::after {
  border: none;
}

.share-btn {
  background: #f5f5f5;
  color: #333;
}

.train-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
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