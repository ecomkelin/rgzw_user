<template>
  <div class="dashboard">
    <h2 class="page-title" id="dashboard-title">首页</h2>

    <el-row :gutter="20" class="dashboard-stats" id="dashboard-stats">
      <el-col :span="6">
        <el-card class="stat-card" id="stat-users">
          <div class="stat-content">
            <div class="stat-icon bg-blue">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">1,234</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" id="stat-students">
          <div class="stat-content">
            <div class="stat-icon bg-green">
              <el-icon><School /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">56</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" id="stat-orgs">
          <div class="stat-content">
            <div class="stat-icon bg-orange">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">23</div>
              <div class="stat-label">公司数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" id="stat-courses">
          <div class="stat-content">
            <div class="stat-icon bg-purple">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">89</div>
              <div class="stat-label">课程总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-content">
      <el-col :span="16">
        <el-card class="chart-card" id="dashboard-chart">
          <template #header>
            <span>用户活动统计</span>
          </template>
          <div class="chart-placeholder">
            图表区域 - 此处将显示用户活动统计图表
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="quick-links" id="dashboard-quicklinks">
          <template #header>
            <span>快捷链接</span>
          </template>
          <div class="link-list">
            <div class="link-item" @click="goToPage('/layout/accounts')">
              <el-icon><User /></el-icon>
              <span>管理账户</span>
            </div>
            <div class="link-item" @click="goToPage('/layout/students')">
              <el-icon><School /></el-icon>
              <span>管理学生</span>
            </div>
            <div class="link-item" @click="goToPage('/layout/companies')">
              <el-icon><OfficeBuilding /></el-icon>
              <span>管理公司</span>
            </div>
            <div class="link-item" @click="goToPage('/layout/analytics')">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据分析</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 首次访问引导 -->
    <OnboardingGuide tour-key="dashboard" :steps="dashboardTourSteps" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  User,
  School,
  OfficeBuilding,
  Document,
  DataAnalysis
} from '@element-plus/icons-vue'
import OnboardingGuide from '../components/OnboardingGuide.vue'

const router = useRouter()

const goToPage = (path) => {
  router.push(path)
}

// 引导步骤：与模板中的 id 锚点一一对应
const dashboardTourSteps = [
  {
    target: '#dashboard-title',
    title: '欢迎使用 RGZW 管理后台 👋',
    description: '这是您登录后的主页。下面我们用 30 秒带您熟悉主要功能。',
    placement: 'bottom'
  },
  {
    target: '.layout-aside',
    title: '侧边栏导航',
    description: '通过侧边栏可快速切换首页、账户、用户与组织、学员、数据分析等模块。',
    placement: 'right'
  },
  {
    target: '#dashboard-stats',
    title: '核心数据概览',
    description: '这里展示系统关键指标：用户数、学员数、组织数、课程数，一目了然。',
    placement: 'top'
  },
  {
    target: '#dashboard-chart',
    title: '活动趋势',
    description: '展示最近一段时间的用户活动趋势。后续会接入真实图表组件。',
    placement: 'top'
  },
  {
    target: '#dashboard-quicklinks',
    title: '快捷入口',
    description: '点击任意快捷链接直接进入对应管理页。',
    placement: 'left'
  },
  {
    target: '.layout-header',
    title: '用户菜单',
    description: '点击右上角头像可以进入个人资料、设置或退出登录。',
    placement: 'bottom'
  }
]
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  overflow: hidden;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.bg-blue {
  background-color: #e3f2fd;
  color: #2196f3;
}

.bg-green {
  background-color: #e8f5e8;
  color: #4caf50;
}

.bg-orange {
  background-color: #fff3e0;
  color: #ff9800;
}

.bg-purple {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-card, .quick-links {
  height: 300px;
  border-radius: 8px;
}

.chart-placeholder {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-radius: 4px;
  color: #909399;
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.link-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.link-item:hover {
  background-color: #f5f7fa;
}

.link-item i {
  margin-right: 10px;
  font-size: 18px;
  color: #409eff;
}
</style>