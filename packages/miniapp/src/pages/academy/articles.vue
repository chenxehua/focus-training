<template>
  <view class="articles-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">文章列表</text>
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

    <!-- 文章列表 -->
    <scroll-view class="article-list" scroll-y @scrolltolower="loadMore">
      <view class="article-item" 
            v-for="article in articles" 
            :key="article.id"
            @click="goToArticle(article.id)">
        <image class="cover" 
               :src="article.cover_image || '/static/default-article.png'" 
               mode="aspectFill"/>
        <view class="article-content">
          <text class="article-title">{{ article.title }}</text>
          <text class="article-summary">{{ article.summary || article.content?.substring(0, 60) || '' }}...</text>
          <view class="article-meta">
            <text class="category">{{ article.category_name }}</text>
            <text class="read-count">{{ article.read_count || 0 }}阅读</text>
            <text class="reading-time">{{ article.reading_time || 5 }}分钟</text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && articles.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty-state" v-if="!loading && articles.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无文章</text>
      </view>
    </scroll-view>

    <LoadingSpinner v-if="loading && articles.length === 0" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAcademyCategories, getArticles } from '../../api/academy'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const loading = ref(false)
const categories = ref<any[]>([])
const articles = ref<any[]>([])
const selectedCategoryId = ref(0)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

async function loadCategories() {
  try {
    const res = await getAcademyCategories()
    if (res.code === 0) {
      categories.value = res.data || []
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadArticles(reset = false) {
  if (loading.value || (!hasMore.value && !reset)) return
  
  loading.value = true
  try {
    if (reset) {
      page.value = 1
      articles.value = []
      hasMore.value = true
    }

    const res = await getArticles({
      page: page.value,
      pageSize,
      categoryId: selectedCategoryId.value || undefined
    })

    if (res.code === 0) {
      const data = res.data
      if (data.items) {
        articles.value = reset ? data.items : [...articles.value, ...data.items]
        hasMore.value = articles.value.length < data.total
        page.value++
      }
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

function selectCategory(categoryId: number) {
  selectedCategoryId.value = categoryId
  loadArticles(true)
}

function loadMore() {
  if (!loading.value && hasMore.value) {
    loadArticles()
  }
}

function goBack() {
  uni.navigateBack()
}

function goToArticle(articleId: number) {
  uni.navigateTo({ url: `/pages/academy/article?id=${articleId}` })
}

onMounted(() => {
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.articles-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.back-btn {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
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

.article-list {
  padding: 20rpx 30rpx;
  height: calc(100vh - 200rpx);
}

.article-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.cover {
  width: 200rpx;
  height: 150rpx;
  border-radius: 12rpx;
  background: #eee;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.article-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.article-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.article-meta {
  display: flex;
  font-size: 22rpx;
  color: #999;
}

.category {
  color: #6C63FF;
  margin-right: 16rpx;
}

.read-count, .reading-time {
  margin-right: 16rpx;
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