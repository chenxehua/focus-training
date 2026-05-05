<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/store/game'
import { useUserStore } from '@/store/user'
import { getGameList } from '@/api/game'
import { getMembershipStatus } from '@/api/membership'
import GameCard from '@/components/GameCard.vue'
import type { GameInfo } from '@/store/game'

const gameStore = useGameStore()
const userStore = useUserStore()

const allGames = ref<GameInfo[]>([])
const selectedType = ref<string>('全部')
const isLoading = ref(false)
const isVip = ref(false)

// 游戏分类标签（中文）
const gameTypes = ['全部', '注意力', '记忆', '反应', '感知', '冥想', '观察', '计算', '听觉']

// 根据分类筛选游戏 - 使用 category 字段匹配中文标签
const filteredGames = computed(() => {
  if (selectedType.value === '全部') return allGames.value
  return allGames.value.filter(g => g.category === selectedType.value)
})

// 根据会员状态判断游戏是否锁定
function isGameLocked(game: GameInfo): boolean {
  if (isVip.value) return false
  // 免费游戏直接解锁
  if (game.isFree) return false
  // 非免费游戏需要会员
  return true
}

function navigateToGame(game: GameInfo) {
  if (isGameLocked(game)) {
    uni.showToast({ title: '升级会员解锁更多游戏', icon: 'none' })
    uni.navigateTo({ url: '/pages/membership/index' })
    return
  }
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
    const [gamesRes] = await Promise.all([
      getGameList()
    ])
    allGames.value = gamesRes.data
    gameStore.setGameList(gamesRes.data)

    // 检查会员状态
    if (userStore.isLoggedIn) {
      try {
        const membershipRes = await getMembershipStatus()
        if (membershipRes.data) {
          isVip.value = membershipRes.data.is_vip === true || (membershipRes.data.days_remaining || 0) > 0
        }
      } catch (e) {
        console.error('获取会员状态失败', e)
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (gameStore.gameList.length > 0) {
    allGames.value = gameStore.gameList
  }
  loadGames()
})
</script>

<template>
  <view class="page">
    <!-- 搜索/筛选区 -->
    <view class="filter-bar">
      <scroll-view class="filter-scroll" scroll-x enhanced>
        <view class="filter-list">
          <view
            v-for="type in gameTypes"
            :key="type"
            class="filter-tag"
            :class="{ active: selectedType === type }"
            @tap="selectedType = type"
          >
            <text class="filter-text">{{ type }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 游戏数量 -->
    <view class="count-row">
      <text class="count-text">共 {{ filteredGames.length }} 款游戏</text>
    </view>

    <!-- 游戏列表 -->
    <view v-if="isLoading" class="games-grid">
      <view v-for="i in 6" :key="i" class="skeleton-card" />
    </view>

    <view v-else-if="filteredGames.length === 0" class="empty-state">
      <text class="empty-icon">🎮</text>
      <text class="empty-text">该类别暂无游戏</text>
    </view>

    <view v-else class="games-grid">
      <GameCard
        v-for="game in filteredGames"
        :key="game.id"
        :game="game"
        :locked="isGameLocked(game)"
        @play="navigateToGame"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.filter-bar {
  background-color: #ffffff;
  padding: 20rpx 0;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: flex;
  flex-direction: row;
  padding: 0 24rpx;
  gap: 16rpx;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 28rpx;
  border-radius: 99rpx;
  background-color: #f5f5f5;
  flex-shrink: 0;

  &.active {
    background-color: #6C63FF;
    .filter-text { color: #ffffff; }
  }

  &:active { opacity: 0.8; }
}

.filter-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}

.count-row {
  padding: 20rpx 24rpx 8rpx;
}

.count-text {
  font-size: 24rpx;
  color: #999999;
}

.games-grid {
  padding: 0 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.skeleton-card {
  height: 280rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  border-radius: 24rpx;
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 32rpx;
  gap: 16rpx;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 30rpx; color: #999999; }
</style>
