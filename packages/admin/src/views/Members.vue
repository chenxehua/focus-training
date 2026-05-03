<template>
  <div class="members-page">
    <h2 class="page-title">会员管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-select v-model="statusFilter" placeholder="会员状态" style="width: 140px" clearable>
        <el-option label="活跃会员" value="active" />
        <el-option label="过期会员" value="expired" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="memberList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="150">
          <template #default="{ row }">
            <div>
              <p>{{ row.user_name || '用户' }}</p>
              <p class="phone">{{ row.user_phone || '-' }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="member_type" label="会员类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMemberTypeColor(row.member_type)" size="small">
              {{ getMemberTypeText(row.member_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120">
          <template #default="{ row }">
            {{ row.start_date }}
          </template>
        </el-table-column>
        <el-table-column prop="end_date" label="到期日期" width="120">
          <template #default="{ row }">
            {{ row.end_date || '永久' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="isExpired(row.end_date) ? 'danger' : 'success'" size="small">
              {{ isExpired(row.end_date) ? '已过期' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="开通时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleExtend(row)">延期</el-button>
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

    <!-- 延期弹窗 -->
    <el-dialog v-model="extendVisible" title="会员延期" width="400px">
      <el-form :model="extendForm" label-width="80px">
        <el-form-item label="当前到期">
          {{ extendForm.currentEnd || '永久' }}
        </el-form-item>
        <el-form-item label="延期天数">
          <el-input-number v-model="extendForm.days" :min="1" :max="365" />
          <span style="margin-left: 8px">天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extendVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExtendConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMemberList, updateMember } from '@/api/admin'
import type { Member } from '@/types'

const statusFilter = ref('')
const loading = ref(false)
const memberList = ref<Member[]>([])
const extendVisible = ref(false)

const extendForm = reactive({
  id: 0,
  currentEnd: '',
  days: 30
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await getMemberList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value
    })
    memberList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取会员列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMembers()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchMembers()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchMembers()
}

const handleExtend = (row: Member) => {
  extendForm.id = row.id
  extendForm.currentEnd = row.end_date
  extendForm.days = 30
  extendVisible.value = true
}

const handleExtendConfirm = async () => {
  try {
    await updateMember(extendForm.id, { extendDays: extendForm.days })
    ElMessage.success('延期成功')
    extendVisible.value = false
    fetchMembers()
  } catch (error) {
    console.error('延期失败:', error)
  }
}

const getMemberTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    month: 'info',
    quarter: 'warning',
    year: 'success',
    lifetime: 'danger'
  }
  return colors[type] || 'info'
}

const getMemberTypeText = (type: string) => {
  const texts: Record<string, string> = {
    month: '月卡',
    quarter: '季卡',
    year: '年卡',
    lifetime: '永久'
  }
  return texts[type] || type
}

const isExpired = (endDate: string) => {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.members-page {
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

.phone {
  font-size: 12px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>