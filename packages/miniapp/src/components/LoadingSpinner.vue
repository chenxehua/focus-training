<template>
  <view v-if="show" class="loading-container" :class="{ 'full-screen': fullScreen }">
    <view class="loading-content" :class="size">
      <view class="spinner">
        <view class="spinner-item" v-for="i in 12" :key="i" :style="getItemStyle(i)"></view>
      </view>
      <text v-if="text" class="loading-text">{{ text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    show: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    text: {
      type: String,
      default: ''
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: '#6C63FF'
    }
  },
  methods: {
    getItemStyle(index) {
      const angle = (index - 1) * 30
      const delay = (index - 1) * 0.1
      return {
        background: this.color,
        animationDelay: `${delay}s`,
        transform: `rotate(${angle}deg) translateY(-10px)`
      }
    }
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.loading-container.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-content.small .spinner {
  width: 40rpx;
  height: 40rpx;
}

.loading-content.medium .spinner {
  width: 80rpx;
  height: 80rpx;
}

.loading-content.large .spinner {
  width: 120rpx;
  height: 120rpx;
}

.spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-item {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  opacity: 0;
  animation: spinner-fade 1.2s ease-in-out infinite;
}

.loading-content.small .spinner-item {
  width: 6rpx;
  height: 6rpx;
}

.loading-content.large .spinner-item {
  width: 12rpx;
  height: 12rpx;
}

@keyframes spinner-fade {
  0%, 20% {
    opacity: 1;
  }
  40% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
  }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #999999;
}
</style>