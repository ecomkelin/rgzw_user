<template>
  <div id="app">
    <router-view v-if="isReady" />
    <div v-else style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div>正在验证登录状态...</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const isReady = ref(false)

onMounted(async () => {
  // 等待认证状态初始化完成
  await authStore.initializeAuth()
  await nextTick() // 确保DOM更新
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