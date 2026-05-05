<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { doWxLogin, getWxUserProfile } from '@/utils/auth'
import { addChild } from '@/api/user'
import { updateUserInfo } from '@/api/user'
import type { Child } from '@/store/user'

const userStore = useUserStore()

const isLoggingIn = ref(false)
const showAddChildModal = ref(false)
const isSubmittingChild = ref(false)

const newChild = ref({
  name: '',
  age: 6,
  gender: 'male' as 'male' | 'female',
  ageGroup: '4-6' as '4-6' | '7-9' | '10-12',
})

function computeAgeGroup(age: number): '4-6' | '7-9' | '10-12' {
  if (age <= 6) return '4-6'
  if (age <= 9) return '7-9'
  return '10-12'
}

async function handleLogin() {
  if (isLoggingIn.value) return
  isLoggingIn.value = true
  try {
    await doWxLogin()
    await userStore.fetchChildren()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (error) {
    console.error(error)
  } finally {
    isLoggingIn.value = false
  }
}

async function handleGetProfile() {
  try {
    const profile = await getWxUserProfile()
    await updateUserInfo({ nickname: profile.nickname, avatar: profile.avatar })
    await userStore.fetchUserInfo()
    uni.showToast({ title: '头像昵称已更新', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '获取信息失败', icon: 'none' })
  }
}

function onAgeChange(e: { detail: { value: string } }) {
  const age = Number(e.detail.value)
  newChild.value.age = age
  newChild.value.ageGroup = computeAgeGroup(age)
}

async function handleAddChild() {
  if (!newChild.value.name.trim()) {
    uni.showToast({ title: '请输入孩子姓名', icon: 'none' })
    return
  }
  isSubmittingChild.value = true
  try {
    const res = await addChild({
      name: newChild.value.name.trim(),
      age: newChild.value.age,
      gender: newChild.value.gender,
      ageGroup: newChild.value.ageGroup,
    })
    await userStore.fetchChildren()
    userStore.setCurrentChild(res.data)
    showAddChildModal.value = false
    newChild.value = { name: '', age: 6, gender: 'male', ageGroup: '4-6' }
    uni.showToast({ title: '添加成功', icon: 'success' })
  } catch (error) {
    console.error(error)
  } finally {
    isSubmittingChild.value = false
  }
}

function selectChild(child: Child) {
  userStore.setCurrentChild(child)
  uni.showToast({ title: `已切换到 ${child.name}`, icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出登录后需重新授权',
    success(res: UniApp.ShowModalRes) {
      if (res.confirm) {
        userStore.logout()
      }
    },
  })
}

const menuItems = [
  { icon: '🔔', label: '消息通知', action: () => uni.showToast({ title: '消息功能开发中', icon: 'none' }) },
  { icon: '💎', label: '会员中心', action: () => uni.navigateTo({ url: '/pages/membership/index' }) },
  { icon: '📞', label: '联系客服', action: () => uni.makePhoneCall({ phoneNumber: '400-123-4567' }) },
  { icon: '📖', label: '关于我们', action: () => showAboutModal() },
]

function showAboutModal() {
  uni.showModal({
    title: '关于我们',
    content: '专注星球 v1.0.0\n\n一款面向4-12岁儿童的专注力训练应用。\n\n每天10分钟，专注伴成长！',
    showCancel: false,
    confirmText: '知道了'
  })
}
</script>

<template>
  <view class="page">
    <!-- 用户信息卡 -->
    <view class="user-card">
      <view v-if="userStore.isLoggedIn" class="user-info">
        <button class="avatar-btn" open-type="chooseAvatar" @tap="handleGetProfile">
          <image
            class="avatar"
            :src="userStore.userInfo?.avatar || '/static/avatar-default.png'"
            mode="aspectFill"
          />
        </button>
        <view class="user-detail">
          <text class="user-name">{{ userStore.userInfo?.nickname || '未设置昵称' }}</text>
          <text class="user-phone">{{ userStore.userInfo?.phone || '未绑定手机' }}</text>
        </view>
      </view>

      <view v-else class="login-prompt" @tap="handleLogin">
        <image class="avatar-placeholder" src="/static/avatar-default.png" mode="aspectFill" />
        <view class="login-text-wrap">
          <text class="login-title" v-if="!isLoggingIn">点击登录</text>
          <text class="login-title" v-else>登录中...</text>
          <text class="login-hint">登录后查看完整数据</text>
        </view>
      </view>
    </view>

    <!-- 孩子管理 -->
    <view v-if="userStore.isLoggedIn" class="section-card">
      <view class="section-header">
        <text class="section-title">孩子管理</text>
        <view class="add-child-btn" @tap="showAddChildModal = true">
          <text class="add-child-text">+ 添加</text>
        </view>
      </view>

      <view v-if="userStore.children.length === 0" class="no-child">
        <text class="no-child-text">还没有孩子信息，添加一个吧</text>
      </view>

      <view v-else class="children-list">
        <view
          v-for="child in userStore.children"
          :key="child.id"
          class="child-item"
          :class="{ active: userStore.currentChild?.id === child.id }"
          @tap="selectChild(child)"
        >
          <image
            class="child-avatar"
            :src="child.avatar || '/static/avatar-default.png'"
            mode="aspectFill"
          />
          <view class="child-info">
            <text class="child-name">{{ child.name }}</text>
            <text class="child-meta">{{ child.age }}岁 · {{ child.gender === 'male' ? '男' : '女' }} · Lv.{{ child.level }}</text>
          </view>
          <view v-if="userStore.currentChild?.id === child.id" class="current-badge">
            <text class="current-text">当前</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section-card">
      <view
        v-for="(item, index) in menuItems"
        :key="index"
        class="menu-item"
        @tap="item.action"
      >
        <text class="menu-icon">{{ item.icon }}</text>
        <text class="menu-label">{{ item.label }}</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="userStore.isLoggedIn" class="logout-btn" @tap="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>

    <text class="version-text">v1.0.0</text>

    <!-- 添加孩子弹窗 -->
    <view v-if="showAddChildModal" class="modal-overlay" @tap.self="showAddChildModal = false">
      <view class="modal" @tap.stop="() => {}">
        <text class="modal-title">添加孩子信息</text>

        <view class="form-item">
          <text class="form-label">姓名</text>
          <input
            class="form-input"
            v-model="newChild.name"
            placeholder="请输入孩子姓名"
            maxlength="10"
            @tap.stop="() => {}"
          />
        </view>

        <view class="form-item">
          <text class="form-label">年龄</text>
          <view class="age-stepper">
            <view class="stepper-btn" @tap.stop="newChild.age = Math.max(4, newChild.age - 1); newChild.ageGroup = computeAgeGroup(newChild.age)">-</view>
            <text class="stepper-value">{{ newChild.age }}岁</text>
            <view class="stepper-btn" @tap.stop="newChild.age = Math.min(12, newChild.age + 1); newChild.ageGroup = computeAgeGroup(newChild.age)">+</view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-select">
            <view
              class="gender-btn"
              :class="{ active: newChild.gender === 'male' }"
              @tap.stop="newChild.gender = 'male'"
            >男孩</view>
            <view
              class="gender-btn"
              :class="{ active: newChild.gender === 'female' }"
              @tap.stop="newChild.gender = 'female'"
            >女孩</view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">年龄段</text>
          <text class="form-value">{{ newChild.ageGroup }} 岁（自动计算）</text>
        </view>

        <view class="modal-actions">
          <view class="btn-outline modal-btn" @tap.stop="showAddChildModal = false">
            <text class="btn-text-outline">取消</text>
          </view>
          <view class="btn-primary modal-btn" @tap.stop="handleAddChild">
            <text class="btn-text">{{ isSubmittingChild ? '添加中...' : '确认添加' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60rpx;
}

.user-card {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  padding: 48rpx 32rpx 48rpx;
}

.user-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.avatar-btn {
  padding: 0;
  margin: 0;
  background: none;
  border: none;

  &::after { border: none; }
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.8);
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.user-phone {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 8rpx;
}

.login-prompt {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;

  &:active { opacity: 0.8; }
}

.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.6);
  background-color: rgba(255,255,255,0.3);
}

