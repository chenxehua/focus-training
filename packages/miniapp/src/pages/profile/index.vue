<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getMembershipStatus } from '@/api/membership'
import { getAchievementList } from '@/api/achievement'

const userStore = useUserStore()

const membershipStatus = ref<any>(null)
const achievements = ref<any[]>([])
const isLoading = ref(false)

const isVip = computed(() => membershipStatus.value?.is_vip || false)
const vipExpireDate = computed(() => membershipStatus.value?.end_date || membershipStatus.value?.expireDate || '')

async function loadUserData() {
  if (!userStore.isLoggedIn) return

  isLoading.value = true
  try {
    const [membershipRes, achievementRes] = await Promise.all([
      getMembershipStatus().catch(() => ({ data: null })),
      getAchievementList().catch(() => ({ data: [] }))
    ])
    membershipStatus.value = membershipRes.data
    achievements.value = achievementRes.data || []
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function goToAssessment() {
  uni.navigateTo({ url: '/pages/assessment/welcome' })
}

function goToAchievement() {
  uni.navigateTo({ url: '/pages/achievement/index' })
}

function goToMembership() {
  uni.navigateTo({ url: '/pages/membership/index' })
}

function goToSettings() {
  uni.showToast({ title: '设置功能开发中', icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadUserData()
  }
})
</script>

<template>
  <view class="page">
    <!-- 未登录 -->
    <view v-if="!userStore.isLoggedIn" class="not-login">
      <text class="not-login-icon">👤</text>
      <text class="not-login-text">请先登录</text>
      <view class="btn-login" @tap="goToLogin">
        <text class="btn-login-text">去登录</text>
      </view>
    </view>

    <template v-else>
      <!-- 用户信息头部 -->
      <view class="profile-header">
        <view class="user-info">
          <image
            class="avatar"
            :src="userStore.userInfo?.avatar || '/static/avatar-default.png'"
            mode="aspectFill"
          />
          <view class="user-detail">
            <text class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</text>
            <text class="phone">{{ userStore.userInfo?.phone || '' }}</text>
          </view>
          <view class="vip-badge" :class="{ active: isVip }">
            <text>{{ isVip ? 'VIP' : '普通会员' }}</text>
          </view>
        </view>

        <!-- VIP权益 -->
        <view v-if="isVip" class="vip-section" @tap="goToMembership">
          <view class="vip-left">
            <text class="vip-title">VIP会员</text>
            <text class="vip-expire">有效期至 {{ vipExpireDate }}</text>
          </view>
          <view class="vip-right">
            <text class="vip-arrow">›</text>
          </view>
        </view>

        <!-- 非VIP提示 -->
        <view v-else class="upgrade-section" @tap="goToMembership">
          <text class="upgrade-text">开通VIP解锁全部功能</text>
          <view class="btn-upgrade">
            <text>立即开通</text>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions">
        <view class="action-item" @tap="goToAssessment">
          <view class="action-icon">📊</view>
          <text class="action-text">专注力评估</text>
        </view>
        <view class="action-item" @tap="goToAchievement">
          <view class="action-icon">🏆</view>
          <text class="action-text">成就中心</text>
        </view>
        <view class="action-item" @tap="goToMembership">
          <view class="action-icon">💎</view>
          <text class="action-text">会员中心</text>
        </view>
        <view class="action-item" @tap="goToSettings">
          <view class="action-icon">⚙️</view>
          <text class="action-text">设置</text>
        </view>
      </view>

      <!-- 孩子信息 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">孩子管理</text>
        </view>

        <view v-if="userStore.children.length > 0" class="children-list">
          <view
            v-for="child in userStore.children"
            :key="child.id"
            class="child-item"
          >
            <image
              class="child-avatar"
              :src="child.avatar || '/static/avatar-default.png'"
              mode="aspectFill"
            />
            <view class="child-info">
              <text class="child-name">{{ child.name }}</text>
              <text class="child-age">{{ child.age }}岁</text>
            </view>
            <view class="child-badge" v-if="userStore.currentChild?.id === child.id">
              <text>当前</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-children">
          <text class="empty-text">还没有添加孩子</text>
          <view class="btn-add-child">
            <text>添加孩子</text>
          </view>
        </view>
      </view>

      <!-- 成就展示 -->
      <view class="section-card" @tap="goToAchievement">
        <view class="section-header">
          <text class="section-title">我的成就</text>
          <text class="section-more">查看全部 ›</text>
        </view>

        <view v-if="achievements.length > 0" class="achievement-list">
          <view
            v-for="item in achievements.slice(0, 3)"
            :key="item.id"
            class="achievement-item"
          >
            <view class="achievement-icon">{{ item.icon || '🏅' }}</view>
            <text class="achievement-name">{{ item.name }}</text>
          </view>
        </view>

        <view v-else class="empty-achievement">
          <text class="empty-text">完成训练获得成就</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <view class="btn-logout" @tap="handleLogout">
          <text>退出登录</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.not-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 32rpx;
  gap: 24rpx;
}

.not-login-icon {
  font-size: 120rpx;
}

.not-login-text {
  font-size: 32rpx;
  color: #666666;
}

.btn-login {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  padding: 24rpx 64rpx;
  border-radius: 99rpx;
  margin-top: 20rpx;
}

.btn-login-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}

