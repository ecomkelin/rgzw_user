# 用户引导系统（Onboarding Tour）

> 本文档对应 `TODOS.md` 中「添加更完善的用户引导」的实施方案。

## 背景

新用户首次进入管理后台往往不知道侧边栏的功能布局、快捷入口在哪里、数据如何筛选。一个轻量的引导系统可以：
- 让新用户在 30 秒内了解系统全貌
- 让老用户随时"重看引导"作为备忘
- 不引入第三方库（基于 Element Plus 内置的 `el-tour`）

## 文件清单

| 路径 | 角色 |
| --- | --- |
| `src/composables/useTour.js` | 全局引导状态 composable |
| `src/composables/useTour.test.js` | 9 个单元测试 |
| `src/components/OnboardingGuide.vue` | 通用引导宿主组件 |
| `src/views/Dashboard.vue` | 首个接入引导的页面 |
| `src/views/Layout.vue` | 用户下拉菜单加「重新查看引导」入口 |

## 实现要点

### 1. `useTour` composable

模块级单例状态，多个页面共享同一份引导生命周期。

```js
import { useTour, registerTour, startTour, hasSeenTour, resetTour } from '@/composables/useTour'

const tour = useTour('dashboard')

// 注册步骤
tour.register([
  { target: '#dashboard-title', title: '欢迎', description: '...' },
  { target: '#dashboard-stats', title: '核心指标', description: '...' }
])

// 启动（已读时默认不启动）
if (!tour.hasSeen()) tour.start()

// 强制启动
tour.start({ force: true })

// 重置"已读"标记
tour.resetSeen()

// 跳过/完成会自动标记为已读
tour.end()
```

状态机：
- `activeKey: Ref<string|null>` 当前活动的引导 key
- `currentStep: Ref<number>` 当前步骤索引
- `seenSet: Set<string>` 已读集合（同步 localStorage `rgzw:tour:<key>`）

### 2. `OnboardingGuide.vue` 宿主组件

业务页面只需在模板中放一个组件，传入 `tourKey` + `steps`：

```vue
<template>
  <div class="dashboard">
    <!-- 业务内容 -->
    <h2 id="dashboard-title">首页</h2>
    <div id="dashboard-stats">...</div>

    <!-- 引导 -->
    <OnboardingGuide tour-key="dashboard" :steps="tourSteps" />
  </div>
</template>
```

组件内部：
- `onBeforeMount` 注册步骤
- `onMounted` 若未看过且 `autoStart=true` 则自动启动
- 通过 `v-model` 监听 el-tour 的关闭事件，自动 `endTour` 标记已读

### 3. Dashboard 引导步骤

[Dashboard.vue:114-149](src/views/Dashboard.vue#L114-L149) 定义了 6 个步骤：

| # | target | 标题 | 描述 |
| --- | --- | --- | --- |
| 1 | `#dashboard-title` | 欢迎使用 RGZW 管理后台 | 30 秒带您熟悉主要功能 |
| 2 | `.layout-aside` | 侧边栏导航 | 快速切换各模块 |
| 3 | `#dashboard-stats` | 核心数据概览 | 用户数 / 学员数 / 组织数 / 课程数 |
| 4 | `#dashboard-chart` | 活动趋势 | 用户活动趋势图 |
| 5 | `#dashboard-quicklinks` | 快捷入口 | 一键进入各管理页 |
| 6 | `.layout-header` | 用户菜单 | 个人资料 / 设置 / 退出 |

### 4. 重新查看引导入口

[Layout.vue:140-144](src/views/Layout.vue#L140-L144) 在用户下拉菜单加了"重新查看引导"项：

```js
case 'restart-tour':
  resetTour('dashboard')              // 清掉已读标记
  const started = startTour('dashboard', { force: true })
  if (!started) ElMessage.info('请先进入首页查看引导')
  break
```

## 持久化

已读标记存在 `localStorage`，key 格式 `rgzw:tour:<tourKey>`：

```
rgzw:tour:dashboard  =  "1"
```

刷新页面 / 重新登录都会保留已读状态，**不会**重复弹引导。

如需重置全部引导，可在浏览器控制台执行：

```js
Object.keys(localStorage).filter(k => k.startsWith('rgzw:tour:')).forEach(k => localStorage.removeItem(k))
```

或者在代码中 `import { resetAllTours } from '@/composables/useTour'`。

## 扩展其他页面

在 `Students.vue` / `Users.vue` 等页面添加引导时：

1. 给关键元素加 `id`（如 `#students-table` / `#students-search-form`）
2. 在 `<script setup>` 中定义步骤数组
3. 模板中放 `<OnboardingGuide tour-key="students" :steps="studentsTourSteps" />`

每个引导**独立持久化**，互不干扰。

## 测试

`src/composables/useTour.test.js` 覆盖 9 个用例：

- 未注册时 startTour 返回 false + warn
- 注册后 startTour 返回 true
- 已读后再 startTour 默认不启动
- resetSeen 后可以再 start
- force 选项无视已读状态
- next 推进步骤（最后一步 next 自动结束）
- prev 回退
- endTour 显式结束并标记已读
- hasSeenTour 与 localStorage 双向同步

```
✓ src/composables/useTour.test.js (9 tests) Xms
```

## 注意事项

- `el-tour` 的 `target` 必须能匹配 DOM 选择器。若目标元素是异步渲染的，引导弹出时可能找不到目标，定位会失效
- 步骤的 `placement` 可选：`top / top-start / top-end / bottom / bottom-start / bottom-end / left / left-start / left-end / right / right-start / right-end`
- `el-tour` 组件在 2.6.0+ 才加入；本项目使用的 `element-plus@2.14.0` 已内置
- 业务侧的 `el-tour-step` 由 `OnboardingGuide.vue` 内部用 `v-for` 渲染，无需手写

## 验证

- 测试：**52 passed (52)** ✅
- 构建：✓ built in 3.10s ✅
- Dashboard 首次访问自动弹出引导；右上下拉 → 重新查看引导可强制再播
