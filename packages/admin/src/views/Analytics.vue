<template>
  <div class="analytics-page">
    <h2 class="page-title">数据分析</h2>
    
    <!-- 时间范围选择 -->
    <div class="filter-bar">
      <el-radio-group v-model="daysRange" @change="handleRangeChange">
        <el-radio-button :label="7">近7天</el-radio-button>
        <el-radio-button :label="30">近30天</el-radio-button>
        <el-radio-button :label="90">近90天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 训练趋势 -->
    <div class="chart-card">
      <h3>训练趋势</h3>
      <div ref="trainingTrendChart" class="chart-container"></div>
    </div>

    <!-- 年龄段分析 -->
    <div class="charts-row">
      <div class="chart-card">
        <h3>年龄段分布</h3>
        <div ref="ageGroupChart" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h3>游戏使用统计</h3>
        <div ref="gameStatsChart" class="chart-container"></div>
      </div>
    </div>

    <!-- 用户留存 -->
    <div class="chart-card">
      <h3>用户留存分析</h3>
      <div ref="retentionChart" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getTrainingAnalytics, getRetentionAnalytics } from '@/api/admin'

const daysRange = ref(30)
const trainingData = ref<any[]>([])
const ageGroupData = ref<any[]>([])
const gameStatsData = ref<any[]>([])
const retentionData = ref<any[]>([])

let trainingTrendChart: echarts.ECharts | null = null
let ageGroupChart: echarts.ECharts | null = null
let gameStatsChart: echarts.ECharts | null = null
let retentionChart: echarts.ECharts | null = null

const initCharts = () => {
  // 训练趋势图
  const trendEl = document.getElementById('training-trend-chart')
  if (trendEl) {
    if (!trainingTrendChart) {
      trainingTrendChart = echarts.init(trendEl)
    }
    trainingTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['训练次数', '平均准确率', '平均专注得分'] },
      grid: { left: 50, right: 20, bottom: 30, top: 60 },
      xAxis: {
        type: 'category',
        data: trainingData.value.map(d => d.date)
      },
      yAxis: [
        { type: 'value', name: '训练次数' },
        { type: 'value', name: '百分比', max: 100 }
      ],
      series: [
        {
          name: '训练次数',
          type: 'bar',
          data: trainingData.value.map(d => d.total_count)
        },
        {
          name: '平均准确率',
          type: 'line',
          yAxisIndex: 1,
          data: trainingData.value.map(d => (d.avg_accuracy * 100).toFixed(1))
        },
        {
          name: '平均专注得分',
          type: 'line',
          yAxisIndex: 1,
          data: trainingData.value.map(d => d.avg_focus_score)
        }
      ]
    })
  }

  // 年龄段分布饼图
  const ageEl = document.getElementById('age-group-chart')
  if (ageEl) {
    if (!ageGroupChart) {
      ageGroupChart = echarts.init(ageEl)
    }
    ageGroupChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: ageGroupData.value.map(d => ({
          name: d.age_group,
          value: d.count
        }))
      }]
    })
  }

  // 游戏使用统计
  const gameEl = document.getElementById('game-stats-chart')
  if (gameEl) {
    if (!gameStatsChart) {
      gameStatsChart = echarts.init(gameEl)
    }
    gameStatsChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 80, right: 20, bottom: 30, top: 20 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: gameStatsData.value.map(d => d.game_name)
      },
      series: [{
        name: '使用次数',
        type: 'bar',
        data: gameStatsData.value.map(d => d.play_count),
        itemStyle: { color: '#6C63FF' }
      }]
    })
  }

  // 用户留存
  const retEl = document.getElementById('retention-chart')
  if (retEl) {
    if (!retentionChart) {
      retentionChart = echarts.init(retEl)
    }
    retentionChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['次日留存', '7日留存', '30日留存'] },
      grid: { left: 50, right: 20, bottom: 30, top: 40 },
      xAxis: {
        type: 'category',
        data: retentionData.value.map(d => d.date)
      },
      yAxis: { type: 'value', max: 100, name: '留存率(%)' },
      series: [
        {
          name: '次日留存',
          type: 'line',
          data: retentionData.value.map(d => d.d1_retained ? ((d.d1_retained / d.new_users) * 100).toFixed(1) : 0)
        },
        {
          name: '7日留存',
          type: 'line',
          data: retentionData.value.map(d => d.d7_retained ? ((d.d7_retained / d.new_users) * 100).toFixed(1) : 0)
        },
        {
          name: '30日留存',
          type: 'line',
          data: retentionData.value.map(d => d.d30_retained ? ((d.d30_retained / d.new_users) * 100).toFixed(1) : 0)
        }
      ]
    })
  }
}

const fetchData = async () => {
  try {
    // 训练分析
    const trainingRes = await getTrainingAnalytics({ days: daysRange.value })
    trainingData.value = trainingRes.data.dailyTrend || []
    ageGroupData.value = trainingRes.data.ageGroupStats || []
    gameStatsData.value = trainingRes.data.gameStats || []

    // 留存分析
    const retentionRes = await getRetentionAnalytics()
    retentionData.value = retentionRes.data || []

    initCharts()
  } catch (error) {
    console.error('获取分析数据失败:', error)
  }
}

const handleRangeChange = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', initCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', initCharts)
  trainingTrendChart?.dispose()
  ageGroupChart?.dispose()
  gameStatsChart?.dispose()
  retentionChart?.dispose()
})
</script>

<style scoped>
.analytics-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.chart-container {
  height: 280px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.charts-row .chart-card {
  margin-bottom: 0;
}

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>