.profile-header {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  padding: 40rpx 32rpx;
  padding-top: 60rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.3);
  border: 4rpx solid #ffffff;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.phone {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
}

.vip-badge {
  padding: 8rpx 20rpx;
  border-radius: 99rpx;
  background-color: rgba(255,255,255,0.3);
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);

  &.active {
    background-color: #FFD93D;
    color: #333333;
  }
}

.vip-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255,255,255,0.15);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-top: 24rpx;
}

.vip-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #FFD93D;
}

.vip-expire {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 4rpx;
}

.vip-arrow {
  font-size: 36rpx;
  color: rgba(255,255,255,0.7);
}

.upgrade-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255,255,255,0.15);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-top: 24rpx;
}

.upgrade-text {
  font-size: 26rpx;
  color: rgba(255,255,255,0.9);
}

.btn-upgrade {
  background-color: #FFD93D;
  padding: 12rpx 24rpx;
  border-radius: 99rpx;
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  background-color: #ffffff;
  padding: 32rpx 16rpx;
  margin-top: -20rpx;
  border-radius: 24rpx 24rpx 0 0;
  position: relative;
  z-index: 1;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.action-icon {
  font-size: 48rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.section-card {
  background-color: #ffffff;
  margin: 20rpx 24rpx;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.section-more {
  font-size: 26rpx;
  color: #999999;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
}

.child-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
}

.child-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.child-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.child-age {
  font-size: 24rpx;
  color: #999999;
}

.child-badge {
  background-color: #6C63FF;
  padding: 6rpx 16rpx;
  border-radius: 99rpx;
  font-size: 20rpx;
  color: #ffffff;
}

.empty-children {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  gap: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

.btn-add-child {
  background-color: #f0eeff;
  padding: 16rpx 32rpx;
  border-radius: 99rpx;
  font-size: 26rpx;
  color: #6C63FF;
}

.achievement-list {
  display: flex;
  gap: 20rpx;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}

.achievement-icon {
  font-size: 56rpx;
}

.achievement-name {
  font-size: 22rpx;
  color: #666666;
  text-align: center;
}

.empty-achievement {
  display: flex;
  justify-content: center;
  padding: 20rpx;
}

.logout-section {
  padding: 40rpx 24rpx 20rpx;
}

.btn-logout {
  background-color: #ffffff;
  border-radius: 99rpx;
  padding: 24rpx;
  text-align: center;
  font-size: 30rpx;
  color: #FF8A80;
}
</style>