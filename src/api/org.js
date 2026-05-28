import http from './http'

export const orgService = {
  // 获取组织列表
  getOrgs(params) {
    return http.post('/org/list', params)
  },

  // 获取组织详情
  getOrgById(id) {
    return http.post(`/org/detail/${id}`)
  },

  // 创建组织
  createOrg(orgData) {
    return http.post('/org/add', orgData)
  },

  // 更新组织
  updateOrg(id, orgData) {
    return http.post(`/org/edit/${id}`, orgData)
  },

  // 获取当前用户所属组织
  getCurrentUserOrg() {
    return http.post('/org/self')
  }
}