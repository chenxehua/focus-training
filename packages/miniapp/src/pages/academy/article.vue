<template>
  <view class="article-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">文章详情</text>
    </view>

    <scroll-view class="content" scroll-y v-if="article">
      <!-- 文章头部 -->
      <view class="article-header">
        <text class="article-title">{{ article.title }}</text>
        <view class="article-meta">
          <text class="category">{{ article.category_name }}</text>
          <text class="date">{{ formatDate(article.created_at) }}</text>
          <text class="reading-time">{{ article.reading_time || 5 }}分钟阅读</text>
        </view>
      </view>

      <!-- 文章封面 -->
      <image class="cover" 
             v-if="article.cover_image"
             :src="article.cover_image" 
             mode="widthFix"/>

      <!-- 文章正文 -->
      <view class="article-body">
        <text class="content-text">{{ article.content }}</text>
      </view>

      <!-- 标签 -->
      <view class="tags" v-if="article.tags">
        <text class="tag" v-for="tag in article.tags.split(',')" :key="tag">{{ tag }}</text>
      </view>

      <!-- 相关推荐 -->
      <view class="related-section" v-if="relatedArticles.length > 0">
        <view class="section-title">相关推荐</view>
        <view class="related-list">
          <view class="related-item" 
                v-for="item in relatedArticles" 
                :key="item.id"
                @click="goToArticle(item.id)">
            <image class="cover" :src="item.cover_image || '/static/default-article.png'" mode="aspectFill"/>
            <text class="title">{{ item.title }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getArticleDetail, getRelatedArticles } from '../../api/academy'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

const loading = ref(false)
const article = ref<any>(null)
const relatedArticles = ref<any[]>([])

async function loadArticle(articleId: number) {
  loading.value = true
  try {
    const res = await getArticleDetail(articleId)
    if (res.code === 0) {
      article.value = res.data
      // 加载相关文章
      const relatedRes = await getRelatedArticles(articleId, 3)
      if (relatedRes.code === 0) {
        relatedArticles.value = relatedRes.data || []
      }
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function goBack() {
  uni.navigateBack()
}

function goToArticle(articleId: number) {
  uni.redirectTo({ url: `/pages/academy/article?id=${articleId}` })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).$page?.options || {}
  const articleId = options.id || options.articleId
  
  if (articleId) {
    loadArticle(parseInt(articleId))
  }
})
</script>

<style scoped>
.article-page {
  min-height: 100vh;
  background-color: #fff;
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
  padding: 30rpx;
  height: calc(100vh - 120rpx);
}

.article-header {
  margin-bottom: 30rpx;
}

.article-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.article-meta {
  display: flex;
  font-size: 24rpx;
  color: #999;
}

.category {
  color: #6C63FF;
  margin-right: 20rpx;
}

.date, .reading-time {
  margin-right: 20rpx;
}

.cover {
  width: 100%;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.article-body {
  margin-bottom: 30rpx;
}

.content-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  display: block;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.tag {
  padding: 8rpx 20rpx;
  background: #f5f5f5;
  color: #666;
  font-size: 24rpx;
  border-radius: 30rpx;
}

.related-section {
  border-top: 1px solid #eee;
  padding-top: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.related-list {
  display: flex;
  gap: 20rpx;
}

.related-item {
  flex: 1;
  background: #f8f8ff;
  border-radius: 12rpx;
  overflow: hidden;
}

.related-item .cover {
  width: 100%;
  height: 150rpx;
  margin-bottom: 0;
}

.related-item .title {
  padding: 16rpx;
  font-size: 24rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>