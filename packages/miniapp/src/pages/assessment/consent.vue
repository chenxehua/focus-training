<template>
  <view class="consent-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="header-title">测评知情同意书</text>
      <text class="header-subtitle">请家长仔细阅读以下内容</text>
    </view>

    <!-- 同意书内容 -->
    <view class="consent-content">
      <!-- 隐私保护 -->
      <view class="consent-section">
        <view class="section-header">
          <text class="section-icon">🔒</text>
          <text class="section-title">隐私保护</text>
        </view>
        <view class="section-text">
          <text>
            我们高度重视您的隐私和数据安全。在测评过程中收集的所有信息将严格遵守相关法律法规，仅用于评估儿童专注力发展水平，不会用于任何商业目的。

            收集的信息包括：
            • 儿童基本信息（年龄、性别）
            • 问卷回答
            • 游戏表现数据
            • 评估报告

            这些信息将安全存储，不会与第三方共享。
          </text>
        </view>
      </view>

      <!-- 测评目的 -->
      <view class="consent-section">
        <view class="section-header">
          <text class="section-icon">🎯</text>
          <text class="section-title">测评目的</text>
        </view>
        <view class="section-text">
          <text>
            本测评旨在帮助家长了解孩子在专注力方面的优势和不足，以便提供更有针对性的训练建议。

            测评结果仅供参考，不能替代专业医疗诊断。如发现孩子存在严重的注意力问题，建议咨询专业医生或儿童心理专家。
          </text>
        </view>
      </view>

      <!-- 测评须知 -->
      <view class="consent-section">
        <view class="section-header">
          <text class="section-icon">📋</text>
          <text class="section-title">测评须知</text>
        </view>
        <view class="section-text">
          <text>
            1. 测评环境：请在安静、无干扰的环境中进行
            2. 测评设备：建议使用手机或平板
            3. 测评时长：约5-10分钟
            4. 中途保存：支持断点续测，可随时暂停
            5. 结果查询：测评完成后可立即查看报告

            为了保证测评结果的准确性，请确保：
            • 孩子在最佳状态时进行测评
            • 测评过程中不要提供过多帮助
            • 如实回答问卷问题
          </text>
        </view>
      </view>

      <!-- 免责声明 -->
      <view class="consent-section">
        <view class="section-header">
          <text class="section-icon">⚠️</text>
          <text class="section-title">免责声明</text>
        </view>
        <view class="section-text">
          <text>
            本产品提供的专注力测评仅作为参考工具，不能替代专业医疗诊断或治疗。我们不提供关于注意缺陷多动障碍（ADHD）或其他神经发育障碍的诊断服务。

            如对孩子的专注力发展有疑虑，请：
            • 咨询专业医生
            • 寻求儿童心理专家帮助
            • 联系专业医疗机构进行评估

            使用本产品即表示您理解并同意以上内容。
          </text>
        </view>
      </view>
    </view>

    <!-- 同意复选框 -->
    <view class="consent-checkbox" @tap="toggleConsent">
      <view class="checkbox" :class="{ checked: agreed }">
        <text v-if="agreed" class="check-icon">✓</text>
      </view>
      <text class="checkbox-label">我已阅读并同意以上内容</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-area">
      <button 
        class="agree-btn" 
        :disabled="!agreed"
        @tap="handleAgree"
      >
        同意并继续
      </button>
      <button 
        class="disagree-btn"
        @tap="handleDisagree"
      >
        暂不同意
      </button>
    </view>
  </view>
</template>

<script>
/**
 * 知情同意页
 * 功能：隐私声明、合规说明
 */
export default {
  data() {
    return {
      assessmentId: null,
      childId: null,
      agreed: false
    }
  },
  
  onLoad(options) {
    if (options.assessmentId) {
      this.assessmentId = parseInt(options.assessmentId)
    }
    if (options.childId) {
      this.childId = parseInt(options.childId)
    }
  },
  
  methods: {
    /**
     * 切换同意状态
     */
    toggleConsent() {
      this.agreed = !this.agreed
    },
    
    /**
     * 同意并继续
     */
    handleAgree() {
      if (!this.agreed) {
        uni.showToast({
          title: '请先阅读并同意',
          icon: 'none'
        })
        return
      }
      
      // 跳转到问卷测评页
      uni.navigateTo({
        url: `/pages/assessment/questionnaire?assessmentId=${this.assessmentId}&childId=${this.childId}`
      })
    },
    
    /**
     * 不同意
     */
    handleDisagree() {
      uni.showModal({
        title: '提示',
        content: '测评需要您同意相关协议才能继续，是否返回上一页？',
        confirmText: '返回',
        cancelText: '留在本页',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack()
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.consent-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 300rpx;
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
  padding-top: calc(60rpx + env(status-bar-height));
}

.header-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 同意书内容 */
.consent-content {
  padding: 30rpx;
}

.consent-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-icon {
  font-size: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

/* 同意复选框 */
.consent-checkbox {
  position: fixed;
  bottom: 240rpx;
  left: 30rpx;
  right: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #ffffff;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.checkbox {
  width: 44rpx;
  height: 44rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.checkbox.checked {
  background: #667eea;
  border-color: #667eea;
}

.check-icon {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
}

.checkbox-label {
  font-size: 28rpx;
  color: #333;
}

/* 操作按钮 */
.action-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.agree-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-bottom: 20rpx;
}

.agree-btn::after {
  border: none;
}

.agree-btn[disabled] {
  opacity: 0.5;
}

.disagree-btn {
  width: 100%;
  height: 88rpx;
  background: #ffffff;
  color: #999;
  font-size: 28rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #ddd;
}

.disagree-btn::after {
  border: none;
}
</style>
