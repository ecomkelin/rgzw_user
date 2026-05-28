import http from './http'

export const studentService = {
  // 获取学生列表
  getStudents(params) {
    return http.post('/student/list', params)
  },

  // 获取学生详情
  getStudentById(id) {
    return http.post(`/student/detail/${id}`)
  },

  // 创建学生
  createStudent(studentData) {
    return http.post('/student/add', studentData)
  },

  // 更新学生
  updateStudent(id, studentData) {
    return http.post(`/student/edit/${id}`, studentData)
  }
}