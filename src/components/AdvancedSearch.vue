<!-- AdvancedSearch.vue -->
<template>
  <div class="advanced-search">
    <el-collapse v-model="activeNames" @change="handleChange">
      <el-collapse-item title="高级搜索" name="advanced">
        <el-form :model="searchForm" label-width="100px" class="search-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="关键词">
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="请输入关键词进行全文搜索"
                  clearable
                  :prefix-icon="Search"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="searchForm.gender" placeholder="请选择性别" clearable>
                  <el-option label="男" value="Male" />
                  <el-option label="女" value="Female" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄范围">
                <el-slider
                  v-model="searchForm.ageRange"
                  range
                  :min="0"
                  :max="100"
                  :marks="{ 0: '0岁', 100: '100岁' }"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="激活" :value="true" />
                  <el-option label="未激活" :value="false" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源类型">
                <el-select v-model="searchForm.sourceType" placeholder="请选择来源类型" clearable>
                  <el-option label="地推" value="地推" />
                  <el-option label="传单" value="传单" />
                  <el-option label="活动" value="活动" />
                  <el-option label="介绍" value="介绍" />
                  <el-option label="听说" value="听说" />
                  <el-option label="路过" value="路过" />
                  <el-option label="抖音" value="抖音" />
                  <el-option label="朋友圈" value="朋友圈" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <div class="search-actions">
                <el-button type="primary" @click="onSearch">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="onReset">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const activeNames = ref([])
const emit = defineEmits(['search', 'reset'])

const searchForm = reactive({
  keyword: '',
  dateRange: [],
  gender: '',
  ageRange: [0, 100],
  status: '',
  sourceType: ''
})

const handleChange = (val) => {
  console.log(val)
}

const onSearch = () => {
  const searchData = {
    ...searchForm,
    startDate: searchForm.dateRange && searchForm.dateRange[0],
    endDate: searchForm.dateRange && searchForm.dateRange[1],
    minAge: searchForm.ageRange && searchForm.ageRange[0],
    maxAge: searchForm.ageRange && searchForm.ageRange[1]
  }
  emit('search', searchData)
}

const onReset = () => {
  // 重置所有搜索字段
  searchForm.keyword = ''
  searchForm.dateRange = []
  searchForm.gender = ''
  searchForm.ageRange = [0, 100]
  searchForm.status = ''
  searchForm.sourceType = ''
  emit('reset')
}

defineExpose({
  searchForm,
  onSearch,
  onReset
})
</script>

<style scoped>
.advanced-search {
  margin-bottom: 20px;
}

.search-form {
  margin-top: 16px;
  padding: 0 16px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-collapse-item__header) {
  font-weight: bold;
  color: #409eff;
}
</style>