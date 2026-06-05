# 前端 API 文档（FRONTEND_API / v8.0.2）

> 本文档对应 `rgzw_backend/DOCS/API_DOCUMENTATION.md` 的前端视图。
> 它从前端调用者视角描述所有 `src/api/*` service 的入参 / 出参 / 错误行为，
> 以及本轮 (v8.0.2) 新增的 `utils/listPayload.js` / `utils/enums.js` / `useListPage` / `<DetailDialog>`。

## 通用约定

### 基础地址
- 所有接口走 `/api/*` 前缀，由 Vite dev 代理到 `http://localhost:8000`
- 生产环境由反向代理转发到后端服务

### 通用请求头
- `Authorization: Bearer <accessToken>`（除登录外的所有接口）
- `Content-Type: application/json`

### 统一响应结构
```ts
interface ApiResponse<T> {
  success: boolean       // 业务成功标志
  data: T                // 业务数据
  message: string        // 业务消息（成功/失败均可读）
  code?: string          // 业务码（失败时）
}
```

### 错误处理
- HTTP 401 → 自动尝试 `/api/auth/refresh-token`（**GET**）重试一次，失败后清登录态并跳登录页
- 其它错误 → 走 `utils/normalizeError.js` 归一化分类
  - `NETWORK / UNAUTHORIZED / FORBIDDEN / NOT_FOUND / VALIDATION / SERVER / BUSINESS / UNKNOWN`
- 组件树渲染异常 → 由 `<ErrorBoundary>` 兜底（参见 `doc/ERROR_BOUNDARY.md`）

### listVD 字段白名单（v8.0.2 强约束）

后端 listVD 用 `matchedData()` 只放行白名单字段，**所有**非法字段会**静默剔除**（不会报错，但筛选会失效）。

| 后端模块 | 支持的 filter 字段 | 模糊搜索 | 软删除 |
| --- | --- | --- | --- |
| Room     | `Org, status, isActive`                          | `regExp`（name）          | ✅ |
| Subject  | `Org, category, isShow, isActive`                | `regExp`（name）          | ✅ |
| Course   | `Subject, defaultRoom, isActive`                 | `regExp`                  | ✅ |
| Org      | `unionCode, isMain, isActive`                    | `regExp`（name/nickname） | ✅ |
| User     | `Org, roleTemp, isActive, Account`               | `regExp`（nickname）      | ✅ |
| Student  | `Org, gender, sourceType, isActive`              | `regExp`（name）          | ✅ |
| Account  | `accountType, isActive`                          | ❌                        | ✅ |

`options` 字段：`limit / skip / sort / populate`（其它字段也会被剔除）

> ⚠️ **不要**在 .vue 里手搓 `filter.$or = [...]` 或 `filter.x.$regex` —— 一定会被剔除。
> 一律走 `utils/listPayload.js`（见 §3）。

### populate 速查

`utils/listPayload.js#APP_DEFAULT_POPULATE` 已收录：

| key | populate 列表 |
| --- | --- |
| `Org`         | `[{ path: 'Org', select: 'name' }]` |
| `Account`     | `[{ path: 'Account', select: 'name phone email identityNo isActive' }]` |
| `currentUser` | `[{ path: 'currentUser', select: 'nickname roleTemp isActive Org' }]` |

调用时 `buildListPayload({ populateKeys: ['Org', 'Account'] })` 即会自动展开。

---

## 1. authService (`api/auth.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `login(credentials)` | `/auth/login` | **POST** | `{ code, password }` | `{ accessToken, refreshToken?, account }` |
| `refreshToken()`    | `/auth/refresh-token` | **GET** | — | `{ accessToken, refreshToken? }` |
| `logout()`          | `/auth/logout` | **POST** | — | `null`（销毁 refresh cookie） |

> ⚠️ v7.x 之前 logout 是 GET，已在 v8.0.1 改为 POST；不要在 store 里直接 `fetch('/auth/logout')`。

### 典型用法
```js
import { authService } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { data } = await authService.login({ code: 'admin', password: '123456' })
if (data.success) {
  authStore.setTokens(data.data.accessToken, data.data.refreshToken ?? null)
  authStore.setUser(data.data.account)
}
```

---

## 2. accountService (`api/account.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getAccounts(params)` | `/account/list` | POST | `{ filter, options }` | `{ items: Account[], total: number }` |
| `getAccountById(id)` | `/account/detail/:id` | POST | — | `Account` |
| `createAccount(data)` | `/account/add` | POST | `Account` | `Account` |
| `updateAccount(id, data)` | `/account/edit/:id` | POST | `Partial<Account>` | `Account` |
| `getCurrentUser()` | `/account/self` | POST | — | `Account` |
| `updateCurrentUser(data)` | `/account/edit/self` | POST | `Partial<Account>` | `Account` |

> ⚠️ 账户模块 listVD 不提供 `name` 模糊搜索，过滤时不要传 `filter.name` / `filter.regExp`。

