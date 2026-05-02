<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number       // 当前值
  max?: number        // 最大值，默认 100
  color?: string      // 进度条颜色
  height?: number     // 高度 rpx，默认 16
  showLabel?: boolean
  animated?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  color: '#6C63FF',
  height: 16,
  showLabel: false,
  animated: true,
  label: '',
})

const percentage = computed(() => {
  const pct = (props.value / props.max) * 100
  return Math.min(Math.max(pct, 0), 100)
})

const heightStyle = computed(() => `${props.height}rpx`)
const borderRadiusStyle = computed(() => `${props.height / 2}rpx`)
</script>

<template>
  <view class="progress-bar-wrapper">
    <view v-if="showLabel || label" class="progress-label-row">
      <text v-if="label" class="progress-label">{{ label }}</text>
      <text v-if="showLabel" class="progress-value">{{ Math.round(percentage) }}%</text>
    </view>
    <view
      class="progress-track"
      :style="{ height: heightStyle, borderRadius: borderRadiusStyle }"
    >
      <view
        class="progress-fill"
        :style="{
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: borderRadiusStyle,
          transition: animated ? 'width 0.5s ease' : 'none',
        }"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.progress-bar-wrapper {
  width: 100%;
}

.progress-label-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.progress-label {
  font-size: 24rpx;
  color: #666666;
}

.progress-value {
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
}

.progress-track {
  width: 100%;
  background-color: #f0f0f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  min-width: 0;
}
</style>
