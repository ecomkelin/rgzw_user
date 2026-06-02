/**
 * 用户管理 API
 */
import http from './http'

export const userService = {
  /**
   * 用户分页列表
   * @param {object} params 搜索条件（keyword、page、pageSize、status...）
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getUsers(params) {
    return http.post('/user/list', params)
  },

  /**
   * 用户详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getUserById(id) {
    return http.post(`/user/detail/${id}`)
  },

  /**
   * 创建用户
   * @param {object} userData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createUser(userData) {
    return http.post('/user/add', userData)
  },

  /**
   * 更新用户
   * @param {string|number} id
   * @param {object} userData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateUser(id, userData) {
    return http.post(`/user/edit/${id}`, userData)
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getCurrentUser() {
    return http.post('/user/self')
  }
}
