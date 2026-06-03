<template>
  <el-container class="layout-container">
    <!-- 桌面端：固定侧边栏 -->
    <el-aside v-if="!isMobile" width="200px" class="layout-aside">
      <div class="logo">
        <h3>RGZW系统</h3>
      </div>
      <el-menu
        :default-active="$route.path"
        :unique-opened="true"
        router
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/layout/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/layout/accounts">
          <el-icon><User /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
        <el-sub-menu index="/account">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户与组织</span>
          </template>
          <el-menu-item index="/layout/users">用户管理</el-menu-item>
          <el-menu-item index="/layout/orgs">组织管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/layout/rooms">
          <el-icon><OfficeBuilding /></el-icon>
          <span>教室管理</span>
        </el-menu-item>
        <el-sub-menu index="/school">
          <template #title>
            <el-icon><School /></el-icon>
            <span>学校管理</span>
          </template>
          <el-menu-item index="/layout/subjects">科目管理</el-menu-item>
          <el-menu-item index="/layout/students">学生列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/analysis">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>分析后台</span>
          </template>
          <el-menu-item index="/layout/analytics">数据分析</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 移动端：抽屉式侧边栏 -->
    <el-drawer
      v-else
      v-model="drawerVisible"
      direction="ltr"
      :with-header="false"
      size="78vw"
      class="layout-drawer"
    >
      <div class="logo">
        <h3>RGZW系统</h3>
      </div>
      <el-menu
        :default-active="$route.path"
        :unique-opened="true"
        router
        background-color="#ffffff"
        text-color="#303133"
        active-text-color="#409EFF"
        @select="drawerVisible = false"
      >
        <el-menu-item index="/layout/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/layout/accounts">
          <el-icon><User /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
        <el-sub-menu index="/account">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户与组织</span>
          </template>
          <el-menu-item index="/layout/users">用户管理</el-menu-item>
          <el-menu-item index="/layout/orgs">组织管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/layout/rooms">
          <el-icon><OfficeBuilding /></el-icon>
          <span>教室管理</span>
        </el-menu-item>
        <el-sub-menu index="/school">
          <template #title>
            <el-icon><School /></el-icon>
            <span>学校管理</span>
          </template>
          <el-menu-item index="/layout/subjects">科目管理</el-menu-item>
          <el-menu-item index="/layout/students">学生列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/analysis">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>分析后台</span>
          </template>
          <el-menu-item index="/layout/analytics">数据分析</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-drawer>

    <!-- 主内容区域 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="layout-header">
        <div class="header-left">
          <!-- 移动端：汉堡按钮 -->
          <el-button
            v-if="isMobile"
            link
            class="hamburger"
            aria-label="打开菜单"
            @click="drawerVisible = true"
          >
            <el-icon :size="22"><Menu /></el-icon>
          </el-button>
          <h2 class="page-title-header" :class="{ 'is-mobile': isMobile }">
            {{ pageTitle }}
          </h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              {{ currentUser?.name || currentUser?.code || '用户' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item command="restart-tour">重新查看引导</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="layout-main" :class="{ 'is-mobile': isMobile }">
        <router-view />
      </el-main>

      <!-- 底部 -->
      <el-footer class="layout-footer" :class="{ 'is-mobile': isMobile }">
        <p>© 2026 RGZW 用户管理系统</p>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  House,
  User,
  School,
  DataAnalysis,
  ArrowDown,
  UserFilled,
  Menu,
  OfficeBuilding,
  Reading
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resetTour, startTour } from '../composables/useTour'
import { useResponsive } from '../composables/useResponsive'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isMobile } = useResponsive()

/** 移动端抽屉可见性 */
const drawerVisible = ref(false)

const currentUser = computed(() => authStore.user)

const pageTitle = computed(() => {
  const routeMap = {
    '/layout/dashboard': '首页',
    '/layout/accounts': '账户列表',
    '/layout/users': '用户管理',
    '/layout/orgs': '组织管理',
    '/layout/rooms': '教室管理',
    '/layout/subjects': '科目管理',
    '/layout/students': '学生列表',
    '/layout/analytics': '数据分析'
  }
  return routeMap[route.path] || '管理系统'
})

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/layout/profile')
      break
    case 'settings':
      router.push('/layout/settings')
      break
    case 'restart-tour':
      resetTour('dashboard')
      const started = startTour('dashboard', { force: true })
      if (!started) {
        ElMessage.info('请先进入首页查看引导')
      }
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        await authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.hamburger {
  color: #ffffff;
  padding: 4px;
}

.page-title-header {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-title-header.is-mobile {
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.el-dropdown-link {
  cursor: pointer;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.layout-drawer :deep(.el-drawer__body) {
  padding: 0;
}
</style>
