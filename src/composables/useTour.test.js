/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  useTour,
  registerTour,
  startTour,
  hasSeenTour,
  resetTour,
  resetAllTours,
  endTour
} from './useTour'

const KEY = 'unit-test-tour'

const sampleSteps = [
  { target: '#a', title: 'A', description: 'desc-a' },
  { target: '#b', title: 'B', description: 'desc-b' },
  { target: '#c', title: 'C', description: 'desc-c' }
]

describe('useTour', () => {
  beforeEach(() => {
    // 必须先 endTour 清掉上一个 test 留下的 activeKey（endTour 内部会 persistSeen）
    endTour()
    localStorage.clear()
    resetAllTours()
  })

  it('未注册时 startTour 返回 false 并 warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = startTour('not-registered')
    expect(result).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('注册后 startTour 返回 true，isActive 为 true', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    expect(tour.isActive.value).toBe(false)
    const ok = tour.start()
    expect(ok).toBe(true)
    expect(tour.isActive.value).toBe(true)
    expect(tour.steps.length).toBe(3)
  })

  it('已读后再 startTour 默认不再启动', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    expect(tour.start()).toBe(true)
    endTour()
    expect(hasSeenTour(KEY)).toBe(true)
    expect(tour.start()).toBe(false)
  })

  it('resetSeen 后可以再 start', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    tour.start()
    endTour()
    expect(hasSeenTour(KEY)).toBe(true)
    tour.resetSeen()
    expect(hasSeenTour(KEY)).toBe(false)
    expect(tour.start()).toBe(true)
  })

  it('force 选项无视已读状态', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    tour.start()
    endTour()
    expect(tour.start()).toBe(false)
    expect(tour.start({ force: true })).toBe(true)
  })

  it('next 推进步骤，最后一步 next 后结束并标记已读', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    tour.start()
    expect(tour.currentStep.value).toBe(0)
    tour.next()
    expect(tour.currentStep.value).toBe(1)
    tour.next()
    expect(tour.currentStep.value).toBe(2)
    tour.next() // 最后一步调用 next 应当结束
    expect(tour.isActive.value).toBe(false)
    expect(hasSeenTour(KEY)).toBe(true)
  })

  it('prev 回退到上一步', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    tour.start()
    tour.next()
    tour.next()
    expect(tour.currentStep.value).toBe(2)
    tour.prev()
    expect(tour.currentStep.value).toBe(1)
  })

  it('endTour 显式结束并标记已读', () => {
    registerTour(KEY, sampleSteps)
    const tour = useTour(KEY)
    tour.start()
    expect(tour.isActive.value).toBe(true)
    endTour()
    expect(tour.isActive.value).toBe(false)
    expect(hasSeenTour(KEY)).toBe(true)
  })

  it('hasSeenTour 与 localStorage 双向同步', () => {
    resetTour(KEY)
    expect(hasSeenTour(KEY)).toBe(false)
    registerTour(KEY, sampleSteps)
    useTour(KEY).start()
    endTour()
    expect(hasSeenTour(KEY)).toBe(true)
    expect(localStorage.getItem('rgzw:tour:' + KEY)).toBe('1')
  })
})
