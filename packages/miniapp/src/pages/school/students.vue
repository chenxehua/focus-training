/**
 * 学校端 - 学生管理页面
 */
<template>
  <view class="students-page">
    <!-- 头部 -->
    <view class="header">
      <text class="back-btn" @tap="goBack">← 返回</text>
      <text class="title">{{ className || '学生管理' }}</text>
      <view class="add-btn" @tap="showImportModal = true">
        <text>+ 导入</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" v-model="searchKey" placeholder="搜索学生姓名" @confirm="searchStudents" />
      <text class="search-btn" @tap="searchStudents">搜索</text>
    </view>

    <!-- 学生统计 -->
    <view class="stats-bar">
      <text class="stats-text">共 {{ students.length }} 名学生</text>
      <text class="action-text" @tap="exportStudents">导出名单</text>
    </view>

    <!-- 学生列表 -->
    <view class="student-list">
      <view class="student-card" v-for="(student, index) in students" :key="index">
        <view class="student-avatar">
          <text>{{ student.name?.charAt(0) || 'S' }}</text>
        </view>
        <view class="student-info">
          <text class="student-name">{{ student.name }}</text>
          <view class="student-meta">
            <text class="meta-item">{{ student.gender === 1 ? '男' : '女' }}</text>
            <text class="meta-item">{{ student.age }}岁</text>
          </view>
        </view>
        <view class="student-stats">
          <view class="mini-stat">
            <text class="mini-value">{{ student.training_count || 0 }}</text>
            <text class="mini-label">训练</text>
          </view>
          <view class="mini-stat">
            <text class="mini-value">{{ student.avg_score || 0 }}</text>
            <text class="mini-label">均分</text>
          </view>
        </view>
        <view class="student-actions">
          <text class="action-btn" @tap="viewReport(student)">报告</text>
          <text class="action-btn danger" @tap="removeStudent(student)">移除</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="students.length === 0">
        <text>暂无学生数据</text>
        <text class="empty-tip">点击右上角"导入"按钮添加学生</text>
      </view>
    </view>

    <!-- 导入弹窗 -->
    <view class="modal" v-if="showImportModal" @tap.stop>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">批量导入学生</text>
          <text class="close-btn" @tap="showImportModal = false">×</text>
        </view>

        <view class="import-tip">
          <text>请上传包含学生信息的Excel文件，每行格式：</text>
          <text class="tip-format">姓名, 性别(1=男/2=女), 出生日期</text>
        </view>

        <view class="upload-area" @tap="chooseFile">
          <text class="upload-icon">📁</text>
          <text class="upload-text">{{ importingFile?.name || '点击选择文件' }}</text>
        </view>

        <view class="form-group">
          <text class="label">或者手动添加：</text>
        </view>

        <view class="form-group">
          <text class="label">学生姓名 *</text>
          <input class="input" v-model="newStudent.name" placeholder="请输入学生姓名" />
        </view>

        <view class="form-row">
          <view class="form-group half">
            <text class="label">性别 *</text>
            <picker mode="selector" :range="genders" range-key="label" @change="onGenderChange">
              <view class="picker-value">
                <text>{{ newStudent.genderLabel || '请选择' }}</text>
              </view>
            </picker>
          </view>
          <view class="form-group half">
            <text class="label">年龄 *</text>
            <input class="input" v-model="newStudent.age" type="number" placeholder="年龄" />
          </view>
        </view>

        <view class="form-actions">
          <button class="btn-cancel" @tap="showImportModal = false">取消</button>
          <button class="btn-confirm" @tap="addSingleStudent">添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 性别选项
const genders = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
]

// 数据状态
const students = ref<any[]>([])
const searchKey = ref('')
const showImportModal = ref(false)
const importingFile = ref<any>(null)
const classId = ref(0)
const className = ref('')

// 新增学生表单
const newStudent = ref({
  name: '',
  gender: 0,
  genderLabel: '',
  age: '',
})

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  classId.value = parseInt(options.classId) || 1
  className.value = decodeURIComponent(options.className || '学生管理')
  
  fetchStudents()
})

