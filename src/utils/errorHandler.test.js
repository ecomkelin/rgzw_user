/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reportManualError, initErrorHandler } from './errorHandler'

describe('errorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reportManualError 触发控制台错误', () => {
    reportManualError(new Error('boom'), { tag: 'unit' })
    expect(console.error).toHaveBeenCalled()
    const call = console.error.mock.calls[0]
    expect(JSON.stringify(call)).toContain('boom')
    expect(JSON.stringify(call)).toContain('unit')
  })

  it('initErrorHandler 注册 window 监听器', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    initErrorHandler({ config: {} })
    const events = addSpy.mock.calls.map((c) => c[0])
    expect(events).toContain('unhandledrejection')
    expect(events).toContain('error')
  })

  it('重复 initErrorHandler 不会重复注册（幂等）', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    addSpy.mockClear()
    initErrorHandler({ config: {} })
    initErrorHandler({ config: {} })
    // 因为第一次调用时 initialized=true，第二次直接 return
    // 所以 addEventListener 不应被再次调用
    const errorCalls = addSpy.mock.calls.filter((c) => c[0] === 'error')
    expect(errorCalls.length).toBe(0)
  })
})
