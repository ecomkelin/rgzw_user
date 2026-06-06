/**
 * useAuthStore 单元测试
 *
 * 重点：checkAuthStatus 必须用 /api/account/self + 显式传 options.populate，
 * 拿到 populate 后的 item 才能覆盖 localStorage。否则会把内存里 populate 好的 user
 * 覆盖成 currentUser 是 ObjectId 字符串的版本 → useAccount.isManager 变 false →
 * 刷新页面后侧边栏所有 isManager 菜单消失。
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

// mock apiClient —— store 改用 axios 后，旧的 globalThis.fetch mock 不再生效
// 每个测试可以用 mockResolvedValueOnce / mockResolvedValue 控制响应
const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn()
}))

vi.mock('../api/http', () => ({
  default: {
    post: (...args) => mockPost(...args)
  }
}))

/** 等待 setTimeout(0) + await Promise 链全部 flush */
const flushPromises = () => new Promise((r) => setTimeout(r, 0))

/** 构造一个 populate 完整的 Account 文档（模拟 Login 写入或后端正常返回） */
const makePopulatedAccount = (overrides = {}) => ({
  _id: 'acc-1',
  code: 'admin',
  accountType: 'User',
  isAdmin: true,
  currentUser: { _id: 'u-1', Org: 'org-1', roleTemp: 'manager', nickname: '超管' },
  ...overrides
})

describe('useAuthStore — 基础状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockPost.mockReset()
    vi.restoreAllMocks()
  })

  it('初始状态为未认证、未检查', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.authChecked).toBe(false)
    expect(store.user).toBeNull()
  })

  it('setTokens 写入 store 与 localStorage', () => {
    const store = useAuthStore()
    store.setTokens('access-123', 'refresh-456')
    expect(store.accessToken).toBe('access-123')
    expect(store.refreshToken).toBe('refresh-456')
    expect(store.isAuthenticated).toBe(true)
    expect(store.authChecked).toBe(true)
    expect(localStorage.getItem('accessToken')).toBe('access-123')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456')
  })

  it('setUser 持久化用户信息', () => {
    const store = useAuthStore()
    const user = { id: 1, name: 'Tom' }
    store.setUser(user)
    expect(store.user).toEqual(user)
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(user)
  })

  it('logout 清空 store 与 localStorage', async () => {
    const store = useAuthStore()
    store.setTokens('a', 'r')
    store.setUser({ id: 1 })

    store.logout()
    // logout 内部调 fetch /auth/logout (post 销毁 cookie)，等 promise 完成
    await flushPromises()
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('useAuthStore — initializeAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockPost.mockReset()
  })

  it('有 token 时立即视为已认证', async () => {
    localStorage.setItem('accessToken', 'stored-token')
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: makePopulatedAccount() } } })
    const store = useAuthStore()

    await store.initializeAuth()
    expect(store.accessToken).toBe('stored-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.authChecked).toBe(true)
  })

  it('无 token 时标记为未认证', async () => {
    const store = useAuthStore()
    await store.initializeAuth()
    expect(store.isAuthenticated).toBe(false)
    expect(store.authChecked).toBe(true)
  })

  it('localStorage 中 user 解析失败时不会崩', async () => {
    localStorage.setItem('accessToken', 'tk')
    localStorage.setItem('user', '{not-json')
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: makePopulatedAccount() } } })
    const store = useAuthStore()
    await expect(store.initializeAuth()).resolves.toBeUndefined()
    expect(store.authChecked).toBe(true)
  })
})