### Account 字段
```ts
interface Account {
  _id: string
  code: string                  // 登录账号
  name: string
  accountType: 'Admin' | 'User' | 'Student'
  phone?: string
  email?: string
  identityNo?: string
  gender?: 'male' | 'female'    // 注意：账户是全小写，Student.gender 是 'Male' | 'Female'
  birthday?: string             // YYYY-MM-DD
  isActive: boolean
  sort: number
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  lastLoginIP?: string
  lastLogoutAt?: string
}
```

---

## 3. userService (`api/user.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getUsers(params)` | `/user/list` | POST | `{ filter, options }` | `{ items: User[], total: number }` |
| `getUserById(id)` | `/user/detail/:id` | POST | — | `User` |
| `createUser(data)` | `/user/add` | POST | `{ user, account? }` | `User` |
| `updateUser(id, data)` | `/user/edit/:id` | POST | `Partial<User>` | `User` |
| `getCurrentUser()` | `/user/self` | POST | — | `User` |

### User 字段
```ts
interface User {
  _id: string
  nickname: string
  roleTemp: 'manager' | 'teacher'   // 全小写
  Org?: string | { _id: string, name: string }
  Account?: string | Account
  sort: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

---

## 4. orgService (`api/org.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getOrgs(params)` | `/org/list` | POST | `{ filter, options }` | `{ items: Org[], total: number }` |
| `getOrgById(id)` | `/org/detail/:id` | POST | — | `Org` |
| `createOrg(data)` | `/org/add` | POST | `Org` | `Org` |
| `updateOrg(id, data)` | `/org/edit/:id` | POST | `Partial<Org>` | `Org` |
| `getCurrentUserOrg()` | `/org/self` | POST | — | `Org` |

### Org 字段
```ts
interface Org {
  _id: string
  name: string
  nickname: string
  unionCode: string
  isMain: boolean
  phone?: string
  email?: string
  website?: string
  address?: string
  isActive: boolean
  sort: number
  createdAt: string
  updatedAt: string
}
```

---

## 5. studentService (`api/student.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getStudents(params)` | `/student/list` | POST | `{ filter, options }` | `{ items: Student[], total: number }` |
| `getStudentById(id)` | `/student/detail/:id` | POST | — | `Student` |
| `createStudent(data)` | `/student/add` | POST | `{ student, account? }` | `Student` |
| `updateStudent(id, data)` | `/student/edit/:id` | POST | `Partial<Student>` | `Student` |

### Student 字段
```ts
interface Student {
  _id: string
  name: string
  gender: 'Male' | 'Female'              // 首字母大写
  birthday?: string                       // YYYY-MM-DD
  identityNo?: string
  phone?: string
  school?: string
  sourceType?: string                     // 见 enums.SOURCE_TYPES
  address?: string
  currentAddress?: string
  description?: string
  Org?: string | Org
  Account?: string | Account
  sort: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

---

## 6. roomService (`api/room.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getRooms(params)` | `/room/list` | POST | `{ filter, options }` | `{ items: Room[], total: number }` |
| `getRoomById(id)` | `/room/detail/:id` | POST | — | `Room` |
| `createRoom(data)` | `/room/add` | POST | `Room` | `Room` |
| `updateRoom(id, data)` | `/room/edit/:id` | POST | `Partial<Room>` | `Room` |

> ⚠️ Room 模块**没有** `deleteRoom` —— 后端 v7.x 暂未开放 `/room/remove/:id` 物理删除路由。
> 禁用走软删除：`updateRoom(id, { isActive: false })`。

### Room 字段
```ts
interface Room {
  _id: string
  name: string
  capacity: number
  location?: string
  Org: string | Org
  status: 'available' | 'in_use' | 'maintenance'    // 见 enums.ROOM_STATUS
  isActive: boolean
  description?: string
  sort: number
  createdAt: string
  updatedAt: string
}
```

---

## 7. subjectService (`api/subject.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getSubjects(params)` | `/subject/list` | POST | `{ filter, options }` | `{ items: Subject[], total: number }` |
| `getSubjectById(id)` | `/subject/detail/:id` | POST | — | `Subject` |
| `createSubject(data)` | `/subject/add` | POST | `Subject` | `Subject` |
| `updateSubject(id, data)` | `/subject/edit/:id` | POST | `Partial<Subject>` | `Subject` |
| `deactivateSubject(id)` | `/subject/edit/:id` | POST | `{ isActive: false }` | `Subject`（软删除封装） |

> ⚠️ 同 Room，没有 `deleteSubject`；改用 `deactivateSubject` 语义化封装。

### Subject 字段
```ts
interface Subject {
  _id: string
  name: string
  category: 'C++' | 'Python' | 'Scratch' | 'Spike' | '电子智慧大颗粒'
  price: number              // 单位：分
  duration_minutes: number
  default_lesson_count: number
  Org: string | Org
  isShow: boolean
  isActive: boolean
  sort: number
  syllabus: Array<{ title: string, description: string }>
  createdAt: string
  updatedAt: string
}
```

---

## 8. courseService (`api/course.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getCourses(params)` | `/course/list` | POST | `{ filter, options }` | `{ items: Course[], total: number }` |
| `getCourseById(id)` | `/course/detail/:id` | POST | — | `Course` |
| `createCourse(data)` | `/course/add` | POST | `Course` | `Course` |
| `updateCourse(id, data)` | `/course/edit/:id` | POST | `Partial<Course>` | `Course` |
| `deleteCourse(id)` | `/course/edit/:id` | POST | `{ isActive: false }` | `Course`（软删除封装） |

> 课程模块的 Org 范围控制详见 [COURSE_ORG_SCOPING.md](./COURSE_ORG_SCOPING.md)。

---

## 9. 工具（v8.0.2 收口）

### `utils/listPayload.js`

```js
import {
  buildListPayload,     // { filter, options } 构造器
  appendExact,          // filter.x = value（仅当非空）
  appendBoolean,        // filter.x = bool（兼容 'true'/true/null）
  appendRegExp,         // filter.regExp = kw（替代 $or + 多字段 $regex）
  appendDateRange,      // filter.createdAt = { $gte, $lte }
  unwrapListResponse    // 统一 response.data.data.items / total
} from '@/utils/listPayload'

const payload = buildListPayload({
  filter,
  page: 1, pageSize: 10,
  sort: { sort: -1, createdAt: -1 },
  populateKeys: ['Org', 'Account']   // 自动从 APP_DEFAULT_POPULATE 展开
})
const resp = await roomService.getRooms(payload)
const { items, total } = unwrapListResponse(resp)
```

### `utils/enums.js`

```js
import {
  ROOM_STATUS, ROOM_STATUS_MAP, formatRoomStatus, roomStatusTagType,
  SUBJECT_CATEGORIES, formatSubjectCategory, subjectCategoryTagType,
  ACCOUNT_TYPES, formatAccountTypeEnum,
  USER_ROLES, formatUserRole,
  GENDER_OPTIONS, formatGenderEnum
} from '@/utils/enums'
```

所有枚举项形态：`{ value, label, tagType? }`，template 里 `v-for="opt in Xxx"`，formatter 走 `formatXxx` / `xxxTagType`。

### `composables/useListPage.js`

```js
import { useListPage } from '@/composables/useListPage'

const {
  items, loading, selectedRows, pagination,
  fetchList,
  handleSizeChange, handleCurrentChange, handleSelectionChange,
  batchUpdateField, batchDeactivate
} = useListPage()

// 批量软删除
batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => xxService.updateXx(id, { isActive: false }))),
  onComplete: fetchList
})

// 批量改字段
batchUpdateField({
  field: 'isShow', value: true, label: '展示',
  apply: (ids, body) => Promise.allSettled(ids.map(id => xxService.updateXx(id, body))),
  onComplete: fetchList
})
```

### `components/DetailDialog.vue`

```vue
<DetailDialog v-model="detailVisible" title="用户详情" :data="currentRow" :rows="detailRows" />
```

```js
const detailRows = [
  { label: '真实姓名', field: 'Account.name' },
  { label: '角色',     field: 'roleTemp', render: r => formatUserRole(r.roleTemp) },
  { label: '所属组织', field: 'Org.name' }
]
```

- `field` 支持点号路径
- `render(row)` 自定义渲染；**不要**把用户输入直接拼字符串（XSS 风险）

---

## 10. 错误处理工具（`utils/normalizeError.js`）

| 导出 | 用途 |
| --- | --- |
| `ErrorKind` | 枚举：`NETWORK / UNAUTHORIZED / FORBIDDEN / NOT_FOUND / SERVER / VALIDATION / BUSINESS / UNKNOWN` |
| `normalizeError(err)` | 把任意输入归一化为带 `kind / status / code / data` 的 Error |
| `classifyError(err)` | 提取 kind 标签 |
| `getUserMessage(err, opts?)` | 返回中文展示文案 |
| `reportNormalized(err, extra?)` | 归一化 + 走 errorHandler 通道上报 |

详见源码注释。

## 11. 工具函数（`utils/format.js`）

| 函数 | 入参 | 返回 |
| --- | --- | --- |
| `formatDate(dateString)` | string/number/Date | `yyyy/MM/dd hh:mm` |
| `formatDateOnly(dateString)` | string/number/Date | `YYYY-MM-DD` |
| `formatGender(gender)` | `'Male' \| 'Female' \| string` | `'男' \| '女' \| 原值` |
| `formatAccountType(type)` | `'Admin' \| 'User' \| 'Student' \| string` | `'管理员' \| '公司用户' \| '学生' \| 原值` |
| `formatActiveStatus(active)` | boolean | `'激活' \| '未激活'` |
| `formatBirthdayAge(birthday)` | string/Date | `yyyy/MM/dd hh:mm (xx岁)` / `-` |

---

## 12. 维护说明

- 新增 service 时请同步：
  1. `src/api/<name>.js` 中导出函数 + JSDoc
  2. 本文档新增一节，列出端点 + 入参 + 出参 + 类型
  3. 若有复杂业务逻辑，单独写 `doc/<FEATURE>.md`
- 错误码 / 错误结构若后端调整，请同步更新本文档「统一响应结构」一节
- listVD 字段若有调整，请同步更新「listVD 字段白名单」表 + `utils/listPayload.js` 的 helper
