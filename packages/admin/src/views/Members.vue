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
      <el-button type="success" @click="handleGrant">开通会员</el-button>
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
        <el-table-column label="儿童信息" min-width="120">
          <template #default="{ row }">
            <div>
              <p>{{ row.child_name || '-' }}</p>
              <p class="child-id">ID: {{ row.child_id }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="membership_name" label="会员套餐" width="120">
          <template #default="{ row }">
            <el-tag :type="getMemberTypeColor(row.tier)" size="small">
              {{ row.membership_name || row.tier }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120">
          <template #default="{ row }">
            {{ row.start_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="end_date" label="到期日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'expired': isExpired(row.end_date) }">
              {{ row.end_date || '永久' }}
            </span>
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

    <!-- 开通会员弹窗 -->
    <el-dialog v-model="grantVisible" title="开通会员" width="500px">
      <el-form :model="grantForm" label-width="100px" :rules="grantRules" ref="grantFormRef">
        <el-form-item label="用户搜索" prop="userId">
          <el-select
            v-model="grantForm.userId"
            filterable
            remote
            reserve-keyword
            placeholder="输入用户名或手机号搜索"
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
            @change="handleUserChange"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.nickname || '用户'}(${user.phone || '无手机'})`"
              :value="user.id"
            >
              <span>{{ user.nickname || '用户' }}</span>
              <span style="color: #999; font-size: 12px; margin-left: 8px">{{ user.phone || '' }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联儿童">
          <el-select
            v-model="grantForm.childId"
            placeholder="请先选择用户"
            style="width: 100%"
            :disabled="!grantForm.userId"
          >
            <el-option
              v-for="child in childOptions"
              :key="child.id"
              :label="`${child.name}(${child.age}岁)`"
              :value="child.id"
            >
              <span>{{ child.name }}</span>
              <span style="color: #999; font-size: 12px; margin-left: 8px">{{ child.age }}岁</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="会员套餐" prop="tier">
          <el-radio-group v-model="grantForm.tier">
            <el-radio label="basic">
              年度会员
              <span style="color: #999; font-size: 12px; margin-left: 8px">¥199/年</span>
            </el-radio>
            <el-radio label="premium">
              高级会员
              <span style="color: #999; font-size: 12px; margin-left: 8px">¥399/年</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开通时长" prop="durationDays">
          <el-input-number v-model="grantForm.durationDays" :min="1" :max="365" />
          <span style="margin-left: 8px">天</span>
          <div class="duration-hint">
            <span v-if="grantForm.tier === 'basic'">预计到期: {{ calculateEndDate() }}</span>
            <span v-else-if="grantForm.tier === 'premium'">预计到期: {{ calculateEndDate() }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantLoading" @click="handleGrantConfirm">确定开通</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getMemberList, updateMember, grantMembership, getUserSelectList, getUserDetail } from '@/api/admin'
import type { Member } from '@/types'

interface UserOption {
  id: number
  nickname: string
  phone: string
}

interface ChildOption {
  id: number
  name: string
  age: number
}

const statusFilter = ref('')
const loading = ref(false)
const memberList = ref<Member[]>([])
const extendVisible = ref(false)
const grantVisible = ref(false)
const grantLoading = ref(false)
const userLoading = ref(false)
const grantFormRef = ref<FormInstance>()

const extendForm = reactive({
  id: 0,
  currentEnd: '',
  days: 30
})

const grantForm = reactive({
  userId: null as number | null,
  childId: null as number | null,
  tier: 'basic',
  durationDays: 365
})

const grantRules: FormRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  tier: [{ required: true, message: '请选择会员套餐', trigger: 'change' }],
  durationDays: [{ required: true, message: '请设置开通时长', trigger: 'change' }]
}

const userOptions = ref<UserOption[]>([])
const childOptions = ref<ChildOption[]>([])

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

const handleGrant = () => {
  grantForm.userId = null
  grantForm.childId = null
  grantForm.tier = 'basic'
  grantForm.durationDays = 365
  userOptions.value = []
  childOptions.value = []
  grantVisible.value = true
}

const searchUsers = async (keyword: string) => {
  if (!keyword) {
    userOptions.value = []
    return
  }
  userLoading.value = true
  try {
    const res = await getUserSelectList({ keyword })
    userOptions.value = res.data || []
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    userLoading.value = false
  }
}

const handleUserChange = async (userId: number) => {
  grantForm.childId = null
  childOptions.value = []
  if (userId) {
    try {
      const res = await getUserDetail(userId)
      if (res.data.children && res.data.children.length > 0) {
        childOptions.value = res.data.children.map((c: any) => ({
          id: c.id,
          name: c.name,
          age: c.age
        }))
        grantForm.childId = childOptions.value[0].id
      }
    } catch (error) {
      console.error('获取用户儿童信息失败:', error)
    }
  }
}

const calculateEndDate = () => {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + grantForm.durationDays)
  return endDate.toLocaleDateString('zh-CN')
}

const handleGrantConfirm = async () => {
  if (!grantFormRef.value) return
  
  try {
    await grantFormRef.value.validate()
  } catch {
    return
  }
  
  if (!grantForm.userId) {
    ElMessage.warning('请选择用户')
    return
  }
  
  grantLoading.value = true
  try {
    await grantMembership({
      userId: grantForm.userId,
      childId: grantForm.childId || undefined,
      tier: grantForm.tier as 'basic' | 'premium',
      durationDays: grantForm.durationDays
    })
    ElMessage.success('开通会员成功')
    grantVisible.value = false
    fetchMembers()
  } catch (error: any) {
    ElMessage.error(error.message || '开通会员失败')
  } finally {
    grantLoading.value = false
  }
}

const getMemberTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    free: 'info',
    basic: 'success',
    premium: 'danger'
  }
  return colors[type] || 'info'
}

const getMemberTypeText = (type: string) => {
  const texts: Record<string, string> = {
    free: '免费',
    basic: '年度',
    premium: '高级'
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

.phone, .child-id {
  font-size: 12px;
  color: #999;
}

.expired {
  color: #999;
  text-decoration: line-through;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.duration-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>