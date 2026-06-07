# 版本更新日志

## v8.4.1
- [新增] 学生课包页面管理

## v8.3.0
- [后端一致] 8.1.1 和 后端的 8.2.2 一致。 
- 8.3.0 两端一致

## v8.1.1
- 课包订单优化
# 问题 账户管理页面 子表没有数据

## v8.1.0
- [新增] 课包订单管理
- [bugger 全局] 解决刷新页面的缓存store和登陆后的缓存store不一致问题

## v8.0.3
- [新增] 课包管理页面

## v8.0.2
- **页面体检 + 模板统一**（参见 [doc/PAGE_REVIEW.md](./doc/PAGE_REVIEW.md)）：
  - 新增 `utils/listPayload.js`：`buildListPayload / appendExact / appendBoolean / appendRegExp / appendDateRange / unwrapListResponse / APP_DEFAULT_POPULATE` —— 7 个 CRUD 页面不再手搓 filter
  - 新增 `utils/enums.js`：`ROOM_STATUS / SUBJECT_CATEGORIES / ACCOUNT_TYPES / USER_ROLES / GENDER_OPTIONS` + 各自的 `formatXxx` / `xxxTagType`
  - 新增 `composables/useListPage.js`：分页 / 选中 / 批量三件套（`batchUpdateField` / `batchDeactivate`）
  - 新增 `components/DetailDialog.vue`：替代散落的 `ElMessageBox.alert + dangerouslyUseHTMLString`，XSS 安全
- **4 个落后页面已按统一模板重写**：
  - `Orgs.vue`：新增批量操作（激活 / 禁用 / 主机构切换）+ 打印工具栏 + `DetailDialog` + `listPayload`
  - `Students.vue`：高级搜索的 `$or` 全部收敛到 `regExp`；`calculateAge` 抽到 `format.js#formatBirthdayAge`；编辑模式下表单不再有"学校"重复字段
  - `Users.vue`：移除 `console.log` 残留；`saveUser` 用 `pickDefined` 统一 body 构造；详情改 `DetailDialog`
  - `Accounts.vue`：行展开的关联加载逻辑保留；`viewDetail` 改 `DetailDialog`；`saveAccount` 改 `pickDefined`；新增用户/学生对话框改名为 `saveRelatedUser/Student` 与 `saveUser` 区分
- **util 测试**：
  - 新增 `utils/enums.test.js`（24 个 case）
  - 新增 `utils/listPayload.test.js`（17 个 case）
  - `utils/format.test.js` 增补 `formatBirthdayAge`（2 个 case）
  - 测试总数：61 → 105
- **文档重写 / 同步**：
  - 重写 [doc/DEVELOPMENT_STANDARD.md](./doc/DEVELOPMENT_STANDARD.md)：基于现有代码真实状态，新增「§1 新增页面 checklist」作为强制流程
  - 重写 [doc/FRONTEND_API.md](./doc/FRONTEND_API.md)：补「listVD 字段白名单」表 + utils/composable 章节
  - 更新 [doc/PAGE_STRUCTURE.md](./doc/PAGE_STRUCTURE.md)：新增 4 节公共工具介绍 + 修正 API 端点
  - 新增 [doc/PAGE_REVIEW.md](./doc/PAGE_REVIEW.md)：7 个页面的体检报告
- **构建**：`pnpm build` 通过；7 个页 chunk size 都比 v8.0.1 缩水（删了 7 份重复 if-链）

## v8.0.1
- 与后端 v8.x 同步：
  - 修复 `/api/auth/logout` 走 GET 的问题，改为 POST（与后端路由对齐）
  - 修复 `authStore.logout()` 直接 fetch 走 GET 的问题，改为 POST
  - 修复 `authStore.checkAuthStatus()` 验证端点 `/api/user/self/` 末尾的尾斜杠（404 旁路），改为 `/api/user/self`，并正确解析 `data.item` 写入 user
  - 清理：移除 `api/room.js` 中 `deleteRoom`（后端 /remove 路由已注释），`Rooms.vue` 批量删除改为软删除（`updateRoom(id, { isActive: false })`）
  - 清理：`api/subject.js` 中 `deleteSubject` 重命名为 `deactivateSubject`，`Subjects.vue` 调用方同步更新
  - 清理：删除 `views/accounts/Accounts_updated.vue` 死文件
  - 修复：`Users.vue` 关键词搜索用 `$or` 多字段正则会被后端 `matchedData()` 静默剔除，改用 `filter.regExp`（DAO 内部走 nickname 模糊）
  - 修复：`Students.vue` 把 `filter.name / school / identityNo` 的 $regex 合并为 `filter.regExp`
  - 修复：`Orgs.vue` 把 `filter.$or`（name/nickname）改为 `filter.regExp`（DAO 内部走 name/nickname 模糊）
  - 修复：`Accounts.vue` 把无效的 `filter.name.$regex` 移除（账户模块 listVD 未提供模糊搜索）

## v7.4.2
- 后端统一 sortObj 修改成了 sort 前端也需要

## v7.3.1
- 根据后端 修正了 登陆 id 问题

## v7.3.0
- 修改了 Province 这个字符串

## v7.2.2
- 优化course 编辑

## v7.2.1
- 课程列表的主讲老师 / 默认教室等关联字段通过 `populate` 展示真实姓名（nickname / room.name），不再显示 ID
- 课程管理新增 Org 范围控制：
  - 登录后异步拉取 `account.currentUser.Org`，持久化到 `authStore.currentOrgId` + `localStorage('currentOrgId')`
  - 课程新增页的下拉（所属科目 / 主讲老师 / 助教 / 默认教室）按当前 Org 过滤
  - 创建课程时携带 `Org`，由后端 `payload.currentUser.Org` 兜底覆盖
  - 拿不到 Org 时非管理员直接拒绝新增
- 详见 `doc/COURSE_ORG_SCOPING.md`

## v7.2.0
- 增加了 课程 course 的管理页面

## v7.1.0
- 增加了 subject 科目的管理页面

## v7.0.1
- 增加了 账户用户的打印和批量管理功能

## v7.0.0
- 增加了 教室模块

## v6.1.4
- [x] 优化移动端用户体验

## v6.1.3
- [x] 添加更完善的用户引导

## v6.1.2
- 完成了 todos.md 的技术债务
- [x] 统一错误处理机制
- [x] 测试覆盖率提升
- [x] 代码注释完善
- [x] API文档完善

## v6.1.1
- 添加全局错误边界处理组件崩溃

## v6.1.0
- 增加了 搜索增强功能

## v6.0.1
- 增加了 一些文档 claude.md 开发文档 todo.md

## v6.0.0
- 刷新跳转登陆页面问题 修复完成

## v5.0.2
- 修改好了， 与后台无关

## v5.0.1
- 无法启动

## v5.0.0
- 基础项目测试完成
- 与后端 同步更新 5.0