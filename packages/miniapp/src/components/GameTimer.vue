<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface Props {
  autoStart?: boolean
  countDown?: number  // 倒计时秒数，0 表示正计时
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  countDown: 0,
})

const emit = defineEmits<{
  (e: 'tick', seconds: number): void
  (e: 'finish'): void
}>()

const seconds = ref<number>(props.countDown > 0 ? props.countDown : 0)
const isRunning = ref<boolean>(false)
let timer: ReturnType<typeof setInterval> | null = null

const displayTime = computed(() => {
  const total = seconds.value
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const isCountDown = computed(() => props.countDown > 0)

function start() {
  if (isRunning.value) return
  isRunning.value = true

  timer = setInterval(() => {
    if (isCountDown.value) {
      seconds.value -= 1
      emit('tick', seconds.value)
      if (seconds.value <= 0) {
        seconds.value = 0
        stop()
        emit('finish')
      }
    } else {
      seconds.value += 1
      emit('tick', seconds.value)
    }
  }, 1000)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isRunning.value = false
}

function reset() {
  stop()
  seconds.value = props.countDown > 0 ? props.countDown : 0
}

function getElapsed(): number {
  return isCountDown.value ? props.countDown - seconds.value : seconds.value
}

if (props.autoStart) {
  start()
}

onUnmounted(() => {
  stop()
})

defineExpose({ start, stop, reset, getElapsed, seconds })
</script>

<template>
  <view class="game-timer" :class="{ 'count-down': isCountDown && seconds <= 10 }">
    <text class="timer-text">{{ displayTime }}</text>
    <view v-if="isCountDown" class="progress-bar">
      <view
        class="progress-fill"
        :style="{ width: `${(seconds / countDown) * 100}%` }"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.game-timer {
  display: flex;
  flex-direction: column;
  align-items: center;

  &.count-down {
    .timer-text {
      color: #FF8A80;
      animation: pulse 0.8s ease-in-out infinite;
    }
  }
}

.timer-text {
  font-size: 64rpx;
  font-weight: 700;
  color: #6C63FF;
  font-variant-numeric: tabular-nums;
  letter-spacing: 4rpx;
}

.progress-bar {
  width: 200rpx;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  margin-top: 12rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #6C63FF;
  border-radius: 4rpx;
  transition: width 0.9s linear;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
