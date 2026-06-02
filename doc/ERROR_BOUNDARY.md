# 全局错误边界（Error Boundary）

> 本文档对应 `TODOS.md` 中「错误边界：添加全局错误边界处理组件崩溃」的实施方案。

## 背景

在没有错误边界的情况下，任意一个子组件的渲染异常都会沿着组件树冒泡，最终导致整个 Vue 应用白屏，用户体验极差且没有恢复路径。本项目在 v1.x 中只做了 HTTP 层的错误提示，对**组件渲染**、**异步 reject**、**全局同步异常**缺乏统一兜底。

本方案在 Vue 3 应用中建立三层错误防线：

1. **组件树渲染层** —— 通过 `ErrorBoundary` 组件 + `onErrorCaptured` 捕获子组件渲染异常并显示降级 UI
2. **Vue 应用层** —— 通过 `app.config.errorHandler` 捕获未被边界拦截的异常（如 setup 抛错、watch 回调）
3. **浏览器全局层** —— 通过 `window.onerror` 与 `unhandledrejection` 捕获同步运行时错误与未处理 Promise

## 文件清单

| 路径 | 角色 | 说明 |
| --- | --- | --- |
| `src/components/ErrorBoundary.vue` | 通用边界组件 | 组合式 API 实现，支持 fallback 插槽与 reset |
| `src/views/ErrorFallback.vue` | 默认降级页面 | 懒加载，挂在 `el-result` 上，提供「重试 / 返回首页 / 错误详情」 |
| `src/utils/errorHandler.js` | 全局错误入口 | 挂载 Vue / window / promise 三类监听，输出统一上报通道 |
| `src/App.vue` | 接入点 | 在 `router-view` 外层包 `ErrorBoundary`，路由切换时通过 `:key` 强制重挂载 |
| `src/main.js` | 启动接入 | `createApp` 后调用 `initErrorHandler(app)` |

## 实现要点

### 1. `ErrorBoundary.vue`

核心机制是利用 Vue 3 的 `onErrorCaptured` 钩子（类似 React `getDerivedStateFromError`）：

```js
import { onErrorCaptured, ref, shallowRef } from 'vue'

const hasError = ref(false)
const error = shallowRef(null)

onErrorCaptured((err, instance, info) => {
  hasError.value = true
  error.value = err
  emit('error', err, info)
  return false   // 关键：返回 false 阻止错误继续冒泡到父边界
})

const reset = () => {
  hasError.value = false
  error.value = null
  emit('reset')
}
```

- 使用 `shallowRef` 持有 `error` 避免 Vue 把 error 对象深响应化（错误对象可能含有循环引用）
- `defineAsyncComponent` 加载默认降级页面，避免边界组件自身失败时再次崩溃
- 支持 `silent` prop 静默错误（适合被嵌套使用）
- 通过 `defineExpose` 暴露 `reset` 与 `hasError`，允许父级以 ref 方式手动控制

模板部分支持两种降级方式：

```vue
<!-- 方式一：使用默认降级页面（推荐） -->
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

<!-- 方式二：自定义 fallback 插槽 -->
<ErrorBoundary>
  <template #fallback="{ error, reset }">
    <YourCustomFallback :error="error" @retry="reset" />
  </template>
  <YourComponent />
</ErrorBoundary>
```

### 2. `errorHandler.js`

集中维护三类监听，避免散落在各处：

```js
export const initErrorHandler = (app) => {
  setupVueErrorHandler(app)        // app.config.errorHandler / warnHandler
  setupGlobalListeners()           // window.error / unhandledrejection
}
```

- 单一 `reportError` 函数统一错误输出格式（`source / message / stack / info`），未来可一行替换为埋点上报
- `setupGlobalListeners` 通过 `initialized` 标志防止 HMR 重复挂载
- `reportManualError` 暴露给业务侧显式上报（与 ErrorBoundary 的 `@error` 事件串联）

### 3. `App.vue` 接入

```vue
<ErrorBoundary @error="handleError" @reset="handleReset">
  <router-view v-if="isReady" :key="routeKey" />
</ErrorBoundary>
```

- `routeKey` 在 `onMounted` 与 `handleReset` 中递增
- Vue 复用 DOM 时 `:key` 变化会强制卸载/重挂载子树，这正是「错误恢复」所必需的——仅重置响应式状态无法让已损坏的组件实例自我修复

### 4. `ErrorFallback.vue`

- 使用 `el-result`（Element Plus）作为视觉骨架
- 重新加载 → 调用 `reset()` 让边界重新挂载子树
- 返回首页 → 先 reset 再 `router.push`
- 「查看错误详情」仅在 `import.meta.env.DEV` 为真时显示，避免生产环境泄漏堆栈

## 使用建议

### 嵌套边界

默认顶层边界足以应对绝大多数崩溃。若某模块（如富文本编辑器、图表组件）发生错误的概率较高，可在它外面再包一层局部边界，让其它区域不受影响：

```vue
<template>
  <div class="dashboard">
    <ErrorBoundary>
      <ChartPanel />
    </ErrorBoundary>

    <ErrorBoundary>
      <DataTable />
    </ErrorBoundary>
  </div>
</template>
```

注意：边界仅能捕获**子组件渲染过程**的错误，无法捕获：
- 异步任务（`setTimeout` / `Promise` / `requestAnimationFrame`）内部的错误 —— 这些走 `errorHandler.js` 中的 `unhandledrejection` / `window.onerror`
- 事件处理函数中的错误 —— 同样走 `errorHandler.js`
- 服务端 SSR 阶段错误（当前项目是纯 SPA，无影响）

### 业务侧显式上报

```js
import { reportManualError } from '@/utils/errorHandler'

try {
  await riskyOperation()
} catch (e) {
  reportManualError(e, { module: 'students-import', file: row.fileName })
}
```

### 自定义降级

```vue
<ErrorBoundary>
  <template #fallback="{ error, reset }">
    <div class="my-fallback">
      <h3>数据加载失败</h3>
      <p>{{ error.message }}</p>
      <button @click="reset">重试</button>
    </div>
  </template>
  <HeavyChart />
</ErrorBoundary>
```

## 验证

执行 `npm run build`，`dist/assets/` 会出现 `ErrorFallback-*.js` 懒加载 chunk（约 1.4 kB），主入口体积几乎无增长（边界组件被静态引入，但 `errorCaptured` 钩子开销可忽略）。

构建输出（节选）：

```
✓ 1679 modules transformed.
dist/assets/ErrorFallback-BpmENjXB.js   1.38 kB │ gzip: 0.87 kB
✓ built in 3.05s
```

## 后续可扩展点

> 以下条目已并入 `../TODOS.md` 的「建议改进 → 来自文档后续可扩展项」跟踪。

- [ ] 在 `reportError` 中接入真实埋点服务（Sentry / 自研后端）
- [ ] 在降级页面中增加「复制错误 ID」按钮，方便用户反馈问题
- [ ] 在边界组件中暴露 `errorStack` 字段到 Sentry 上报 payload
- [ ] 为常见错误类型（401、403、网络断开）提供更精细的降级 UI
