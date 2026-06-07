/**
 * Vue Router 配置
 *
 * 路由结构：
 *   /login                          公开（已登录则跳到 dashboard）
 *   /layout                         鉴权壳 —— 子路由都在这里
 *     ├─ dashboard                  首页
 *     ├─ accounts                   账户管理 (requiresAdmin)
 *     ├─ users                      用户管理 (requiresManager)
 *     ├─ orgs                       组织管理 (requiresAdmin)
 *     ├─ rooms                      教室管理 (requiresManager)
 *     ├─ subjects                   科目管理 (requiresManager)
 *     ├─ courses                    课程管理 (requiresManager)
 *     ├─ students                   学员管理 (requiresManager)
 *     ├─ packs                      课包管理 (requiresManager)
 *     ├─ orderPacks                 课包订单 (requiresManager)
 *     ├─ studentPacks               学生课包 (requiresManager)
 *     ├─ studentCourses             学生选课（requiresManager；read 对普通老师/Student 也开放，但 rgzw_user 主走管理端）
 *     └─ analytics                  数据分析 (requiresManager)
 *   /                               重定向到 /layout/dashboard
 *   /:pathMatch(.*)*                兜底重定向到 dashboard
 *
 * 鉴权策略：
 *   - meta.requiresAuth:    必须登录才能进入
 *   - meta.requiresGuest:   已登录用户禁止进入（如 /login）
 *   - meta.requiresAdmin:   仅超管（Account.isAdmin === true）可进
 *   - meta.requiresManager: 至少经理（roleTemp === 'manager'）可进；超管自动通过
 *     —— 与后端 payloadChecker.js isManager() 等价（不变量：isAdmin ⇒ isManager）
 *   - 路由守卫读取 `useAuthStore().authChecked`，等待认证状态初始化完成后再放行
 *     这避免了"刷新页面短暂跳到登录页"的问题
 */

import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useAccount } from '../composables/useAccount'

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
        // Account.dao.list / add / edit 全部强制 isAdmin
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/Users.vue'),
        // User.dao.list / add / edit 全部强制 isManager
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'orgs',
        name: 'Orgs',
        component: () => import('../views/orgs/Orgs.vue'),
        // Org.dao 全部强制 isAdmin
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('../views/rooms/Rooms.vue'),
        // Room.dao 全部强制 isManager
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'subjects',
        name: 'Subjects',
        component: () => import('../views/subjects/Subjects.vue'),
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('../views/courses/Courses.vue'),
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('../views/students/Students.vue'),
        // Student.dao.list / add / edit 全部强制 isManager
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'packs',
        name: 'Packs',
        component: () => import('../views/packs/Packs.vue'),
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'orderPacks',
        name: 'OrderPacks',
        component: () => import('../views/orderPacks/OrderPacks.vue'),
        // OrderPack.dao.add: isAdmin / isManager; edit: isAdmin
        // —— isManager 即可看到列表，超管在页面内能继续 edit
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'studentPacks',
        name: 'StudentPacks',
        component: () => import('../views/studentPacks/StudentPacks.vue'),
        // StudentPack.dao.list / detail: isManager; add / edit: isAdmin
        // —— 列表/详情仅需 manager；add / edit 由页面级按钮 v-if="isAdmin" 控权
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'studentCourses',
        name: 'StudentCourses',
        component: () => import('../views/studentCourses/StudentCourses.vue'),
        // StudentCourse.dao.list / detail: isUser (Student / 老师 / manager / isAdmin) 均可读
        // StudentCourse.dao.add / edit:  仅 manager / isAdmin
        // —— rgzw_user 是管理端, 因此用 requiresManager 兜底; add / edit 由页面级按钮 v-if="isManager" 控权
        meta: { requiresAuth: true, requiresManager: true }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('../views/schedule/Schedule.vue'),
        // 排课管理: 预览/生成/编辑/取消 = manager only;
        // 四维度查询 + AI 解析 = manager+ 即可, 前端按 tab 实体做权限控制
        meta: { requiresAuth: true, requiresManager: true }
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
    return
  }
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/layout/dashboard')
    return
  }

  // 角色门禁（前端 UX 层 —— 后端 DAO 才是终局防线）
  // useAccount() 必须在 Pinia store 已就绪后调用；这里 authStore.user 已就绪
  if (to.meta.requiresAdmin || to.meta.requiresManager) {
    const { isAdmin, isManager } = useAccount()
    if (to.meta.requiresAdmin && !isAdmin.value) {
      console.warn(`[router] ${to.path} requires admin, redirecting`)
      ElMessage.error('该页面仅限超管访问')
      next('/layout/dashboard')
      return
    }
    if (to.meta.requiresManager && !isManager.value) {
      console.warn(`[router] ${to.path} requires manager, redirecting`)
      ElMessage.error('该页面需要经理及以上权限')
      next('/layout/dashboard')
      return
    }
  }

  next()
})

export default router