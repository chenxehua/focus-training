<template>
  <div class="orders-page">
    <h2 class="page-title">订单管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-select v-model="statusFilter" placeholder="订单状态" style="width: 120px" clearable>
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="已退款" value="refunded" />
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

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="orderList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="order_no" label="订单号" min-width="160" />
        <el-table-column label="用户信息" min-width="150">
          <template #default="{ row }">
            <div>
              <p>{{ row.user_name || '用户' }}</p>
              <p class="phone">{{ row.user_phone || '-' }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pay_time" label="支付时间" width="160">
          <template #default="{ row }">
            {{ row.pay_time ? formatDate(row.pay_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row.id)">详情</el-button>
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

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="650px">
      <div v-if="orderDetail" class="order-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号" :span="2">
            {{ orderDetail.order_no }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(orderDetail.status)" size="small">
              {{ getStatusText(orderDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ orderDetail.payment_method || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="amount">¥{{ orderDetail.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="优惠金额">
            <span class="discount">-¥{{ orderDetail.discount_amount || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="交易流水号" :span="2">
            {{ orderDetail.transaction_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ formatDate(orderDetail.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="支付时间">
            {{ orderDetail.pay_time ? formatDate(orderDetail.pay_time) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户ID">
            {{ orderDetail.user_id }}
          </el-descriptions-item>
          <el-descriptions-item label="用户名称">
            {{ orderDetail.user_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户手机">
            {{ orderDetail.user_phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="OpenID" :span="2">
            {{ orderDetail.openid || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.remark" label="备注" :span="2">
            {{ orderDetail.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, getOrderDetail } from '@/api/admin'
import type { Order } from '@/types'

const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)
const loading = ref(false)
const orderList = ref<Order[]>([])
const detailVisible = ref(false)
const orderDetail = ref<Order | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrderList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    })
    orderList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

const handleReset = () => {
  statusFilter.value = ''
  dateRange.value = null
  pagination.page = 1
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchOrders()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchOrders()
}

const handleViewDetail = async (id: number) => {
  try {
    const res = await getOrderDetail(id)
    orderDetail.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'info',
    refunded: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return texts[status] || status
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-page {
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

.amount {
  color: #ff4d4f;
  font-weight: 600;
}

.discount {
  color: #52c41a;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.order-detail-content {
  padding: 10px 0;
}
</style>