/**
 * 学员管理 API
 */
import http from './http'

export const studentService = {
  /**
   * 学员分页列表
   * @param {object} params 搜索条件
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudents(params) {
    return http.post('/student/list', params)
  },

  /**
   * 学员详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudentById(id) {
    return http.post(`/student/detail/${id}`)
  },

  /**
   * 创建学员
   * @param {object} studentData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createStudent(studentData) {
    return http.post('/student/add', studentData)
  },

  /**
   * 更新学员
   * @param {string|number} id
   * @param {object} studentData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateStudent(id, studentData) {
    return http.post(`/student/edit/${id}`, studentData)
  }
}
