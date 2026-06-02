/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeError,
  classifyError,
  getUserMessage,
  ErrorKind
} from './normalizeError'

describe('normalizeError', () => {
  it('归一化 axios 风格的 401 错误', () => {
    const axiosErr = {
      isAxiosError: true,
      response: { status: 401, statusText: 'Unauthorized', data: { message: '请登录' } }
    }
    const e = normalizeError(axiosErr)
    expect(e).toBeInstanceOf(Error)
    expect(e.kind).toBe(ErrorKind.UNAUTHORIZED)
    expect(e.status).toBe(401)
    expect(e.message).toBe('请登录')
  })

  it('归一化 axios 风格的 500 错误', () => {
    const axiosErr = {
      isAxiosError: true,
      response: { status: 500, data: {} }
    }
    const e = normalizeError(axiosErr)
    expect(e.kind).toBe(ErrorKind.SERVER)
  })

  it('归一化 axios 网络异常（无 response 有 request）', () => {
    const axiosErr = {
      isAxiosError: true,
      request: {},
      message: 'Network Error'
    }
    const e = normalizeError(axiosErr)
    expect(e.kind).toBe(ErrorKind.NETWORK)
  })

  it('归一化普通 Error', () => {
    const e = normalizeError(new Error('boom'))
    expect(e.message).toBe('boom')
    expect(e.kind).toBe(ErrorKind.UNKNOWN)
  })

  it('归一化字符串', () => {
    const e = normalizeError('just a string')
    expect(e.message).toBe('just a string')
    expect(e.kind).toBe(ErrorKind.UNKNOWN)
  })

  it('重复归一化是幂等的', () => {
    const e1 = normalizeError(new Error('x'))
    const e2 = normalizeError(e1)
    expect(e2).toBe(e1)
  })
})

describe('classifyError', () => {
  it.each([
    [401, ErrorKind.UNAUTHORIZED],
    [403, ErrorKind.FORBIDDEN],
    [404, ErrorKind.NOT_FOUND],
    [400, ErrorKind.VALIDATION],
    [422, ErrorKind.VALIDATION],
    [500, ErrorKind.SERVER],
    [503, ErrorKind.SERVER]
  ])('status=%i -> %s', (status, kind) => {
    expect(classifyError({ isAxiosError: true, response: { status, data: {} } })).toBe(kind)
  })

  it('无法分类时为 UNKNOWN', () => {
    expect(classifyError(new Error('x'))).toBe(ErrorKind.UNKNOWN)
    expect(classifyError(null)).toBe(ErrorKind.UNKNOWN)
  })
})

describe('getUserMessage', () => {
  it('不同 kind 返回对应中文文案', () => {
    expect(getUserMessage({ isAxiosError: true, response: { status: 401, data: {} } }))
      .toBe('登录已过期，请重新登录')
    expect(getUserMessage({ isAxiosError: true, response: { status: 500, data: {} } }))
      .toBe('服务器开了个小差，请稍后再试')
    expect(getUserMessage({ isAxiosError: true, request: {} }))
      .toBe('网络异常，请检查网络连接后重试')
  })

  it('fallback 兜底', () => {
    expect(getUserMessage(new Error('xxx'), { fallback: '自定义文案' }))
      .toBe('自定义文案')
  })
})
