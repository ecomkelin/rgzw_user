/**
 * 账户管理 API
 */
import http from './http'

export const accountService = {
  /**
   * 账户分页列表
   * @param {object} params 搜索条件（keyword、page、pageSize、status...）
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getAccounts(params) {
    return http.post('/account/list', params)
  },

  /**
   * 账户详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getAccountById(id) {
    return http.post(`/account/detail/${id}`)
  },

  /**
   * 创建账户
   * @param {object} accountData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createAccount(accountData) {
    return http.post('/account/add', accountData)
  },

  /**
   * 更新账户
   * @param {string|number} id
   * @param {object} accountData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateAccount(id, accountData) {
    return http.post(`/account/edit/${id}`, accountData)
  },

  /**
   * 获取当前登录账户
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getCurrentUser() {
    return http.post('/account/self')
  },

  /**
   * 更新当前登录账户
   * @param {object} userData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateCurrentUser(userData) {
    return http.post('/account/edit/self', userData)
  }
}
