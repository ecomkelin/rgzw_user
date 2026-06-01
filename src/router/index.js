import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
        path: 'students',
        name: 'Students',
        component: () => import('../views/students/Students.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/',
    redirect: '/layout/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简单的路由守卫实现
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