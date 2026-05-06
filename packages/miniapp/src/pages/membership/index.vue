<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { getMembershipBenefits, getMembershipInfo, createMembershipOrder } from '@/api/membership'

const userStore = useUserStore()
const benefits = ref<BenefitTier[]>([])
const membership = ref<MembershipInfo | null>(null)
const isLoading = ref(false)
const isCreatingOrder = ref(false)

interface BenefitTier {
  type: 'month' | 'quarter' | 'year' | 'lifetime'
  name: string
  price: number
  originalPrice?: number
  period: string
  features: string[]
}

interface MembershipInfo {
  member_type: string
  member_name: string
  end_date?: string
  status: string
  is_vip: boolean
}

const isVip = computed(() => membership.value?.is_vip)

// 推荐套餐高亮
const recommendedType = computed(() => 'year')

async function loadData() {
  isLoading.value = true
  try {
    const [benefitsRes, membershipRes] = await Promise.all([
      getMembershipBenefits(),
      getMembershipInfo(),
    ])
    benefits.value = benefitsRes.data.tiers
    membership.value = membershipRes.data
  } catch (error) {
    console.error('加载会员信息失败:', error)
  } finally {
    isLoading.value = false
  }
}

async function handlePurchase(type: string) {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }

  isCreatingOrder.value = true
  try {
    const res = await createMembershipOrder({ memberType: type as any })
    // 调用微信支付
    uni.requestPayment({
      provider: 'wxpay',
      ...res.data.paymentParams,
      success: () => {
        uni.showToast({ title: '支付成功', icon: 'success' })
        loadData() // 刷新会员状态
      },
      fail: (err) => {
        console.error('支付失败:', err)
        uni.showToast({ title: '支付取消', icon: 'none' })
      },
    })
  } catch (error: any) {
    console.error('创建订单失败:', error)
    uni.showToast({ title: error.message || '创建订单失败', icon: 'none' })
  } finally {
    isCreatingOrder.value = false
  }
}

function formatPrice(price: number): string {
  return (price / 100).toFixed(2)
}

function getMonthCount(period: string): number {
  const match = period.match(/(\d+)/)
  return match ? parseInt(match[1]) : 1
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadData()
  }
})
</script>

