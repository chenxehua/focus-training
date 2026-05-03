/**
 * 学校管理API
 */
import request from './request'

// 获取学校信息
export const getSchool = (schoolId: number) => {
  return request.get(`/school/schools/${schoolId}`)
}

// 获取学校列表
export const getSchoolList = (params?: { status?: number; page?: number; page_size?: number }) => {
  return request.get('/school/schools', params)
}

// 创建学校
export const createSchool = (data: any) => {
  return request.post('/school/schools', data)
}

// 审核学校
export const approveSchool = (schoolId: number, status: number) => {
  return request.put(`/school/schools/${schoolId}/approve`, { status })
}

// 获取教师列表
export const getTeachers = (params: { school_id: number; role?: number; page?: number; page_size?: number }) => {
  return request.get('/school/teachers', params)
}

// 创建教师
export const createTeacher = (data: any) => {
  return request.post('/school/teachers', data)
}

// 更新教师
export const updateTeacher = (teacherId: number, data: any) => {
  return request.put(`/school/teachers/${teacherId}`, data)
}

// 删除教师
export const deleteTeacher = (teacherId: number) => {
  return request.delete(`/school/teachers/${teacherId}`)
}

// 获取班级列表
export const getClasses = (params: { school_id: number; grade?: string; page?: number; page_size?: number }) => {
  return request.get('/school/classes', params)
}

// 创建班级
export const createClass = (data: any) => {
  return request.post('/school/classes', data)
}

// 更新班级
export const updateClass = (classId: number, data: any) => {
  return request.put(`/school/classes/${classId}`, data)
}

// 删除班级
export const deleteClass = (classId: number) => {
  return request.delete(`/school/classes/${classId}`)
}

// 获取班级学生
export const getClassStudents = (classId: number, params?: { page?: number; page_size?: number }) => {
  return request.get(`/school/classes/${classId}/students`, params)
}

// 导入学生
export const importStudents = (classId: number, students: any[]) => {
  return request.post(`/school/classes/${classId}/students/import`, { students })
}

// 添加学生
export const addStudent = (classId: number, data: any) => {
  return request.post(`/school/classes/${classId}/students`, data)
}

// 移除学生
export const removeStudent = (classId: number, studentId: number) => {
  return request.delete(`/school/classes/${classId}/students/${studentId}`)
}

// 获取班级专注力报告
export const getClassReport = (classId: number, params?: { start_date?: string; end_date?: string }) => {
  return request.get(`/school/classes/${classId}/report`, params)
}

// 获取学校仪表盘
export const getDashboard = (schoolId: number) => {
  return request.get('/school/dashboard', { school_id: schoolId })
}

// 获取学生专注力报告
export const getStudentReport = (studentId: number, params?: { start_date?: string; end_date?: string }) => {
  return request.get(`/school/students/${studentId}/report`, params)
}