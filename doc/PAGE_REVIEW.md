# 前端页面体检报告（v8.0.x 对齐后）

> 本报告基于 `rgzw_backend` v8.0.x 真实可用接口、`api/*` service 与所有 `views/**/*.vue` 源码对照得出。
> 用于：
>   1. 找出 7 个 CRUD 页面之间不一致 / 落后 / 多余的地方
>   2. 给出"以什么为标杆、向什么方向收敛"的具体决策
>   3. 作为后续 `DEVELOPMENT_STANDARD.md` 收口的事实依据

## 1. 评分维度

每个页面按 7 个维度评估 0–5 分（5 为最佳）：

| 维度 | 含义 |
| --- | --- |
| 列表加载 | listVD payload 正确（无被静默剔除字段）、`populate` 完整、loading / 分页处理 |
| 筛选 UX | 基础筛选 + 高级筛选、空值归一、reset 行为 |
| 表单提交 | 字段裁剪（去空）、校验规则、tab 拆分、关联资源（Org 选项）正确 |
| 批量操作 | 多选 + Promise.allSettled + 软删除、可取消 |
| 打印 | 选中 / 全部、formatter 完整 |
| 详情查看 | `viewDetail` 渲染完整、可读 |
| 错误处理 | 不掩盖 401、不重复 toast、loading 收尾 |

## 2. 总体打分

| 页面 | 列表 | 筛选 | 表单 | 批量 | 打印 | 详情 | 错误 | 合计 | 评级 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| **Rooms** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **35** | ⭐ 标杆 |
| **Subjects** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **35** | ⭐ 标杆 |
| **Courses** | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **28** | 良好（业务最重） |
| **Orgs** | 4 | 4 | 3 | 1 | 1 | 5 | 4 | **24** | 缺批量+打印 |
| **Users** | 4 | 4 | 3 | 4 | 4 | 4 | 4 | **27** | 待统一 |
| **Students** | 4 | 4 | 3 | 4 | 4 | 4 | 3 | **26** | 仍残留 `$or` |
| **Accounts** | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **21** | 落后 |

## 3. 各页优缺点

### 3.1 Rooms.vue（⭐ 标杆）
**优点**
- 列表 + 筛选 + 表单 + 批量 + 打印五件套齐全
- `populate: [{ path: 'Org', select: 'name' }]` 让"所属组织"展示为名称而非 `_id`
- 软删除：`batchDelete` 走 `updateRoom(id, { isActive: false })`，与后端 v7.x 路由注释一致
- 教室状态、激活状态分两套 tag + 双 formatter（`formatStatus` / `formatStatusType`）
- `saveRoom` 用 `validate()` 而非 callback，可读性更好
- `Org` 在编辑模式下 `disabled`，避免换组织

**改进点**
- `console.log` 残留（`Fetching rooms with params` / `Rooms response`），可移除
- 详情面板用 `ElMessageBox.alert + dangerouslyUseHTMLString`，可考虑抽 `DetailDialog` 组件
- 教室状态值用裸字符串（`available` / `in_use` / `maintenance`），建议抽到 `utils/enums.js` 统一管理

### 3.2 Subjects.vue（⭐ 标杆）
**优点**
- 与 Rooms 完全同构：批量（激活/禁用/展示/隐藏）、打印、详情、populate 一致
- 教学大纲子表（`syllabus` 数组）保存前做了"空项过滤"
- `deactivateSubject` 命名清晰，注释里说明后端无 `/remove` 路由
- 价格 `formatPrice(priceInCents)` 统一按"分"换算

**改进点**
- 分类枚举（`C++ / Python / Scratch / Spike / 电子智慧大颗粒`）硬编码在模板 × 2 处，应抽 `SUBJECT_CATEGORIES`
- `saveSubject` 内联字段裁剪（`if (sort !== null) ...`）可以再抽 `pickDefined()`
- 详情面板同样用 `dangerouslyUseHTMLString`，XSS 面要小心

### 3.3 Courses.vue（业务最重）
**优点**
- 自带 Org 范围控制（`currentOrgId`），创建时下拉按 Org 过滤，是全站最完整的多租户实现
- 排课规则子表（`scheduleRules`）结构清晰
- 软删除走 `deleteCourse(id)`（封装在 api 层）

**改进点**
- 体积过大（1515 行），建议拆 `CourseFormDialog.vue` / `ScheduleRuleEditor.vue`
- `populate` 仍按 ID 拼接处有几处是 `populate.Org.name` 直接渲染，但表头 `prop` 列里如果包含未 populate 的字段会展示 `undefined`

### 3.4 Orgs.vue
**优点**
- `isMain` / `isActive` 状态用 switch 控件
- 主机构用高亮颜色 `.main-org`
- 列表筛选已按 v8.0.1 改为 `filter.regExp`（DAO 内部走 name/nickname 模糊）

**改进点**
- 缺批量操作（多选 + 批量激活/禁用）
- 缺打印工具栏
- 校验链过长（name 2-100 / nickname 1-50 / phone 7-20 / email 100 / website 200 / address 200 …）且与后端 listVD 字段存在不对齐（`email` / `website` 后端模型可能并未启用）

