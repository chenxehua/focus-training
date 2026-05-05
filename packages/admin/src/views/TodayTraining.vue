<template>
  <div class="today-training-page">
    <h2 class="page-title">今日训练数据</h2>
    
    <!-- 概览卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ todayData.total_records }}</p>
          <p class="stat-label">训练记录</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ todayData.total_children }}</p>
          <p class="stat-label">参与儿童</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <el-icon :size="28"><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ formatDuration(todayData.total_duration) }}</p>
          <p class="stat-label">总训练时长</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
          <el-icon :size="28"><DataLine /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ (todayData.avg_accuracy * 100).toFixed(1) }}%</p>
          <p class="stat-label">平均准确率</p>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <!-- 热门游戏 -->
      <div class="card">
        <div class="card-header">
          <h3>热门游戏</h3>
        </div>
        <div class="card-body">
          <div v-if="todayData.top_games?.length > 0" class="game-list">
            <div 
              v-for="(game, index) in todayData.top_games" 
              :key="index"
              class="game-item"
            >
              <div class="game-rank" :class="{ 'top-3': index < 3 }">{{ index + 1 }}</div>
              <div class="game-info">
                <p class="game-name">{{ game.game_name }}</p>
                <p class="game-count">{{ game.count }} 次训练</p>
              </div>
              <div class="game-bar">
                <div 
                  class="bar-fill" 
                  :style="{ width: (game.count / todayData.top_games[0].count * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="今日暂无训练数据" />
        </div>
      </div>

      <!-- 近期表现 -->
      <div class="card">
        <div class="card-header">
          <h3>今日最新训练</h3>
          <span class="header-sub">最近20条记录</span>
        </div>
        <div class="card-body">
          <el-table 
            :data="recentRecords" 
            v-loading="loading"
            stripe
            size="small"
          >
            <el-table-column prop="child_name" label="儿童" width="100" />
            <el-table-column prop="game_name" label="游戏" width="120" />
            <el-table-column prop="score" label="得分" width="70">
              <template #default="{ row }">
                <span :class="getScoreClass(row.score)">{{ row.score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="accuracy" label="准确率" width="80">
              <template #default="{ row }">
                {{ (row.accuracy * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column prop="duration_seconds" label="时长" width="70">
              <template #default="{ row }">
                {{ row.duration_seconds }}s
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 关注度趋势 -->
    <div class="card full-width">
      <div class="card-header">
        <h3>今日训练时段分布</h3>
      </div>
      <div class="card-body chart-container">
        <div class="time-distribution">
          <div 
            v-for="hour in timeDistribution" 
            :key="hour.hour"
            class="hour-bar"
          >
            <div 
              class="bar" 
              :style="{ height: (hour.count / maxHourCount * 100) + '%' }"
              :title="`${hour.hour}时: ${hour.count}次训练`"
            ></div>
            <span class="hour-label">{{ hour.hour }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Document, User, Timer, DataLine } from '@element-plus/icons-vue'
import { getTodayTraining } from '@/api/admin'

const loading = ref(false)
const todayData = ref<any>({
  total_records: 0,
  total_children: 0,
  total_duration: 0,
  avg_accuracy: 0,
  avg_focus_score: 0,
  top_games: [],
  records: []
})

const recentRecords = computed(() => {
  return todayData.value.records?.slice(0, 20) || []
})

const timeDistribution = computed(() => {
  const hours: Record<number, number> = {}
  for (let i = 0; i < 24; i++) {
    hours[i] = 0
  }
  
  todayData.value.records?.forEach((record: any) => {
    const hour = new Date(record.created_at).getHours()
    hours[hour]++
  })
  
  return Object.entries(hours).map(([hour, count]) => ({
    hour: parseInt(hour),
    count
  }))
})

const maxHourCount = computed(() => {
  return Math.max(...timeDistribution.value.map(h => h.count), 1)
})

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h${minutes}m`
  }
  return `${minutes}m`
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

const fetchTodayData = async () => {
  loading.value = true
  try {
    const res = await getTodayTraining()
    todayData.value = res.data
  } catch (error) {
    console.error('获取今日训练数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTodayData()
})
</script>

<style scoped>
.today-training-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-sub {
  font-size: 12px;
  color: #999;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-rank.top-3 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.game-info {
  flex: 1;
  min-width: 0;
}

.game-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-count {
  font-size: 12px;
  color: #999;
}

.game-bar {
  width: 80px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.chart-container {
  min-height: 200px;
}

.time-distribution {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 180px;
  padding-top: 20px;
}

.hour-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.bar {
  width: 16px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  cursor: pointer;
}

.hour-bar:hover .bar {
  opacity: 0.8;
}

.hour-label {
  font-size: 10px;
  color: #999;
  margin-top: 8px;
}

.score-high {
  color: #67c23a;
  font-weight: 600;
}

.score-mid {
  color: #e6a23c;
}

.score-low {
  color: #f56c6c;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>