# 移动端用户体验优化

> 本文档对应 `TODOS.md` 中「优化移动端用户体验」的实施方案。

## 背景

桌面浏览器 (1920×1080) 和 iPhone SE (375×667) 显示同一份代码，结果天差地别。`el-aside width=200px` 写死、表格横向溢出、按钮区域小、双击缩放错乱等问题集中爆发。

本方案在不引入 UI 框架（继续用 Element Plus）的前提下，对**关键路径**做响应式改造。

## 断点设计

| 断点 | 宽度区间 | 设备举例 | 处理策略 |
| --- | --- | --- | --- |
| `mobile`  | ≤ 768px    | iPhone / Android 竖屏 | 侧栏改抽屉、汉堡按钮、表格横向滚动 |
| `tablet`  | 769~1024px | iPad 竖屏 / 小笔记本  | 缩小 padding、隐藏次要元素 |
| `desktop` | > 1024px   | 桌面浏览器              | 完整布局 |

## 文件清单

| 路径 | 角色 |
| --- | --- |
| [src/composables/useResponsive.js](src/composables/useResponsive.js) | 响应式状态 composable |
| [src/composables/useResponsive.test.js](src/composables/useResponsive.test.js) | 5 个单元测试 |
| [src/views/Layout.vue](src/views/Layout.vue) | 桌面 aside / 移动 drawer 切换 |
| [src/views/Login.vue](src/views/Login.vue) | 移动端 padding / 字号缩小 |
| [src/styles/global.css](src/styles/global.css) | 媒体查询 + 触摸优化 |
| [index.html](index.html) | viewport meta + theme-color |

## 关键实现

### 1. `useResponsive` composable

订阅 `matchMedia` 的 `(max-width: 768px)` 和 `(min-width: 769px) and (max-width: 1024px)` 两个断点，单一全局监听、按引用计数管理订阅生命周期。

```js
import { useResponsive } from '@/composables/useResponsive'

const { isMobile, isTablet, isDesktop, bp } = useResponsive()

// 模板
<el-aside v-if="!isMobile" />
<el-drawer v-else v-model="drawerVisible" />
```

### 2. Layout 双形态

**桌面** (`!isMobile`)：固定 `el-aside`，菜单直接展开。

**移动** (`isMobile`)：
- 顶部导航多一个汉堡按钮（`Menu` 图标）触发 `el-drawer`
- 抽屉宽度 `78vw`，避免完全遮住内容
- 抽屉内菜单点击 (`@select`) 自动关闭，符合移动端操作直觉
- h2 标题字号从 20 缩到 16，white-space: nowrap 防止超长标题挤压

### 3. 全局媒体查询（[global.css](src/styles/global.css)）

```css
/* ≤ 1024 平板 */
@media (max-width: 1024px) {
  .form-container { max-width: 100%; }
  .layout-header { padding: 0 14px; }
}

/* ≤ 768 手机 */
@media (max-width: 768px) {
  .page-title { font-size: 18px; margin-bottom: 12px; }
  .layout-main { padding: 12px; }
  .hide-on-mobile { display: none !important; }
  .table-actions .el-button span { display: none; }   /* 表格操作按钮只留图标 */
}

/* 触摸设备 */
@media (hover: none) and (pointer: coarse) {
  .el-button { min-height: 36px; }                     /* 加大命中区 */
  .el-menu-item { min-height: 48px; }
  .el-button, .hamburger, .el-dropdown-link { touch-action: manipulation; }
}
```

### 4. 表格响应式（按需使用）

在列数较多的表格外层包一个 `.table-scroll-x` 工具类容器：

```html
<div class="table-scroll-x">
  <el-table :data="rows">
    <el-table-column prop="id" label="ID" />
    ...
  </el-table>
</div>
```

容器开启 `overflow-x: auto` + `min-width: 640px` 强制触发横向滚动而非挤压列宽。

### 5. index.html viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
<meta name="theme-color" content="#409EFF" />
```

- `maximum-scale=5.0, user-scalable=yes` —— **不**禁用缩放（iOS Safari 一度默认禁止是糟糕体验）
- `viewport-fit=cover` —— 兼容 iPhone 刘海 / 小黑条
- `theme-color` —— Android Chrome 地址栏颜色匹配

## 触摸优化细节

| 优化点 | 做法 |
| --- | --- |
| 误触高亮 | body 设 `-webkit-tap-highlight-color: transparent` |
| iOS 长按菜单 | body 设 `-webkit-touch-callout: none` |
| 弹性滚动 | 滚动容器加 `-webkit-overflow-scrolling: touch` |
| 双击放大按钮 | `touch-action: manipulation`（仍允许缩放页面） |
| 动态视口 | Login 用 `min-height: 100dvh` 避开 iOS 地址栏 |
| 命中区 | 触摸设备按钮 `min-height: 36px+` |

## 使用方式

**业务侧判断移动端**：

```vue
<script setup>
import { useResponsive } from '@/composables/useResponsive'
const { isMobile } = useResponsive()
</script>

<template>
  <el-button v-if="!isMobile" size="default">详情</el-button>
  <el-button v-else size="small">详情</el-button>
</template>
```

**隐藏元素**：

```html
<span class="hide-on-mobile">详细描述</span>  <!-- 桌面显示 -->
<span class="hide-on-desktop">简述</span>     <!-- 移动端显示 -->
```

## 验证

- 测试：**57 passed (57)** ✅（5 个新增 useResponsive 用例）
- 构建：✓ built in 2.97s ✅
- 浏览器实测：
  - 桌面 1920×1080：完整布局
  - iPhone 12 (390×844)：抽屉式侧栏 + 顶部汉堡
  - iPad (768×1024)：仍走桌面布局（边界值）

## 后续可扩展

> 以下条目已并入 `../TODOS.md` 的「建议改进 → 来自文档后续可扩展项」跟踪。PWA 已合并到「建议改进 → 添加离线缓存功能」，此处不再单列。

- [ ] 给 `Students.vue` / `Users.vue` 等表格加 `.table-scroll-x` 容器（按需）
- [ ] 添加 swipe-back 手势（移动端从边缘右滑返回上一页）
- [ ] 接入 PWA（已合并到「建议改进 → 添加离线缓存功能」）
- [ ] 横屏 / 折叠屏适配（`screen and (orientation: landscape)`）

## 注意事项

- `matchMedia` 在 jsdom 中不存在，单元测试中需要 mock。已在 [tests/setup.js](tests/setup.js) 注入桩实现
- `el-drawer` 的 `size="78vw"` 是按视口宽度计算的，移动端从右往左滑入动画需要等 drawer 自身完成
- 切换桌面/移动端时，`el-aside` 和 `el-drawer` 是两个独立实例，菜单状态（如展开的子菜单）不会跨形态保留。若需要保留，需要把菜单状态提升到 store
