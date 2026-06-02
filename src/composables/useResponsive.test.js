/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useResponsive, getBreakpoint, __setBreakpoint } from './useResponsive'

const Probe = defineComponent({
  setup() {
    const { isMobile, isTablet, isDesktop, bp } = useResponsive()
    return () => h('div', { class: 'probe' }, [
      h('span', { class: 'bp' }, bp.value),
      h('span', { class: 'mobile' }, String(isMobile.value)),
      h('span', { class: 'tablet' }, String(isTablet.value)),
      h('span', { class: 'desktop' }, String(isDesktop.value))
    ])
  }
})

describe('useResponsive', () => {
  beforeEach(() => {
    __setBreakpoint(1280) // 桌面
  })

  it('桌面端 (1280) 三个布尔值', () => {
    const wrapper = mount(Probe)
    expect(wrapper.find('.desktop').text()).toBe('true')
    expect(wrapper.find('.mobile').text()).toBe('false')
    expect(wrapper.find('.tablet').text()).toBe('false')
  })

  it('切换到 800 应当识别为 tablet', async () => {
    const wrapper = mount(Probe)
    __setBreakpoint(800)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tablet').text()).toBe('true')
    expect(wrapper.find('.desktop').text()).toBe('false')
  })

  it('切换到 600 应当识别为 mobile', async () => {
    const wrapper = mount(Probe)
    __setBreakpoint(600)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mobile').text()).toBe('true')
    expect(wrapper.find('.desktop').text()).toBe('false')
  })

  it('getBreakpoint 在三种宽度返回正确标签', () => {
    __setBreakpoint(400); expect(getBreakpoint()).toBe('mobile')
    __setBreakpoint(900); expect(getBreakpoint()).toBe('tablet')
    __setBreakpoint(1400); expect(getBreakpoint()).toBe('desktop')
  })

  it('边界值：768 为 mobile，769 为 tablet', () => {
    __setBreakpoint(768); expect(getBreakpoint()).toBe('mobile')
    __setBreakpoint(769); expect(getBreakpoint()).toBe('tablet')
    __setBreakpoint(1024); expect(getBreakpoint()).toBe('tablet')
    __setBreakpoint(1025); expect(getBreakpoint()).toBe('desktop')
  })
})
