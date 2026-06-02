/**
 * HTTP 客户端封装（基于 axios）
 *
 * 责任：
 *   - 统一 baseURL / 超时 / withCredentials
 *   - 请求拦截：自动注入 Bearer token
 *   - 响应拦截：
 *       * 401 走 refresh-token 重试一次；失败则清登录态并跳 /login
 *       * 业务失败（HTTP 200 但 success=false）也走统一错误归一化
 *       * 所有错误经过 `normalizeError` 收敛后，再走 `reportNormalized` 通道
 *   - 错误统一展示：非 401 / 非业务失败用 `ElMessage.error`
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { normalizeError, getUserMessage, reportNormalized, ErrorKind } from '../utils/normalizeError'

/** axios 实例 —— 所有 api service 共享此实例 */
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

/* ============== 请求拦截 ============== */
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(normalizeError(error))
)

/* ============== 响应拦截 ============== */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const authStore = useAuthStore()

    /* ----- 401：尝试 refresh-token 重试一次 ----- */
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const resp = await apiClient.get('/auth/refresh-token')
        if (resp.data?.success && resp.data.data?.accessToken) {
          const { accessToken } = resp.data.data
          authStore.setTokens(accessToken, null)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        }
        throw new Error('Token refresh failed')
      } catch (refreshErr) {
        // 刷新失败：清登录态 + 跳登录页
        authStore.logout()
        const e = normalizeError(refreshErr)
        e.kind = ErrorKind.UNAUTHORIZED
        reportNormalized(e, { phase: 'refresh-token' })
        ElMessage.error(getUserMessage(e))
        // 用 location 强制刷新避免 Pinia 状态不一致
        window.location.href = '/login'
        return Promise.reject(e)
      }
    }

    /* ----- 其它错误：归一化 + 统一上报 + 提示 ----- */
    const e = normalizeError(error)
    reportNormalized(e, {
      phase: 'response',
      url: originalRequest.url,
      method: originalRequest.method
    })
    // 业务错误也展示后端 message（如果有）
    const message = getUserMessage(e)
    if (message && e.kind !== ErrorKind.UNAUTHORIZED) {
      // 401 已经在上面单独提示过
      ElMessage.error(message)
    }
    return Promise.reject(e)
  }
)

export default apiClient
