import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    currentAccessToken: (state) => state.accessToken
  },

  actions: {
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.isAuthenticated = true

      localStorage.setItem('accessToken', accessToken)
      // 刷新token通常存储在cookie中，我们只在需要时才存储
    },

    setUser(user) {
      this.user = user
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false

      localStorage.removeItem('accessToken')
      // 发送请求清理服务器端的refresh token cookie
      fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include' // 确保包含cookies
      }).catch(err => console.error('Logout error:', err))
    },

    checkAuthStatus() {
      const token = localStorage.getItem('accessToken')
      if (token) {
        this.accessToken = token
        this.isAuthenticated = true
        // 这里可能需要调用API来获取当前用户信息
      }
    }
  }
})