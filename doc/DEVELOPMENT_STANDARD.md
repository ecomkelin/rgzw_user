# RGZW 管理后台开发规范

## 1. 代码规范

### 1.1 JavaScript/ES6+ 规范

#### 语法规范
- 使用 ES6+ 语法
- 使用 `const` 和 `let` 替代 `var`
- 使用箭头函数（在适当场景下）
- 使用模板字符串
- 使用解构赋值
- 使用默认参数和展开运算符

#### 代码风格
```javascript
// ✅ 推荐
const getUserInfo = async (userId) => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// ❌ 不推荐
function getUserInfo(userId) {
  return api.getUser(userId).then(function(response) {
    return response.data;
  }).catch(function(error) {
    console.log('获取用户信息失败:' + error);
  });
}
```

### 1.2 Vue 组件规范

#### 组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 组合式 API 代码
</script>

<style scoped>
/* 组件样式 */
</style>
```

#### 命名规范
- 组件文件名: PascalCase (如 `UserProfile.vue`)
- 组件标签: kebab-case (如 `<user-profile />`)
- 组件名称: PascalCase (在注册时)
- Props: camelCase
- 事件: kebab-case (在模板中使用时)
- 方法: camelCase

### 1.3 文件命名规范

#### 通用规则
- 目录名: kebab-case (如 `user-management`)
- 文件名: kebab-case (如 `user-list.vue`)
- JavaScript 文件: camelCase 或 kebab-case

#### 目录结构
```
src/
├── components/           # 公共组件
│   ├── Base/            # 基础组件
│   ├── Form/            # 表单组件
│   ├── Table/           # 表格组件
│   └── Search/          # 搜索组件（如 AdvancedSearch.vue）
├── views/               # 页面组件
│   ├── User/            # 用户模块页面
│   ├── Account/         # 账户模块页面
│   └── Common/          # 通用页面组件
├── stores/              # 状态管理
├── api/                 # API 接口
├── utils/               # 工具函数
└── router/              # 路由配置
```

## 2. 组件开发规范

### 2.1 组件设计原则

#### 单一职责
每个组件应该只负责一个特定的功能或UI元素。

```vue
<!-- ✅ 单一职责 -->
<template>
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="email" label="邮箱" />
  </el-table>
</template>
```

#### 组件复用
提取公共功能为独立组件。

```vue
<!-- TableList.vue -->
<template>
  <div class="table-list">
    <el-table :data="data" v-loading="loading">
      <slot></slot>
    </el-table>
    <el-pagination
      v-if="showPagination"
      :current-page="pagination.page"
      :page-size="pagination.size"
      :total="pagination.total"
    />
  </div>
</template>
```

### 2.2 Props 定义规范

```javascript
// ✅ 完整的 Props 定义
defineProps({
  title: {
    type: String,
    required: true,
    default: ''
  },
  data: {
    type: Array,
    default: () => []
  },
  status: {
    type: String,
    validator: (value) => ['active', 'inactive', 'pending'].includes(value),
    default: 'active'
  }
});
```

### 2.3 事件处理规范

```vue
<script setup>
// ✅ 清晰的事件处理
const emit = defineEmits(['update:modelValue', 'change', 'save']);

const handleChange = (value) => {
  emit('update:modelValue', value);
  emit('change', value);
};

const handleSave = async () => {
  try {
    await saveData();
    emit('save');
  } catch (error) {
    console.error('保存失败:', error);
  }
};
</script>
```

## 3. API 调用规范

### 3.1 API 模块化

```javascript
// api/user.js
import http from './http';

export const userApi = {
  // 获取用户列表
  getList(params) {
    return http.post('/user/list/', params);
  },
  
  // 获取用户详情
  getDetail(id) {
    return http.post(`/user/detail/${id}`);
  },
  
  // 创建用户
  create(data) {
    return http.post('/user/add/', data);
  },
  
  // 更新用户
  update(id, data) {
    return http.post(`/user/edit/${id}`, data);
  }
};
```

### 3.2 错误处理

```javascript
// ✅ 统一的错误处理
const handleSubmit = async () => {
  try {
    loading.value = true;
    const response = await userApi.update(userId, formData);
    
    if (response.data.success) {
      ElMessage.success('更新成功');
      emit('success');
    } else {
      ElMessage.error(response.data.message || '操作失败');
    }
  } catch (error) {
    console.error('API 调用失败:', error);
    ElMessage.error(error.response?.data?.message || '网络错误');
  } finally {
    loading.value = false;
  }
};
```

## 4. 状态管理规范 (Pinia)

### 4.1 Store 定义

```javascript
// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    profile: null,
    permissions: [],
    loading: false
  }),
  
  // 计算属性
  getters: {
    isAuthenticated: (state) => !!state.profile,
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission);
    }
  },
  
  // 动作
  actions: {
    async fetchProfile() {
      this.loading = true;
      try {
        const response = await userApi.getProfile();
        this.profile = response.data;
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        this.loading = false;
      }
    }
  }
});
```

### 4.2 Store 使用

```vue
<script setup>
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// 在组件中使用
const { profile, loading } = storeToRefs(userStore);
</script>
```

## 5. 路由规范

### 5.1 路由定义

```javascript
// router/index.js
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true } // 访客权限
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true } // 认证权限
  }
];
```

### 5.2 路由守卫

```javascript
// ✅ 路由守卫规范
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});
```

## 6. 搜索功能规范

### 6.1 高级搜索组件规范

高级搜索功能使用统一的 `AdvancedSearch` 组件，遵循以下规范：

```vue
<!-- 在需要高级搜索的页面中使用 -->
<template>
  <div class="page-container">
    <!-- 基础搜索栏 -->
    <BasicSearch @search="handleBasicSearch" />
    
    <!-- 高级搜索面板 -->
    <AdvancedSearch @search="handleAdvancedSearch" @reset="handleAdvancedReset" />
    
    <!-- 数据表格 -->
    <DataTable :data="filteredData" />
  </div>
