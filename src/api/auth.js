import http from './http'

export const authService = {
  // 登录
  login(credentials) {
    return http.post('/auth/login', credentials)
  },

  // 刷新token
  refreshToken() {
    return http.get('/auth/refresh-token')
  },

  // 登出
  logout() {
    return http.get('/auth/logout')
  }
}