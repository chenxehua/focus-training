<template>
  <div class="training-records-page">
    <h2 class="page-title">训练记录管理</h2>
    
    <!-- 搜索筛选 -->
    <div class="search-bar">
      <el-select v-model="filters.childId" placeholder="选择儿童" clearable filterable :filter-method="filterChild" style="width: 240px">
        <el-option
          v-for="child in filteredChildren"
          :key="child.id"
          :label="`${child.id} - ${child.name} (${child.age}岁)`"
          :value="child.id"
        />
      </el-select>
      <el-select v-model="filters.gameId" placeholder="选择游戏" clearable style="width: 160px">
        <el-option
          v-for="game in gamesList"
          :key="game.id"
          :label="game.game_name"
          :value="game.id"
        />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 数据统计 -->
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-label">总记录数：</span>
        <span class="stat-value">{{ pagination.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均准确率：</span>
        <span class="stat-value">{{ avgAccuracy }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均专注度：</span>
        <span class="stat-value">{{ avgFocusScore }}分</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="儿童信息" min-width="120">
          <template #default="{ row }">
            <div class="child-cell">
              <span class="child-name">{{ row.child_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="game_name" label="游戏" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.game_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="80">
          <template #default="{ row }">
            <span :class="getScoreClass(row.score)">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="accuracy" label="准确率" width="90">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.accuracy * 100)" 
              :color="getAccuracyColor(row.accuracy)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="focus_score" label="专注度" width="90">
          <template #default="{ row }">
            <span :class="getFocusClass(row.focus_score)">{{ row.focus_score?.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration_seconds" label="时长(s)" width="80" />
        <el-table-column prop="difficulty_level" label="难度" width="70">
          <template #default="{ row }">
            <el-tag size="small" :type="getDifficultyType(row.difficulty_level)">
              Lv.{{ row.difficulty_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="训练时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="训练记录详情" width="600px">
      <div v-if="currentRecord" class="record-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">记录ID：</span>
              <span class="value">{{ currentRecord.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">训练时间：</span>
              <span class="value">{{ formatDateTime(currentRecord.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">儿童：</span>
              <span class="value">{{ currentRecord.child_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">游戏：</span>
              <span class="value">{{ currentRecord.game_name }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>成绩数据</h4>
          <div class="score-cards">
            <div class="score-card">
              <p class="score-value" :class="getScoreClass(currentRecord.score)">
                {{ currentRecord.score }}
              </p>
              <p class="score-label">得分</p>
            </div>
            <div class="score-card">
              <p class="score-value">{{ (currentRecord.accuracy * 100).toFixed(1) }}%</p>
              <p class="score-label">准确率</p>
            </div>
            <div class="score-card">
              <p class="score-value">{{ currentRecord.focus_score?.toFixed(1) }}</p>
              <p class="score-label">专注度</p>
            </div>
            <div class="score-card">
              <p class="score-value">{{ currentRecord.duration_seconds }}s</p>
              <p class="score-label">训练时长</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>游戏信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">游戏编码：</span>
              <span class="value">{{ currentRecord.game_code }}</span>
            </div>
            <div class="detail-item">
              <span class="label">难度等级：</span>
              <span class="value">Level {{ currentRecord.difficulty_level }}</span>
            </div>
          </div>
          <p class="game-desc" v-if="currentRecord.game_description">
            {{ currentRecord.game_description }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getTrainingRecords, getChildList, getGameList } from '@/api/admin'

const loading = ref(false)
const detailVisible = ref(false)
const currentRecord = ref<any>(null)

const records = ref<any[]>([])
const childrenList = ref<any[]>([])
const gamesList = ref<any[]>([])
const childSearchQuery = ref('')

const dateRange = ref<[string, string] | null>(null)

const filters = reactive({
  childId: null as number | null,
  gameId: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 计算统计数据
const avgAccuracy = computed(() => {
  if (records.value.length === 0) return '0.0'
  const sum = records.value.reduce((acc, r) => acc + (r.accuracy || 0), 0)
  return ((sum / records.value.length) * 100).toFixed(1)
})

const avgFocusScore = computed(() => {
  if (records.value.length === 0) return '0.0'
  const sum = records.value.reduce((acc, r) => acc + (r.focus_score || 0), 0)
  return (sum / records.value.length).toFixed(1)
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

const fetchRecords = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (filters.childId) params.childId = filters.childId
    if (filters.gameId) params.gameId = filters.gameId
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const res = await getTrainingRecords(params)
    records.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取训练记录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchChildren = async () => {
  try {
    const res = await getChildList({ pageSize: 100 })
    childrenList.value = res.data.list
  } catch (error) {
    console.error('获取儿童列表失败:', error)
  }
}

const fetchGames = async () => {
  try {
    const res = await getGameList()
    gamesList.value = res.data
  } catch (error) {
    console.error('获取游戏列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchRecords()
}

const handleReset = () => {
  filters.childId = null
  filters.gameId = null
  dateRange.value = null
  pagination.page = 1
  fetchRecords()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchRecords()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRecords()
}

const handleViewDetail = (row: any) => {
  currentRecord.value = row
  detailVisible.value = true
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

const getFocusClass = (score: number) => {
  if (score >= 80) return 'focus-high'
  if (score >= 60) return 'focus-mid'
  return 'focus-low'
}

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 0.9) return '#67c23a'
  if (accuracy >= 0.7) return '#e6a23c'
  return '#f56c6c'
}

const getDifficultyType = (level: number) => {
  if (level >= 4) return 'danger'
  if (level >= 2) return 'warning'
  return 'info'
}

onMounted(() => {
  fetchRecords()
  fetchChildren()
  fetchGames()
})
</script>

<style scoped>
.training-records-page {
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
  margin-bottom: 16px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
}

.stats-summary {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #f0f9ff;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #409eff;
  font-size: 18px;
  font-weight: 600;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.child-cell {
  display: flex;
  align-items: center;
}

.child-name {
  font-weight: 500;
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

.focus-high {
  color: #67c23a;
  font-weight: 600;
}

.focus-mid {
  color: #e6a23c;
}

.focus-low {
  color: #f56c6c;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 详情弹窗样式 */
.record-detail {
  padding: 0 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item .label {
  color: #999;
  font-size: 13px;
  min-width: 80px;
}

.detail-item .value {
  color: #333;
  font-size: 13px;
}

.score-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.score-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.score-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.score-label {
  font-size: 12px;
  color: #999;
}

.game-desc {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
</style>