</template>
```

### 6.2 搜索参数处理

```javascript
// 搜索参数结构
const searchParams = {
  keyword: '',           // 关键词搜索
  dateRange: [],         // 日期范围
  category: '',          // 分类筛选
  status: '',            // 状态筛选
  rangeFilters: {}       // 范围过滤器对象
};

// 高级搜索处理
const handleAdvancedSearch = (params) => {
  // 将高级搜索参数合并到主搜索条件
  Object.assign(searchParams, params);
  fetchData(); // 重新获取数据
};
```

### 6.3 搜索查询构建

```javascript
// 构建查询条件
const buildQueryFilter = (searchParams) => {
  const filter = {};

  // 关键词搜索（多字段）
  if (searchParams.keyword) {
    filter.$or = [
      { name: { $regex: searchParams.keyword, $options: 'i' } },
      { description: { $regex: searchParams.keyword, $options: 'i' } }
    ];
  }

  // 时间范围筛选
  if (searchParams.dateRange && searchParams.dateRange.length === 2) {
    filter.createdAt = {
      $gte: new Date(searchParams.dateRange[0]),
      $lte: new Date(searchParams.dateRange[1])
    };
  }

  // 分类筛选
  if (searchParams.category) {
    filter.category = searchParams.category;
  }

  // 状态筛选
  if (searchParams.status !== '') {
    filter.status = searchParams.status;
  }

  return filter;
};
```

## 7. 样式规范

### 7.1 CSS 类名规范

- 使用 BEM 方法论
- 类名使用 kebab-case
- 组件级样式使用 scoped

```vue
<template>
  <div class="user-card">
    <div class="user-card__header">
      <h3 class="user-card__title">{{ title }}</h3>
    </div>
    <div class="user-card__body">
      <p class="user-card__info">{{ userInfo }}</p>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-card__header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.user-card__title {
  margin: 0;
  font-size: 18px;
}
</style>
```

### 7.2 Element Plus 使用

```vue
<!-- ✅ Element Plus 组件规范 -->
<template>
  <el-form 
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="用户名" prop="username">
      <el-input 
        v-model="formData.username" 
        placeholder="请输入用户名"
        clearable
      />
    </el-form-item>
    
    <el-form-item>
      <el-button 
        type="primary" 
        :loading="submitting"
        @click="handleSubmit"
      >
        提交
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>
```

## 8. 错误处理规范

### 8.1 全局错误处理

```javascript
// main.js
const app = createApp(App);

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 全局错误:', err);
  console.error('错误信息:', info);
  
  // 发送到错误监控平台
  // errorReporter.report(err, info);
};
```

### 8.2 异步错误处理

```javascript
// ✅ 异步操作错误处理
const asyncOperation = async () => {
  try {
    const result = await someAsyncFunction();
    return result;
  } catch (error) {
    // 记录错误
    console.error('异步操作失败:', error);
    
    // 用户友好提示
    ElMessage.error('操作失败，请稍后重试');
    
    // 抛出错误供上层处理
    throw error;
  }
};
```

## 9. 性能优化

### 9.1 组件懒加载

```javascript
// ✅ 路由懒加载
{
  path: '/user',
  component: () => import('@/views/User/List.vue')
}

// ✅ 组件懒加载
const LazyComponent = defineAsyncComponent(() => 
  import('./ExpensiveComponent.vue')
);
```

### 9.2 虚拟滚动

对于大量数据列表，使用虚拟滚动技术：

```vue
<template>
  <VirtualList
    :data-key="'id'"
    :data-sources="listData"
    :data-component="itemComponent"
    :estimate-size="50"
  />
</template>
```

## 10. 测试规范

### 10.1 单元测试

```javascript
// user.test.js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UserCard from '@/components/UserCard.vue';

describe('UserCard', () => {
  it('should render user info correctly', () => {
    const wrapper = mount(UserCard, {
      props: {
        user: { name: 'John', email: 'john@example.com' }
      }
    });
    
    expect(wrapper.text()).toContain('John');
    expect(wrapper.text()).toContain('john@example.com');
  });
});
```

### 10.2 组件测试要点

- Props 输入验证
- 事件触发
- Slot 内容渲染
- 异步行为处理
- 错误状态处理

## 11. Git 工作流

### 11.1 分支命名

```
feature/功能描述          # 新功能开发
bugfix/问题描述          # bug修复
hotfix/紧急修复描述       # 紧急修复
release/版本号           # 发布分支
```

### 11.2 提交信息规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 11.3 提交示例

```
feat(user): 添加用户搜索功能

- 实现用户名模糊搜索
- 添加搜索结果显示
- 优化搜索性能

Fixes #123
```

## 12. 安全规范

### 12.1 XSS 防护

```vue
<template>
  <!-- ✅ 自动转义 -->
  <div>{{ safeContent }}</div>
  
  <!-- ❌ 危险：仅在信任内容时使用 -->
  <div v-html="trustedHtml"></div>
</template>
```

### 12.2 认证安全

- 敏感信息不存储在 localStorage 中
- 定期刷新令牌
- 实施 CSRF 防护
- 验证 API 响应

## 13. 部署规范

### 13.1 构建配置

```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false, // 生产环境关闭
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          element: ['element-plus']
        }
      }
    }
  }
});
```

### 13.2 环境变量

```bash
# .env.production
VITE_API_BASE_URL=https://api.yoursite.com
VITE_APP_TITLE=生产环境标题

# .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=开发环境标题
```

以上规范确保了代码的一致性、可维护性和团队协作效率。