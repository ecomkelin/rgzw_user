/**
 * Vue Router 配置
 *
 * 路由结构：
 *   /login                          公开（已登录则跳到 dashboard）
 *   /layout                         鉴权壳 —— 子路由都在这里
 *     ├─ dashboard                  首页
 *     ├─ accounts                   账户管理
 *     ├─ users                      用户管理
 *     ├─ orgs                       组织管理
 *     ├─ rooms                      教室管理
 *     ├─ subjects                   科目管理
 *     ├─ courses                    课程管理
 *     ├─ students                   学员管理
 *     ├─ packs                      课包管理
 *     └─ analytics                  数据分析
 *   /                               重定向到 /layout/dashboard
 *   /:pathMatch(.*)*                兜底重定向到 dashboard
 *
 * 鉴权策略：
 *   - meta.requiresAuth: 必须登录才能进入
 *   - meta.requiresGuest: 已登录用户禁止进入（如 /login）
 *   - 路由守卫读取 `useAuthStore().authChecked`，等待认证状态初始化完成后再放行
 *     这避免了"刷新页面短暂跳到登录页"的问题
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * 路由表（懒加载每个页面，减小首屏体积）
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/layout',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: () => import('../views/accounts/Accounts.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/Users.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orgs',
        name: 'Orgs',
        component: () => import('../views/orgs/Orgs.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('../views/rooms/Rooms.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'subjects',
        name: 'Subjects',
        component: () => import('../views/subjects/Subjects.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('../views/courses/Courses.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('../views/students/Students.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'packs',
        name: 'Packs',
        component: () => import('../views/packs/Packs.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/Analytics.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/',
    redirect: '/layout/dashboard'
  },
  // 兜底：未匹配到任何路由时跳回首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/layout/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局前置守卫：实现页面级鉴权
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').RouteLocationNormalized} from
 * @param {Function} next
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 如果认证状态还没检查完成（可能刚初始化），允许继续，因为App.vue会处理
  if (!authStore.isAuthChecked) {
    next()
    return
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/layout/dashboard')
  } else {
    next()
  }
})

export default router