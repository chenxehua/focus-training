<template>
  <div class="children-page">
    <h2 class="page-title">儿童管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索儿童姓名"
        style="width: 300px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="ageGroupFilter" placeholder="年龄段" style="width: 140px" clearable>
        <el-option label="4-6岁" value="4-6" />
        <el-option label="7-9岁" value="7-9" />
        <el-option label="10-12岁" value="10-12" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="childList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="儿童信息" min-width="150">
          <template #default="{ row }">
            <div class="child-info-cell">
              <el-avatar :size="40" :src="row.avatar" icon="UserFilled" />
              <div class="child-detail">
                <p class="name">{{ row.name }}</p>
                <p class="age">年龄: {{ row.age }}岁</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age_group" label="年龄段" width="100" />
        <el-table-column prop="parent_name" label="关联家长" width="120" />
        <el-table-column prop="parent_phone" label="家长手机" width="130" />
        <el-table-column prop="training_count" label="训练次数" width="100" />
        <el-table-column prop="created_at" label="添加时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
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
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getChildList } from '@/api/admin'
import type { Child, PageResult } from '@/types'

const searchKeyword = ref('')
const ageGroupFilter = ref('')
const loading = ref(false)
const childList = ref<Child[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchChildren = async () => {
  loading.value = true
  try {
    const res = await getChildList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      ageGroup: ageGroupFilter.value
    })
    childList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取儿童列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchChildren()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchChildren()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchChildren()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.children-page {
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
  margin-bottom: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.child-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.child-detail {
  text-align: left;
}

.name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.age {
  font-size: 12px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>