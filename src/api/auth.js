/**
 * 认证相关 API
 * 所有方法都返回 Promise，resolve 的是 axios response 对象
 * 业务字段在 response.data 内（统一为 { success, data, message } 形态）
 */
import http from './http'

export const authService = {
  /**
   * 登录
   * @param {{code:string, password:string}} credentials
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  login(credentials) {
    return http.post('/auth/login', credentials)
  },

  /**
   * 刷新 accessToken
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  refreshToken() {
    return http.get('/auth/refresh-token')
  },

  /**
   * 登出（销毁服务器端 refresh cookie）
   * 后端 v7.x 起改用 POST（与登录/刷新令牌保持一致的写操作语义）
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  logout() {
    return http.post('/auth/logout')
  }
}
