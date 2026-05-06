<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useGameStore } from '@/store/game'
import { getGameList } from '@/api/game'
import GameCard from '@/components/GameCard.vue'
import type { GameInfo } from '@/store/game'

const gameStore = useGameStore()

const games = ref<GameInfo[]>([])
const isLoading = ref(false)
const selectedCategory = ref<string>('all')
const selectedAgeGroup = ref<string>('all')

// 分类选项
const categories = [
  { value: 'all', label: '全部' },
  { value: '注意力', label: '注意力' },
  { value: '记忆', label: '记忆' },
  { value: '感知', label: '感知' },
  { value: '听觉', label: '听觉' },
  { value: '节奏', label: '节奏' },
  { value: '空间', label: '空间' },
]

// 年龄组选项
const ageGroups = [
  { value: 'all', label: '全部年龄' },
  { value: '4-6', label: '4-6岁' },
  { value: '7-9', label: '7-9岁' },
  { value: '10-12', label: '10-12岁' },
]

// 筛选后的游戏
const filteredGames = computed(() => {
  return games.value.filter(game => {
    const categoryMatch = selectedCategory.value === 'all' || game.category === selectedCategory.value
    const ageMatch = selectedAgeGroup.value === 'all' || game.targetAgeGroup.includes(selectedAgeGroup.value)
    return categoryMatch && ageMatch
  })
})

function navigateToGame(game: GameInfo) {
  const gamePageMap: Record<string, string> = {
    'schulte': '/pages/game-schulte/index',
    'audio_count': '/pages/game-audio/index',
    'pattern_memory': '/pages/game-memory/index',
    'visual_tracking': '/pages/game-visual/index',
    'reaction_speed': '/pages/game-reaction/index',
    'rhythm_tap': '/pages/game-rhythm/index',
    'auditory_memory': '/pages/game-sound/index',
    'maze_navigation': '/pages/game-maze/index',
    'quick_sort': '/pages/game-sort/index',
    'target_tracking': '/pages/game-tracking/index'
  }
  const url = gamePageMap[game.gameCode]
  if (url) {
    uni.navigateTo({ url })
  } else {
    uni.showToast({ title: '该游戏即将上线', icon: 'none' })
  }
}

async function loadGames() {
  isLoading.value = true
  try {
    const res = await getGameList()
    games.value = res.data
    gameStore.setGameList(res.data)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadGames()
})
</script>

<template>
  <view class="page">
    <!-- 标题 -->
    <view class="header">
      <text class="title">全部游戏</text>
      <text class="subtitle">共 {{ games.length }} 款专注力训练游戏</text>
    </view>

    <!-- 筛选器 -->
    <view class="filters">
      <view class="filter-section">
        <text class="filter-label">类型</text>
        <view class="filter-tags">
          <view
            v-for="cat in categories"
            :key="cat.value"
            class="filter-tag"
            :class="{ active: selectedCategory === cat.value }"
            @tap="selectedCategory = cat.value"
          >
            <text>{{ cat.label }}</text>
          </view>
        </view>
      </view>

      <view class="filter-section">
        <text class="filter-label">年龄</text>
        <view class="filter-tags">
          <view
            v-for="age in ageGroups"
            :key="age.value"
            class="filter-tag"
            :class="{ active: selectedAgeGroup === age.value }"
            @tap="selectedAgeGroup = age.value"
          >
            <text>{{ age.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 游戏列表 -->
    <view class="games-grid">
      <GameCard
        v-for="game in filteredGames"
        :key="game.id"
        :game="game"
        :locked="!game.isFree"
        @play="navigateToGame"
      />
    </view>

    <!-- 空状态 -->
    <view v-if="filteredGames.length === 0 && !isLoading" class="empty-state">
      <text class="empty-icon">🎮</text>
      <text class="empty-text">暂无符合条件的游戏</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333333;
}

.subtitle {
  font-size: 26rpx;
  color: #999999;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.filter-label {
  font-size: 24rpx;
  color: #666666;
  font-weight: 600;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-tag {
  padding: 8rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 99rpx;
  font-size: 24rpx;
  color: #666666;

  &.active {
    background-color: #6C63FF;
    color: #ffffff;
  }
}

.games-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
  gap: 16rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999999; }
</style>