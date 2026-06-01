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
│   │   ├── auth.js            # 认证相关API
│   │   └── http.js            # HTTP 客户端配置
│   ├── assets/                # 静态资源文件
│   ├── components/            # 公共组件
│   ├── router/                # 路由配置
│   ├── stores/                # Pinia 状态管理
│   │   └── auth.js            # 认证状态管理
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数
│   ├── views/                 # 页面组件
│   │   ├── Layout.vue         # 主布局组件
│   │   ├── Login.vue          # 登录页面
│   │   ├── Dashboard.vue      # 仪表盘
│   │   ├── accounts/          # 账户管理页面
│   │   ├── users/             # 用户管理页面
│   │   ├── orgs/              # 组织管理页面
│   │   └── students/          # 学员管理页面
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
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
- 用户管理
- 组织管理
- 学员管理
- 仪表盘

### 3. 布局组件
- 侧边栏导航
- 顶部导航栏
- 内容区域

## 认证机制

系统实现了完整的认证状态管理：

1. **登录**: 保存 accessToken 到 localStorage 和 Pinia Store
2. **状态恢复**: 页面加载时自动从 localStorage 恢复认证状态
3. **状态验证**: 通过后端 API 验证 token 有效性
4. **权限保护**: 路由守卫控制页面访问权限
5. **登出**: 清除所有认证相关信息

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