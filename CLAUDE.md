# RGZW 管理后台系统

## 项目概述

RGZW 管理后台系统是一个基于 Vue 3 + Vite + Element Plus 构建的现代化单页应用，旨在为用户提供完整的管理功能。系统采用 Pinia 进行状态管理，Axios 进行 API 请求，并实现了完整的用户认证和权限控制。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 框架**: Element Plus
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **路由管理**: Vue Router 4
- **样式预处理器**: CSS

## 项目结构

```
rgzw_user/
├── public/                    # 静态资源
├── src/                       # 源代码目录
│   ├── api/                   # API 接口定义
│   ├── assets/                # 静态资源文件
│   ├── components/            # 公共组件
│   │   └── AdvancedSearch.vue # 高级搜索组件
│   ├── composables/           # Vue 3 composable
│   │   ├── useAccount.js      # 账户身份与权限判断（isAdmin/isManager/isUser/isStudent）
│   │   ├── useListPage.js     # 列表页通用逻辑
│   │   ├── useResponsive.js   # 响应式断点
│   │   └── useTour.js         # 新手引导
│   ├── router/                # 路由配置（含 requiresAdmin/requiresManager 守卫）
│   ├── stores/                # Pinia 状态管理
│   │   └── auth.js            # 认证状态管理（持有 currentOrgId）
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数（enums.js / format.js）
│   ├── views/                 # 页面组件
│   │   ├── Layout.vue         # 主布局组件（侧边栏按权限 v-if）
│   │   ├── Login.vue          # 登录页面（登录后异步加载 currentUser.Org）
│   │   ├── Dashboard.vue      # 仪表盘
│   │   ├── accounts/          # 账户管理页面（仅超管）
│   │   ├── users/             # 用户管理页面（≥ 经理，Org 选择器受控）
│   │   ├── orgs/              # 组织管理页面（仅超管）
│   │   ├── rooms/             # 教室管理页面（≥ 经理）
│   │   ├── subjects/          # 科目管理页面（≥ 经理）
│   │   ├── courses/           # 课程管理页面（≥ 经理，Org 范围控制）
│   │   ├── students/          # 学员管理页面（≥ 经理）
│   │   ├── packs/             # 课包管理页面（≥ 经理）
│   │   ├── orderPacks/        # 课包订单页面（≥ 经理，超管可编辑）
│   │   └── Analytics.vue      # 数据分析
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
├── doc/                       # 项目文档
│   ├── COURSE_ORG_SCOPING.md  # 课程管理 Org 范围控制（v7.2.1+）
│   └── ...
├── tests/
│   └── setup.js               # Vitest 全局 mock（ElMessage / matchMedia / Pinia）
├── index.html                 # HTML 模板
├── package.json               # 项目配置
├── vite.config.js             # Vite 配置
└── CLAUDE.md                  # 开发者文档
```

## 核心功能

### 1. 认证系统
- 登录/登出功能
- Token 持久化存储（localStorage）
- 自动认证状态恢复
- 权限路由保护

### 2. 页面模块
- 账户管理
- 用户管理（含高级搜索功能）
- 组织管理
- 教室管理（含批量操作、打印功能）
- 科目管理（含教学大纲、批量操作、打印功能）
- 课程管理（含排课规则、批量操作、打印功能、Org 范围控制 —— 详见 `doc/COURSE_ORG_SCOPING.md`）
- 学员管理（含高级搜索功能）
- 课包管理（按 Pack 模块 API：list/detail/add/edit/remove，含批量操作、打印功能）
- 仪表盘

### 3. 搜索增强功能
- 高级搜索面板（可折叠）
- 多维度搜索（关键词、时间范围、分类筛选、数值范围等）
- 智能匹配（多字段联合查询）
- 条件组合过滤
- 一键重置功能

### 4. 布局组件
- 侧边栏导航（菜单项按当前账户角色 `v-if` 过滤，见下方"权限模型"）
- 顶部导航栏
- 内区域

## 权限模型

### 账户类型（v2026-06-04 起）

账户类型枚举仅剩 `User` / `Student` 两种，**`Admin` 已彻底移除**：
- 后端 `JwtUtil.js` 移除了 `Admin` 死分支
- 前端 `utils/enums.js` 的 `ACCOUNT_TYPES` / `utils/format.js` 的 `formatAccountType` 同步清理
- 旧 token 里的 `accountType: 'Admin'` 输入到前端 `formatAccountType` 会**原样返回**（兜底，不翻译为"管理员"）

派生关系（不变量，**必须与后端 `payloadChecker.js` 一致**）：
```
isAdmin   ⇒  isManager   ⇒  isUser
                            ⇓
                        isStudent (互斥)
```
即 `isAdmin === true` ⇒ `roleTemp === 'manager'`。

