<template>
  <div class="questions-page">
    <h2 class="page-title">问答管理</h2>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待回复</el-radio-button>
        <el-radio-button label="answered">已回复</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="questionList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="问题" min-width="250">
          <template #default="{ row }">
            <div class="question-cell">
              <p class="title">{{ row.title }}</p>
              <p class="content">{{ row.content }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提问者" width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.user_avatar" icon="UserFilled" />
              <span>{{ row.user_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="answer_count" label="回复数" width="80">
          <template #default="{ row }">
            <el-badge :value="row.answer_count" :max="99" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提问时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看</el-button>
            <el-button type="success" link @click="handleReply(row)" v-if="row.answer_count === 0">回复</el-button>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="问题详情" width="600px">
      <div v-if="currentQuestion" class="question-detail">
        <div class="question-header">
          <h3>{{ currentQuestion.title }}</h3>
          <div class="meta">
            <span>提问者: {{ currentQuestion.user_name }}</span>
            <span>分类: {{ currentQuestion.category_name }}</span>
            <span>时间: {{ formatDate(currentQuestion.created_at) }}</span>
          </div>
        </div>
        <div class="question-content">
          {{ currentQuestion.content }}
        </div>
      </div>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复问题" width="500px">
      <el-form :model="replyForm" ref="replyFormRef" label-width="80px">
        <el-form-item label="回复内容" prop="content">
          <el-input 
            v-model="replyForm.content" 
            type="textarea" 
            :rows="5" 
            placeholder="请输入回复内容" 
          />
        </el-form-item>
        <el-form-item label="专家回复">
          <el-switch v-model="replyForm.isExpert" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitReply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getQuestionList, answerQuestion } from '@/api/admin'

const statusFilter = ref('')
const loading = ref(false)
const submitLoading = ref(false)
const questionList = ref<any[]>([])
const detailVisible = ref(false)
const replyVisible = ref(false)
const currentQuestion = ref<any>(null)
const replyingId = ref<number | null>(null)

const replyFormRef = ref()
const replyForm = reactive({
  content: '',
  isExpert: true
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchQuestions = async () => {
  loading.value = true
  try {
    const res = await getQuestionList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value
    })
    questionList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取问题列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.page = 1
  fetchQuestions()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchQuestions()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchQuestions()
}

const handleViewDetail = (row: any) => {
  currentQuestion.value = row
  detailVisible.value = true
}

const handleReply = (row: any) => {
  replyingId.value = row.id
  replyForm.content = ''
  replyForm.isExpert = true
  replyVisible.value = true
}

const handleSubmitReply = async () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  if (!replyingId.value) return

  submitLoading.value = true
  try {
    await answerQuestion(replyingId.value, replyForm)
    ElMessage.success('回复成功')
    replyVisible.value = false
    fetchQuestions()
  } catch (error: any) {
    ElMessage.error(error.message || '回复失败')
  } finally {
    submitLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.questions-page {
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

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.question-cell {
  text-align: left;
}

.question-cell .title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.question-cell .content {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.question-detail {
  padding: 10px 0;
}

.question-header h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.question-header .meta {
  display: flex;
  gap: 20px;
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.question-content {
  color: #666;
  line-height: 1.8;
}
</style>