.login-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.login-hint {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 8rpx;
}

.section-card {
  background-color: #ffffff;
  margin: 20rpx 24rpx 0;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333333;
}

.add-child-btn {
  padding: 8rpx 20rpx;
  background-color: #f0eeff;
  border-radius: 99rpx;

  &:active { opacity: 0.8; }
}

.add-child-text {
  font-size: 24rpx;
  color: #6C63FF;
  font-weight: 600;
}

.no-child {
  padding: 24rpx 28rpx;
}

.no-child-text {
  font-size: 26rpx;
  color: #999999;
}

.children-list {
  padding: 0 8rpx 8rpx;
}

.child-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  gap: 16rpx;

  &.active { background-color: #f0eeff; }
  &:active { background-color: #f5f5f5; }
}

.child-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.child-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.child-meta {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

.current-badge {
  margin-left: auto;
  background-color: #6C63FF;
  border-radius: 99rpx;
  padding: 4rpx 16rpx;
}

.current-text {
  font-size: 20rpx;
  color: #ffffff;
}

.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  gap: 16rpx;

  &:last-child { border-bottom: none; }
  &:active { background-color: #f8f8f8; }
}

.menu-icon { font-size: 36rpx; }
.menu-label { flex: 1; font-size: 28rpx; color: #333333; }
.menu-arrow { font-size: 32rpx; color: #cccccc; }

.logout-btn {
  margin: 20rpx 24rpx 0;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);

  &:active { opacity: 0.8; }
}

.logout-text {
  font-size: 28rpx;
  color: #FF8A80;
  font-weight: 600;
}

.version-text {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #cccccc;
  margin-top: 32rpx;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal {
  background-color: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  text-align: center;
  display: block;
  margin-bottom: 8rpx;
}

.form-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  width: 120rpx;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  text-align: right;
}

.form-value {
  font-size: 28rpx;
  color: #6C63FF;
}

.age-stepper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333333;

  &:active { background-color: #e0e0e0; }
}

.stepper-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  min-width: 80rpx;
  text-align: center;
}

.gender-select {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.gender-btn {
  padding: 12rpx 32rpx;
  border-radius: 99rpx;
  font-size: 26rpx;
  color: #666666;
  background-color: #f5f5f5;

  &.active {
    background-color: #6C63FF;
    color: #ffffff;
    font-weight: 600;
  }

  &:active { opacity: 0.8; }
}

.modal-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-top: 8rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 99rpx;
}

.btn-primary {
  background-color: #6C63FF;
  &:active { opacity: 0.85; }
}

.btn-outline {
  border: 2rpx solid #6C63FF;
  background-color: transparent;
  &:active { opacity: 0.85; }
}

.btn-text { color: #ffffff; font-size: 30rpx; font-weight: 600; }
.btn-text-outline { color: #6C63FF; font-size: 30rpx; font-weight: 600; }
</style>
