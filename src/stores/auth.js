import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    authChecked: false // 新增：标识认证状态是否已检查
  }),

  getters: {
    currentUser: (state) => state.user,
    currentAccessToken: (state) => state.accessToken,
    isAuthChecked: (state) => state.authChecked
  },

  actions: {
    async initializeAuth() {
      // 应用启动时初始化认证状态
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

      console.log('initializeAuth - retrieved from localStorage:', {
        hasAccessToken: !!storedAccessToken,
        hasRefreshToken: !!storedRefreshToken,
        hasUser: !!storedUser
      });

      if (storedAccessToken) {
        this.accessToken = storedAccessToken
      }

      if (storedRefreshToken) {
        this.refreshToken = storedRefreshToken
      }

      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user data:', e)
        }
      }

      // 先假设有认证状态（如果存在token）
      if (this.accessToken) {
        this.isAuthenticated = true; // 假设token有效
      }

      // 立即标记认证已检查，这样路由守卫就不会无限等待
      this.authChecked = true

      // 如果有有效的 token，则尝试验证认证状态
      if (this.accessToken) {
        console.log('Attempting to validate existing token...');
        // 异步验证，不阻塞UI渲染
        setTimeout(async () => {
          await this.checkAuthStatus()
        }, 0);
      } else {
        // 没有token，设置为未认证
        console.log('No token found, setting as not authenticated');
        this.isAuthenticated = false
      }
    },

    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.isAuthenticated = true
      this.authChecked = true

      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }

      console.log('Tokens set in store and localStorage:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken
      });
    },

    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
      console.log('User set in store and localStorage:', !!user);
    },

    logout() {
      console.log('Logout called, clearing authentication data');
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.authChecked = true

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // 发送请求清理服务器端的refresh token cookie
      fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include' // 确保包含cookies
      }).catch(err => console.error('Logout error:', err))
    },

    async checkAuthStatus() {
      console.log('checkAuthStatus called with accessToken:', !!this.accessToken);
      if (!this.accessToken) {
        console.log('No access token, marking as not authenticated');
        this.isAuthenticated = false
        return false
      }

      try {
        // 尝试使用需要认证的端点来验证token是否有效
        // 使用正确的端点：/api/user/self/
        console.log('Making request to validate token...');
        const response = await fetch('/api/user/self/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // 空body，因为self端点可能不需要参数
        })

        console.log('Response status:', response.status);

        if (response.status === 401) {
          // Token无效，清除认证状态
          console.log('Token is invalid (401), logging out');
          this.logout()
          return false
        }

        if (response.status === 200 || response.status === 403) {
          // 200表示token有效（请求成功）
          // 403表示token有效但权限不足（这同样证明token有效）
          console.log('Token is valid, setting authenticated status');
          this.isAuthenticated = true

          // 尝试获取用户信息（如果有的话）
          try {
            const result = await response.json()
            console.log('Response data:', result);
            if (result.data) {
              this.setUser(result.data)
            }
          } catch (e) {
            // 如果解析响应失败，也不影响认证状态
            console.warn('Could not parse user data:', e)
          }

          return true
        }

        // 对于其他状态码，我们不改变isAuthenticated状态，继续保持原样
        console.log(`Received unexpected status code: ${response.status}, keeping current authentication state`);
        return false;

      } catch (error) {
        console.error('Network error validating token:', error)
        // 遇到网络错误时，不改变isAuthenticated状态，保持现有状态
        // 这样在网络不稳定时，用户不会被意外登出
        return false;
      }
    }
  }
})