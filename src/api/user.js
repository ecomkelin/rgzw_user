import http from './http'

export const userService = {
  // 获取用户列表
  getUsers(params) {
    return http.post('/user/list', params)
  },

  // 获取用户详情
  getUserById(id) {
    return http.post(`/user/detail/${id}`)
  },

  // 创建用户
  createUser(userData) {
    return http.post('/user/add', userData)
  },

  // 更新用户
  updateUser(id, userData) {
    return http.post(`/user/edit/${id}`, userData)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return http.post('/user/self')
  }
}