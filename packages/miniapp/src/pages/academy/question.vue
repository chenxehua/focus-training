<template>
  <view class="question-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">问题详情</text>
    </view>

    <scroll-view class="content" scroll-y v-if="question">
      <!-- 问题内容 -->
      <view class="question-section">
        <view class="question-header">
          <text class="status" :class="getStatusClass(question.status)">
            {{ getStatusText(question.status) }}
          </text>
          <text class="category">{{ question.category_name }}</text>
        </view>
        <text class="question-title">{{ question.question_title }}</text>
        <text class="question-content">{{ question.question_content }}</text>
        <view class="question-meta">
          <text class="author">{{ question.user_nickname || '用户' }}</text>
          <text class="date">{{ formatDate(question.created_at) }}</text>
          <text class="views">{{ question.view_count || 0 }}浏览</text>
        </view>
        <!-- 图片 -->
        <view class="images" v-if="question.images">
          <image 
            v-for="(img, idx) in question.images.split(',')" 
            :key="idx"
            class="img" 
            :src="img" 
            mode="aspectFill"
            @click="previewImage(img)"/>
        </view>
      </view>

      <!-- 回答列表 -->
      <view class="answers-section">
        <view class="section-title">{{ answers.length }}个回答</view>
        
        <view class="answer-item" 
              v-for="answer in answers" 
              :key="answer.id"
              :class="{ 'best-answer': answer.is_best === 1 }">
          <view class="answer-header">
            <image class="avatar" :src="answer.avatar || '/static/default-avatar.png'" />
            <view class="answer-info">
              <text class="nickname">{{ answer.expert_name || answer.user_nickname || '用户' }}</text>
              <text class="role" v-if="answer.is_expert === 1">👨‍🏫 专家</text>
            </view>
            <text class="date">{{ formatDate(answer.created_at) }}</text>
          </view>
          <text class="answer-content">{{ answer.answer_content }}</text>
          <view class="answer-actions" v-if="canAdopt && answer.is_best !== 1">
            <text class="adopt-btn" @click="adoptAnswer(answer.id)">采纳为最佳答案</text>
          </view>
          <view class="best-badge" v-if="answer.is_best === 1">✓ 最佳答案</view>
        </view>

        <view class="empty-answers" v-if="answers.length === 0">
          <text class="empty-icon">💬</text>
          <text class="empty-text">暂无回答，我来帮你提问！</text>
        </view>
      </view>

      <!-- 输入回答 -->
      <view class="reply-section" v-if="!canAdopt">
        <textarea 
          class="reply-input" 
          v-model="replyContent" 
          placeholder="写下你的回答..." 
          :maxlength="2000"/>
        <button class="submit-btn" @click="submitReply">提交回答</button>
      </view>
    </scroll-view>

    <LoadingSpinner v-if="loading" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getQuestionDetail, getAnswers, createQuestion } from '../../api/academy'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const loading = ref(false)
const question = ref<any>(null)
const answers = ref<any[]>([])
const replyContent = ref('')
const canAdopt = ref(false) // 是否可以采纳答案（提问者可见）

async function loadQuestion(questionId: number) {
  loading.value = true
  try {
    const res = await getQuestionDetail(questionId)
    if (res.code === 0) {
      question.value = res.data
      // 加载回答
      const answersRes = await getAnswers(questionId, 1, 20)
      if (answersRes.code === 0) {
        const data = answersRes.data
        answers.value = data.items || []
      }
    }
  } catch (error) {
    console.error('加载问题失败:', error)
  } finally {
    loading.value = false
  }
}

async function submitReply() {
  if (!replyContent.value.trim()) {
    uni.showToast({ title: '请输入回答内容', icon: 'none' })
    return
  }

  try {
    // 直接提交回答（这里需要后端支持）
    const res = await createQuestion({
      questionTitle: question.value.question_title,
      questionContent: replyContent.value,
      categoryId: question.value.category_id
    })
    
    if (res.code === 0) {
      uni.showToast({ title: '提交成功', icon: 'success' })
      replyContent.value = ''
      // 重新加载回答
      loadQuestion(question.value.id)
    }
  } catch (error) {
    console.error('提交回答失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

async function adoptAnswer(answerId: number) {
  // 采纳最佳答案
  uni.showModal({
    title: '确认',
    content: '确定采纳为最佳答案？',
    success: async (res) => {
      if (res.confirm) {
        // TODO: 调用后端采纳接口
        uni.showToast({ title: '已采纳', icon: 'success' })
      }
    }
  })
}

function previewImage(url: string) {
  uni.previewImage({ urls: [url] })
}

function getStatusText(status: number) {
  const map: Record<number, string> = {
    0: '待回复',
    1: '已回复',
    2: '已采纳',
    3: '已关闭'
  }
  return map[status] || '待回复'
}

function getStatusClass(status: number) {
  const map: Record<number, string> = {
    0: 'pending',
    1: 'replied',
    2: 'adopted',
    3: 'closed'
  }
  return map[status] || 'pending'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function goBack() {
  uni.navigateBack()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).$page?.options || {}
  const questionId = options.id || options.questionId
  
  if (questionId) {
    loadQuestion(parseInt(questionId))
  }
})
</script>

<style scoped>
.question-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 40rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.back-btn {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.content {
  height: calc(100vh - 120rpx);
}

.question-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.status {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  margin-right: 16rpx;
}

.status.pending { background: #fff3e0; color: #ff9800; }
.status.replied { background: #e3f2fd; color: #2196f3; }
.status.adopted { background: #e8f5e9; color: #4caf50; }
.status.closed { background: #f5f5f5; color: #999; }

.category {
  font-size: 24rpx;
  color: #999;
}

.question-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.question-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
}

.question-meta {
  display: flex;
  font-size: 24rpx;
  color: #999;
}

.author { margin-right: auto; }
.views, .date { margin-left: 20rpx; }

.images {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.images .img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
}

.answers-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.answer-item {
  padding: 24rpx;
  background: #f8f8ff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.answer-item.best-answer {
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
  border: 1px solid #4caf50;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.answer-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.nickname {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.role {
  font-size: 22rpx;
  color: #ff9500;
}

.answer-item .date {
  font-size: 22rpx;
  color: #999;
}

.answer-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
}

.answer-actions {
  margin-top: 16rpx;
  text-align: right;
}

.adopt-btn {
  font-size: 24rpx;
  color: #4caf50;
}

.best-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #4caf50;
  padding: 6rpx 16rpx;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 6rpx;
}

.empty-answers {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.reply-section {
  background: #fff;
  padding: 30rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.reply-input {
  width: 100%;
  height: 160rpx;
  padding: 20rpx;
  border: 1px solid #eee;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 20rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
}
</style>