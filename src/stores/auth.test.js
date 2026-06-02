/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
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

  it('logout 清空 store 与 localStorage', () => {
    const store = useAuthStore()
    store.setTokens('a', 'r')
    store.setUser({ id: 1 })
    // mock fetch
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true }))

    store.logout()
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('initializeAuth: 有 token 时立即视为已认证', async () => {
    localStorage.setItem('accessToken', 'stored-token')
    const store = useAuthStore()
    // mock setTimeout 0 路径：把 checkAuthStatus 内部 fetch mock 掉
    globalThis.fetch = vi.fn(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ data: null }) }))

    await store.initializeAuth()
    expect(store.accessToken).toBe('stored-token')
    expect(store.isAuthenticated).toBe(true)
    expect(store.authChecked).toBe(true)
  })

  it('initializeAuth: 无 token 时标记为未认证', async () => {
    const store = useAuthStore()
    await store.initializeAuth()
    expect(store.isAuthenticated).toBe(false)
    expect(store.authChecked).toBe(true)
  })

  it('initializeAuth: localStorage 中 user 解析失败时不会崩', async () => {
    localStorage.setItem('accessToken', 'tk')
    localStorage.setItem('user', '{not-json')
    const store = useAuthStore()
    globalThis.fetch = vi.fn(() => Promise.resolve({ status: 200, json: () => Promise.resolve({}) }))
    await expect(store.initializeAuth()).resolves.toBeUndefined()
    // 即便解析失败也不抛
    expect(store.authChecked).toBe(true)
  })
})
