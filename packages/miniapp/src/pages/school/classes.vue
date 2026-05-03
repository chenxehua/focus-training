/**
 * 学校端 - 班级管理页面
 */
<template>
  <view class="classes-page">
    <!-- 头部 -->
    <view class="header">
      <text class="title">班级管理</text>
      <view class="add-btn" @tap="showAddModal = true">
        <text>+ 创建班级</text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker mode="selector" :range="grades" range-key="label" @change="onGradeChange">
        <view class="filter-item">
          <text>{{ selectedGrade || '全部年级' }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 班级列表 -->
    <view class="class-list">
      <view class="class-card" v-for="(cls, index) in classes" :key="index" @tap="viewClassDetail(cls)">
        <view class="class-info">
          <text class="class-name">{{ cls.name }}</text>
          <view class="class-meta">
            <text class="grade-tag">{{ cls.grade }}</text>
            <text class="year-tag">{{ cls.year }}级</text>
          </view>
        </view>
        <view class="class-stats">
          <view class="stat-item">
            <text class="stat-value">{{ cls.student_count }}</text>
            <text class="stat-label">学生</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ cls.teacher_name || '-' }}</text>
            <text class="stat-label">班主任</text>
          </view>
        </view>
        <view class="class-actions">
          <text class="action-btn" @tap.stop="editClass(cls)">编辑</text>
          <text class="action-btn" @tap.stop="manageStudents(cls)">学生</text>
          <text class="action-btn danger" @tap.stop="deleteClass(cls)">删除</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="classes.length === 0">
        <text>暂无班级数据</text>
      </view>
    </view>

    <!-- 添加/编辑班级弹窗 -->
    <view class="modal" v-if="showAddModal" @tap.stop>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingClass ? '编辑班级' : '创建班级' }}</text>
          <text class="close-btn" @tap="closeModal">×</text>
        </view>

        <view class="form-group">
          <text class="label">班级名称 *</text>
          <input class="input" v-model="formData.name" placeholder="如：一年级一班" />
        </view>

        <view class="form-group">
          <text class="label">年级 *</text>
          <picker mode="selector" :range="grades" range-key="label" @change="onFormGradeChange">
            <view class="picker-value">
              <text>{{ formData.gradeLabel || '请选择年级' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-group">
          <text class="label">入学年份 *</text>
          <picker mode="selector" :range="years" @change="onYearChange">
            <view class="picker-value">
              <text>{{ formData.year || '请选择年份' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-group">
          <text class="label">班主任 *</text>
          <picker mode="selector" :range="teachers" range-key="name" @change="onTeacherChange">
            <view class="picker-value">
              <text>{{ formData.teacher_name || '请选择班主任' }}</text>
            </view>
          </picker>
        </view>

        <view class="form-actions">
          <button class="btn-cancel" @tap="closeModal">取消</button>
          <button class="btn-confirm" @tap="saveClass">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 年级选项
const grades = [
  { value: '', label: '全部年级' },
  { value: '一年级', label: '一年级' },
  { value: '二年级', label: '二年级' },
  { value: '三年级', label: '三年级' },
  { value: '四年级', label: '四年级' },
  { value: '五年级', label: '五年级' },
  { value: '六年级', label: '六年级' },
]

// 年份选项
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => `${currentYear - i}`)

// 数据状态
const classes = ref<any[]>([])
const teachers = ref<any[]>([])
const selectedGrade = ref('')
const showAddModal = ref(false)
const editingClass = ref<any>(null)

// 表单数据
const formData = ref({
  name: '',
  grade: '',
  gradeLabel: '',
  year: '',
  teacher_id: 0,
  teacher_name: '',
  school_id: 1,
})

// 年级筛选
const onGradeChange = (e: any) => {
  const index = e.detail.value
  selectedGrade.value = index > 0 ? grades[index].value : ''
  fetchClasses()
}

// 表单年级选择
const onFormGradeChange = (e: any) => {
  const index = e.detail.value
  formData.value.grade = grades[index].value
  formData.value.gradeLabel = grades[index].label
}

// 年份选择
const onYearChange = (e: any) => {
  formData.value.year = years[e.detail.value]
}

// 班主任选择
const onTeacherChange = (e: any) => {
  const teacher = teachers.value[e.detail.value]
  formData.value.teacher_id = teacher.id
  formData.value.teacher_name = teacher.name
}

// 获取班级列表
const fetchClasses = async () => {
  try {
    // const res = await schoolApi.getClasses({ school_id: 1, grade: selectedGrade.value })
    // classes.value = res.data.list
    
    // 模拟数据
    classes.value = [
      { id: 1, name: '一年级一班', grade: '一年级', year: '2024', student_count: 35, teacher_name: '张老师' },
      { id: 2, name: '一年级二班', grade: '一年级', year: '2024', student_count: 32, teacher_name: '李老师' },
      { id: 3, name: '二年级一班', grade: '二年级', year: '2023', student_count: 38, teacher_name: '王老师' },
      { id: 4, name: '二年级二班', grade: '二年级', year: '2023', student_count: 36, teacher_name: '赵老师' },
    ]
    
    // 模拟教师列表
    teachers.value = [
      { id: 1, name: '张老师' },
      { id: 2, name: '李老师' },
      { id: 3, name: '王老师' },
      { id: 4, name: '赵老师' },
    ]
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 查看班级详情
const viewClassDetail = (cls: any) => {
  uni.navigateTo({ url: `/pages/school/class-detail?id=${cls.id}&name=${cls.name}` })
}

// 编辑班级
const editClass = (cls: any) => {
  editingClass.value = cls
  formData.value = { ...cls, gradeLabel: cls.grade }
  showAddModal.value = true
}

// 管理学生
const manageStudents = (cls: any) => {
  uni.navigateTo({ url: `/pages/school/students?classId=${cls.id}&className=${cls.name}` })
}

// 删除班级
const deleteClass = async (cls: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除班级 "${cls.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        // await schoolApi.deleteClass(cls.id)
        classes.value = classes.value.filter(c => c.id !== cls.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    },
  })
}

// 保存班级
const saveClass = async () => {
  if (!formData.value.name || !formData.value.grade || !formData.value.year || !formData.value.teacher_id) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  try {
    if (editingClass.value) {
      // await schoolApi.updateClass(editingClass.value.id, formData.value)
    } else {
      // await schoolApi.createClass(formData.value)
      classes.value.push({ id: Date.now(), ...formData.value, student_count: 0 })
    }
    
    closeModal()
    fetchClasses()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

// 关闭弹窗
const closeModal = () => {
  showAddModal.value = false
  editingClass.value = null
  formData.value = { name: '', grade: '', gradeLabel: '', year: '', teacher_id: 0, teacher_name: '', school_id: 1 }
}

onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.classes-page {
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

.class-list {
  padding: 20rpx;
}

.class-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.class-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.class-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.class-meta {
  display: flex;
  gap: 10rpx;
}

.grade-tag, .year-tag {
  padding: 8rpx 16rpx;
  background: #f0f0f0;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #666;
}

.class-stats {
  display: flex;
  gap: 40rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #eee;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 20rpx;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #6C63FF;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 5rpx;
}

.class-actions {
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