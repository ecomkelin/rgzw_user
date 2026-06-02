/**
 * 响应式断点 composable
 *
 * 提供三档断点：
 *   - isMobile :  <= 768px
 *   - isTablet :  769 ~ 1024px
 *   - isDesktop:  > 1024px
 *
 * 设计要点：
 *   1. 单一全局 window.matchMedia 实例，避免每个组件各订阅一份
 *   2. SSR 安全：检测 window 存在
 *   3. 提供 `bp` (当前断点字符串) 便于业务侧在表达式中分支
 */

import { ref, computed, onBeforeUnmount, onMounted } from 'vue'

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
}

/** 当前断点字符串：'mobile' / 'tablet' / 'desktop' */
const bp = ref(getCurrentBp())

function getCurrentBp() {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w <= BREAKPOINTS.mobile) return 'mobile'
  if (w <= BREAKPOINTS.tablet) return 'tablet'
  return 'desktop'
}

let mqlMobile = null
let mqlTablet = null
let listenerCount = 0

const handleChange = () => {
  bp.value = getCurrentBp()
}

const subscribe = () => {
  if (typeof window === 'undefined') return
  if (listenerCount === 0) {
    mqlMobile = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`)
    mqlTablet = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile + 1}px) and (max-width: ${BREAKPOINTS.tablet}px)`)
    mqlMobile.addEventListener('change', handleChange)
    mqlTablet.addEventListener('change', handleChange)
  }
  listenerCount++
}

const unsubscribe = () => {
  listenerCount--
  if (listenerCount === 0) {
    mqlMobile?.removeEventListener('change', handleChange)
    mqlTablet?.removeEventListener('change', handleChange)
    mqlMobile = null
    mqlTablet = null
  }
}

/**
 * 响应式 composable
 * - 在 setup() 中调用，组件挂载时开始订阅、卸载时取消订阅
 * - 返回的 isMobile / isTablet / isDesktop 都是 computed，响应式
 */
export const useResponsive = () => {
  onMounted(subscribe)
  onBeforeUnmount(unsubscribe)

  return {
    bp,
    isMobile: computed(() => bp.value === 'mobile'),
    isTablet: computed(() => bp.value === 'tablet'),
    isDesktop: computed(() => bp.value === 'desktop')
  }
}

/** 兼容用法：直接读取当前断点（无响应式） */
export const getBreakpoint = () => getCurrentBp()

/**
 * 测试辅助：手动触发断点重新计算
 * （jsdom 不支持 matchMedia 的 change 事件，单元测试需要直接调用）
 * @param {number} width
 */
export const __setBreakpoint = (width) => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  }
  handleChange()
}

export default useResponsive