describe('useAuthStore — checkAuthStatus 覆盖 user 的契约', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockPost.mockReset()
  })

  /**
   * 关键：必须显式传 options.populate: [{ path: 'currentUser' }]
   * 后端 selfVD 接受这个 schema，但默认不传就不 populate
   */
  it('checkAuthStatus 必须带 options.populate: [{ path: "currentUser" }]', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: makePopulatedAccount() } } })

    await store.checkAuthStatus()
    expect(mockPost).toHaveBeenCalledWith(
      '/account/self',
      { options: { populate: [{ path: 'currentUser' }] } }
    )
  })

  it('响应是完整 populate Account 时,会覆盖 localStorage 里的 user', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    // 旧 user 是 populate 好的
    const oldUser = makePopulatedAccount({ code: 'old', isAdmin: false })
    store.setUser(oldUser)

    // 响应是新的 populate user (isAdmin 从 false 升 true)
    const newUser = makePopulatedAccount({ code: 'old', isAdmin: true, currentUser: { _id: 'u-1', Org: 'org-1', roleTemp: 'manager' } })
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: newUser } } })

    await store.checkAuthStatus()
    expect(store.user.isAdmin).toBe(true)
    expect(store.user.currentUser.roleTemp).toBe('manager')
  })

  /**
   * 关键 bug 复现：如果后端响应里 currentUser 是字符串（未 populate），
   * 旧代码会 setUser 覆盖，导致 isManager 变 false。
   * 修复后：item 必须有 isAdmin (boolean) + accountType (合法值) 才覆盖。
   * 但 currentUser 是 string 的 item 仍然有 isAdmin=true，所以**会**覆盖。
   *
   * 这意味着我们需要更深一层的防御：仅在 item.currentUser 是对象时才覆盖。
   * 让我重新审视代码...
   */
  it('响应 currentUser 是裸 ID 字符串时，不应覆盖（防御性）', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    const oldUser = makePopulatedAccount({ code: 'old', isAdmin: true })
    store.setUser(oldUser)

    // 模拟后端没 populate —— currentUser 是字符串
    const brokenItem = {
      _id: 'acc-1',
      code: 'old',
      accountType: 'User',
      isAdmin: true,
      currentUser: 'u-1' // 裸 ID 字符串
    }
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: brokenItem } } })

    await store.checkAuthStatus()
    // 防御性：currentUser 不是对象时不能覆盖
    expect(store.user.currentUser).toEqual({ _id: 'u-1', Org: 'org-1', roleTemp: 'manager', nickname: '超管' })
  })

  it('响应缺 isAdmin 字段时,不覆盖 localStorage', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    const oldUser = makePopulatedAccount()
    store.setUser(oldUser)

    // 模拟后端响应残缺 —— 没有 isAdmin
    const brokenItem = { _id: 'acc-1', code: 'admin', accountType: 'User', currentUser: { _id: 'u-1', roleTemp: 'manager' } }
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: brokenItem } } })

    await store.checkAuthStatus()
    // 不应被覆盖
    expect(store.user).toEqual(oldUser)
  })

  it('响应 accountType 是非法值时,不覆盖', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    const oldUser = makePopulatedAccount()
    store.setUser(oldUser)

    const brokenItem = { _id: 'acc-1', code: 'admin', isAdmin: true, accountType: 'Admin' } // 非法
    mockPost.mockResolvedValueOnce({ data: { code: 200, success: true, data: { item: brokenItem } } })

    await store.checkAuthStatus()
    expect(store.user).toEqual(oldUser)
  })

  it('401 由 axios 拦截器处理（不修改 isAuthenticated）', async () => {
    const store = useAuthStore()
    store.setTokens('bad-tk', null)
    store.isAuthenticated = true
    // 模拟 axios 拦截器拒绝 401（实际拦截器会做 logout+跳登录；测试只关心 store 行为）
    mockPost.mockRejectedValueOnce({ response: { status: 401 } })

    const result = await store.checkAuthStatus()
    expect(result).toBe(false)
    // 401 路径只返回 false，不在 store.checkAuthStatus 里 logout（拦截器负责）
  })

  it('网络错误（无 response）不修改 isAuthenticated', async () => {
    const store = useAuthStore()
    store.setTokens('tk', null)
    store.isAuthenticated = true
    mockPost.mockRejectedValueOnce(new Error('Network Error'))

    const result = await store.checkAuthStatus()
    expect(result).toBe(false)
    expect(store.isAuthenticated).toBe(true) // 不被踢
  })
})
