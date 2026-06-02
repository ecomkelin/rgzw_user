# 前端 API 文档（FRONTEND_API）

> 本文档对应 `TODOS.md` 中「API 文档完善」的产出。它从前端调用者视角描述所有 `api/*` service 的入参 / 出参 / 错误行为。
>
> 后端实现细节请参考 `rgzw_backend/DOCS/API_DOCUMENTATION.md`。

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
- HTTP 401 → 自动尝试 `/api/auth/refresh-token` 重试一次，失败后跳转登录页
- 其它错误 → 走 `utils/normalizeError.js` 归一化分类
  - `NETWORK`        网络断开 / 超时
  - `UNAUTHORIZED`   401
  - `FORBIDDEN`      403
  - `NOT_FOUND`      404
  - `VALIDATION`     400 / 422
  - `SERVER`         5xx
  - `BUSINESS`       success=false
- 组件树渲染异常 → 由 `ErrorBoundary` 兜底（参见 `doc/ERROR_BOUNDARY.md`）

---

## authService (`api/auth.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `login(credentials)` | `/auth/login` | POST | `{ code, password }` | `{ accessToken, refreshToken?, account }` |
| `refreshToken()` | `/auth/refresh-token` | GET | — | `{ accessToken, refreshToken? }` |
| `logout()` | `/auth/logout` | GET | — | `null`（销毁 refresh cookie） |

### 典型用法
```js
import { authService } from '@/api/auth'

const { data } = await authService.login({ code: 'admin', password: '123456' })
if (data.success) {
  authStore.setTokens(data.data.accessToken, null)
  authStore.setUser(data.data.account)
}
```

---

## accountService (`api/account.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getAccounts(params)` | `/account/list` | POST | `{ keyword?, page?, pageSize?, status?, ... }` | `{ list: Account[], total: number }` |
| `getAccountById(id)` | `/account/detail/:id` | POST | — | `Account` |
| `createAccount(data)` | `/account/add` | POST | `Account` | `Account`（含 id） |
| `updateAccount(id, data)` | `/account/edit/:id` | POST | `Account` | `Account` |
| `getCurrentUser()` | `/account/self` | POST | — | `Account` |
| `updateCurrentUser(data)` | `/account/edit/self` | POST | `Partial<Account>` | `Account` |

### Account 字段
```ts
interface Account {
  id: number
  code: string                  // 登录账号
  name: string
  accountType: 'Admin' | 'User' | 'Student'
  orgId?: number
  isActive: boolean
  phone?: string
  email?: string
  createdAt: string             // ISO 时间
  updatedAt: string
}
```

---

## userService (`api/user.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getUsers(params)` | `/user/list` | POST | `{ keyword?, dateRange?, gender?, ageRange?, status?, sourceType?, page?, pageSize? }` | `{ list: User[], total: number }` |
| `getUserById(id)` | `/user/detail/:id` | POST | — | `User` |
| `createUser(data)` | `/user/add` | POST | `User` | `User` |
| `updateUser(id, data)` | `/user/edit/:id` | POST | `User` | `User` |
| `getCurrentUser()` | `/user/self` | POST | — | `User` |

### User 字段
```ts
interface User {
  id: number
  name: string
  gender: 'Male' | 'Female'
  age: number
  phone?: string
  status: boolean              // 激活 / 未激活
  sourceType?: string          // 来源渠道（地推/传单/活动/介绍...）
  orgId?: number
  createdAt: string
  updatedAt: string
}
```

---

## orgService (`api/org.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getOrgs(params)` | `/org/list` | POST | `{ keyword?, page?, pageSize? }` | `{ list: Org[], total: number }` |
| `getOrgById(id)` | `/org/detail/:id` | POST | — | `Org` |
| `createOrg(data)` | `/org/add` | POST | `Org` | `Org` |
| `updateOrg(id, data)` | `/org/edit/:id` | POST | `Org` | `Org` |
| `getCurrentUserOrg()` | `/org/self` | POST | — | `Org` |

### Org 字段
```ts
interface Org {
  id: number
  name: string
  shortName?: string
  type?: 'Company' | 'School' | 'Department'
  parentId?: number
  contactPhone?: string
  address?: string
  createdAt: string
  updatedAt: string
}
```

---

## studentService (`api/student.js`)

| 方法 | 接口 | Method | 入参 | 出参 data 形态 |
| --- | --- | --- | --- | --- |
| `getStudents(params)` | `/student/list` | POST | `{ keyword?, page?, pageSize? }` | `{ list: Student[], total: number }` |
| `getStudentById(id)` | `/student/detail/:id` | POST | — | `Student` |
| `createStudent(data)` | `/student/add` | POST | `Student` | `Student` |
| `updateStudent(id, data)` | `/student/edit/:id` | POST | `Student` | `Student` |

### Student 字段
```ts
interface Student {
  id: number
  name: string
  gender: 'Male' | 'Female'
  age: number
  phone?: string
  schoolName?: string
  grade?: string
  guardianName?: string
  guardianPhone?: string
  remark?: string
  createdAt: string
  updatedAt: string
}
```

---

## 错误处理工具（`utils/normalizeError.js`）

| 导出 | 用途 |
| --- | --- |
| `ErrorKind` | 枚举：`NETWORK / UNAUTHORIZED / FORBIDDEN / NOT_FOUND / SERVER / VALIDATION / BUSINESS / UNKNOWN` |
| `normalizeError(err)` | 把任意输入归一化为带 `kind` / `status` / `code` / `data` 的 Error |
| `classifyError(err)` | 提取 kind 标签 |
| `getUserMessage(err, opts?)` | 返回中文展示文案 |
| `reportNormalized(err, extra?)` | 归一化 + 走 errorHandler 通道上报 |

详见源码注释。

## 工具函数（`utils/format.js`）

| 函数 | 入参 | 返回 |
| --- | --- | --- |
| `formatDate(dateString)` | string/number/Date | `yyyy/MM/dd hh:mm` |
| `formatGender(gender)` | `'Male' \| 'Female' \| string` | `'男' \| '女' \| 原值` |
| `formatAccountType(type)` | `'Admin' \| 'User' \| 'Student' \| string` | `'管理员' \| '公司用户' \| '学生' \| 原值` |
| `formatActiveStatus(active)` | boolean | `'激活' \| '未激活'` |

---

## 维护说明

- 新增 service 时请同步：
  1. `api/<name>.js` 中导出函数 + JSDoc
  2. 本文档新增一节，列出端点 + 入参 + 出参 + 类型
  3. 若有复杂业务逻辑，单独写 `doc/<FEATURE>.md`
- 错误码 / 错误结构若后端调整，请同步更新本文档「统一响应结构」一节
