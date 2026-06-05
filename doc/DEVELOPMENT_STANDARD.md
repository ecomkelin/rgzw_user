# RGZW 管理后台开发规范（v8.0.2 起强制）

> 本规范基于现有 7 个 CRUD 页面（Rooms / Subjects / Courses / Orgs / Users / Students / Accounts）的实际状态收口。
> 适用对象：**所有新增、修改、重写页面都必须遵守**。
> 改完一份页面 / 新增一个页面后请顺着本文档末尾的"新增页面 checklist"逐项过一遍再交。

## 0. 文档地图

| 文档 | 用途 |
| --- | --- |
| `doc/DEVELOPMENT_STANDARD.md`（本文） | "应该怎么写"的规范 |
| `doc/FRONTEND_API.md` | "api/<name>.js 应该长什么样"的接口契约 |
| `doc/PAGE_STRUCTURE.md` | 路由 / 页面结构总览 |
| `doc/PAGE_REVIEW.md` | 7 个页面的体检报告（含评分与待办） |
| `doc/COURSE_ORG_SCOPING.md` | 课程管理的多租户 Org 范围实现细节 |
| `doc/ERROR_BOUNDARY.md` | 全局错误边界使用 |

## 1. 新增页面 checklist（必走流程）

> **新页面、或者对老页面做超过 200 行的改动时**，请按这个 checklist 自检一遍再发 PR。

