<template>
  <!-- 发生错误时显示降级 UI；否则透传默认插槽 -->
  <div v-if="hasError" class="error-boundary">
    <slot name="fallback" :error="error" :reset="reset">
      <component :is="fallbackComponent" :error="error" :reset="reset" />
    </slot>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, shallowRef, onErrorCaptured, defineAsyncComponent } from 'vue'

// 异步加载默认的降级页面，失败时也不至于让错误边界自身崩溃
const ErrorFallback = defineAsyncComponent(() => import('../views/ErrorFallback.vue'))

const props = defineProps({
  // 可选：自定义降级组件
  fallback: {
    type: [Object, Function],
    default: null
  },
  // 是否在控制台打印错误
  silent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['error', 'reset'])

const hasError = ref(false)
const error = shallowRef(null)

// 选中的降级组件：优先使用 prop 传入，否则使用默认
const fallbackComponent = shallowRef(props.fallback || ErrorFallback)

/**
 * 捕获子组件渲染 / 生命周期钩子中的错误
 * 返回 false 阻止错误继续向上冒泡
 */
onErrorCaptured((err, instance, info) => {
  hasError.value = true
  error.value = err

  if (!props.silent) {
    // 打印足够上下文便于排查
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', err, '\nComponent:', instance, '\nInfo:', info)
  }

  emit('error', err, info)
  return false
})

/**
 * 重置错误状态，尝试重新渲染子树
 * 使用 key 改变触发 router-view 重新挂载
 */
const reset = () => {
  hasError.value = false
  error.value = null
  emit('reset')
}

defineExpose({ reset, hasError })
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}
</style>
