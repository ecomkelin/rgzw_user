import http from './http'

export const accountService = {
  // 获取账户列表
  getAccounts(params) {
    return http.post('/account/list', params)
  },

  // 获取账户详情
  getAccountById(id) {
    return http.post(`/account/detail/${id}`)
  },

  // 创建账户
  createAccount(accountData) {
    return http.post('/account/add', accountData)
  },

  // 更新账户
  updateAccount(id, accountData) {
    return http.post(`/account/edit/${id}`, accountData)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return http.post('/account/self')
  },

  // 更新当前用户信息
  updateCurrentUser(userData) {
    return http.post('/account/edit/self', userData)
  }
}