import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGameRecords } from '@/api/game'
import { getTodayData } from '@/api/report'

export interface TrainingRecord {
  id: number
  childId: number
  gameId: number
  gameName: string
  gameCode: string
  durationSeconds: number
  accuracy: number
  score: number
  focusScore: number
  difficultyLevel: number
  createdAt: string
}

export interface GameInfo {
  id: number
  gameCode: string
  gameName: string
  gameType: string
  category: string
  iconUrl: string
  difficultyLevels: number
  targetAgeGroup: string
  description: string
  isFree: boolean
}

export const useGameStore = defineStore('game', () => {
  const todayRecords = ref<TrainingRecord[]>([])
  const currentStreak = ref<number>(0)
  const totalTrainingCount = ref<number>(0)
  const gameList = ref<GameInfo[]>([])
  const isLoading = ref<boolean>(false)

  const todayDuration = computed(() => {
    return todayRecords.value.reduce((sum, r) => sum + r.durationSeconds, 0)
  })

  const todayGameCount = computed(() => todayRecords.value.length)

  const avgFocusScore = computed(() => {
    if (todayRecords.value.length === 0) return 0
    const total = todayRecords.value.reduce((sum, r) => sum + r.focusScore, 0)
    return Math.round(total / todayRecords.value.length)
  })

  async function fetchTodayData(childId: number) {
    try {
      isLoading.value = true
      const res = await getTodayData(childId)
      todayRecords.value = res.data.records || []
      currentStreak.value = res.data.currentStreak || 0
      totalTrainingCount.value = res.data.totalTrainingCount || 0
    } catch (error) {
      console.error('fetchTodayData error:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGameRecords(childId: number, page = 1) {
    try {
      const res = await getGameRecords({ childId, page, pageSize: 20 })
      return res.data
    } catch (error) {
      console.error('fetchGameRecords error:', error)
      return null
    }
  }

  function addTodayRecord(record: TrainingRecord) {
    todayRecords.value.unshift(record)
    totalTrainingCount.value += 1
  }

  function setGameList(list: GameInfo[]) {
    gameList.value = list
  }

  return {
    todayRecords,
    currentStreak,
    totalTrainingCount,
    gameList,
    isLoading,
    todayDuration,
    todayGameCount,
    avgFocusScore,
    fetchTodayData,
    fetchGameRecords,
    addTodayRecord,
    setGameList,
  }
})
