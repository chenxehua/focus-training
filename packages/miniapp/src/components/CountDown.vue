<template>
  <view
    class="countdown-container"
    :class="[size, { 'has-ring': showRing }]"
    :style="containerStyle"
  >
    <view class="countdown-ring" v-if="showRing">
      <svg viewBox="0 0 100 100">
        <circle
          class="ring-bg"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#E8E8E8"
          stroke-width="6"
        />
        <circle
          class="ring-progress"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          :stroke="progressColor"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
        />
      </svg>
    </view>
    <view class="countdown-content">
      <text class="time" :style="{ color: timeColor }">{{ displayTime }}</text>
      <text v-if="label" class="label">{{ label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CountDown',
  props: {
    seconds: {
      type: Number,
      default: 60
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    showRing: {
      type: Boolean,
      default: false
    },
    autoStart: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: '#6C63FF'
    },
    label: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      remaining: this.seconds,
      timer: null,
      isPaused: false
    }
  },
  computed: {
    displayTime() {
      const minutes = Math.floor(this.remaining / 60)
      const seconds = this.remaining % 60
      if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
      return seconds.toString()
    },
    timeColor() {
      if (this.remaining <= 10) {
        return '#FF6B6B'
      }
      return this.color
    },
    progressColor() {
      return this.timeColor
    },
    circumference() {
      return 2 * Math.PI * 45
    },
    strokeDashoffset() {
      const progress = this.remaining / this.seconds
      return this.circumference * (1 - progress)
    },
    containerStyle() {
      if (this.showRing) {
        const sizeMap = { small: 80, medium: 120, large: 160 }
        return { width: sizeMap[this.size] + 'px', height: sizeMap[this.size] + 'px' }
      }
      return {}
    }
  },
  mounted() {
    if (this.autoStart) {
      this.start()
    }
  },
  beforeDestroy() {
    this.stop()
  },
  methods: {
    start() {
      if (this.timer) return
      
      this.timer = setInterval(() => {
        if (!this.isPaused && this.remaining > 0) {
          this.remaining--
          
          if (this.remaining === 0) {
            this.$emit('finish')
            this.stop()
          }
        }
      }, 1000)
    },
    pause() {
      this.isPaused = true
    },
    resume() {
      this.isPaused = false
    },
    stop() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    reset() {
      this.stop()
      this.remaining = this.seconds
      if (this.autoStart) {
        this.start()
      }
    },
    addTime(seconds) {
      this.remaining += seconds
    }
  }
}
</script>

<style scoped>
.countdown-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.countdown-container.small .time {
  font-size: 32rpx;
}

.countdown-container.medium .time {
  font-size: 48rpx;
}

.countdown-container.large .time {
  font-size: 64rpx;
}

.countdown-container.has-ring {
  position: relative;
}

.countdown-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.countdown-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.countdown-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.time {
  font-weight: 700;
  font-family: 'DIN Alternate', 'Roboto', sans-serif;
}

.label {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}
</style>