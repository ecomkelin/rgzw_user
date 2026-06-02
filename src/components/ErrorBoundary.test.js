/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import ErrorBoundary from './ErrorBoundary.vue'

// render 函数里直接抛错 —— onErrorCaptured 只捕获 render 抛错
const FlakyChild = defineComponent({
  props: {
    shouldThrow: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      if (props.shouldThrow) throw new Error('child crashed')
      return h('div', { class: 'flaky-ok' }, 'I am fine')
    }
  }
})

describe('ErrorBoundary', () => {
  it('子组件正常时透传渲染', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: { default: () => h(FlakyChild, { shouldThrow: false }) }
    })
    expect(wrapper.find('.flaky-ok').exists()).toBe(true)
  })

  it('子组件抛错时显示降级 UI（自定义 fallback 插槽）', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ErrorBoundary, {
      props: { silent: true },
      slots: {
        default: () => h(FlakyChild, { shouldThrow: true }),
        fallback: ({ error }) => h('div', { class: 'my-fallback' }, error.message)
      }
    })
    // 等 watch 同步抛错 + 边界处理
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flaky-ok').exists()).toBe(false)
    expect(wrapper.find('.my-fallback').exists()).toBe(true)
    expect(wrapper.find('.my-fallback').text()).toBe('child crashed')
  })

  it('emits error 事件', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    const wrapper = mount(ErrorBoundary, {
      props: { onError, silent: true },
      slots: { default: () => h(FlakyChild, { shouldThrow: true }) }
    })
    await wrapper.vm.$nextTick()
    expect(onError).toHaveBeenCalled()
    const [err, info] = onError.mock.calls[0]
    expect(err.message).toBe('child crashed')
    expect(typeof info).toBe('string')
  })

  it('reset 后 hasError 状态被清空', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const shouldThrow = ref(true)
    const wrapper = mount(ErrorBoundary, {
      props: { silent: true },
      slots: {
        default: () => h(FlakyChild, { shouldThrow: shouldThrow.value }),
        fallback: () => h('div', { class: 'my-fallback' }, 'fallback')
      }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.findComponent(ErrorBoundary).vm
    expect(vm.hasError).toBe(true)

    // 先让子组件不再抛错，再 reset 边界
    shouldThrow.value = false
    await wrapper.vm.$nextTick()
    vm.reset()
    await wrapper.vm.$nextTick()
    expect(vm.hasError).toBe(false)
    expect(vm.error).toBeNull()
  })

  it('emits reset 事件', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReset = vi.fn()
    const wrapper = mount(ErrorBoundary, {
      props: { onReset, silent: true },
      slots: {
        default: () => h(FlakyChild, { shouldThrow: true }),
        fallback: () => h('div', { class: 'my-fallback' }, 'fallback')
      }
    })
    await wrapper.vm.$nextTick()
    wrapper.findComponent(ErrorBoundary).vm.reset()
    expect(onReset).toHaveBeenCalled()
  })
})
