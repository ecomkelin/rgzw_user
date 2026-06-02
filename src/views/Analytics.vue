<template>
  <div class="analytics">
    <h2 class="page-title">数据分析</h2>

    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6">
        <el-card class="kpi-card">
          <div class="kpi-label">本月新增用户</div>
          <div class="kpi-value">+128</div>
          <div class="kpi-trend up">较上月 +12%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="kpi-card">
          <div class="kpi-label">活跃学员</div>
          <div class="kpi-value">432</div>
          <div class="kpi-trend up">较上月 +5%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="kpi-card">
          <div class="kpi-label">课程完成率</div>
          <div class="kpi-value">78%</div>
          <div class="kpi-trend down">较上月 -2%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="kpi-card">
          <div class="kpi-label">营收（万元）</div>
          <div class="kpi-value">86.5</div>
          <div class="kpi-trend up">较上月 +18%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>用户增长趋势</span>
          </template>
          <div class="chart-placeholder">
            图表区域 - 此处将接入用户增长趋势图
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>来源渠道占比</span>
          </template>
          <div class="chart-placeholder">
            图表区域 - 此处将接入来源渠道饼图
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 数据分析占位页 - 后续接入真实图表与 API
</script>

<style scoped>
.analytics {
  padding: 0;
}

.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  border-radius: 8px;
}

.kpi-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.kpi-trend {
  font-size: 12px;
  margin-top: 8px;
}

.kpi-trend.up {
  color: #67c23a;
}

.kpi-trend.down {
  color: #f56c6c;
}

.chart-placeholder {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-radius: 4px;
  color: #909399;
}
</style>
