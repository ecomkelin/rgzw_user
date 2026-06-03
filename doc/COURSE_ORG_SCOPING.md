# 课程管理页 Org 范围控制 & 关联字段 populate 展示

> 本文档记录 `courses/Courses.vue` 与认证流程中关于 **「课程所属 Org 必须等于当前登录用户 Org」** 以及 **「课程列表主讲老师 / 默认教室 populate 出 name 展示」** 的改动，方便后续开发参考。
>
> 改动时间：v7.2.1
>
> 涉及文件：
>
> - `src/stores/auth.js`
> - `src/views/Login.vue`
> - `src/views/courses/Courses.vue`

---

## 1. 背景与目标

### 1.1 业务背景

后端 `Course.model.js` 中：

- `Course.Org` 为 `required: true`，且 `CourseDAO.add` 会在创建时把 `doc.Org` 强制覆盖为 `payload.currentUser.Org`（即「机构隔离」）。
- 课程关联的 `mainTeacher / assistantTeacher` 必须是同一 `Org` 下的 `User`，`defaultRoom` 必须是同一 `Org` 下的 `Room`，否则后端校验 / 业务层面会出现跨机构串数据。

### 1.2 修改前的问题

- 课程列表「主讲老师」「默认教室」两列展示的是 `ObjectId`（回退为 `老师ID:xxxxxx...` / `教室ID:xxxxxx...`）。
- 课程新增时，下拉里的「所属科目 / 主讲老师 / 助教 / 默认教室」是**全平台**的，不限当前登录用户所属机构。
- 前端没有持久化 `currentUser.Org`，每次新增课程都要现拼 `Org`，且容易漏写。

### 1.3 修改目标

1. 课程列表中 `mainTeacher / assistantTeacher / defaultRoom` 通过 `populate` 展示出真实姓名 / 教室名。
2. 课程新增时：
   - `Org` 自动从 `payload.currentUser.Org` 取值（前端持久化到 store + localStorage）。
   - 下拉里的「所属科目 / 主讲老师 / 助教 / 默认教室」全部按当前 Org 过滤。
3. 拿不到 Org 时，非管理员直接拒绝新增。

---

## 2. populate 展示姓名（列表 / 详情 / 打印）

后端 list 接口的 `options.populate` 是数组（`backend/src/utils/validatorHandle.js` 中 `populateValidator` 校验），每一项形如：

```js
{ path: '字段名', select: '字段1 字段2' }
```

`Course.model.js` 中字段类型：

| 字段 | ref | 需要的 select |
| --- | --- | --- |
| `mainTeacher` / `assistantTeacher` | `User` | `nickname roleTemp`（User 文档本身没有 `name`，昵称字段是 `nickname`） |
| `defaultRoom` | `Room` | `name capacity location` |
| `Subject` | `Subject` | `name category` |

### 2.1 Courses.vue 中的 list populate

`src/views/courses/Courses.vue` 的 `fetchCourses`：

```js
const options = {
  limit: pagination.pageSize,
  sortObj: { sort: -1, createdAt: -1 },
  populate: [
    { path: 'Subject', select: 'name category' },
    { path: 'mainTeacher', select: 'nickname roleTemp' },
    { path: 'assistantTeacher', select: 'nickname roleTemp' },
    { path: 'defaultRoom', select: 'name capacity location' }
  ]
}
```

### 2.2 表格渲染

`mainTeacher / defaultRoom` 两列已经使用 template：

```vue
<el-table-column prop="mainTeacher" label="主讲老师" width="120">
  <template #default="{ row }">
    {{ getTeacherName(row.mainTeacher) }}
  </template>
</el-table-column>
<el-table-column prop="defaultRoom" label="默认教室" width="120">
  <template #default="{ row }">
    {{ getRoomName(row.defaultRoom) }}
  </template>
</el-table-column>
```

辅助函数（处理 populate 后为对象 / 未 populate 回退为字符串 ID 两种情况）：

