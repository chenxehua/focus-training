<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const isLoading = ref(false)
const errorMsg = ref('')

let timer: ReturnType<typeof setInterval> | null = null

async function sendCode() {
  if (!phone.value || phone.value.length !== 11) {
    errorMsg.value = '请输入正确的手机号'
    return
  }

  try {
    await userStore.sendCode(phone.value)
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = 0
        if (timer) clearInterval(timer)
      }
    }, 1000)
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : '发送失败'
  }
}

async function login() {
  if (!phone.value || !code.value) {
    errorMsg.value = '请填写手机号和验证码'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    await userStore.phoneLogin(phone.value, code.value)
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    isLoading.value = false
  }
}

// 微信登录
async function wxLogin() {
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    await userStore.wxLogin(loginRes.code)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (error: unknown) {
    errorMsg.value = error instanceof Error ? error.message : '微信登录失败'
  }
}

</script>

<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
      <view class="bg-circle circle-3"></view>
    </view>

    <!-- Logo区 -->
    <view class="logo-section">
      <view class="logo-wrapper">
        <text class="logo-icon">🎯</text>
      </view>
      <text class="app-name">专注星球</text>
      <text class="app-slogan">每天10分钟，专注伴成长</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-section">
      <!-- 手机号输入 -->
      <view class="input-group">
        <view class="input-wrapper">
          <text class="input-icon">📱</text>
          <input
            v-model="phone"
            type="number"
            placeholder="请输入手机号"
            placeholder-class="input-placeholder"
            maxlength="11"
            class="input-field"
          />
        </view>
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <view class="input-wrapper code-wrapper">
          <text class="input-icon">🔐</text>
          <input
            v-model="code"
            type="number"
            placeholder="请输入验证码"
            placeholder-class="input-placeholder"
            maxlength="6"
            class="input-field"
          />
          <view
            class="send-code-btn"
            :class="{ disabled: countdown > 0 }"
            @tap="sendCode"
          >
            <text class="code-text">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </text>
          </view>
        </view>
      </view>

      <!-- 错误提示 -->
      <view v-if="errorMsg" class="error-tip">
        <text class="error-text">{{ errorMsg }}</text>
      </view>

      <!-- 登录按钮 -->
      <view class="login-btn" :class="{ loading: isLoading }" @tap="login">
        <text class="login-btn-text">{{ isLoading ? '登录中...' : '登录' }}</text>
      </view>

      <!-- 分割线 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <!-- 微信一键登录 -->
      <view class="wx-login-btn" @tap="wxLogin">
        <view class="wx-icon">🍊</view>
        <text class="wx-login-text">微信一键登录</text>
      </view>

      <!-- 用户协议 -->
      <view class="agreement">
        <text class="agreement-text">
          登录即表示同意
          <text class="link">《用户服务协议》</text>
          和
          <text class="link">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 品牌信息 -->
    <view class="brand-section">
      <text class="brand-text">科学训练 · 寓教于乐 · 见证成长</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8E0FF 0%, #F5F5FF 50%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48rpx;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
}

.circle-1 {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  top: -100rpx;
  right: -150rpx;
}

.circle-2 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%);
  bottom: 200rpx;
  left: -150rpx;
}

.circle-3 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #98D8C8 0%, #B2E1D8 100%);
  bottom: -50rpx;
  right: 50rpx;
}

// Logo区
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 120rpx;
  z-index: 1;
}

.logo-wrapper {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(108, 99, 255, 0.3);
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
  margin-top: 24rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: #666666;
  margin-top: 8rpx;
}

// 表单区
.form-section {
  width: 100%;
  margin-top: 80rpx;
  z-index: 1;
}

.input-group {
  margin-bottom: 32rpx;
}

.input-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 0 32rpx;
  height: 100rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.code-wrapper {
  padding-right: 0;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.input-field {
  flex: 1;
  font-size: 32rpx;
  color: #333333;
}

.input-placeholder {
  color: #999999;
}

.send-code-btn {
  padding: 24rpx 32rpx;
  background-color: transparent;

  &.disabled {
    .code-text {
      color: #999999;
    }
  }
}

.code-text {
  font-size: 28rpx;
  color: #6C63FF;
  font-weight: 600;
}

.error-tip {
  background-color: #FFF0F0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.error-text {
  font-size: 26rpx;
  color: #FF5252;
}

.login-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(108, 99, 255, 0.3);

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  &.loading {
    opacity: 0.7;
  }
}

.login-btn-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
}

// 分割线
.divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 40rpx 0;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background-color: #E8E8E8;
}

.divider-text {
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #999999;
}

// 微信登录
.wx-login-btn {
  width: 100%;
  height: 100rpx;
  background-color: #07C160;
  border-radius: 50rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
}

.wx-icon {
  font-size: 40rpx;
  margin-right: 12rpx;
}

.wx-login-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

// 用户协议
.agreement {
  margin-top: 32rpx;
  text-align: center;
}

.agreement-text {
  font-size: 24rpx;
  color: #999999;
}

.link {
  color: #6C63FF;
}

// 品牌信息
.brand-section {
  position: absolute;
  bottom: 60rpx;
  z-index: 1;
}

.brand-text {
  font-size: 24rpx;
  color: #B3B3B3;
}
</style>