<template>
  <div class="articles-page">
    <h2 class="page-title">文章管理</h2>
    
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增文章</el-button>
      <div class="search-area">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题/作者"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="articleList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column prop="is_featured" label="推荐" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_featured ? 'success' : 'info'" size="small">
              {{ row.is_featured ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_published" label="发布" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'warning'" size="small">
              {{ row.is_published ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publish_date" label="发布时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <!-- 编辑弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑文章' : '新增文章'" 
      width="800px"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option label="学习方法" :value="1" />
            <el-option label="训练技巧" :value="2" />
            <el-option label="专家建议" :value="3" />
            <el-option label="常见问题" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="请输入文章摘要" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入文章内容" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author" placeholder="请输入作者名称" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="form.coverImage" placeholder="请输入封面图URL" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.isFeatured" />
        </el-form-item>
        <el-form-item label="发布">
          <el-switch v-model="form.isPublished" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getArticleList, createArticle, updateArticle, deleteArticle } from '@/api/admin'

const searchKeyword = ref('')
const loading = ref(false)
const submitLoading = ref(false)
const articleList = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const formRef = ref()
const form = reactive({
  title: '',
  content: '',
  summary: '',
  coverImage: '',
  categoryId: 1,
  author: '',
  tags: '',
  isFeatured: false,
  isPublished: false
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await getArticleList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value
    })
    articleList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchArticles()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchArticles()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchArticles()
}

const handleCreate = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    title: row.title,
    content: row.content,
    summary: row.summary,
    coverImage: row.cover_image,
    categoryId: row.category_id,
    author: row.author,
    tags: row.tags,
    isFeatured: !!row.is_featured,
    isPublished: !!row.is_published
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value && editingId.value) {
      await updateArticle(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createArticle(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchArticles()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文稿吗？', '提示', { type: 'warning' })
    await deleteArticle(row.id)
    ElMessage.success('删除成功')
    fetchArticles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    title: '',
    content: '',
    summary: '',
    coverImage: '',
    categoryId: 1,
    author: '',
    tags: '',
    isFeatured: false,
    isPublished: false
  })
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.articles-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
}

.search-area {
  display: flex;
  gap: 12px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>