// 获取学生列表
const fetchStudents = async () => {
  try {
    // const res = await schoolApi.getClassStudents(classId.value, { search: searchKey.value })
    // students.value = res.data.list
    
    // 模拟数据
    students.value = [
      { id: 1, name: '张三', gender: 1, age: 8, training_count: 45, avg_score: 85.5 },
      { id: 2, name: '李四', gender: 2, age: 7, training_count: 38, avg_score: 78.2 },
      { id: 3, name: '王五', gender: 1, age: 9, training_count: 52, avg_score: 92.1 },
      { id: 4, name: '赵六', gender: 1, age: 8, training_count: 41, avg_score: 80.3 },
      { id: 5, name: '孙七', gender: 2, age: 7, training_count: 35, avg_score: 76.8 },
    ]
  } catch (error) {
    console.error('获取学生列表失败:', error)
  }
}

// 搜索学生
const searchStudents = () => {
  fetchStudents()
}

// 选择文件
const chooseFile = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res) => {
      importingFile.value = res.tempFiles[0]
    },
  })
}

// 性别选择
const onGenderChange = (e: any) => {
  const index = e.detail.value
  newStudent.value.gender = genders[index].value
  newStudent.value.genderLabel = genders[index].label
}

// 添加单个学生
const addSingleStudent = async () => {
  if (!newStudent.value.name || !newStudent.value.gender || !newStudent.value.age) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  try {
    // await schoolApi.addStudent(classId.value, newStudent.value)
    students.value.push({
      id: Date.now(),
      name: newStudent.value.name,
      gender: newStudent.value.gender,
      age: parseInt(newStudent.value.age),
      training_count: 0,
      avg_score: 0,
    })
    
    showImportModal.value = false
    newStudent.value = { name: '', gender: 0, genderLabel: '', age: '' }
    uni.showToast({ title: '添加成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

// 查看报告
const viewReport = (student: any) => {
  uni.navigateTo({ url: `/pages/school/student-report?studentId=${student.id}&studentName=${student.name}` })
}

// 移除学生
const removeStudent = async (student: any) => {
  uni.showModal({
    title: '确认移除',
    content: `确定要将学生 "${student.name}" 从班级移除吗？`,
    success: async (res) => {
      if (res.confirm) {
        // await schoolApi.removeStudent(classId.value, student.id)
        students.value = students.value.filter(s => s.id !== student.id)
        uni.showToast({ title: '移除成功', icon: 'success' })
      }
    },
  })
}

// 导出学生
const exportStudents = () => {
  uni.showToast({ title: '导出功能开发中', icon: 'none' })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.students-page {
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

.back-btn {
  color: #6C63FF;
  font-size: 28rpx;
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

.search-bar {
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
}

.search-input {
  flex: 1;
  padding: 20rpx 25rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 28rpx;
}

.search-btn {
  background: #6C63FF;
  color: white;
  padding: 20rpx 35rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.stats-bar {
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-text {
  font-size: 26rpx;
  color: #666;
}

.action-text {
  color: #6C63FF;
  font-size: 26rpx;
}

.student-list {
  padding: 20rpx;
}

.student-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.student-avatar {
  width: 70rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #6C63FF, #9D4EDD);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.student-meta {
  display: flex;
  gap: 15rpx;
  margin-top: 8rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.student-stats {
  display: flex;
  gap: 20rpx;
  margin-right: 20rpx;
}

.mini-stat {
  text-align: center;
}

.mini-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #6C63FF;
  display: block;
}

.mini-label {
  font-size: 20rpx;
  color: #999;
}

.student-actions {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.action-btn {
  color: #6C63FF;
  font-size: 24rpx;
  text-align: right;
}

.action-btn.danger {
  color: #ff4d4f;
}

.empty-state {
  text-align: center;
  padding: 100rpx;
  color: #999;
}

.empty-tip {
  font-size: 24rpx;
  display: block;
  margin-top: 20rpx;
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
  max-height: 85vh;
  overflow-y: auto;
  padding: 30rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 50rpx;
  color: #999;
}

.import-tip {
  background: #f0f0f0;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.import-tip text {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.tip-format {
  font-family: monospace;
  margin-top: 10rpx;
}

.upload-area {
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.upload-icon {
  font-size: 60rpx;
  display: block;
}

.upload-text {
  font-size: 26rpx;
  color: #666;
  margin-top: 10rpx;
}

.form-group {
  margin-bottom: 20rpx;
}

.form-row {
  display: flex;
  gap: 20rpx;
}

.form-group.half {
  flex: 1;
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