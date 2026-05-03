<template>
  <view class="academy-page">
    <!-- 顶部导航 -->
    <view class="header">
      <text class="title">家长学院</text>
      <text class="subtitle">专注力训练知识库</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar" @click="goToSearch">
      <text class="icon">🔍</text>
      <text class="placeholder">搜索文章、问答...</text>
    </view>

    <!-- 热门文章 -->
    <view class="section" v-if="hotArticles.length > 0">
      <view class="section-header">
        <text class="section-title">热门文章</text>
        <text class="more" @click="goToArticles">更多 ></text>
      </view>
      <scroll-view class="article-scroll" scroll-x>
        <view class="article-card" 
              v-for="article in hotArticles" 
              :key="article.id"
              @click="goToArticle(article.id)">
          <image class="cover" :src="article.cover_image || '/static/default-article.png'" mode="aspectFill"/>
          <view class="article-info">
            <text class="article-title">{{ article.title }}</text>
            <view class="article-meta">
              <text class="read-count">{{ article.read_count }}阅读</text>
              <text class="reading-time">{{ article.reading_time || 5 }}分钟</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 分类列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">知识分类</text>
      </view>
      <view class="category-grid">
        <view class="category-item" 
              v-for="category in categories" 
              :key="category.id"
              @click="goToCategory(category.id)">
          <text class="category-icon">{{ category.category_icon || '📚' }}</text>
          <text class="category-name">{{ category.category_name }}</text>
          <text class="article-count">{{ category.article_count }}篇</text>
        </view>
      </view>
    </view>

    <!-- 专家问答 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">专家问答</text>
        <text class="more" @click="goToQuestions">更多 ></text>
      </view>
      <view class="expert-answers" v-if="expertAnswers.length > 0">
        <view class="expert-item"
              v-for="answer in expertAnswers"
              :key="answer.id"
              @click="goToQuestion(answer.question_id)">
          <view class="expert-badge">
            <text class="badge-icon">👨‍🏫</text>
            <text class="badge-text">专家回答</text>
          </view>
          <text class="question-title">{{ answer.question_title }}</text>
          <text class="answer-preview">{{ truncateAnswer(answer.answer_content) }}</text>
          <view class="expert-info">
            <text class="expert-name">{{ answer.expert_name }}</text>
            <text class="answer-time">{{ formatTime(answer.created_at) }}</text>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-icon">💬</text>
        <text class="empty-text">暂无专家回答</text>
      </view>
    </view>

    <!-- 热门问题 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热门问题</text>
      </view>
      <view class="question-list">
        <view class="question-item"
              v-for="question in hotQuestions"
              :key="question.id"
              @click="goToQuestion(question.id)">
          <view class="question-content">
            <text class="question-title">{{ question.question_title }}</text>
            <view class="question-meta">
              <text class="category">{{ question.category_name }}</text>
              <text class="views">{{ question.view_count }}浏览</text>
              <text class="answers">{{ question.answer_count }}回答</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  getAcademyCategories, 
  getHotArticles, 
  getHotQuestions,
  getExpertAnswers 
} from '../../api/academy'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const loading = ref(false)
const categories = ref<any[]>([])
const hotArticles = ref<any[]>([])
const hotQuestions = ref<any[]>([])
const expertAnswers = ref<any[]>([])

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [categoriesRes, articlesRes, questionsRes, answersRes] = await Promise.all([
      getAcademyCategories(),
      getHotArticles(5),
      getHotQuestions(5),
      getExpertAnswers(3)
    ])

    if (categoriesRes.code === 0) {
      categories.value = categoriesRes.data || []
    }
    if (articlesRes.code === 0) {
      hotArticles.value = articlesRes.data || []
    }
    if (questionsRes.code === 0) {
      hotQuestions.value = questionsRes.data || []
    }
    if (answersRes.code === 0) {
      expertAnswers.value = answersRes.data || []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化时间
function formatTime(time: string) {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 截断回答内容
function truncateAnswer(content: string) {
  if (!content) return ''
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

// 页面跳转
function goToSearch() {
  // TODO: 跳转搜索页
}

function goToArticles() {
  uni.navigateTo({ url: '/pages/academy/articles' })
}

function goToArticle(articleId: number) {
  uni.navigateTo({ url: `/pages/academy/article?id=${articleId}` })
}

function goToCategory(categoryId: number) {
  uni.navigateTo({ url: `/pages/academy/category?id=${categoryId}` })
}

function goToQuestions() {
  uni.navigateTo({ url: '/pages/academy/questions' })
}

function goToQuestion(questionId: number) {
  uni.navigateTo({ url: `/pages/academy/question?id=${questionId}` })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.academy-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
}

.header {
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
}

.subtitle {
  font-size: 26rpx;
  opacity: 0.9;
  margin-top: 8rpx;
  display: block;
}

.search-bar {
  margin: -30rpx 30rpx 20rpx;
  background: #fff;
  border-radius: 50rpx;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.icon {
  margin-right: 16rpx;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.section {
  background: #fff;
  margin: 20rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 26rpx;
  color: #999;
}

.article-scroll {
  white-space: nowrap;
  margin: 0 -30rpx;
  padding: 0 30rpx;
}

.article-card {
  display: inline-block;
  width: 280rpx;
  margin-right: 20rpx;
  vertical-align: top;
}

.cover {
  width: 280rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background: #eee;
}

.article-info {
  margin-top: 16rpx;
}

.article-title {
  font-size: 28rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.category-item {
  text-align: center;
  padding: 20rpx 10rpx;
  border-radius: 16rpx;
  background: #f8f8ff;
}

.category-icon {
  font-size: 48rpx;
  display: block;
}

.category-name {
  font-size: 24rpx;
  color: #333;
  margin-top: 8rpx;
  display: block;
}

.article-count {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.expert-answers {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.expert-item {
  padding: 24rpx;
  background: linear-gradient(135deg, #fef9f3 0%, #fff8f0 100%);
  border-radius: 16rpx;
  border: 1px solid #ffe4c4;
}

.expert-badge {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.badge-icon {
  font-size: 28rpx;
}

.badge-text {
  font-size: 22rpx;
  color: #ff9500;
  margin-left: 8rpx;
}

.question-title {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.answer-preview {
  font-size: 24rpx;
  color: #666;
  display: block;
  line-height: 1.5;
}

.expert-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.question-item {
  padding: 24rpx;
  background: #f8f8ff;
  border-radius: 12rpx;
}

.question-content {
  display: flex;
  flex-direction: column;
}

.question-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
  margin-top: 16rpx;
  display: block;
}
</style>