### `useAccount` composable

`src/composables/useAccount.js` 是后端 `src/utils/payloadChecker.js` 4 个 helper 的前端镜像：

| helper | 含义 | 后端对应 |
|---|---|---|
| `isUser` | `accountType === 'User'` | `payloadChecker.isUser` |
| `isStudent` | `accountType === 'Student'` | `payloadChecker.isStudent` |
| `isManager` | `isUser` ∧ `currentUser.roleTemp === 'manager'` | `payloadChecker.isManager` |
| `isAdmin` | `isUser` ∧ `user.isAdmin === true` | `payloadChecker.isAdmin` |

外加 `currentOrgId`（`authStore.currentOrgId`）/ `ensureCurrentOrgId()`（带 fallback 的同步读取）。

**用法约定**：
- 页面**不要**自己写 `computed(() => auth.user?.isAdmin)` —— 一律 `const { isAdmin } = useAccount()`
- 按钮权限优先用 `v-if="isManager"`，不要在 `@click` 里 `if (!isAdmin) return`
- Org 选择器在非超管场景下 `:disabled="!isAdmin"`，并用 `ensureCurrentOrgId()` 自动回填

### 路由角色门禁

`router/index.js` 路由 meta 支持两种角色门禁：
- `meta: { requiresAdmin: true }` —— 仅超管（`accounts`、`orgs`）
- `meta: { requiresAdmin: false, requiresManager: true }` —— 经理及以上（`users` / `rooms` / `subjects` / `courses` / `students` / `packs` / `orderPacks`）

`beforeEach` 守卫读 `useAccount().isAdmin` / `isManager`，不通过则 `next('/layout/dashboard')` + `ElMessage.error(...)`。

**两层防御**：
1. **路由层**：防止 URL 直接跳转访问
2. **DAO 层（后端）**：即便前端绕过，后端 `daoAccount` / `daoUser` / ... 也会 403

前端是 UX 层，不参与权限决策。Org 字段**始终**由后端强制写 `currentUser.Org`。

## 认证机制

系统实现了完整的认证状态管理：

1. **登录**: 保存 accessToken 到 localStorage 和 Pinia Store
2. **状态恢复**: 页面加载时自动从 localStorage 恢复认证状态
3. **状态验证**: 通过后端 API 验证 token 有效性
4. **权限保护**: 路由守卫控制页面访问权限
5. **登出**: 清除所有认证相关信息

## 搜索功能

系统实现了强大的搜索功能：

### 高级搜索特性
1. **关键词搜索**: 支持在多个字段中进行全文检索
2. **时间范围筛选**: 可按时间段筛选数据
3. **分类筛选**: 提供多种下拉选项进行精确过滤
4. **数值范围筛选**: 支持年龄、金额等数值范围筛选
5. **智能匹配**: 支持不区分大小写的模糊匹配和多字段联合查询

### 实现方式
- 通用 AdvancedSearch 组件
- 动态查询条件构建
- 前端与后端协调过滤

## 开发规范

### 代码风格
- 使用 ESLint 和 Prettier 进行代码规范
- 组件名称使用 PascalCase
- 文件命名使用 kebab-case
- 遵循 Vue 3 最佳实践

### 组件规范
- 使用 Composition API
- 单文件组件 (SFC)
- Prop 类型定义
- 合理的组件拆分

### 提交规范
- 遵循 conventional commits 规范
- 描述性提交信息
- 功能分离提交

## 环境配置

### 开发环境
- 端口: 3000
- 代理: `/api` -> `http://localhost:8000`

### 后端依赖
- 确保后端服务运行在 `http://localhost:8000`
- 认证服务可用
- 所需 API 端点可用

## 常见问题

### 1. 刷新页面后回到登录页
- 检查 localStorage 中是否保存了认证信息
- 确认后端 `/api/user/self/` 端点是否可用
- 检查网络连接和 API 响应

### 2. 认证状态不一致
- 确保 localStorage 和 Pinia Store 同步
- 检查 token 有效期
- 确认后端服务正常

### 3. 路由权限问题
- 验证路由配置
- 检查认证状态
- 确认用户权限

### 4. 搜索功能问题
- 验证查询参数构建是否正确
- 检查后端API对高级搜索的支持
- 确认条件组合逻辑是否合理

## 部署说明

1. 构建应用: `npm run build`
2. 服务部署: 部署 dist 目录到 Web 服务器
3. 配置反向代理指向后端 API
4. 确保静态资源正确加载

## 更新日志

### v1.0.0
- 完成基础认证系统
- 实现页面路由和布局
- 添加账户、用户、组织、学员管理模块
- 实现 token 持久化和自动恢复功能
- 添加搜索增强功能，支持高级搜索和多维度过滤