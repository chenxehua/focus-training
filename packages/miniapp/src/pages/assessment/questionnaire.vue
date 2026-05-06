<template>
  <view class="questionnaire-container">
    <!-- 顶部进度条 -->
    <view class="progress-header">
      <view class="progress-info">
        <text class="progress-text">问卷 ({{ currentIndex + 1 }}/{{ questions.length }})</text>
        <text class="time-text" v-if="timeLimit">剩余 {{ formatTime(remainingTime) }}</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <!-- 题目区域 -->
    <view class="question-area" v-if="currentQuestion">
      <!-- 维度标签 -->
      <view class="dimension-tag">
        <text class="dimension-icon">{{ getDimensionIcon(currentQuestion.dimension) }}</text>
        <text class="dimension-name">{{ currentQuestion.dimensionName }}</text>
      </view>

      <!-- 题目文本 -->
      <view class="question-text">
        <text>{{ currentQuestion.questionText }}</text>
      </view>

      <!-- 选项区域 -->
      <view class="options-area">
        <view
          v-for="(option, index) in currentQuestion.options"
          :key="option.value"
          class="option-item"
          :class="{ selected: selectedAnswer === option.value }"
          @tap="selectOption(option.value)"
        >
          <view class="option-radio">
            <view class="radio-inner" v-if="selectedAnswer === option.value"></view>
          </view>
          <text class="option-text">{{ option.text }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="action-area">
      <button
        class="next-btn"
        :disabled="selectedAnswer === null"
        @tap="handleNext"
      >
        {{ isLastQuestion ? '提交问卷' : '下一题' }}
      </button>
      <text class="hint-text">请选择最符合孩子情况的选项</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 问卷测评页面
 * 功能：展示问卷题目、选择答案、提交问卷
 */
import { getQuestionnaire, submitQuestionnaire } from '@/api/initialAssessment'

export default {
  data() {
    return {
      assessmentId: null,
      loading: false,
      
      // 问卷数据
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      
      // 时间控制
      timeLimit: 0,
      remainingTime: 0,
      timer: null,
      
      // 临时答案存储
      answers: []
    }
  },

  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null
    },
    
    isLastQuestion() {
      return this.currentIndex === this.questions.length - 1
    },
    
    progressPercent() {
      if (this.questions.length === 0) return 0
      return Math.round((this.currentIndex / this.questions.length) * 100)
    }
  },

  onLoad(options) {
    if (options.assessmentId) {
      this.assessmentId = parseInt(options.assessmentId)
      this.loadQuestionnaire()
    } else {
      uni.showToast({
        title: '缺少测评ID',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },

  onUnload() {
    this.stopTimer()
  },

  methods: {
    /**
     * 加载问卷题目
     */
    async loadQuestionnaire() {
      try {
        this.loading = true
        
        const res = await getQuestionnaire(this.assessmentId)
        
        if (res.success && res.data) {
          this.questions = res.data.questions || []
          this.timeLimit = res.data.timeLimit || 180 // 默认3分钟
          this.remainingTime = this.timeLimit
          
          // 初始化进度
          this.currentIndex = 0
          this.selectedAnswer = null
          this.answers = []
          
          // 启动计时器
          if (this.timeLimit > 0) {
            this.startTimer()
          }
          
          // 如果没有题目，显示提示
          if (this.questions.length === 0) {
            uni.showToast({
              title: '暂无问卷题目',
              icon: 'none'
            })
          }
        } else {
          throw new Error(res.message || '加载问卷失败')
        }
        
      } catch (error) {
        console.error('加载问卷失败:', error)
        uni.showToast({
          title: error.message || '加载问卷失败',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } finally {
        this.loading = false
      }
    },

    /**
     * 选择选项
     */
    selectOption(value) {
      this.selectedAnswer = value
    },

    /**
     * 处理下一题/提交
     */
    async handleNext() {
      if (this.selectedAnswer === null) {
        uni.showToast({
          title: '请选择答案',
          icon: 'none'
        })
        return
      }

      // 保存答案
      const currentQ = this.currentQuestion
      this.answers.push({
        questionId: currentQ.id,
        dimension: currentQ.dimension,
        score: this.selectedAnswer
      })

      if (this.isLastQuestion) {
        // 提交问卷
        await this.submitAnswers()
      } else {
        // 下一题
        this.currentIndex++
        this.selectedAnswer = null
      }
    },

    /**
     * 提交问卷答案
     */
    async submitAnswers() {
      try {
        this.loading = true
        
        // 提交答案
        const res = await submitQuestionnaire(this.assessmentId, this.answers)
        
        if (res.success && res.data) {
          this.stopTimer()
          
          uni.showToast({
            title: '问卷提交成功',
            icon: 'success'
          })
          
          // 跳转到游戏选择页面
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/assessment/games?assessmentId=${this.assessmentId}`
            })
          }, 1500)
        } else {
          throw new Error(res.message || '提交问卷失败')
        }
        
      } catch (error) {
        console.error('提交问卷失败:', error)
        uni.showToast({
          title: error.message || '提交问卷失败',
          icon: 'none'
        })
        // 允许重试
        this.loading = false
      }
    },

    /**
     * 启动计时器
     */
    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
        } else {
          // 时间到，自动提交
          this.stopTimer()
          this.handleTimeUp()
        }
      }, 1000)
    },

    /**
     * 停止计时器
     */
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },

    /**
     * 时间到处理
     */
    handleTimeUp() {
      uni.showModal({
        title: '时间到',
        content: '问卷答题时间已到，是否立即提交？',
        confirmText: '提交',
        cancelText: '继续答题',
        success: (res) => {
          if (res.confirm) {
            this.submitAnswers()
          } else {
            // 继续答题，不限制时间
            this.remainingTime = 0
            this.timeLimit = 0
          }
        }
      })
    },

    /**
     * 格式化时间
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    /**
     * 获取维度图标
     */
    getDimensionIcon(dimension) {
      const icons = {
        'sustained_attention': '🎯',
        'selective_attention': '🔍',
        'divided_attention': '🔀',
        'attention_shifting': '🔄',
        'working_memory': '🧠',
        'impulse_control': '⏸️',
        'reaction_speed': '⚡'
      }
      return icons[dimension] || '📝'
    }
  }
}
</script>

<style scoped>
.questionnaire-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部进度条 */
.progress-header {
  background: #ffffff;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.progress-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.time-text {
  font-size: 26rpx;
  color: #ff6b6b;
  font-weight: 500;
}

.progress-bar {
  height: 8rpx;
  background: #e8e8e8;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

/* 题目区域 */
.question-area {
  flex: 1;
  padding: 40rpx 30rpx;
}

.dimension-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  margin-bottom: 30rpx;
}

.dimension-icon {
  font-size: 28rpx;
}

.dimension-name {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 500;
}

.question-text {
  background: #ffffff;
  padding: 40rpx;
  border-radius: 20rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.question-text text {
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  font-weight: 500;
}

/* 选项区域 */
.options-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #ffffff;
  padding: 30rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e8e8e8;
  transition: all 0.3s ease;
}

.option-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.option-radio {
  width: 44rpx;
  height: 44rpx;
  border: 2rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.option-item.selected .option-radio {
  border-color: #667eea;
}

.radio-inner {
  width: 24rpx;
  height: 24rpx;
  background: #667eea;
  border-radius: 50%;
}

.option-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
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
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.next-btn {
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

.next-btn::after {
  border: none;
}

.next-btn[disabled] {
  background: #cccccc;
  opacity: 0.8;
}

.hint-text {
  display: block;
  text-align: center;
  font-size: 24rpx;
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