```js
const getTeacherName = (teacher) => {
  if (!teacher) return '-'
  // populate 后是对象，包含 nickname 等字段
  if (typeof teacher === 'object') {
    return teacher.nickname || teacher.Account?.name || '-'
  }
  return '老师ID:' + (teacher._id || teacher).substring(0, 8) + '...'
}

const getRoomName = (room) => {
  if (!room) return '-'
  if (typeof room === 'object') {
    return room.name || '-'
  }
  return '教室ID:' + (room._id || room).substring(0, 8) + '...'
}
```

> 注意：User 的 Account 是 ObjectId 引用，**不允许**通过二次 populate 取出（`validatorHandle.js` 中嵌套 populate 白名单只允许 `leaderId / deptId / parentId`），所以前端只能取 `User.nickname`。如果未来需要展示真实姓名，要么把 `name` 字段也加到 User 模型，要么后端对 Account 做一次 populate 再展开。

---

## 3. Org 的获取与持久化

### 3.1 数据来源

- 登录接口 `/api/auth/login` 返回 `account.currentUser`（`ObjectId`），`Org` 字段在 User 文档上。
- 因此**仅靠登录响应拿不到 Org**，必须再请求一次 `/user/detail/:currentUserId` 取 `item.Org`。

### 3.2 三段式策略

1. **登录时**：`Login.vue` 登录成功后异步调用 `userService.getUserById(account.currentUser)`，把 `item.Org` 写入 `authStore.setCurrentOrgId(orgId)`，并持久化到 `localStorage('currentOrgId')`。这一步不阻塞跳转。
2. **启动时**：`stores/auth.js` 的 `initializeAuth()` 从 `localStorage` 恢复 `currentOrgId`，避免首屏空白闪烁。
3. **业务页兜底**：`Courses.vue` 的 `ensureCurrentOrgId()`：
   - store 有 → 直接返回；
   - store 没有但 `authStore.user.currentUser` 存在 → 实时调用 `getUserById` 拉一次；
   - 仍拉不到 → 非管理员直接拒绝新增。

### 3.3 auth store 改动

`src/stores/auth.js`：

```js
state: () => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  currentOrgId: null,        // ← 新增
  isAuthenticated: false,
  authChecked: false
}),

getters: {
  currentUser: (state) => state.user,
  currentAccessToken: (state) => state.accessToken,
  currentOrgIdValue: (state) => state.currentOrgId,   // ← 新增
  isAuthChecked: (state) => state.authChecked
},

actions: {
  // ...
  setCurrentOrgId(orgId) {
    this.currentOrgId = orgId || null
    if (orgId) {
      localStorage.setItem('currentOrgId', orgId)
    } else {
      localStorage.removeItem('currentOrgId')
    }
  },

  logout() {
    this.user = null
    this.accessToken = null
    this.refreshToken = null
    this.currentOrgId = null          // ← 新增
    this.isAuthenticated = false
    this.authChecked = true
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('currentOrgId')   // ← 新增
    // ...
  }
}
```

`initializeAuth()` 中新增从 localStorage 恢复 `currentOrgId`：

```js
const storedOrgId = localStorage.getItem('currentOrgId')
if (storedOrgId) {
  this.currentOrgId = storedOrgId
}
```

### 3.4 Login.vue 改动

`src/views/Login.vue`：

```js
import { userService } from '../api/user'   // ← 新增

const loadCurrentUserOrg = async (account) => {
  const currentUserId = account?.currentUser
  if (!currentUserId) return null   // Student 账户没有 currentUser
  try {
    const res = await userService.getUserById(currentUserId)
    return res?.data?.data?.item?.Org || null
  } catch (e) {
    console.error('Failed to load current user Org after login:', e)
    return null
  }
}

// handleLogin 成功分支
authStore.setTokens(accessToken, null)
authStore.setUser(account)
loadCurrentUserOrg(account).then((orgId) => {
  authStore.setCurrentOrgId(orgId)
})
ElMessage.success('登录成功')
router.push('/layout/dashboard')
```

> 异步加载不阻塞跳转；业务页进入时会再走 `ensureCurrentOrgId()` 兜底。

---

## 4. Courses.vue 改动

### 4.1 计算属性 + 兜底函数

