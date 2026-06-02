/**
 * 统一错误归一化与分类工具
 *
 * 设计目的：
 *   项目中存在多种错误来源 —— axios HTTP 响应、Promise reject、组件渲染异常、
 *   手动 throw 等等。它们的形态不一致（有的有 response、有的有 code、有的只是字符串），
 *   不统一就只能在散落各处的 catch 分支里重复判断。
 *
 *   本模块做三件事：
 *     1. normalizeError(err)  —— 把任意形态的 err 收敛成统一结构
 *     2. classifyError(err)   —— 给出类型标签（NETWORK / UNAUTHORIZED / FORBIDDEN / NOT_FOUND / BUSINESS / UNKNOWN）
 *     3. getUserMessage(err)  —— 给出"应该展示给用户"的中文文案
 *
 * 同时通过 `onNormalizedError` 订阅通道上报到 `errorHandler.js` 的同一入口。
 */

import { reportManualError } from './errorHandler'

/**
 * 错误分类标签
 */
export const ErrorKind = Object.freeze({
  NETWORK: 'NETWORK',          // 网络断开 / 超时 / DNS
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  FORBIDDEN: 'FORBIDDEN',       // 403
  NOT_FOUND: 'NOT_FOUND',       // 404
  SERVER: 'SERVER',             // 5xx
  VALIDATION: 'VALIDATION',     // 422 / 400 业务校验
  BUSINESS: 'BUSINESS',         // 后端 success=false 的业务错误
  UNKNOWN: 'UNKNOWN'
})

/**
 * 归一化后的错误结构
 * @typedef {Object} NormalizedError
 * @property {Error}  original  原始 Error 对象（始终是 Error 实例，便于堆栈）
 * @property {string} kind      错误分类（ErrorKind 之一）
 * @property {number} status    HTTP 状态码（若有）
 * @property {string} code      后端业务码（若有）
 * @property {string} message   原始消息
 * @property {*}      data      后端 data 字段（若有）
 */

/**
 * 把任意输入归一化为带分类的 Error
 * @param {*} input
 * @returns {Error & { kind:string, status:number, code:string, data:* }}
 */
export const normalizeError = (input) => {
  // 已经是标准化过的（重复传入）
  if (input && typeof input === 'object' && 'kind' in input && input instanceof Error) {
    return input
  }

  // axios 风格错误：{ response, request, message, config }
  if (input && typeof input === 'object' && (input.isAxiosError || input.response || input.request)) {
    const status = input.response?.status
    const data = input.response?.data
    const code = data?.code ?? data?.errorCode ?? ''
    const message =
      data?.message ||
      input.response?.statusText ||
      input.message ||
      '请求失败'

    const err = new Error(message)
    err.kind = classifyByStatus(status) || (input.request ? ErrorKind.NETWORK : ErrorKind.UNKNOWN)
    err.status = status || 0
    err.code = code
    err.data = data
    return err
  }

  // 普通 Error
  if (input instanceof Error) {
    input.kind = input.kind || ErrorKind.UNKNOWN
    return input
  }

  // 字符串 / 其它
  const err = new Error(typeof input === 'string' ? input : '未知错误')
  err.kind = ErrorKind.UNKNOWN
  return err
}

const classifyByStatus = (status) => {
  if (!status) return ''
  if (status === 401) return ErrorKind.UNAUTHORIZED
  if (status === 403) return ErrorKind.FORBIDDEN
  if (status === 404) return ErrorKind.NOT_FOUND
  if (status === 422 || status === 400) return ErrorKind.VALIDATION
  if (status >= 500) return ErrorKind.SERVER
  return ErrorKind.UNKNOWN
}

/**
 * 给定一个错误（任意形态），返回 ErrorKind 标签
 * 这是 `normalizeError` 之后做 kind 提取的便捷封装
 * @param {*} err
 * @returns {string} ErrorKind 之一
 */
export const classifyError = (err) => normalizeError(err).kind

/**
 * 用户侧展示文案
 * @param {*} err
 * @param {object} [opts]
 * @param {string} [opts.fallback] 自定义兜底文案
 * @returns {string}
 */
export const getUserMessage = (err, opts = {}) => {
  const e = normalizeError(err)
  switch (e.kind) {
    case ErrorKind.NETWORK:
      return '网络异常，请检查网络连接后重试'
    case ErrorKind.UNAUTHORIZED:
      return '登录已过期，请重新登录'
    case ErrorKind.FORBIDDEN:
      return '没有访问权限'
    case ErrorKind.NOT_FOUND:
      return '请求的资源不存在'
    case ErrorKind.SERVER:
      return '服务器开了个小差，请稍后再试'
    case ErrorKind.VALIDATION:
      return e.message || '请求参数有误'
    case ErrorKind.BUSINESS:
      return e.message || '操作失败'
    default:
      return opts.fallback || e.message || '操作失败'
  }
}

/**
 * 订阅通道：所有"已经被分类过的"错误都过这里，便于埋点聚合
 * 在 http.js 拦截器与组件 catch 中调用
 *
 * @param {*} err
 * @param {object} [extra]
 */
export const reportNormalized = (err, extra = {}) => {
  const e = normalizeError(err)
  reportManualError(e, { kind: e.kind, status: e.status, code: e.code, ...extra })
  return e
}

export default normalizeError
