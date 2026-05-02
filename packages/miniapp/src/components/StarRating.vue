<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score: number      // 0-100 分
  max?: number       // 最大星数，默认 5
  size?: number      // 星星大小 rpx，默认 48
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 5,
  size: 48,
  readonly: true,
})

const emit = defineEmits<{
  (e: 'change', star: number): void
}>()

// 将 0-100 分映射到 0-5 星
const starCount = computed(() => {
  return Math.round((props.score / 100) * props.max)
})

function getStarType(index: number): 'full' | 'empty' {
  return index < starCount.value ? 'full' : 'empty'
}

function handleTap(index: number) {
  if (props.readonly) return
  emit('change', index + 1)
}

const starSize = computed(() => `${props.size}rpx`)
</script>

<template>
  <view class="star-rating">
    <view
      v-for="i in max"
      :key="i"
      class="star"
      :style="{ width: starSize, height: starSize }"
      @tap="handleTap(i - 1)"
    >
      <text
        class="star-icon"
        :class="getStarType(i - 1)"
        :style="{ fontSize: starSize }"
      >
        {{ getStarType(i - 1) === 'full' ? '★' : '☆' }}
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.star-rating {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
}

.star {
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-icon {
  line-height: 1;

  &.full {
    color: #FFD93D;
  }

  &.empty {
    color: #d0d0d0;
  }
}
</style>
