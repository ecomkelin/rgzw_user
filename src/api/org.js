/**
 * 组织管理 API
 */
import http from './http'

export const orgService = {
  /**
   * 组织分页列表
   * @param {object} params 搜索条件
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getOrgs(params) {
    return http.post('/org/list', params)
  },

  /**
   * 组织详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getOrgById(id) {
    return http.post(`/org/detail/${id}`)
  },

  /**
   * 创建组织
   * @param {object} orgData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createOrg(orgData) {
    return http.post('/org/add', orgData)
  },

  /**
   * 更新组织
   * @param {string|number} id
   * @param {object} orgData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateOrg(id, orgData) {
    return http.post(`/org/edit/${id}`, orgData)
  },

  /**
   * 获取当前用户所属组织
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getCurrentUserOrg() {
    return http.post('/org/self')
  }
}
