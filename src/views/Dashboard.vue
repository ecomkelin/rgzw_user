<template>
  <div class="dashboard">
    <h2 class="page-title">首页</h2>

    <el-row :gutter="20" class="dashboard-stats">
      <el-col :span="6">
        <el-card class="stat-card">
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
        <el-card class="stat-card">
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
        <el-card class="stat-card">
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
        <el-card class="stat-card">
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
        <el-card class="chart-card">
          <template #header>
            <span>用户活动统计</span>
          </template>
          <div class="chart-placeholder">
            图表区域 - 此处将显示用户活动统计图表
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="quick-links">
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

const router = useRouter()

const goToPage = (path) => {
  router.push(path)
}
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