### 3.5 Users.vue
**优点**
- 双标签页（用户信息 / 账户信息）实现"创建用户必须关联账户"的业务约束
- 支持"绑定现有账户"或"新建账户"两种模式
- `populate: Account + Org` 都已配置
- 已按 v8.0.1 把高级搜索的 `$or` 改为 `regExp`

**改进点**
- 高级搜索的 `dateRange` 仍走 `filter.createdAt.$gte/$lte`，但 AdvancedSearch 组件的 `dateRange` 类型不确定是字符串还是 Date，要在 buildQuery 里规整
- 角色 `roleTemp` 是 `'manager' | 'teacher'`，与后端对齐，但 formatter 还是裸字符串
- 详情面板有"头像"展示但实际后端未回传，UI 一直 `-`

### 3.6 Students.vue
**优点**
- 高级搜索支持"年龄范围 → 出生日期范围"换算，是个有价值的封装
- 真实姓名 / 学校 / 身份证号 / 状态 4 维基础筛选
- `populate: Account + Org` 完整
- v8.0.1 把多字段 `$or` 改为 `filter.regExp = primaryKeyword`，但 `primaryKeyword` 是"第一个非空值"，粒度退化

**改进点**
- `advancedFilters.keyword` 那条 `filter.$or = [name/school/sourceType]` **仍存在**，后端会静默剔除；要把高级搜索关键词也并入 `regExp`
- 详情面板硬塞 `dangerouslyUseHTMLString` + 内联字符串，未抽组件
- `calculateAge` 可放 `utils/format.js`

### 3.7 Accounts.vue（最落后）
**优点**
- 自带行展开：展开后异步加载关联 User / Student
- 筛选条件只有 3 个（accountType / name / isActive）

**改进点**
- "新增账户" 按钮直接调 `POST /account/add`：后端不推荐这条路径（详见 [SECTION 6]），但仍挂着没去
- 缺少打印工具栏
- 关联 User / Student 加载时把数据塞进 `row.relatedUsers = []` 这类可变字段，没有专门的 state，刷新展开行会丢
- 行展开 + 关联加载逻辑（`loadRelatedData`）应该抽成独立 composable `useRelatedLoader`

## 4. 跨页面共性问题

1. **payload 拼接无统一封装** —— 7 个页面各自手搓 `filter` / `options` / `populate`，逻辑重复 7 份；尤其 `skip = (page-1) * size` 同样 7 份
2. **批量操作结构完全相同**（多选 + Promise.allSettled + 软删除），但每个页面都手抄一遍
3. **打印配置 7 份**，但 `printTable` 工具已经统一，问题在于调用处
4. **详情面板 7 份 `ElMessageBox.alert + dangerouslyUseHTMLString`**，全是手搓 HTML 字符串
5. **后端 `matchedData()` 静默剔除字段**的事故至少发生过 2 次（之前 Users / Students / Orgs / Accounts 都中招），需要写一个 `utils/listPayload.js` 来集中白名单
6. **`console.log` 残留**（`console.log('Sending request with params:', params)`），生产环境不应该打
7. **.vue 文件命名混用**：本项目历史已经统一为 `*.vue` PascalCase，但 `src/api/` 里没有这个问题
8. **JSDoc 几乎为空**：`api/<name>.js` 里部分方法没有 `@param` / `@returns` 注释
9. **store 持久化无统一封装**：登录后异步加载 `currentOrgId` 写在 `Login.vue` 里，再通过 `authStore.setCurrentOrgId` 写入，但每个用到 Org 的页面都得自己调 `getCurrentUserOrg` 才能兜底

## 5. 改造方向（落地为本轮行动项）

按以下顺序推进：

1. **抽 `utils/listPayload.js`**：把 `buildListPayload({ filter, sort, page, pageSize, populate, populateOrg })` 统一封装，强制走白名单字段
2. **抽 `utils/enums.js`**：把 `ROOM_STATUS` / `SUBJECT_CATEGORIES` / `ACCOUNT_TYPES` / `USER_ROLES` 等枚举集中管理
3. **抽 `components/DetailDialog.vue`**：把 7 处 `ElMessageBox.alert` 详情面板统一
4. **抽 `composables/useListPage.js`**：把 `pagination + loading + selectedRows + reset + handleSizeChange + handleCurrentChange + handleSelectionChange + batchUpdateXxx` 集中
5. **按上述三件套升级 4 个落后页**（Users / Students / Orgs / Accounts），保留各自业务字段
6. **重写 `DEVELOPMENT_STANDARD.md`**：把上述工具/组件的"必走"规则写进去
7. **同步 `FRONTEND_API.md` / `PAGE_STRUCTURE.md`**：与本轮新约定保持一致

## 6. 不在本轮改造范围（避免越界）

- **"新增账户"按钮**：后端 `apiDesc.md` 标"不直接提供该路由"但实际 `index.routes.js` 仍挂着，单独出来的 Account 没有 User/Student 身份。要么删按钮、要么重定向到"新增用户/学生"。属于产品决策。
- **后端模型里没启用的字段**（Users / Accounts 的 `email` / `address` / `currentAddress` 等）：继续在表单展示，后端 `matchedData` 静默丢弃；不影响流程。
- **课程模块拆文件**：业务体量大，需要更多设计；本轮只升级"格式规范"层。
- **后端 v8.1+ 的预期变更**：本轮以 v8.0.x 为准。
