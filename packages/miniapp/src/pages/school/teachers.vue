/**
 * 学校端 - 教师管理页面
 */
<template>
  <view class="teachers-page">
    <!-- 头部 -->
    <view class="header">
      <text class="title">教师管理</text>
      <view class="add-btn" @tap="showAddModal = true">
        <text>+ 添加教师</text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker mode="selector" :range="roles" range-key="label" @change="onRoleChange">
        <view class="filter-item">
          <text>{{ selectedRole || '全部角色' }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 教师列表 -->
    <view class="teacher-list">
      <view class="teacher-card" v-for="(teacher, index) in teachers" :key="index">
        <view class="teacher-avatar">
          <text>{{ teacher.name?.charAt(0) || 'T' }}</text>
        </view>
        <view class="teacher-info">
          <text class="teacher-name">{{ teacher.name }}</text>
          <text class="teacher-role">{{ getRoleLabel(teacher.role) }}</text>
          <text class="teacher-phone">{{ teacher.phone }}</text>
        </view>
        <view class="teacher-actions">
          <text class="action-btn" @tap="editTeacher(teacher)">编辑</text>
          <text class="action-btn danger" @tap="deleteTeacher(teacher)">删除</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="teachers.length === 0">
        <text>暂无教师数据</text>
      </view>
    </view>

    <!-- 添加/编辑教师弹窗 -->
    <view class="modal" v-if="showAddModal" @tap.stop>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingTeacher ? '编辑教师' : '添加教师' }}</text>
          <text class="close-btn" @tap="closeModal">×</text>
        </view>

        <view class="form-group">
          <text class="label">姓名 *</text>
          <input class="input" v-model="formData.name" placeholder="请输入教师姓名" />
        </view>

        <view class="form-group">
          <text class="label">手机号 *</text>
          <input class="input" v-model="formData.phone" type="number" placeholder="请输入手机号" />
        </view>

        <view class="form-group">
          <text class="label">邮箱</text>
          <input class="input" v-model="formData.email" type="email" placeholder="请输入邮箱" />
        </view>

        <view class="form-group">
          <text class="label">角色 *</text>
          <picker mode="selector" :range="roles" range-key="label" @change="onFormRoleChange">
            <view class="picker-value">
              <text>{{ formData.roleLabel || '请选择角色' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-actions">
          <button class="btn-cancel" @tap="closeModal">取消</button>
          <button class="btn-confirm" @tap="saveTeacher">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 角色选项
const roles = [
  { value: 0, label: '全部角色' },
  { value: 1, label: '管理员' },
  { value: 2, label: '班主任' },
  { value: 3, label: '任课教师' },
  { value: 4, label: '心理老师' },
]

// 数据状态
const teachers = ref<any[]>([])
const selectedRole = ref('')
const showAddModal = ref(false)
const editingTeacher = ref<any>(null)

// 表单数据
const formData = ref({
  name: '',
  phone: '',
  email: '',
  role: 0,
  roleLabel: '',
  school_id: 1,
})

// 获取角色标签
const getRoleLabel = (role: number) => {
  const r = roles.find(r => r.value === role)
  return r?.label || '未知'
}

// 角色筛选
const onRoleChange = (e: any) => {
  const index = e.detail.value
  selectedRole.value = index > 0 ? roles[index].label : ''
  fetchTeachers()
}

// 表单角色选择
const onFormRoleChange = (e: any) => {
  const index = e.detail.value
  formData.value.role = roles[index].value
  formData.value.roleLabel = roles[index].label
}

// 获取教师列表
const fetchTeachers = async () => {
  try {
    // const res = await schoolApi.getTeachers({ school_id: 1, role: selectedRole.value })
    // teachers.value = res.data.list
    
    // 模拟数据
    teachers.value = [
      { id: 1, name: '张老师', phone: '13800138001', email: 'zhang@test.com', role: 1 },
      { id: 2, name: '李老师', phone: '13800138002', email: 'li@test.com', role: 2 },
      { id: 3, name: '王老师', phone: '13800138003', email: 'wang@test.com', role: 3 },
      { id: 4, name: '赵老师', phone: '13800138004', email: 'zhao@test.com', role: 4 },
    ]
  } catch (error) {
    console.error('获取教师列表失败:', error)
  }
}

// 编辑教师
const editTeacher = (teacher: any) => {
  editingTeacher.value = teacher
  formData.value = { ...teacher, roleLabel: getRoleLabel(teacher.role) }
  showAddModal.value = true
}

// 删除教师
const deleteTeacher = async (teacher: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除教师 "${teacher.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        // await schoolApi.deleteTeacher(teacher.id)
        teachers.value = teachers.value.filter(t => t.id !== teacher.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    },
  })
}

// 保存教师
const saveTeacher = async () => {
  if (!formData.value.name || !formData.value.phone || !formData.value.role) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  try {
    if (editingTeacher.value) {
      // await schoolApi.updateTeacher(editingTeacher.value.id, formData.value)
    } else {
      // await schoolApi.createTeacher(formData.value)
      teachers.value.push({ id: Date.now(), ...formData.value })
    }
    
    closeModal()
    fetchTeachers()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

// 关闭弹窗
const closeModal = () => {
  showAddModal.value = false
  editingTeacher.value = null
  formData.value = { name: '', phone: '', email: '', role: 0, roleLabel: '', school_id: 1 }
}

onMounted(() => {
  fetchTeachers()
})
</script>

<style scoped>
.teachers-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
}

.add-btn {
  background: #6C63FF;
  color: white;
  padding: 15rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.filter-bar {
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 15rpx 25rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.arrow {
  margin-left: 10rpx;
  font-size: 20rpx;
  color: #666;
}

.teacher-list {
  padding: 20rpx;
}

.teacher-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.teacher-avatar {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #6C63FF, #9D4EDD);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 25rpx;
}

.teacher-info {
  flex: 1;
}

.teacher-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.teacher-role {
  font-size: 24rpx;
  color: #6C63FF;
  display: block;
  margin: 5rpx 0;
}

.teacher-phone {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.teacher-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  color: #6C63FF;
  font-size: 26rpx;
  padding: 10rpx;
}

.action-btn.danger {
  color: #ff4d4f;
}

.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20rpx;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 30rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 50rpx;
  color: #999;
}

.form-group {
  margin-bottom: 25rpx;
}

.label {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.picker-value {
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  background: white;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 25rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  text-align: center;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: #6C63FF;
  color: white;
}
</style>