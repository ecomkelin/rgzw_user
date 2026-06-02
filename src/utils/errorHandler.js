/**
 * 全局错误处理工具
 *
 * 职责：
 *  1. 集中配置 Vue 应用级 errorHandler（捕获组件 render/watch 之外的异常）
 *  2. 监听未处理的 Promise 拒绝
 *  3. 监听 window 上的同步运行时错误
 *  4. 提供一个上报入口（默认 console.error，可替换为埋点接口）
 */

let initialized = false
let lastTriggerHandler = null

/**
 * 错误上报通道 —— 在此接入真实的上报服务
 * 现阶段只在 dev 打印，生产可扩展为 sendBeacon / fetch 上报
 */
const reportError = (payload) => {
  // eslint-disable-next-line no-console
  console.error('[GlobalErrorHandler]', payload)
  // TODO: 接入埋点服务
  // if (window.__monitor__) window.__monitor__.reportError(payload)
}

/**
 * 给 Vue 应用挂载 errorHandler
 */
export const setupVueErrorHandler = (app) => {
  if (!app) return
  app.config.errorHandler = (err, instance, info) => {
    reportError({
      source: 'vue',
      message: err?.message,
      stack: err?.stack,
      info,
      componentName: instance?.$?.type?.name || instance?.type?.name
    })
  }

  // Vue 3.2+ 的 warnHandler 也接管，统一收敛日志格式
  app.config.warnHandler = (msg, instance, trace) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Vue warn]', msg, '\nTrace:', trace)
    }
  }
}

/**
 * 监听未捕获的 Promise 拒绝与同步错误
 * 只注册一次，避免 HMR 重复挂载
 */
export const setupGlobalListeners = () => {
  if (initialized) return
  if (typeof window === 'undefined') return
  initialized = true

  // unhandledrejection
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      source: 'unhandledrejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    })
  })

  // window.onerror
  window.addEventListener('error', (event) => {
    // 资源加载错误也会冒泡到这里，过滤掉非脚本异常
    if (event.error) {
      reportError({
        source: 'window.onerror',
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }
  })
}

/**
 * 手动上报入口：业务侧捕获到的错误可显式调用
 */
export const reportManualError = (err, extra = {}) => {
  reportError({
    source: 'manual',
    message: err?.message || String(err),
    stack: err?.stack,
    ...extra
  })
}

/**
 * 一次性初始化
 */
export const initErrorHandler = (app) => {
  setupVueErrorHandler(app)
  setupGlobalListeners()
  // 保存引用，避免被 GC
  lastTriggerHandler = initErrorHandler
}

export default initErrorHandler
