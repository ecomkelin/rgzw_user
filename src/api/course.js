/**
 * 课程管理 API
 */
import http from './http'

export const courseService = {
  /**
   * 课程分页列表
   * @param {object} params 搜索条件
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getCourses(params) {
    return http.post('/course/list', params)
  },

  /**
   * 课程详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getCourseById(id) {
    return http.post(`/course/detail/${id}`)
  },

  /**
   * 创建课程
   * @param {object} courseData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createCourse(courseData) {
    return http.post('/course/add', courseData)
  },

  /**
   * 更新课程
   * @param {string|number} id
   * @param {object} courseData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateCourse(id, courseData) {
    return http.post(`/course/edit/${id}`, courseData)
  },

  /**
   * 删除课程（软删除：将 isActive 设置为 false）
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deleteCourse(id) {
    return http.post(`/course/edit/${id}`, { isActive: false })
  }
}
