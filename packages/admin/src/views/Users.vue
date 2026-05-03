<template>
  <div class="users-page">
    <h2 class="page-title">用户管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户昵称/手机/ID"
        style="width: 300px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" clearable>
        <el-option label="正常" value="1" />
        <el-option label="禁用" value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="40" :src="row.avatar" icon="UserFilled" />
              <div class="user-detail">
                <p class="nickname">{{ row.nickname || '未设置昵称' }}</p>
                <p class="openid">ID: {{ row.openid }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role" label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'success'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row.id)">详情</el-button>
            <el-button 
              :type="row.status === 1 ? 'danger' : 'success'" 
              link 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
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

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <div v-if="userDetail" class="user-detail-content">
        <div class="detail-header">
          <el-avatar :size="80" :src="userDetail.user.avatar" icon="UserFilled" />
          <div class="detail-info">
            <h3>{{ userDetail.user.nickname || '未设置昵称' }}</h3>
            <p>手机: {{ userDetail.user.phone || '未绑定' }}</p>
            <p>角色: {{ userDetail.user.role === 'admin' ? '管理员' : '普通用户' }}</p>
          </div>
        </div>
        <el-divider />
        <div class="detail-stats">
          <div class="stat-item">
            <span class="label">关联儿童</span>
            <span class="value">{{ userDetail.children.length }} 个</span>
          </div>
          <div class="stat-item">
            <span class="label">订单总数</span>
            <span class="value">{{ userDetail.orderStats.total }} 单</span>
          </div>
          <div class="stat-item">
            <span class="label">消费金额</span>
            <span class="value">¥{{ userDetail.orderStats.amount }}</span>
          </div>
        </div>
        <el-divider />
        <div class="children-list" v-if="userDetail.children.length > 0">
          <h4>关联儿童</h4>
          <el-table :data="userDetail.children" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="age" label="年龄" />
            <el-table-column prop="age_group" label="年龄段" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getUserList, getUserDetail, updateUserStatus } from '@/api/admin'
import type { User, PageResult } from '@/types'

const searchKeyword = ref('')
const statusFilter = ref('')
const loading = ref(false)
const userList = ref<User[]>([])
const detailVisible = ref(false)
const userDetail = ref<{ user: User; children: any[]; orderStats: { total: number; amount: number } } | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      status: statusFilter.value
    })
    userList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

const handleViewDetail = async (id: number) => {
  try {
    const res = await getUserDetail(id)
    userDetail.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取用户详情失败:', error)
  }
}

const handleToggleStatus = async (row: User) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${row.nickname || row.openid} 吗？`, '提示')
    await updateUserStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`)
    }
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
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

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  text-align: left;
}

.nickname {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.openid {
  font-size: 12px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.user-detail-content {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}

.detail-info h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}

.detail-info p {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  color: #999;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.children-list h4 {
  margin-bottom: 12px;
  color: #333;
}
</style>