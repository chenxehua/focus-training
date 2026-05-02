<script setup lang="ts">
import type { GameInfo } from '@/store/game'

interface Props {
  game: GameInfo
  locked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  locked: false,
})

const emit = defineEmits<{
  (e: 'play', game: GameInfo): void
}>()

function handlePlay() {
  if (props.locked) {
    uni.showToast({ title: '升级会员解锁更多游戏', icon: 'none' })
    return
  }
  emit('play', props.game)
}

const ageGroupMap: Record<string, string> = {
  '4-6': '4-6岁',
  '7-9': '7-9岁',
  '10-12': '10-12岁',
}

const typeColorMap: Record<string, string> = {
  注意力: '#6C63FF',
  记忆: '#6BCB77',
  反应: '#FFD93D',
  感知: '#FF8A80',
  冥想: '#64B5F6',
  观察: '#FF8A65',
  计算: '#BA68C8',
  听觉: '#4DB6AC',
}

const tagColor = typeColorMap[props.game.gameType] || '#6C63FF'
</script>

<template>
  <view class="game-card" @tap="handlePlay">
    <view v-if="locked" class="lock-mask">
      <text class="lock-icon">🔒</text>
    </view>

    <view class="card-header">
      <image
        class="game-icon"
        :src="game.iconUrl || '/static/game-default.png'"
        mode="aspectFill"
      />
      <view class="game-meta">
        <view class="type-tag" :style="{ backgroundColor: tagColor }">
          {{ game.gameType }}
        </view>
        <text class="age-label">{{ ageGroupMap[game.targetAgeGroup] || game.targetAgeGroup }}</text>
      </view>
    </view>

    <view class="card-body">
      <text class="game-name">{{ game.gameName }}</text>
      <text class="game-desc">{{ game.description }}</text>
    </view>

    <view class="card-footer">
      <view class="difficulty">
        <view
          v-for="i in 5"
          :key="i"
          class="difficulty-dot"
          :class="{ active: i <= game.difficultyLevels }"
        />
      </view>
      <view class="play-btn">
        <text class="play-text">开始</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.game-card {
  position: relative;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;

  &:active {
    opacity: 0.92;
    transform: scale(0.98);
  }
}

.lock-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 24rpx;

  .lock-icon {
    font-size: 48rpx;
  }
}

.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.game-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  margin-right: 16rpx;
  background-color: #f0f0f0;
}

.game-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 16rpx;
  border-radius: 99rpx;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
  align-self: flex-start;
}

.age-label {
  font-size: 22rpx;
  color: #999999;
}

.card-body {
  margin-bottom: 16rpx;
}

.game-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8rpx;
}

.game-desc {
  display: block;
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.difficulty {
  display: flex;
  flex-direction: row;
  gap: 6rpx;
}

.difficulty-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #e0e0e0;

  &.active {
    background-color: #6C63FF;
  }
}

.play-btn {
  background-color: #6C63FF;
  border-radius: 99rpx;
  padding: 12rpx 32rpx;

  .play-text {
    color: #ffffff;
    font-size: 26rpx;
    font-weight: 600;
  }
}
</style>
