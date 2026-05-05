<template>
  <div class="assessment-reports-page">
    <h2 class="page-title">儿童评估报告</h2>
    
    <!-- 搜索筛选 -->
    <div class="search-bar">
      <el-select v-model="filters.childId" placeholder="选择儿童" clearable filterable :filter-method="filterChild" style="width: 280px">
        <el-option
          v-for="child in filteredChildren"
          :key="child.id"
          :label="`${child.id} - ${child.name} (${child.age}岁)`"
          :value="child.id"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">查看报告</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 选择儿童后显示报告 -->
    <div v-if="currentChildId" class="report-content">
      <!-- 报告头部 -->
      <div class="report-header">
        <div class="child-info">
          <el-avatar :size="64" icon="UserFilled" />
          <div class="child-detail">
            <h3>{{ reportData.child_name }}</h3>
            <p>{{ reportData.age }}岁 | {{ reportData.age_group }}</p>
            <p class="report-time">报告生成时间：{{ formatDateTime(reportData.generated_at) }}</p>
          </div>
        </div>
        <div class="overall-score">
          <div class="score-circle">
            <el-progress 
              type="circle" 
              :percentage="reportData.overall_score" 
              :color="getScoreColor(reportData.overall_score)"
              :stroke-width="12"
            />
          </div>
          <div class="score-info">
            <p class="score-label">综合评分</p>
            <p class="score-level">{{ reportData.overall_level }}</p>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- 左侧：维度评估 -->
        <div class="left-column">
          <!-- 7维度评估 -->
          <div class="card">
            <div class="card-header">
              <h3>7维度能力评估</h3>
            </div>
            <div class="card-body">
              <div class="dimension-list">
                <div 
                  v-for="dim in reportData.dimensions" 
                  :key="dim.name"
                  class="dimension-item"
                >
                  <div class="dimension-header">
                    <span class="dimension-name">{{ dim.name }}</span>
                    <span class="dimension-score" :class="getScoreClass(dim.score)">
                      {{ dim.score }}分
                    </span>
                  </div>
                  <el-progress 
                    :percentage="dim.score" 
                    :color="getProgressColor(dim.score)"
                    :stroke-width="10"
                    :show-text="false"
                  />
                  <p class="dimension-desc">{{ dim.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 训练历史 -->
          <div class="card">
            <div class="card-header">
              <h3>训练历史</h3>
            </div>
            <div class="card-body">
              <div class="history-stats">
                <div class="history-item">
                  <span class="history-icon"><el-icon><Calendar /></el-icon></span>
                  <div class="history-content">
                    <p class="history-value">{{ reportData.training_history.total_sessions }}</p>
                    <p class="history-label">训练次数</p>
                  </div>
                </div>
                <div class="history-item">
                  <span class="history-icon"><el-icon><Timer /></el-icon></span>
                  <div class="history-content">
                    <p class="history-value">{{ formatDuration(reportData.training_history.total_duration) }}</p>
                    <p class="history-label">总训练时长</p>
                  </div>
                </div>
                <div class="history-item">
                  <span class="history-icon"><el-icon><DataLine /></el-icon></span>
                  <div class="history-content">
                    <p class="history-value">{{ (reportData.training_history.avg_accuracy * 100).toFixed(1) }}%</p>
                    <p class="history-label">平均准确率</p>
                  </div>
                </div>
                <div class="history-item">
                  <span class="history-icon improvement"><el-icon><TrendCharts /></el-icon></span>
                  <div class="history-content">
                    <p class="history-value" :class="getImprovementClass(reportData.training_history.improvement_rate)">
                      {{ reportData.training_history.improvement_rate > 0 ? '+' : '' }}{{ reportData.training_history.improvement_rate }}%
                    </p>
                    <p class="history-label">进步率</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：游戏表现和建议 -->
        <div class="right-column">
          <!-- 游戏表现 -->
          <div class="card">
            <div class="card-header">
              <h3>各游戏表现</h3>
            </div>
            <div class="card-body">
              <div v-if="reportData.game_performance?.length > 0" class="game-list">
                <div 
                  v-for="game in reportData.game_performance" 
                  :key="game.game_code"
                  class="game-item"
                >
                  <div class="game-info">
                    <p class="game-name">{{ game.game_name }}</p>
                    <p class="game-count">{{ game.play_count }}次训练</p>
                  </div>
                  <div class="game-scores">
                    <div class="score-badge">
                      <span class="score-label">得分</span>
                      <span class="score-value" :class="getScoreClass(game.avg_score)">
                        {{ game.avg_score?.toFixed(0) }}
                      </span>
                    </div>
                    <div class="score-badge">
                      <span class="score-label">准确率</span>
                      <span class="score-value">{{ (game.avg_accuracy * 100).toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无游戏数据" />
            </div>
          </div>

          <!-- 训练建议 -->
          <div class="card">
            <div class="card-header">
              <h3>训练建议</h3>
            </div>
            <div class="card-body">
              <div class="recommendations">
                <div 
                  v-for="(rec, index) in reportData.recommendations" 
                  :key="index"
                  class="recommendation-item"
                >
                  <div class="rec-icon">
                    <el-icon><Sunny /></el-icon>
                  </div>
                  <p class="rec-text">{{ rec }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未选择儿童时的概览列表 -->
    <div v-else class="overview-section">
      <h3>评估报告概览</h3>
      <el-table :data="reportList" v-loading="listLoading" stripe>
        <el-table-column prop="child_name" label="儿童" width="120">
          <template #default="{ row }">
            <div class="child-cell">
              <el-avatar :size="32" icon="UserFilled" />
              <span>{{ row.child_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="age_group" label="年龄段" width="100" />
        <el-table-column prop="total_sessions" label="训练次数" width="100" />
        <el-table-column prop="avg_accuracy" label="平均准确率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.avg_accuracy * 100)" 
              :color="getProgressColor(row.avg_accuracy * 100)"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column prop="avg_focus_score" label="平均专注度" width="120">
          <template #default="{ row }">
            {{ row.avg_focus_score?.toFixed(1) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="last_training_at" label="最近训练" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.last_training_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewReport(row.child_id)">
              查看报告
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Calendar, Timer, DataLine, TrendCharts, Sunny } from '@element-plus/icons-vue'
import { getChildAssessmentReport, getAssessmentReportList, getChildList } from '@/api/admin'

const listLoading = ref(false)
const reportLoading = ref(false)
const currentChildId = ref<number | null>(null)

const childrenList = ref<any[]>([])
const reportList = ref<any[]>([])
const childSearchQuery = ref('')

const filters = reactive({
  childId: null as number | null
})

const reportData = ref<any>({
  child_id: 0,
  child_name: '',
  age: 0,
  age_group: '',
  generated_at: '',
  dimensions: [],
  overall_score: 0,
  overall_level: '',
  recommendations: [],
  training_history: {
    total_sessions: 0,
    total_duration: 0,
    avg_accuracy: 0,
    improvement_rate: 0
  },
  game_performance: []
})

// 儿童筛选搜索
const filterChild = (query: string) => {
  childSearchQuery.value = query
}

const filteredChildren = computed(() => {
  if (!childSearchQuery.value) return childrenList.value
  const query = childSearchQuery.value.toLowerCase()
  return childrenList.value.filter(child => 
    child.name.toLowerCase().includes(query) ||
    String(child.id).includes(query) ||
    String(child.age).includes(query)
  )
})

const fetchChildren = async () => {
  try {
    const res = await getChildList({ pageSize: 100 })
    childrenList.value = res.data.list
  } catch (error) {
    console.error('获取儿童列表失败:', error)
  }
}

const fetchReportList = async () => {
  listLoading.value = true
  try {
    const res = await getAssessmentReportList({ pageSize: 50 })
    reportList.value = res.data.list
  } catch (error) {
    console.error('获取评估报告列表失败:', error)
  } finally {
    listLoading.value = false
  }
}

const fetchReport = async (childId: number) => {
  reportLoading.value = true
  try {
    const res = await getChildAssessmentReport(childId)
    reportData.value = res.data
  } catch (error) {
    console.error('获取评估报告失败:', error)
  } finally {
    reportLoading.value = false
  }
}

const handleSearch = () => {
  if (filters.childId) {
    currentChildId.value = filters.childId
    fetchReport(filters.childId)
  }
}

const handleReset = () => {
  filters.childId = null
  currentChildId.value = null
}

const viewReport = (childId: number) => {
  filters.childId = childId
  currentChildId.value = childId
  fetchReport(childId)
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h${minutes}m`
  }
  return `${minutes}m`
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

const getProgressColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getImprovementClass = (rate: number) => {
  if (rate > 0) return 'improvement-positive'
  if (rate < 0) return 'improvement-negative'
  return ''
}

onMounted(() => {
  fetchChildren()
  fetchReportList()
})
</script>

<style scoped>
.assessment-reports-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
}

.report-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: #fff;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.child-info :deep(.el-avatar) {
  background: rgba(255, 255, 255, 0.3);
}

.child-detail h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.child-detail p {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.report-time {
  font-size: 12px;
  opacity: 0.7;
}

.overall-score {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score-circle {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 4px;
}

.score-circle :deep(.el-progress__text) {
  color: #fff !important;
  font-size: 24px !important;
  font-weight: 600;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
}

.score-level {
  font-size: 20px;
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
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

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dimension-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dimension-score {
  font-size: 14px;
  font-weight: 600;
}

.dimension-desc {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.history-icon.improvement {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.history-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.history-label {
  font-size: 12px;
  color: #999;
}

.improvement-positive {
  color: #67c23a;
}

.improvement-negative {
  color: #f56c6c;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.game-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.game-count {
  font-size: 12px;
  color: #999;
}

.game-scores {
  display: flex;
  gap: 12px;
}

.score-badge {
  text-align: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
}

.score-badge .score-label {
  display: block;
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
}

.score-badge .score-value {
  font-size: 16px;
  font-weight: 600;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #fff9f0;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
}

.rec-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6a23c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.rec-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.overview-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.overview-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.child-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-high {
  color: #67c23a;
}

.score-mid {
  color: #e6a23c;
}

.score-low {
  color: #f56c6c;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>