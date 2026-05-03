<template>
  <view class="ask-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @click="goBack">←</view>
      <text class="title">提问</text>
      <view class="submit-btn" @click="submitQuestion">发布</view>
    </view>

    <!-- 提问表单 -->
    <view class="form-section">
      <!-- 选择分类 -->
      <view class="form-item">
        <text class="label">选择分类 <text class="required">*</text></text>
        <scroll-view class="category-scroll" scroll-x>
          <view 
            class="category-item" 
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: selectedCategoryId === cat.id }"
            @click="selectCategory(cat.id)">
            {{ cat.category_name }}
          </view>
        </scroll-view>
      </view>

      <!-- 问题标题 -->
      <view class="form-item">
        <text class="label">问题标题 <text class="required">*</text></text>
        <input 
          class="input" 
          v-model="questionTitle" 
          placeholder="请输入问题标题（5-50字）"
          :maxlength="50"/>
        <text class="char-count">{{ questionTitle.length }}/50</text>
      </view>

      <!-- 问题描述 -->
      <view class="form-item">
        <text class="label">问题描述 <text class="required">*</text></text>
        <textarea 
          class="textarea" 
          v-model="questionContent" 
          placeholder="请详细描述您的问题（至少10字）"
          :maxlength="2000"/>
        <text class="char-count">{{ questionContent.length }}/2000</text>
      </view>

      <!-- 添加图片 -->
      <view class="form-item">
        <text class="label">添加图片（可选）</text>
        <view class="images-list">
          <view class="image-item" v-for="(img, idx) in images" :key="idx">
            <image :src="img" mode="aspectFill"/>
            <view class="delete-btn" @click="removeImage(idx)">×</view>
          </view>
          <view class="add-image" @click="chooseImage" v-if="images.length < 9">
            <text class="icon">+</text>
            <text class="text">添加图片</text>
          </view>
        </view>
        <text class="tips">最多上传9张图片</text>
      </view>

      <!-- 隐私声明 -->
      <view class="privacy-notice">
        <text class="icon">⚠️</text>
        <text class="text">提问即表示您同意我们的</text>
        <text class="link" @click="goToPrivacy">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getQuestionCategories, createQuestion } from '../../api/academy'

const categories = ref<any[]>([])
const selectedCategoryId = ref<number | null>(null)
const questionTitle = ref('')
const questionContent = ref('')
const images = ref<string[]>([])
const submitting = ref(false)

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

function selectCategory(categoryId: number) {
  selectedCategoryId.value = categoryId
}

function chooseImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 实际项目中应该先上传图片到服务器
      // 这里简化处理，直接使用本地临时路径
      images.value = [...images.value, ...res.tempFilePaths]
    }
  })
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

async function submitQuestion() {
  // 表单验证
  if (!selectedCategoryId.value) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  if (!questionTitle.value.trim() || questionTitle.value.length < 5) {
    uni.showToast({ title: '标题至少5个字', icon: 'none' })
    return
  }
  if (!questionContent.value.trim() || questionContent.value.length < 10) {
    uni.showToast({ title: '问题描述至少10个字', icon: 'none' })
    return
  }

  if (submitting.value) return
  submitting.value = true

  try {
    const res = await createQuestion({
      questionTitle: questionTitle.value,
      questionContent: questionContent.value,
      categoryId: selectedCategoryId.value,
      images: images.value.join(',')
    })

    if (res.code === 0) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.message || '发布失败', icon: 'none' })
    }
  } catch (error) {
    console.error('提交问题失败:', error)
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function goBack() {
  uni.navigateBack()
}

function goToPrivacy() {
  // TODO: 跳转隐私政策页面
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.ask-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 40rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.back-btn {
  font-size: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.submit-btn {
  font-size: 28rpx;
  color: #6C63FF;
}

.form-section {
  padding: 30rpx;
}

.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.label {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.required {
  color: #ff4d4f;
}

.category-scroll {
  white-space: nowrap;
}

.category-item {
  display: inline-block;
  padding: 16rpx 32rpx;
  margin-right: 16rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 30rpx;
}

.category-item.active {
  background: #6C63FF;
  color: #fff;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  border: 1px solid #eee;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  height: 240rpx;
  padding: 20rpx;
  font-size: 30rpx;
  border: 1px solid #eee;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.char-count {
  font-size: 22rpx;
  color: #999;
  text-align: right;
  margin-top: 8rpx;
}

.images-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: 200rpx;
  height: 200rpx;
  position: relative;
}

.image-item image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.delete-btn {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.add-image {
  width: 200rpx;
  height: 200rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ddd;
}

.add-image .icon {
  font-size: 60rpx;
  color: #999;
}

.add-image .text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.tips {
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}

.privacy-notice {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff8e6;
  border-radius: 12rpx;
  font-size: 24rpx;
}

.privacy-notice .icon {
  margin-right: 8rpx;
}

.privacy-notice .text {
  color: #666;
}

.privacy-notice .link {
  color: #6C63FF;
  margin-left: 4rpx;
}
</style>