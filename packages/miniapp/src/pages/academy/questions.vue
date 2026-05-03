<template>
  <view class="questions-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">专家问答</text>
      <view class="ask-btn" @click="goToAsk">提问</view>
    </view>

    <!-- 分类筛选 -->
    <view class="filter-bar" v-if="categories.length > 0">
      <scroll-view class="filter-scroll" scroll-x>
        <view 
          class="filter-item" 
          :class="{ active: selectedCategoryId === 0 }"
          @click="selectCategory(0)">
          全部
        </view>
        <view 
          class="filter-item" 
          v-for="cat in categories"
          :key="cat.id"
          :class="{ active: selectedCategoryId === cat.id }"
          @click="selectCategory(cat.id)">
          {{ cat.category_name }}
        </view>
      </scroll-view>
    </view>

    <!-- 问题列表 -->
    <scroll-view class="question-list" scroll-y @scrolltolower="loadMore">
      <view class="question-item" 
            v-for="question in questions" 
            :key="question.id"
            @click="goToQuestion(question.id)">
        <view class="question-header">
          <text class="status" :class="getStatusClass(question.status)">
            {{ getStatusText(question.status) }}
          </text>
          <text class="category">{{ question.category_name }}</text>
        </view>
        <text class="question-title">{{ question.question_title }}</text>
        <text class="question-content">{{ question.question_content?.substring(0, 80) }}...</text>
        <view class="question-footer">
          <text class="author">{{ question.user_nickname || '用户' }}</text>
          <text class="answer-count">{{ question.answer_count || 0 }}回答</text>
          <text class="views">{{ question.view_count || 0 }}浏览</text>
          <text class="date">{{ formatDate(question.created_at) }}</text>
        </view>
        <!-- 最佳回答预览 -->
        <view class="best-answer" v-if="question.best_answer">
          <text class="badge">✓ 最佳回答</text>
          <text class="answer-content">{{ question.best_answer.substring(0, 60) }}...</text>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && questions.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty-state" v-if="!loading && questions.length === 0">
        <text class="empty-icon">❓</text>
        <text class="empty-text">暂无问题</text>
      </view>
    </scroll-view>

    <LoadingSpinner v-if="loading && questions.length === 0" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getQuestionCategories, getQuestions } from '../../api/academy'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const loading = ref(false)
const categories = ref<any[]>([])
const questions = ref<any[]>([])
const selectedCategoryId = ref(0)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

async function loadCategories() {
  try {
    const res = await getQuestionCategories()
    if (res.code === 0) {
      categories.value = res.data || []
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadQuestions(reset = false) {
  if (loading.value || (!hasMore.value && !reset)) return
  
  loading.value = true
  try {
    if (reset) {
      page.value = 1
      questions.value = []
      hasMore.value = true
    }

    const res = await getQuestions({
      page: page.value,
      pageSize,
      categoryId: selectedCategoryId.value || undefined
    })

    if (res.code === 0) {
      const data = res.data
      if (data.items) {
        questions.value = reset ? data.items : [...questions.value, ...data.items]
        hasMore.value = questions.value.length < data.total
        page.value++
      }
    }
  } catch (error) {
    console.error('加载问题失败:', error)
  } finally {
    loading.value = false
  }
}

function selectCategory(categoryId: number) {
  selectedCategoryId.value = categoryId
  loadQuestions(true)
}

function loadMore() {
  if (!loading.value && hasMore.value) {
    loadQuestions()
  }
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
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function goBack() {
  uni.navigateBack()
}

function goToAsk() {
  uni.navigateTo({ url: '/pages/academy/ask' })
}

function goToQuestion(questionId: number) {
  uni.navigateTo({ url: `/pages/academy/question?id=${questionId}` })
}

onMounted(() => {
  loadCategories()
  loadQuestions()
})
</script>

<style scoped>
.questions-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.back-btn {
  font-size: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.ask-btn {
  font-size: 28rpx;
  padding: 10rpx 24rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 30rpx;
}

.filter-bar {
  background: #fff;
  padding: 20rpx 0;
}

.filter-scroll {
  white-space: nowrap;
  padding: 0 30rpx;
}

.filter-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 30rpx;
}

.filter-item.active {
  background: #6C63FF;
  color: #fff;
}

.question-list {
  padding: 20rpx 30rpx;
  height: calc(100vh - 200rpx);
}

.question-item {
  background: #fff;
  border-radius: 16rpx;
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

.status.pending {
  background: #fff3e0;
  color: #ff9800;
}

.status.replied {
  background: #e3f2fd;
  color: #2196f3;
}

.status.adopted {
  background: #e8f5e9;
  color: #4caf50;
}

.status.closed {
  background: #f5f5f5;
  color: #999;
}

.category {
  font-size: 24rpx;
  color: #999;
}

.question-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.question-content {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.question-footer {
  display: flex;
  font-size: 22rpx;
  color: #999;
}

.author {
  margin-right: auto;
}

.answer-count, .views, .date {
  margin-left: 20rpx;
}

.best-answer {
  margin-top: 20rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
  border-radius: 12rpx;
}

.best-answer .badge {
  font-size: 22rpx;
  color: #4caf50;
  margin-bottom: 8rpx;
  display: block;
}

.best-answer .answer-content {
  font-size: 26rpx;
  color: #666;
}

.load-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}
</style>