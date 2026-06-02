/**
 * 用户引导（Onboarding Tour）状态管理
 *
 * 设计要点：
 *  1. **多个引导可以共存** —— 用 `key` 区分，例如 'dashboard'、'students'
 *  2. **首次访问自动触发** —— 持久化"已读"标记到 localStorage
 *  3. **手动重看** —— 任何页面都能调用 `resetTour(key)` 后再 start
 *  4. **跳过也要记住** —— "跳过" 与 "完成" 都视为已读
 *  5. **解耦** —— composable 只管状态，具体步骤由业务页面传入
 *
 * 用法：
 *   const { isActive, currentStep, steps, startTour, endTour } = useTour('dashboard')
 *   if (!hasSeenTour('dashboard')) startTour(mySteps)
 */

import { ref, computed } from 'vue'

const STORAGE_PREFIX = 'rgzw:tour:'

/** 全局已注册步骤的映射（key -> steps[]） */
const registry = new Map()

/** 当前活动的引导 key（导出供 OnboardingGuide 等宿主组件读取） */
export const activeKey = ref(null)

/** 当前步骤索引（从 0 开始） */
export const currentStep = ref(0)

/** localStorage 中已读的 key 集合（启动时一次性加载） */
const seenSet = new Set()
;(function loadSeen() {
  if (typeof localStorage === 'undefined') return
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(STORAGE_PREFIX)) {
      seenSet.add(k.slice(STORAGE_PREFIX.length))
    }
  }
})()

/**
 * 判断某个引导是否已被用户看过
 * @param {string} key
 * @returns {boolean}
 */
export const hasSeenTour = (key) => seenSet.has(key)

/**
 * 把某个引导标记为已读
 * @param {string} key
 */
const persistSeen = (key) => {
  seenSet.add(key)
  try {
    localStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    // localStorage 不可用时降级为内存态
  }
}

/**
 * 重置某个引导的"已读"标记
 * @param {string} key
 */
export const resetTour = (key) => {
  seenSet.delete(key)
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* noop */
  }
}

/**
 * 重置全部引导的"已读"标记
 */
export const resetAllTours = () => {
  for (const key of [...seenSet]) resetTour(key)
}

/**
 * 注册一个引导步骤列表
 * @param {string} key
 * @param {Array<{target:string,title:string,description:string}>} steps
 */
export const registerTour = (key, steps) => {
  registry.set(key, steps)
}

/**
 * 启动一个引导
 * @param {string} key
 * @param {object} [opts]
 * @param {boolean} [opts.force=false] true 时忽略已读标记强制启动
 * @returns {boolean} 是否真的启动了
 */
export const startTour = (key, opts = {}) => {
  const steps = registry.get(key)
  if (!steps || steps.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`[useTour] No tour registered for key="${key}"`)
    return false
  }
  if (!opts.force && hasSeenTour(key)) return false
  activeKey.value = key
  currentStep.value = 0
  return true
}

/**
 * 跳到指定步骤
 * @param {number} index
 */
export const goToStep = (index) => {
  if (!activeKey.value) return
  const steps = registry.get(activeKey.value) || []
  if (index < 0 || index >= steps.length) return
  currentStep.value = index
}

/**
 * 引导结束（完成 / 跳过 / 关闭）—— 一律标记为已读
 */
export const endTour = () => {
  if (activeKey.value) persistSeen(activeKey.value)
  activeKey.value = null
  currentStep.value = 0
}

/**
 * 进入下一步；到最后一步后自动结束
 */
export const nextStep = () => {
  if (!activeKey.value) return
  const steps = registry.get(activeKey.value) || []
  if (currentStep.value >= steps.length - 1) {
    endTour()
  } else {
    currentStep.value++
  }
}

/**
 * 退一步
 */
export const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

/**
 * 给业务页面用的 composable 入口
 *
 * 设计说明：
 *   - 模块级状态（activeKey / currentStep）是单例 ref，所有调用方共享
 *   - isActive 是 computed（返回 boolean），业务侧可直接拿 .value 当条件渲染
 *   - currentStep 是 computed（返回 number），便于响应式模板
 *   - steps 是普通数组（注册后不变）
 *
 * @param {string} key
 */
export const useTour = (key) => {
  return {
    // 当前引导是否处于活动状态（boolean）
    isActive: computed(() => activeKey.value === key),
    // 当前步骤索引（number）
    currentStep: computed(() => currentStep.value),
    // 步骤列表（注册后不变，普通数组）
    steps: registry.get(key) || [],
    // 持久化
    hasSeen: () => hasSeenTour(key),
    hasSeenTour: () => hasSeenTour(key),
    resetSeen: () => resetTour(key),
    // 动作
    register: (steps) => registerTour(key, steps),
    start: (opts) => startTour(key, opts),
    end: endTour,
    next: nextStep,
    prev: prevStep
  }
}

export default useTour
