<template>
  <div id="app">
    <!-- 顶层错误边界：包裹整个路由出口，捕获任何子组件渲染崩溃 -->
    <ErrorBoundary @error="handleError" @reset="handleReset">
      <router-view v-if="isReady" :key="routeKey" />
      <div v-else style="display: flex; justify-content: center; align-items: center; height: 100vh;">
        <div>正在验证登录状态...</div>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { useAuthStore } from './stores/auth'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { reportManualError } from './utils/errorHandler'

const authStore = useAuthStore()
const isReady = ref(false)

// 让 :key 变化时整个 router-view 重新挂载
// 路由切换时递增；ErrorBoundary reset 时也递增一次
const routeKey = ref(0)
const bumpKey = () => {
  routeKey.value++
}

const handleError = (err, info) => {
  // 业务侧显式上报，便于埋点聚合
  reportManualError(err, { info, source: 'app-error-boundary' })
}

const handleReset = () => {
  // 触发子路由重新挂载，避免错误状态被"卡住"
  bumpKey()
}

onMounted(async () => {
  // 等待认证状态初始化完成
  await authStore.initializeAuth()
  await nextTick() // 确保DOM更新
  bumpKey()
  isReady.value = true
})
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
}

/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}
</style>