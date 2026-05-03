<template>
  <div class="dashboard">
    <h2 class="page-title">数据概览</h2>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.totalUsers }}</p>
          <p class="stat-label">用户总数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon children">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.totalChildren }}</p>
          <p class="stat-label">儿童数量</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon training">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.todayTraining }}</p>
          <p class="stat-label">今日训练</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orders">
          <el-icon><Tickets /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.monthOrders }}</p>
          <p class="stat-label">本月订单</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amount">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">¥{{ stats.monthAmount }}</p>
          <p class="stat-label">本月收入</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon members">
          <el-icon><Medal /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.activeMembers }}</p>
          <p class="stat-label">活跃会员</p>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card">
        <h3>用户增长趋势</h3>
        <div ref="userTrendChart" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h3>游戏使用排行</h3>
        <div ref="gameUsageChart" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getDashboardStats } from '@/api/admin'
import type { DashboardStats } from '@/types'

const stats = reactive<DashboardStats>({
  totalUsers: 0,
  totalChildren: 0,
  todayTraining: 0,
  monthOrders: 0,
  monthAmount: 0,
  activeMembers: 0
})

const userTrendData = ref<{ date: string; count: number }[]>([])
const gameUsageData = ref<{ name: string; code: string; count: number }[]>([])

let userTrendChart: echarts.ECharts | null = null
let gameUsageChart: echarts.ECharts | null = null

const initCharts = () => {
  // 用户趋势图
  const userTrendEl = document.getElementById('user-trend-chart')
  if (userTrendEl) {
    userTrendChart = echarts.init(userTrendEl)
    userTrendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, bottom: 30, top: 20 },
      xAxis: {
        type: 'category',
        data: userTrendData.value.map(d => d.date)
      },
      yAxis: { type: 'value' },
      series: [{
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: userTrendData.value.map(d => d.count),
        areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
        lineStyle: { color: '#6C63FF' },
        itemStyle: { color: '#6C63FF' }
      }]
    })
  }

  // 游戏使用排行
  const gameUsageEl = document.getElementById('game-usage-chart')
  if (gameUsageEl) {
    gameUsageChart = echarts.init(gameUsageEl)
    gameUsageChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 80, right: 20, bottom: 30, top: 20 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: gameUsageData.value.map(d => d.name)
      },
      series: [{
        name: '使用次数',
        type: 'bar',
        data: gameUsageData.value.map(d => d.count),
        itemStyle: { color: '#6C63FF' }
      }]
    })
  }
}

const fetchData = async () => {
  try {
    const res = await getDashboardStats()
    const { stats: s, userTrend, gameUsage } = res.data

    Object.assign(stats, s)
    userTrendData.value = userTrend || []
    gameUsageData.value = gameUsage || []

    initCharts()
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', initCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', initCharts)
  userTrendChart?.dispose()
  gameUsageChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.stat-icon.users { background: #e6f0ff; color: #4a90e2; }
.stat-icon.children { background: #fef0ff; color: #b37feb; }
.stat-icon.training { background: #e6fff0; color: #52c41a; }
.stat-icon.orders { background: #fff7e6; color: #fa8c16; }
.stat-icon.amount { background: #fff1f0; color: #ff4d4f; }
.stat-icon.members { background: #f0f5ff; color: #722ed1; }

.stat-info {
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

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
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

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>