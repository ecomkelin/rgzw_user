/**
 * 认证状态管理（Pinia Store）
 *
 * 持有三类状态：
 *   - user            当前登录用户
 *   - accessToken     短期 access token（API 请求 Authorization）
 *   - refreshToken    长期 refresh token（用于刷新 accessToken）
 *   - isAuthenticated 是否已认证
 *   - authChecked     是否已完成"恢复 + 校验"流程
 *
 * 持久化策略：
 *   - accessToken / refreshToken / user 都同步写入 localStorage
 *   - 启动时从 localStorage 恢复，并异步调用 /api/user/self 验证 token 有效性
 *   - 验证失败时自动清空并跳登录页
 *
 * 提供 actions：
 *   - initializeAuth()  启动时调用，恢复 + 校验
 *   - setTokens()       登录成功时写入
 *   - setUser()         写入用户对象
 *   - logout()          清空所有状态 + 通知后端销毁 refresh cookie
 *   - checkAuthStatus() 主动校验 token
 */

import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    currentOrgId: null, // 当前用户所属机构（currentUser.Org）
    isAuthenticated: false,
    authChecked: false // 标识认证状态是否已检查（用于路由守卫）
  }),

  getters: {
    currentUser: (state) => state.user,
    currentAccessToken: (state) => state.accessToken,
    currentOrgIdValue: (state) => state.currentOrgId,
    isAuthChecked: (state) => state.authChecked
  },

  actions: {
    /**
     * 应用启动时调用：
     * 1. 从 localStorage 恢复 token / user
     * 2. 若有 token，立即将 authChecked=true 放行路由，避免白屏卡顿
     * 3. 异步调用后端校验 token；失败则清空认证状态
     * @returns {Promise<void>}
     */
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

      // 恢复 currentOrgId（优先于异步校验前使用，避免空白闪烁）
      const storedOrgId = localStorage.getItem('currentOrgId')
      if (storedOrgId) {
        this.currentOrgId = storedOrgId
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

    /**
     * 写入 token 并标记已认证
     * @param {string} accessToken
     * @param {string|null} refreshToken
     */
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

    /**
     * 写入当前用户并持久化
     * @param {object} user
     */
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
      console.log('User set in store and localStorage:', !!user);
    },

    /**
     * 写入当前用户所属机构 Org（来自 currentUser.Org），并持久化
     * @param {string} orgId
     */
    setCurrentOrgId(orgId) {
      this.currentOrgId = orgId || null
      if (orgId) {
        localStorage.setItem('currentOrgId', orgId)
      } else {
        localStorage.removeItem('currentOrgId')
      }
    },

    /**
     * 登出：清空 store + localStorage + 通知后端销毁 refresh cookie
     */
    logout() {
      console.log('Logout called, clearing authentication data');
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.currentOrgId = null
      this.isAuthenticated = false
      this.authChecked = true

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('currentOrgId')

      // 发送请求清理服务器端的refresh token cookie
      // 后端 v7.x 起 /auth/logout 已改为 POST；credentials: 'include' 保证带上 HttpOnly cookie
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // 确保包含cookies
      }).catch(err => console.error('Logout error:', err))
    },

    /**
     * 主动校验 accessToken 有效性
     *  - 200/403：token 有效（403 表示权限不足但 token 本身有效）
     *  - 401    ：token 失效，自动登出
     *  - 网络错误：不修改认证状态（避免在弱网下误踢）
     * @returns {Promise<boolean>} 是否有效
     */
    async checkAuthStatus() {
      console.log('checkAuthStatus called with accessToken:', !!this.accessToken);
      if (!this.accessToken) {
        console.log('No access token, marking as not authenticated');
        this.isAuthenticated = false
        return false
      }

      try {
        // 尝试使用需要认证的端点来验证token是否有效
        // 后端 v7.x 的真实端点是 /api/user/self（无尾斜杠）
        // 旧版请求的 `/api/user/self/` 走 404 旁路，被错误地当作「未授权」
        console.log('Making request to validate token...');
        const response = await fetch('/api/user/self', {
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
            // /api/user/self 返回 { data: { item: User } }，统一写到 store
            const item = result?.data?.item || result?.data
            if (item) {
              this.setUser(item)
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