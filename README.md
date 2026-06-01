# RGZW 管理后台系统

## 项目简介

RGZW 管理后台系统是一个现代化的 Web 应用，旨在为用户提供完整的管理和操作界面。系统采用 Vue 3 技术栈构建，具有良好的性能和用户体验。

## 项目结构

```
rgzw_user/
├── public/                    # 静态资源
├── src/                       # 源代码目录
│   ├── api/                   # API 接口定义
│   ├── assets/                # 静态资源
│   ├── components/            # 公共组件
│   ├── router/                # 路由配置
│   ├── stores/                # 状态管理
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数
│   ├── views/                 # 页面组件
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
├── doc/                       # 项目文档
│   ├── PAGE_STRUCTURE.md      # 页面结构文档
│   └── DEVELOPMENT_STANDARD.md # 开发规范文档
├── CLAUDE.md                  # 开发者文档
├── index.html                 # HTML 模板
├── package.json               # 项目配置
├── vite.config.js             # Vite 配置
└── README.md                  # 项目说明
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- npm 或 pnpm 或 yarn

### 安装依赖
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 开发模式
```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

### 构建生产版本
```bash
npm run build
# 或
pnpm build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
pnpm preview
# 或
yarn preview
```

## 核心特性

### 1. 认证系统
- 完整的登录/登出流程
- Token 持久化存储
- 页面刷新后自动恢复认证状态
- 路由权限保护

### 2. 响应式设计
- 移动端友好的界面
- 自适应布局
- 优雅的交互体验

### 3. 现代化技术栈
- Vue 3 + Composition API
- Vite 构建工具
- Element Plus UI 组件库
- Pinia 状态管理

### 4. 代码质量
- ESLint 代码规范
- 统一的开发规范
- 模块化组件设计

## 功能模块

### 1. 账户管理
- 账户信息查看
- 账户权限管理
- 登录状态管理

### 2. 用户管理
- 用户信息管理
- 用户列表展示
- 用户详情查看

### 3. 组织管理
- 组织架构管理
- 部门信息管理
- 组织关系维护

### 4. 学员管理
- 学员信息管理
- 学员状态跟踪
- 学员成绩管理

### 5. 仪表盘
- 系统概览
- 数据统计
- 快捷入口

## API 接口

系统与后端 API 通信，主要接口包括：

- `/api/auth/login` - 用户登录
- `/api/auth/logout` - 用户登出
- `/api/user/self/` - 获取当前用户信息
- `/api/user/list/` - 获取用户列表
- 其他管理相关接口

## 开发规范

请参考 `doc/DEVELOPMENT_STANDARD.md` 了解详细的开发规范和最佳实践。

## 页面结构

请参考 `doc/PAGE_STRUCTURE.md` 了解详细的页面布局和组件结构。

## 部署说明

### 构建
```bash
npm run build
```

### 服务部署
- 构建后的文件在 `dist/` 目录
- 配置 Web 服务器服务静态文件
- 设置路由重定向到 `index.html`
- 配置 API 代理或 CORS

## 常见问题

### 1. 页面刷新后需要重新登录
这是认证状态管理问题，请确保：
- localStorage 中保存了认证信息
- 后端 `/api/user/self/` 端点可访问
- 网络连接正常

### 2. 组件热更新失败
- 检查 Vite 配置
- 确保文件保存正确
- 重启开发服务器

### 3. API 请求失败
- 检查后端服务是否运行
- 确认 API 地址配置
- 检查网络连接

## 技术支持

如遇问题，请参考项目文档或联系开发团队。

## 版本历史

### v1.0.0
- 初始化项目
- 实现核心管理功能
- 完成认证系统
- 实现响应式界面

---

**注意**: 本系统依赖后端服务，确保后端服务正常运行。