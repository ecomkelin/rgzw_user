<template>
  <div class="orgs-page">
    <h2 class="page-title">组织管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="组织名称">
          <el-input v-model="filters.name" placeholder="请输入组织名称" clearable></el-input>
        </el-form-item>

        <el-form-item label="统一代码">
          <el-input v-model="filters.unionCode" placeholder="请输入完整的统一代码" clearable></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="主机构">
          <el-select v-model="filters.isMain" placeholder="请选择是否主机构" clearable style="width: 120px;">
            <el-option label="是" :value="true"></el-option>
            <el-option label="否" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="fetchOrgs">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增组织</el-button>
          </div>
          </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="orgs"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
      >
        <el-table-column prop="name" label="组织名称" width="200"></el-table-column>
        <el-table-column prop="nickname" label="组织简称" width="150"></el-table-column>
        <el-table-column prop="unionCode" label="统一社会信用代码" width="200"></el-table-column>
        <el-table-column prop="isMain" label="是否主机构" width="130">
          <template #default="{ row }">
            <span :class="{ 'main-org': row.isMain }">{{ row.isMain ? '主机构' : '普通机构' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150"></el-table-column>
        <el-table-column prop="email" label="联系邮箱" width="200"></el-table-column>
        <el-table-column prop="website" label="网站" width="200"></el-table-column>
        <el-table-column prop="address" label="地址" width="250"></el-table-column>
        <el-table-column prop="sort" label="排序" width="80">
          <template #default="{ row }">
            {{ row.sort || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="viewDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '创建组织' : '编辑组织'"
      v-model="dialog.visible"
      width="700px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="orgFormRef"
        label-width="120px"
      >
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入组织名称"></el-input>
        </el-form-item>

        <el-form-item label="组织简称" prop="nickname">
          <el-input v-model="dialog.form.nickname" placeholder="请输入组织简称"></el-input>
        </el-form-item>

        <el-form-item label="统一社会信用代码" prop="unionCode">
          <el-input v-model="dialog.form.unionCode" placeholder="请输入统一社会信用代码"></el-input>
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="dialog.form.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>

        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="dialog.form.email" placeholder="请输入联系邮箱"></el-input>
        </el-form-item>

        <el-form-item label="网站" prop="website">
          <el-input v-model="dialog.form.website" placeholder="请输入网站地址"></el-input>
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input
            v-model="dialog.form.address"
            type="textarea"
            :rows="3"
            placeholder="请输入地址"
          ></el-input>
        </el-form-item>

        <el-form-item label="是否主机构" prop="isMain">
          <el-switch
            v-model="dialog.form.isMain"
            active-text="是"
            inactive-text="否"
          ></el-switch>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="dialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveOrg" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orgService } from '../../api/org'
import { formatDate, formatActiveStatus } from '../../utils/format'

// 状态变量
const orgs = ref([])
const loading = ref(false)
const orgFormRef = ref()

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  name: '',
  unionCode: '',
  isActive: '',
  isMain: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  form: {
    name: '',
    nickname: '',
    unionCode: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    isMain: false,
    isActive: true,
    sort: 0
  },
  rules: {
    name: [
      { required: true, message: '请输入组织名称', trigger: 'blur' },
      { min: 2, max: 100, message: '组织名称长度应在2-100个字符之间', trigger: 'blur' }
    ],
    nickname: [
      { required: true, message: '请输入组织简称', trigger: 'blur' },
      { min: 1, max: 50, message: '组织简称长度应在1-50个字符之间', trigger: 'blur' }
    ],
    unionCode: [
      { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
      { min: 2, max: 30, message: '统一社会信用代码长度应在2-30个字符之间', trigger: 'blur' }
    ],
    phone: [
      { max: 20, message: '联系电话长度不能超过20个字符', trigger: 'blur' },
      { min: 7, message: '联系电话长度不能少于7个字符', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ],
    website: [
      { type: 'url', message: '请输入有效的网址', trigger: 'blur' }
    ]
  }
})

// 获取组织列表
const fetchOrgs = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize;
    const options = {
      limit: pagination.pageSize,
      sortObj: { sort: -1, createdAt: -1 }, // 先按sort排序，再按创建时间排序
    };

    // 只有当skipValue大于0时才添加skip参数，避免后端验证错误
    if (skipValue > 0) {
      options.skip = skipValue;
    }

    // 构建查询条件
    const filter = {};

    // 名称搜索，支持组织名称和组织简称的模糊搜索
    if (filters.name) {
      filter.$or = [
        { name: { $regex: filters.name, $options: 'i' } },
        { nickname: { $regex: filters.name, $options: 'i' } }
      ];
    }

    // 统一代码精确匹配
    if (filters.unionCode) {
      filter.unionCode = filters.unionCode;
    }

    // 状态筛选
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    // 主机构筛选
    if (filters.isMain !== '' && filters.isMain !== null && filters.isMain !== undefined) {
      filter.isMain = filters.isMain === 'true' || filters.isMain === true;
    }

    const params = {
      filter: filter,
      options: options
    }

    const response = await orgService.getOrgs(params)
    if (response.data.success) {
      const { items, total } = response.data.data
      orgs.value = items
      pagination.total = total
    }
  } catch (error) {
    console.error('获取组织列表失败:', error)
    ElMessage.error('获取组织列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.unionCode = ''
  filters.isActive = ''
  filters.isMain = ''
  pagination.currentPage = 1
  fetchOrgs()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchOrgs()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchOrgs()
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  // 重置表单
  Object.assign(dialog.form, {
    name: '',
    nickname: '',
    unionCode: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    isMain: false,
    isActive: true,
    sort: 0
  })
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  // 填充表单数据
  Object.assign(dialog.form, {
    _id: row._id,
    name: row.name || '',
    nickname: row.nickname || '',
    unionCode: row.unionCode || '',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    address: row.address || '',
    isMain: row.isMain || false,
    isActive: row.isActive,
    sort: row.sort || 0
  })
}

// 查看详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>组织名称:</strong> ${row.name || '-'}</div>
    <div><strong>组织简称:</strong> ${row.nickname || '-'}</div>
    <div><strong>统一社会信用代码:</strong> ${row.unionCode || '-'}</div>
    <div><strong>是否主机构:</strong> <span style="font-weight:bold; color:orange;">${row.isMain ? '主机构' : '普通机构'}</span></div>
    <div><strong>状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>联系电话:</strong> ${row.phone || '-'}</div>
    <div><strong>联系邮箱:</strong> ${row.email || '-'}</div>
    <div><strong>网站:</strong> ${row.website || '-'}</div>
    <div><strong>地址:</strong> ${row.address || '-'}</div>
    <div><strong>民族:</strong> ${row.Nation || '-'}</div>
    <div><strong>省/市:</strong> ${row.Province || '-'}</div>
    <div><strong>城市:</strong> ${row.City || '-'}</div>
    <div><strong>区/县:</strong> ${row.Area || '-'}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
    <div><strong>最后更新时间:</strong> ${formatDate(row.updatedAt)}</div>
  `, '组织详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 保存组织
const saveOrg = async () => {
  if (!orgFormRef.value) return

  await orgFormRef.value.validate(async (valid) => {
    if (valid) {
      dialog.loading = true
      try {
        if (dialog.mode === 'create') {
          const orgData = {
            name: dialog.form.name,
            nickname: dialog.form.nickname,
            unionCode: dialog.form.unionCode
          };

          // 只有当字段有值时才添加到请求数据中
          if (dialog.form.phone && dialog.form.phone.trim() !== '') {
            // 验证电话长度 (最多20个字符)
            if (dialog.form.phone.length > 20) {
              ElMessage.error('电话长度不能超过20个字符')
              dialog.loading = false
              return
            }
            orgData.phone = dialog.form.phone
          }

          if (dialog.form.email && dialog.form.email.trim() !== '') {
            // 验证邮箱长度 (最多100个字符)
            if (dialog.form.email.length > 100) {
              ElMessage.error('邮箱长度不能超过100个字符')
              dialog.loading = false
              return
            }
            orgData.email = dialog.form.email
          }

          if (dialog.form.website && dialog.form.website.trim() !== '') {
            // 验证网站长度 (最多200个字符)
            if (dialog.form.website.length > 200) {
              ElMessage.error('网站长度不能超过200个字符')
              dialog.loading = false
              return
            }
            orgData.website = dialog.form.website
          }

          if (dialog.form.address && dialog.form.address.trim() !== '') {
            // 验证地址长度 (最多200个字符)
            if (dialog.form.address.length > 200) {
              ElMessage.error('地址长度不能超过200个字符')
              dialog.loading = false
              return
            }
            orgData.address = dialog.form.address
          }

          orgData.isMain = dialog.form.isMain;
          orgData.isActive = dialog.form.isActive;

          if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
            orgData.sort = dialog.form.sort
          }

          const response = await orgService.createOrg(orgData)

          if (response.data.success) {
            ElMessage.success('创建组织成功')
            dialog.visible = false
            fetchOrgs()
          } else {
            ElMessage.error(response.data.message || '创建组织失败')
          }
        } else {
          const orgData = {};

          // 只有当字段有值时才添加到请求数据中
          if (dialog.form.name && dialog.form.name.trim() !== '') {
            // 验证名称长度 (2-100)
            if (dialog.form.name.length < 2 || dialog.form.name.length > 100) {
              ElMessage.error('组织名称长度应在2-100个字符之间')
              dialog.loading = false
              return
            }
            orgData.name = dialog.form.name
          }

          if (dialog.form.nickname && dialog.form.nickname.trim() !== '') {
            // 验证简称长度 (1-50)
            if (dialog.form.nickname.length < 1 || dialog.form.nickname.length > 50) {
              ElMessage.error('组织简称长度应在1-50个字符之间')
              dialog.loading = false
              return
            }
            orgData.nickname = dialog.form.nickname
          }

          if (dialog.form.unionCode && dialog.form.unionCode.trim() !== '') {
            // 验证统一代码长度 (2-30)
            if (dialog.form.unionCode.length < 2 || dialog.form.unionCode.length > 30) {
              ElMessage.error('统一社会信用代码长度应在2-30个字符之间')
              dialog.loading = false
              return
            }
            orgData.unionCode = dialog.form.unionCode
          }

          if (dialog.form.phone && dialog.form.phone.trim() !== '') {
            // 验证电话长度 (最多20个字符)
            if (dialog.form.phone.length > 20) {
              ElMessage.error('电话长度不能超过20个字符')
              dialog.loading = false
              return
            }
            orgData.phone = dialog.form.phone
          }

          if (dialog.form.email && dialog.form.email.trim() !== '') {
            // 验证邮箱长度 (最多100个字符)
            if (dialog.form.email.length > 100) {
              ElMessage.error('邮箱长度不能超过100个字符')
              dialog.loading = false
              return
            }
            orgData.email = dialog.form.email
          }

          if (dialog.form.website && dialog.form.website.trim() !== '') {
            // 验证网站长度 (最多200个字符)
            if (dialog.form.website.length > 200) {
              ElMessage.error('网站长度不能超过200个字符')
              dialog.loading = false
              return
            }
            orgData.website = dialog.form.website
          }

          if (dialog.form.address && dialog.form.address.trim() !== '') {
            // 验证地址长度 (最多200个字符)
            if (dialog.form.address.length > 200) {
              ElMessage.error('地址长度不能超过200个字符')
              dialog.loading = false
              return
            }
            orgData.address = dialog.form.address
          }

          orgData.isMain = dialog.form.isMain;
          orgData.isActive = dialog.form.isActive;

          if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
            orgData.sort = dialog.form.sort
          }

          const response = await orgService.updateOrg(dialog.form._id, orgData)

          if (response.data.success) {
            ElMessage.success('更新组织成功')
            dialog.visible = false
            fetchOrgs()
          } else {
            ElMessage.error(response.data.message || '更新组织失败')
          }
        }
      } catch (error) {
        console.error('保存组织失败:', error)
        ElMessage.error(error.response?.data?.message || '保存组织失败')
      } finally {
        dialog.loading = false
      }
    }
  })
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (orgFormRef.value) {
    orgFormRef.value.clearValidate()
  }
}

onMounted(() => {
  fetchOrgs()
})
</script>

<style scoped>
.orgs-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.table-actions {
  display: flex;
  gap: 5px;
}

.main-org {
  font-weight: bold;
  color: orange;
}
</style>