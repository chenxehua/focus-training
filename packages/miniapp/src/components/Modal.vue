<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" :class="size" @click.stop>
      <view class="modal-header" v-if="title || $slots.header">
        <slot name="header">
          <text class="modal-title">{{ title }}</text>
        </slot>
        <view v-if="showClose" class="modal-close" @click="handleClose">
          <text class="close-icon">×</text>
        </view>
      </view>

      <view class="modal-body">
        <slot></slot>
      </view>

      <view class="modal-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </view>
      <view class="modal-footer" v-else-if="showCancel || showConfirm">
        <view 
          v-if="showCancel" 
          class="modal-btn cancel" 
          @click="handleCancel"
        >
          {{ cancelText }}
        </view>
        <view 
          v-if="showConfirm" 
          class="modal-btn confirm" 
          :class="{ primary: confirmType === 'primary' }"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large', 'full'].includes(value)
    },
    showClose: {
      type: Boolean,
      default: true
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    showCancel: {
      type: Boolean,
      default: true
    },
    showConfirm: {
      type: Boolean,
      default: true
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    confirmType: {
      type: String,
      default: 'primary'
    }
  },
  methods: {
    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.$emit('close')
      }
    },
    handleClose() {
      this.$emit('close')
    },
    handleCancel() {
      this.$emit('cancel')
    },
    handleConfirm() {
      this.$emit('confirm')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-container.small {
  width: 80%;
  max-width: 480rpx;
}

.modal-container.medium {
  width: 85%;
  max-width: 560rpx;
}

.modal-container.large {
  width: 90%;
  max-width: 640rpx;
}

.modal-container.full {
  width: 95%;
  height: 85%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.modal-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 48rpx;
  color: #999999;
  font-weight: 300;
}

.modal-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #F0F0F0;
  gap: 24rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  background: #F5F5F5;
  color: #666666;
}

.modal-btn.primary {
  background: #6C63FF;
  color: #FFFFFF;
}

.modal-btn:active {
  opacity: 0.8;
}
</style>