/**
 * 学校管理路由
 */
import { Router } from 'express'
import SchoolController from '../controllers/schoolController'

const router = Router()

// 管理员 - 学校管理
router.get('/schools', SchoolController.getSchoolList)
router.get('/schools/:id', SchoolController.getSchool)
router.post('/schools', SchoolController.createSchool)
router.put('/schools/:id/approve', SchoolController.approveSchool)

// 教师管理
router.get('/teachers', SchoolController.getTeachers)
router.post('/teachers', SchoolController.createTeacher)
router.put('/teachers/:id', SchoolController.updateTeacher)

// 班级管理
router.get('/classes', SchoolController.getClasses)
router.post('/classes', SchoolController.createClass)
router.put('/classes/:id', SchoolController.updateClass)
router.delete('/classes/:id', SchoolController.deleteClass)

// 学生管理
router.get('/classes/:classId/students', SchoolController.getClassStudents)
router.post('/classes/:classId/students/import', SchoolController.importStudents)
router.delete('/classes/:classId/students/:studentId', SchoolController.deleteStudent)

// 报告与仪表盘
router.get('/classes/:classId/report', SchoolController.getClassReport)
router.get('/dashboard', SchoolController.getDashboard)

export default router