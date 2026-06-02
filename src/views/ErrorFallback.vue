<template>
  <div class="error-fallback">
    <el-result icon="error" title="页面出错了" :sub-title="message">
      <template #extra>
        <el-button type="primary" @click="handleReload">重新加载</el-button>
        <el-button @click="handleBack">返回首页</el-button>
        <el-button v-if="showDetail" text type="info" @click="detailVisible = true">
          查看错误详情
        </el-button>
      </template>
    </el-result>

    <!-- 错误详情（仅开发环境展开） -->
    <el-dialog v-model="detailVisible" title="错误详情" width="520px">
      <pre class="error-detail">{{ stack }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  error: {
    type: [Error, Object, null],
    default: null
  },
  reset: {
    type: Function,
    default: () => {}
  }
})

const router = useRouter()
const detailVisible = ref(false)

// 仅在非生产环境允许查看详情
const showDetail = import.meta.env.DEV

const message = computed(() => {
  if (!props.error) return '组件渲染时发生未知错误'
  return props.error.message || '组件渲染时发生未知错误'
})

const stack = computed(() => {
  if (!props.error) return ''
  return props.error.stack || JSON.stringify(props.error, null, 2)
})

const handleReload = () => {
  // 优先调用父组件的 reset，让 ErrorBoundary 重新挂载子树
  if (typeof props.reset === 'function') {
    props.reset()
  } else {
    window.location.reload()
  }
}

const handleBack = () => {
  if (typeof props.reset === 'function') {
    props.reset()
  }
  router.push('/layout/dashboard').catch(() => {
    // 即便 reset 后路由跳转失败，也兜底走 location
    window.location.href = '/layout/dashboard'
  })
}
</script>

<style scoped>
.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
}

.error-detail {
  max-height: 360px;
  overflow: auto;
  background: #f7f7f7;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #c45656;
}
</style>
