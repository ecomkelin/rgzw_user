// Vitest 全局 setup：jsdom 环境下的公共 mock
// 注意：本文件在 vite.config.js 的 test.setupFiles 中引入
import { vi } from 'vitest'

// 静默 ElMessage 之类的副作用
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve()),
    alert: vi.fn(() => Promise.resolve())
  }
}))

// jsdom 默认不实现 matchMedia：useResponsive / 媒体查询相关代码需要
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},            // 兼容旧 API
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
}

// Pinia 在测试中也用得到
import { config } from '@vue/test-utils'
config.global.plugins = []
