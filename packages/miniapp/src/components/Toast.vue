<template>
  <transition name="toast-fade">
    <view v-if="visible" class="toast-container" :class="position">
      <view class="toast-content" :class="type">
        <view v-if="type === 'loading'" class="toast-loading">
          <view class="loading-spinner"></view>
        </view>
        <view v-else class="toast-icon">
          <text>{{ getIcon }}</text>
        </view>
        <text v-if="message" class="toast-message">{{ message }}</text>
      </view>
    </view>
  </transition>
</template>

<script>
export default {
  name: 'Toast',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: value => ['success', 'error', 'warning', 'info', 'loading'].includes(value)
    },
    position: {
      type: String,
      default: 'center',
      validator: value => ['top', 'center', 'bottom'].includes(value)
    },
    duration: {
      type: Number,
      default: 2000
    }
  },
  computed: {
    getIcon() {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
      }
      return icons[this.type] || ''
    }
  },
  watch: {
    visible(val) {
      if (val && this.type !== 'loading') {
        setTimeout(() => {
          this.$emit('hide')
        }, this.duration)
      }
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
}

.toast-container.top {
  top: 120rpx;
}

.toast-container.center {
  top: 50%;
  transform: translate(-50%, -50%);
}

.toast-container.bottom {
  bottom: 200rpx;
}

.toast-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 48rpx;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 16rpx;
  max-width: 560rpx;
}

.toast-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #FFFFFF;
  margin-bottom: 16rpx;
}

.toast-content.success .toast-icon {
  background: #4CAF50;
}

.toast-content.error .toast-icon {
  background: #F44336;
}

.toast-content.warning .toast-icon {
  background: #FF9800;
}

.toast-content.info .toast-icon {
  background: #2196F3;
}

.toast-message {
  color: #FFFFFF;
  font-size: 28rpx;
  text-align: center;
  line-height: 1.4;
}

.toast-loading {
  margin-bottom: 16rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toast-fade-enter,
.toast-fade-leave-to {
  opacity: 0;
}
</style>