<template>
  <view class="page">
    <!-- 头部区域 -->
    <view class="header-section">
      <view class="vip-banner">
        <view class="banner-left">
          <text class="banner-icon">👑</text>
          <view class="banner-text">
            <text class="banner-title">{{ isVip ? 'VIP会员' : '开通会员' }}</text>
            <text class="banner-sub">{{ isVip ? '感谢您的支持' : '解锁全部训练功能' }}</text>
          </view>
        </view>
        <view v-if="isVip" class="banner-status">
          <text class="vip-badge">已开通</text>
        </view>
      </view>

      <!-- 会员到期信息 -->
      <view v-if="isVip && membership?.end_date" class="expiry-info">
        <text class="expiry-label">有效期至</text>
        <text class="expiry-date">{{ membership.end_date }}</text>
      </view>
    </view>

    <!-- 会员特权 -->
    <view class="privileges-section">
      <text class="section-title">会员特权</text>
      <view class="privileges-grid">
        <view class="privilege-item">
          <text class="privilege-icon">🎮</text>
          <text class="privilege-name">全部游戏</text>
          <text class="privilege-desc">解锁9款训练游戏</text>
        </view>
        <view class="privilege-item">
          <text class="privilege-icon">📊</text>
          <text class="privilege-name">详细报告</text>
          <text class="privilege-desc">7维度专业评估</text>
        </view>
        <view class="privilege-item">
          <text class="privilege-icon">🏆</text>
          <text class="privilege-name">成就系统</text>
          <text class="privilege-desc">专属徽章奖励</text>
        </view>
        <view class="privilege-item">
          <text class="privilege-icon">🎨</text>
          <text class="privilege-name">主题皮肤</text>
          <text class="privilege-desc">更多游戏皮肤</text>
        </view>
      </view>
    </view>

    <!-- 套餐选择 -->
    <view class="plans-section">
      <text class="section-title">选择套餐</text>

      <view v-if="isLoading" class="loading-area">
        <view v-for="i in 3" :key="i" class="skeleton-plan" />
      </view>

      <view v-else class="plans-list">
        <view
          v-for="plan in benefits"
          :key="plan.type"
          class="plan-card"
          :class="{
            recommended: plan.type === recommendedType,
            selected: !isVip,
            disabled: isVip && plan.type === membership?.member_type
          }"
        >
          <!-- 推荐标签 -->
          <view v-if="plan.type === recommendedType" class="recommended-tag">
            <text>推荐</text>
          </view>

          <view class="plan-header">
            <view class="plan-info">
              <text class="plan-name">{{ plan.name }}</text>
              <text class="plan-period">{{ plan.period }}</text>
            </view>
            <view class="plan-price-wrap">
              <text class="plan-price">¥{{ formatPrice(plan.price) }}</text>
              <text v-if="plan.originalPrice" class="plan-original">
                ¥{{ formatPrice(plan.originalPrice) }}
              </text>
            </view>
          </view>

          <!-- 权益列表 -->
          <view class="plan-features">
            <text
              v-for="(feature, index) in plan.features"
              :key="index"
              class="plan-feature"
            >
              ✓ {{ feature }}
            </text>
          </view>

          <!-- 立即开通按钮 -->
          <view
            v-if="!isVip || plan.type !== membership?.member_type"
            class="plan-action"
            @tap="handlePurchase(plan.type)"
          >
            <text class="action-text">
              {{ isVip ? '升级' : '立即开通' }}
            </text>
          </view>
          <view v-else class="plan-current">
            <text class="current-text">当前套餐</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="footer-section">
      <text class="footer-text">
        会员服务一经开通，不支持退款。\n如有疑问请联系客服。
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60rpx;
}

.header-section {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  padding: 32rpx;
  padding-bottom: 40rpx;
}

.vip-banner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.banner-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.banner-icon {
  font-size: 56rpx;
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.banner-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.banner-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.banner-status {
  padding: 8rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

.vip-badge {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
}

.expiry-info {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.expiry-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.expiry-date {
  font-size: 24rpx;
  color: #ffffff;
}

.privileges-section {
  padding: 32rpx 24rpx 0;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.privileges-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.privilege-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.privilege-icon {
  font-size: 40rpx;
}

.privilege-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.privilege-desc {
  font-size: 20rpx;
  color: #999999;
}

.plans-section {
  padding: 32rpx 24rpx 0;
}

.loading-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-plan {
  height: 260rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  border-radius: 24rpx;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.plan-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.2s;

  &.recommended {
    border: 2rpx solid #6C63FF;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.recommended-tag {
  position: absolute;
  top: 20rpx;
  right: -32rpx;
  background-color: #6C63FF;
  padding: 6rpx 48rpx;
  transform: rotate(45deg);
}

.recommended-tag text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
}

.plan-header {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.plan-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.plan-period {
  font-size: 22rpx;
  color: #999999;
}

.plan-price-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.plan-price {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF6B6B;
}

.plan-original {
  font-size: 22rpx;
  color: #999999;
  text-decoration: line-through;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.plan-feature {
  font-size: 24rpx;
  color: #666666;
}

.plan-action {
  background: linear-gradient(135deg, #6C63FF 0%, #9B94FF 100%);
  border-radius: 40rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
}

.plan-current {
  background-color: #f0f0f0;
  border-radius: 40rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-text {
  font-size: 28rpx;
  color: #999999;
}

.footer-section {
  padding: 32rpx 24rpx;
  text-align: center;
}

.footer-text {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.6;
}
</style>