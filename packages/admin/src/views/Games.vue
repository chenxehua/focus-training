<template>
  <div class="games-page">
    <h2 class="page-title">游戏配置</h2>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="gameList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="game_code" label="编号" width="80" />
        <el-table-column label="游戏信息" min-width="200">
          <template #default="{ row }">
            <div class="game-info-cell">
              <span class="name">{{ row.game_name }}</span>
              <span class="type">{{ row.game_type }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="target_age_group" label="适用年龄" width="100" />
        <el-table-column prop="difficulty_levels" label="难度等级" width="100" />
        <el-table-column prop="is_free" label="是否免费" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_free ? 'success' : 'warning'" size="small">
              {{ row.is_free ? '免费' : '付费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch 
              :model-value="row.status === 'active'"
              @change="(val) => handleToggleStatus(row, val)"
              active-text="启用"
              inactive-text="禁用"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="编辑游戏配置" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="游戏名称">
          <el-input v-model="form.game_name" />
        </el-form-item>
        <el-form-item label="游戏类型">
          <el-input v-model="form.game_type" />
        </el-form-item>
        <el-form-item label="适用年龄">
          <el-input v-model="form.target_age_group" placeholder="如: 4-12" />
        </el-form-item>
        <el-form-item label="难度等级数">
          <el-input-number v-model="form.difficulty_levels" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="是否免费">
          <el-switch v-model="form.is_free" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ElMessage } from 'element-plus'
import { getGameList, updateGame } from '@/api/admin'

const loading = ref(false)
const submitLoading = ref(false)
const gameList = ref<any[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  game_name: '',
  game_type: '',
  description: '',
  icon_url: '',
  difficulty_levels: 3,
  target_age_group: '',
  is_free: true,
  status: 'active'
})

const fetchGames = async () => {
  loading.value = true
  try {
    const res = await getGameList()
    gameList.value = res.data
  } catch (error) {
    console.error('获取游戏列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: any) => {
  editingId.value = row.id
  Object.assign(form, {
    game_name: row.game_name,
    game_type: row.game_type,
    description: row.description,
    icon_url: row.icon_url,
    difficulty_levels: row.difficulty_levels,
    target_age_group: row.target_age_group,
    is_free: !!row.is_free,
    status: row.status
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!editingId.value) return

  submitLoading.value = true
  try {
    await updateGame(editingId.value, form)
    ElMessage.success('更新成功')
    dialogVisible.value = false
    fetchGames()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: any, newStatus: boolean) => {
  try {
    await updateGame(row.id, {
      status: newStatus ? 'active' : 'inactive'
    })
    ElMessage.success('状态更新成功')
    fetchGames()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

onMounted(() => {
  fetchGames()
})
</script>

<style scoped>
.games-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 24px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.game-info-cell {
  text-align: left;
}

.game-info-cell .name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.game-info-cell .type {
  font-size: 12px;
  color: #999;
}
</style>