```js
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const currentOrgId = computed(() => authStore.currentOrgId || null)

const ensureCurrentOrgId = async () => {
  if (authStore.currentOrgId) return authStore.currentOrgId
  const currentUserId = authStore.user?.currentUser
  if (!currentUserId) return null
  try {
    const res = await userService.getUserById(currentUserId)
    const orgId = res?.data?.data?.item?.Org || null
    authStore.setCurrentOrgId(orgId)
    return orgId
  } catch (e) {
    console.error('Failed to fetch current user Org:', e)
    return null
  }
}
```

### 4.2 三个下拉的 Org 过滤

`fetchSubjects / fetchUsers / fetchRooms` 都改为：

```js
const filter = { isActive: true }
if (currentOrgId.value) filter.Org = currentOrgId.value
const response = await xxxService.getXxx({ filter, options: { ... } })
```

> 拿不到 Org 时不传 `Org` 过滤（即「全平台」），方便后续在管理后台对所有 Org 数据做维护（若以后要更严格，可改为「拿不到就直接拒绝加载」）。

后端对应 validator 都已支持 `filter.Org`（见后端模块 `_school/course` / `_school/subject` / `_organization/room` / `_organization/user` 的 `middlewares/validator.js`）。

### 4.3 打开新增对话框

```js
const openCreateDialog = async () => {
  const orgId = await ensureCurrentOrgId()
  if (!orgId && !authStore.user?.isAdmin) {
    ElMessage.error('无法识别当前用户所属机构（Org），无法创建课程')
    return
  }
  // 重新拉取当前 Org 下的可选数据，保证下拉与本次创建一致
  await Promise.all([fetchSubjects(), fetchUsers(), fetchRooms()])
  // ... 原有重置表单逻辑
}
```

### 4.4 保存时携带 Org

```js
const courseData = {
  name: dialog.form.name,
  Subject: dialog.form.Subject,
  mainTeacher: dialog.form.mainTeacher,
  defaultRoom: dialog.form.defaultRoom,
  totalSessions: dialog.form.totalSessions,
  frequency: dialog.form.frequency,
  maxStudents: dialog.form.maxStudents,
  price: dialog.form.price,
  status: dialog.form.status,
  isActive: dialog.form.isActive
}

const orgId = authStore.currentOrgId
if (orgId) {
  courseData.Org = orgId
}
```

> 双重保险：后端 `CourseDAO.add` 在 `doc.Org = payload.currentUser.Org;` 会再覆盖一次（`rgzw_backend/src/models/school/course/Course.dao.js:131`），所以即使前端漏传 / 写错，后端仍以 `payload.currentUser.Org` 为准。

### 4.5 挂载时序

```js
onMounted(async () => {
  await ensureCurrentOrgId()
  await Promise.all([fetchSubjects(), fetchUsers(), fetchRooms()])
  fetchCourses()
})
```

---

## 5. 后续开发建议

1. **跨页面复用**：其他管理页（学员、订单、成绩等）若也要按 Org 过滤，可直接用 `authStore.currentOrgId` + `ensureCurrentOrgId()`，不需要重复实现。
2. **管理员场景**：管理员 `isAdmin` 时不强校验 Org，但下拉里仍以当前 `currentOrgId` 过滤（如果需要「管理员可跨机构选」，可加一个 Org 切换器，并在 `filter` 里动态替换）。
3. **Org 切换 / 多机构账号**：若未来账号支持多机构（`Account.currentUser` 是单个 ObjectId），需要扩展为「选机构」交互，并在切换时调 `setCurrentOrgId` + 重新拉下拉数据。
4. **测试覆盖**：
   - Login.vue 异步加载 Org 失败的兜底（store 中 `currentOrgId` 仍为 null，路由仍能跳）
   - Courses.vue `ensureCurrentOrgId` 命中缓存 vs 回拉两条路径
   - `openCreateDialog` 在非管理员且无 Org 时的拒绝路径
5. **populate 字段**：后续若 `User` 模型加上真实 `name` 字段，把 `getTeacherName` 调整为 `teacher.name || teacher.nickname` 即可，无需改 populate。
