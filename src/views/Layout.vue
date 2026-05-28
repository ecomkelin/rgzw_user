<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="layout-aside">
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

        <!-- 账号管理 - 单独菜单项 -->
        <el-menu-item index="/layout/accounts">
          <el-icon><User /></el-icon>
          <span>账户管理</span>
        </el-menu-item>

        <!-- 用户与组织管理 - 同一个菜单 -->
        <el-sub-menu index="/account">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户与组织</span>
          </template>
          <el-menu-item index="/layout/users">用户管理</el-menu-item>
          <el-menu-item index="/layout/orgs">组织管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/school">
          <template #title>
            <el-icon><School /></el-icon>
            <span>学生管理</span>
          </template>
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

    <!-- 主内容区域 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="layout-header">
        <h2>{{ pageTitle }}</h2>
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
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>

      <!-- 底部 -->
      <el-footer class="layout-footer">
        <p>© 2026 RGZW 用户管理系统 - 科技培训学校管理系统</p>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  House,
  User,
  School,
  DataAnalysis,
  ArrowDown,
  UserFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user)

const pageTitle = computed(() => {
  const routeMap = {
    '/layout/dashboard': '首页',
    '/layout/accounts': '账户列表',
    '/layout/users': '用户管理',
    '/layout/orgs': '组织管理',
    '/layout/students': '学生列表',
    '/layout/analytics': '数据分析'
  }
  return routeMap[route.path] || '管理系统'
})

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/layout/profile')
      break
    case 'settings':
      // 跳转到设置页面
      router.push('/layout/settings')
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
        // 用户取消操作
      }
      break
  }
}

onMounted(() => {
  // 确保用户已认证
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e6e6e6;
}

.logo h3 {
  margin: 0;
  color: #409eff;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>