### 1.1 准备阶段
- [ ] **确认后端模块**：对应的 `apiDesc.md` / `*.module.js` / `*.routes.js` 看过
- [ ] **确定 listVD 支持的 filter 字段**（哪些能用 `$or`、哪些只能用 `regExp`、哪些仅精确等值）
  - 不确定就去看 [PAGE_REVIEW.md §4.5](./PAGE_REVIEW.md#4-跨页面共性问题) 或 `rgzw_backend/DOCS/API_DOCUMENTATION.md`
- [ ] **如果后端无 `/remove` 物理删除路由**：决定走软删除（`updateXxx(id, { isActive: false })`），不要造新的 service 方法
- [ ] **如果新建账户类型的枚举**：抽到 `src/utils/enums.js`，**不要**在模板里硬编码

### 1.2 落地阶段
- [ ] 在 `src/api/<name>.js` 加 service（按 §2 的写法）
- [ ] 在 `src/utils/listPayload.js` 看是否能直接复用现成的 `appendExact / appendBoolean / appendRegExp / appendDateRange`；如果不能，就去扩展 `listPayload.js`，**不要在 .vue 里手搓 filter**
- [ ] 用 `useListPage()` 取代分页 / 选中 / 批量三件套的手写
- [ ] 用 `<DetailDialog>` 取代 `ElMessageBox.alert + dangerouslyUseHTMLString`
- [ ] 用 `src/utils/enums.js` 中的枚举 + formatter
- [ ] 表单提交：构建 payload 用 `pickDefined()`（参考 §6）取代 if-链
- [ ] 打印：使用 `utils/print.js#printTable(data, columns, title)`

### 1.3 自检阶段
- [ ] `pnpm build` 通过
- [ ] `pnpm test` 通过（如果新增 / 修改了 util，更新对应 `*.test.js`）
- [ ] 检查 `console.log` 残留（不应出现在 .vue）
- [ ] **手动到页面里走一遍 5 个动作**：查询 / 新建 / 编辑 / 批量 / 详情
- [ ] 同步 `doc/FRONTEND_API.md` 和 `doc/PAGE_STRUCTURE.md`
- [ ] `version.md` 新增一行

---

## 2. 目录结构与命名

```
src/
├── api/                # 1 个后端模块 = 1 个文件（例：room.js, subject.js）
│   └── http.js         # axios 实例（不要在外面直接 axios.create）
├── components/         # 跨页面复用组件
│   ├── AdvancedSearch.vue
│   ├── DetailDialog.vue       # 详情弹窗（v8.0.2 新增）
│   ├── ErrorBoundary.vue
│   └── OnboardingGuide.vue
├── composables/        # 跨页面复用逻辑
│   └── useListPage.js  # 分页 + 选中 + 批量（v8.0.2 新增）
├── router/
├── stores/             # Pinia
├── styles/
├── utils/              # 工具
│   ├── enums.js        # 业务枚举（v8.0.2 新增）
│   ├── format.js
│   ├── listPayload.js  # listVD 参数构造（v8.0.2 新增）
│   ├── normalizeError.js
│   └── print.js
└── views/              # 页面
    ├── rooms/Rooms.vue
    ├── subjects/Subjects.vue
    ├── courses/Courses.vue
    ├── orgs/Orgs.vue
    ├── users/Users.vue
    ├── students/Students.vue
    ├── accounts/Accounts.vue
    ├── Dashboard.vue
    ├── Login.vue
    ├── Layout.vue
    ├── ErrorFallback.vue
    └── Analytics.vue
```

- 目录名：小写，复数（与业务实体对齐）
- 页面文件名：PascalCase（`Rooms.vue`），与目录名同名
- 工具 / composable / util：小驼峰（`listPayload.js`、`useListPage.js`）
- 组件名：PascalCase
- 变量 / 函数 / method：camelCase
- 常量：UPPER_SNAKE_CASE（仅限枚举常量、配置 key）

---

## 3. API Service 规范

```js
// api/<name>.js
import http from './http'

export const roomService = {
  /**
   * 教室分页列表
   * @param {{ filter: object, options: object }} params
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getRooms(params) { return http.post('/room/list', params) },
  getRoomById(id)  { return http.post(`/room/detail/${id}`) },
  createRoom(data) { return http.post('/room/add', data) },
  updateRoom(id, data) { return http.post(`/room/edit/${id}`, data) }

  // 后端 v7.x 暂未提供 /remove 路由，软删除直接走 updateRoom(id, { isActive: false })
}
```

- 命名：`<resource>Service`，导出 `export const` 命名导出
- 全部走 `http.post`（后端全部路由都是 POST）
- 每个方法都写 JSDoc：`@param` / `@returns`
- 不要在本文件里写 `try/catch` 错误处理 —— 由 `http.js` 统一拦截
- 同步更新 `doc/FRONTEND_API.md`

---

## 4. 列表拉取规范（v8.0.2 强制）

> 之前 7 个页面都各自手搓 `filter + options + populate`，问题：
> 1. `$or` / `field.$regex` 会被后端 `matchedData()` 静默剔除
> 2. `skip` / `limit` 计算重复 7 份
> 3. `populate` 拼写容易漏
>
> 统一收口到 `utils/listPayload.js`。

```js
import {
  buildListPayload,
  appendExact,       // 等值
  appendBoolean,      // 布尔（兼容 'true' / true / null）
  appendRegExp,       // 关键词模糊（替代 $or + 多字段 $regex）
  appendDateRange     // createdAt / updatedAt 区间
} from '@/utils/listPayload'
import { useListPage } from '@/composables/useListPage'

const {
  items, loading, selectedRows, pagination,
  fetchList,
  handleSizeChange, handleCurrentChange, handleSelectionChange,
  batchUpdateField, batchDeactivate
} = useListPage()

const fetchList_ = async () => {
  const filter = {}
  appendExact(filter, 'Org', filters.org)
  appendBoolean(filter, 'isActive', filters.isActive)
  appendRegExp(filter, advancedFilters.keyword, filters.name)   // 取第一个非空

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { sort: -1, createdAt: -1 },
    populateKeys: ['Org', 'Account']   // APP_DEFAULT_POPULATE 里有的 key
  })

  await fetchList(roomService.getRooms.bind(roomService), payload)
}
```

### 4.1 字段白名单速查（v8.0.x 后端实测）

| 后端模块 | 支持的 filter 字段 | 模糊搜索 | 删除方式 |
| --- | --- | --- | --- |
| Room | `Org, status, isActive` + `regExp` | `regExp`（name） | 软删除 |
| Subject | `Org, category, isShow, isActive` + `regExp` | `regExp`（name） | 软删除 |
| Course | `Subject, defaultRoom, isActive` + `regExp` + sortObj | `regExp` | 软删除 |
| Org | `unionCode, isMain, isActive` + `regExp` | `regExp`（name / nickname） | 软删除 |
| User | `Org, roleTemp, isActive, Account` + `regExp` | `regExp`（nickname） | 软删除 |
| Student | `Org, gender, sourceType, isActive` + `regExp` | `regExp`（name） | 软删除 |
| Account | `accountType, isActive`（**无** regExp / 无 name 模糊） | ❌ | 软删除 |

> 任何模块的 listVD 都**不接受** `filter.$or` / `filter.x.$regex` / `filter.x.$in`。
> 一律走 `utils/listPayload.js` 中的 helper，确保白名单 + 类型安全。

### 4.2 populate 速查

- `Org`            → `{ path: 'Org', select: 'name' }`
- `Account`        → `{ path: 'Account', select: 'name phone email identityNo isActive' }`
- `currentUser`    → `{ path: 'currentUser', select: 'nickname roleTemp isActive Org' }`
- `Subject`        → `{ path: 'Subject', select: 'name' }`
- `defaultRoom`    → `{ path: 'defaultRoom', select: 'name' }`

`populateKeys: ['Org', 'Account']` 会从 `APP_DEFAULT_POPULATE` 自动展开。

---

## 5. 通用列表页模板

> 每个 CRUD 页面都按这个模板组装，差异只在 `<el-table-column>` 列表和 `<el-form-item>` 字段。

```vue
<template>
  <div class="<name>-page">
    <h2 class="page-title">XX 管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">...</el-form>
    </el-card>

    <!-- 可选：高级搜索 -->
    <AdvancedSearch @search="..." @reset="..." />

    <el-card class="table-card">
      <el-table :data="items" v-loading="loading" row-key="_id"
                @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <!-- ... 业务列 ... -->
        <el-table-column label="操作" width="..." fixed="right">
          <template #default="{ row }">
            <el-button @click="openEditDialog(row)">编辑</el-button>
            <el-button type="primary" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量 -->
      <div class="batch-operation" v-if="selectedRows.length > 0">
        <el-divider />
        <div class="batch-toolbar">
          <span class="selection-info">已选择 {{ selectedRows.length }} 项</span>
          <div class="batch-buttons">
            <el-button @click="onBatchActivate" type="success" size="small">批量激活</el-button>
            <el-button @click="onBatchDeactivate" type="warning" size="small">批量禁用</el-button>
            <el-button @click="selectedRows = []" size="small">取消选择</el-button>
          </div>
        </div>
      </div>

      <!-- 打印 -->
      <div class="print-operation">
        <el-divider />
        <div class="print-toolbar">
          <span class="print-info">打印功能</span>
          <div class="print-buttons">
            <el-button @click="printTable(selectedRows)" :disabled="selectedRows.length === 0">打印选中项</el-button>
            <el-button @click="printTable(items)">打印全部数据</el-button>
          </div>
        </div>
      </div>

      <el-pagination v-model:current-page="pagination.currentPage"
                     v-model:page-size="pagination.pageSize"
                     :total="pagination.total" ... />
    </el-card>

    <!-- 编辑 / 创建对话框 -->
    <el-dialog ... />

    <!-- 详情（统一组件） -->
    <DetailDialog v-model="detailVisible" title="XX 详情" :data="currentRow" :rows="detailRows" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { xxService } from '@/api/xx'
import { printTable as printTableUtil } from '@/utils/print'
import {
  buildListPayload,
  appendExact, appendBoolean, appendRegExp, appendDateRange
} from '@/utils/listPayload'
import { useListPage } from '@/composables/useListPage'
import DetailDialog from '@/components/DetailDialog.vue'

const {
  items, loading, selectedRows, pagination,
  fetchList,
  handleSizeChange: onSizeChange,
  handleCurrentChange: onPageChange,
  handleSelectionChange,
  batchUpdateField, batchDeactivate
} = useListPage()

// 详情面板
const detailVisible = ref(false)
const currentRow = ref({})
const detailRows = [
  { label: 'XX', field: 'name' },
  { label: '所属组织', field: 'Org.name' }
  // 必要时加 render: r => formatXxx(r.field)
]
const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

// 批量
const onBatchActivate = () => batchUpdateField({
  field: 'isActive', value: true, label: '激活',
  apply: (ids, body) => Promise.allSettled(ids.map(id => xxService.updateXx(id, body))),
  onComplete: fetchListX
})
const onBatchDeactivate = () => batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => xxService.updateXx(id, { isActive: false }))),
  onComplete: fetchListX
})

// 列表
const fetchListX = async () => {
  const filter = {}
  appendExact(filter, 'Org', filters.org)
  appendBoolean(filter, 'isActive', filters.isActive)
  appendRegExp(filter, filters.name)
  const payload = buildListPayload({
    filter,
    page: pagination.currentPage, pageSize: pagination.pageSize,
    sort: { sort: -1, createdAt: -1 },
    populateKeys: ['Org', 'Account']
  })
  await fetchList(xxService.getXxs.bind(xxService), payload)
}

// 打印
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: 'XX' }
    // ...
  ]
  printTableUtil(data, columns, 'XX 管理数据报表')
}
</script>
```

---

## 6. 表单提交规范（pickDefined）

> 之前每个 .vue 都有 `if (form.x && form.x.trim() !== '') { data.x = form.x; if (data.x.length < N) ElMessage.error(...) }` 这种长 if-链。
> 收口到 `pickDefined` 工具：只挑"非空"字段交给后端，校验交给 `el-form :rules`。

```js
// 每个页面里定义一次
const pickDefined = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
)

const buildBody = () => pickDefined({
  name: dialog.form.name,
  sort: dialog.form.sort,
  isActive: dialog.form.isActive,
  // ... 仅挑非空字段
})

// 主流程
const saveX = async () => {
  try { await formRef.value.validate() } catch (_) { return }
  dialog.loading = true
  try {
    const isCreate = dialog.mode === 'create'
    const resp = isCreate
      ? xxService.createXx(buildBody())
      : xxService.updateXx(dialog.form._id, buildBody())
    if (resp.data.success) {
      ElMessage.success(isCreate ? '创建成功' : '更新成功')
      dialog.visible = false
      fetchListX()
    } else {
      ElMessage.error(resp.data.message || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    dialog.loading = false
  }
}
```

校验规则在 `dialog.rules` 里集中声明，不要在保存函数里写 if-校验。

---

## 7. 详情面板规范（DetailDialog）

> 之前 7 个页面都用 `ElMessageBox.alert + dangerouslyUseHTMLString` 拼字符串，XSS 风险大、样式不可控。
> 一律改用 `<DetailDialog>`。

```vue
<DetailDialog
  v-model="detailVisible"
  title="用户详情"
  :data="currentRow"
  :rows="detailRows"
/>
```

```js
const detailRows = [
  { label: '真实姓名', field: 'Account.name' },
  { label: '角色', field: 'roleTemp', render: r => formatUserRole(r.roleTemp) },
  { label: '所属组织', field: 'Org.name' }
]
```

- `field`：支持点号路径（`Org.name` / `currentUser.roleTemp`）
- `render(r)`：当后端存的是枚举值（`'manager'`）需要中文展示时用；**不要把用户输入直接拼到 render 里**（XSS）

---

## 8. 业务枚举规范

> 之前 `available / in_use / maintenance` 之类硬编码 2 份（template + formatter），改一次要改两处。
> 收口到 `utils/enums.js`。

```js
// utils/enums.js
export const ROOM_STATUS = Object.freeze([
  { value: 'available',   label: '可用',   tagType: 'success' },
  { value: 'in_use',      label: '使用中', tagType: 'warning' },
  { value: 'maintenance', label: '维护中', tagType: 'danger' }
])
export const formatRoomStatus = (s) => ROOM_STATUS_MAP[s]?.label ?? '-'
export const roomStatusTagType = (s) => ROOM_STATUS_MAP[s]?.tagType ?? 'info'
```

```vue
<el-option v-for="opt in ROOM_STATUS" :key="opt.value" :label="opt.label" :value="opt.value" />
<el-tag :type="roomStatusTagType(row.status)">{{ formatRoomStatus(row.status) }}</el-tag>
```

新加枚举时务必同步 `enums.js`、页面里 `v-for`、formatter。

---

## 9. 软删除 vs 物理删除

- 后端 v7.x 起**几乎所有模块**都没有开放 `/remove/:id` 物理删除路由（见 `rgzw_backend/DOCS/API_DOCUMENTATION.md`）
- 一律走软删除：`updateXxx(id, { isActive: false })`
- 如需新增物理删除：先和后端对齐路由；前端在 `api/<name>.js` 里加 `deleteXxx` 方法，注释里写明"后端 vX.Y 开放 /remove 路由"

---

## 10. 错误处理规范

- 不在 .vue 里 `try { ... } catch { ElMessage.error(...) }` 然后还把错误继续 `throw`（http.js 已经统一处理过）
- 批量操作的结果通过 `Promise.allSettled` 收集，展示 `成功 N / 共 M`
- 401 已在 `http.js` 自动处理（refresh-token 一次再失败跳登录），业务侧不用管
- 全局错误边界由 `<ErrorBoundary>` 提供（详见 [ERROR_BOUNDARY.md](./ERROR_BOUNDARY.md)）

---

## 11. 打印规范

- 全部走 `utils/print.js#printTable(data, columns, title)`
- columns 数组里 `prop` 支持点号路径（`Account.name`）
- 格式化走 `formatter: r => formatXxx(r.field)`，**不要**在 prop 里写表达式
- 标题统一为"XX 管理数据报表"

---

## 12. 样式规范

- 全部 `<style scoped>`
- 颜色 / 间距 跟随 Element Plus 默认值（不要魔改）
- 通用工具栏 class 名固定：
  - `.filter-card`  `.filter-form`（基础筛选）
  - `.table-card`
  - `.batch-operation` `.batch-toolbar` `.selection-info` `.batch-buttons`
  - `.print-operation` `.print-toolbar` `.print-info` `.print-buttons`
  - `.pagination`
  - `.table-actions`（每行操作列）
- 详见 [PAGE_STRUCTURE.md §3](./PAGE_STRUCTURE.md)

---

## 13. 测试规范

- 业务 util（`enums.js` / `format.js` / `listPayload.js`）必须有对应 `*.test.js`
- 改 utils 必跑 `pnpm test`
- 新增 composable / 公共组件，建议至少加 1 个组件渲染测试

---

## 14. 提交与版本

- 一次 PR 一个主题（"升级 Orgs 页"、"加 Student 高级搜索"）
- `version.md` 顶上加一行：

```
## v8.0.x
- 新增 / 修改 / 修复: <一句话总结>
- 关联 PR: #<num>
```

- 关联后端 `rgzw_backend/version.md` 的版本号
- 同步更新 `doc/FRONTEND_API.md` / `doc/PAGE_STRUCTURE.md` / `doc/PAGE_REVIEW.md`

---

## 15. 引用

- [PAGE_REVIEW.md](./PAGE_REVIEW.md) — 7 个页面的体检报告
- [FRONTEND_API.md](./FRONTEND_API.md) — api/<name>.js 的接口契约
- [PAGE_STRUCTURE.md](./PAGE_STRUCTURE.md) — 路由 / 页面结构
- [COURSE_ORG_SCOPING.md](./COURSE_ORG_SCOPING.md) — 课程多租户
- [ERROR_BOUNDARY.md](./ERROR_BOUNDARY.md) — 全局错误边界
