<template>
  <div class="users-page">
    <h2 class="page-title">用户管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="组织">
          <el-select v-model="filters.org" placeholder="请选择组织" clearable style="width: 150px;">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="请选择角色" clearable style="width: 150px;">
            <el-option v-for="opt in USER_ROLES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 150px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <AdvancedSearch @search="handleAdvancedSearch" @reset="handleAdvancedReset" />

    <el-card class="table-card">
      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="Account.name" label="真实姓名" width="120"></el-table-column>
        <el-table-column prop="Account.phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="Account.email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="Account.identityNo" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120"></el-table-column>
        <el-table-column prop="roleTemp" label="角色" width="120">
          <template #default="{ row }">
            {{ formatUserRole(row.roleTemp) }}
          </template>
        </el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="openDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作工具栏 -->
      <div class="batch-operation" v-if="selectedRows.length > 0">
        <el-divider />
        <div class="batch-toolbar">
          <span class="selection-info">已选择 {{ selectedRows.length }} 项</span>
          <div class="batch-buttons">
            <el-button @click="onBatchActivate" type="success" size="small">批量激活</el-button>
            <el-button @click="onBatchDeactivate" type="warning" size="small">批量禁用</el-button>
            <el-button @click="selectedRows = []" size="small">取消选择</el-button>
          </div>
        </div>
      </div>

      <!-- 打印操作工具栏 -->
      <div class="print-operation">
        <el-divider />
        <div class="print-toolbar">
          <span class="print-info">打印功能</span>
          <div class="print-buttons">
            <el-button @click="printTable(selectedRows)" type="primary" size="small" :disabled="selectedRows.length === 0">
              打印选中项
            </el-button>
            <el-button @click="printTable(items)" type="primary" size="small">打印全部数据</el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onPageChange"
        class="pagination"
      />
    </el-card>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '创建用户' : '编辑用户'"
      v-model="dialog.visible"
      width="600px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="userFormRef"
        label-width="120px"
      >
        <el-tabs v-model="dialog.activeTab" v-if="dialog.mode === 'create'">
          <el-tab-pane label="用户信息" name="user">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="dialog.form.nickname" placeholder="请输入昵称"></el-input>
            </el-form-item>

            <el-form-item label="角色" prop="roleTemp">
              <el-select v-model="dialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
                <el-option v-for="opt in USER_ROLES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
            </el-form-item>

            <el-form-item label="状态" prop="isActive">
              <el-switch v-model="dialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
            </el-form-item>

            <el-form-item label="所属组织" prop="orgId">
              <el-select v-model="dialog.form.orgId" :disabled="dialog.mode === 'edit'" placeholder="请选择组织" style="width: 100%">
                <el-option v-for="org in orgOptions" :key="org._id" :label="org.name" :value="org._id"></el-option>
              </el-select>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="账户信息" name="account">
            <el-form-item label="选择现有账户">
              <el-select v-model="dialog.form.selectedAccount" placeholder="请选择现有账户" style="width: 100%" clearable filterable @change="onAccountSelect">
                <el-option
                  v-for="acc in availableAccounts"
                  :key="acc._id"
                  :label="`${acc.code} (${acc.name})`"
                  :value="acc._id">
                </el-option>
              </el-select>
            </el-form-item>

            <div v-if="!dialog.form.selectedAccount">
              <el-form-item label="账户名称" prop="accountCode">
                <el-input v-model="dialog.form.accountCode" placeholder="请输入账户名称"></el-input>
              </el-form-item>
              <el-form-item label="真实姓名" prop="accountName">
                <el-input v-model="dialog.form.accountName" placeholder="请输入真实姓名"></el-input>
              </el-form-item>
              <el-form-item label="手机号" prop="accountPhone">
                <el-input v-model="dialog.form.accountPhone" placeholder="请输入手机号"></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="accountEmail">
                <el-input v-model="dialog.form.accountEmail" placeholder="请输入邮箱"></el-input>
              </el-form-item>
              <el-form-item label="性别" prop="accountGender">
                <el-radio-group v-model="dialog.form.accountGender">
                  <el-radio label="male">男</el-radio>
                  <el-radio label="female">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="身份证号" prop="accountIdentityNo">
                <el-input v-model="dialog.form.accountIdentityNo" placeholder="请输入身份证号"></el-input>
              </el-form-item>
              <el-form-item label="地址" prop="accountAddress">
                <el-input v-model="dialog.form.accountAddress" placeholder="请输入地址"></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="accountPassword">
                <el-input v-model="dialog.form.accountPassword" type="password" placeholder="请输入密码" show-password></el-input>
              </el-form-item>
            </div>
            <div v-else>
              <p>已选择现有账户：{{ getSelectedAccountInfo() }}</p>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 编辑模式：只有用户信息 -->
        <div v-else>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="dialog.form.nickname" placeholder="请输入昵称"></el-input>
          </el-form-item>
          <el-form-item label="角色" prop="roleTemp">
            <el-select v-model="dialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
              <el-option v-for="opt in USER_ROLES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
          </el-form-item>
          <el-form-item label="状态" prop="isActive">
            <el-switch v-model="dialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
          </el-form-item>
          <el-form-item label="所属组织" prop="orgId">
            <el-select v-model="dialog.form.orgId" :disabled="dialog.mode === 'edit'" placeholder="请选择组织" style="width: 100%">
              <el-option v-for="org in orgOptions" :key="org._id" :label="org.name" :value="org._id"></el-option>
            </el-select>
          </el-form-item>
          <!-- 编辑时只读展示关联账户 -->
          <el-form-item label="关联账户">
            <el-input :value="`${dialog.form.accountCode || '-'} (${dialog.form.accountName || '-'})`" disabled></el-input>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框（v8.0.2：替代 ElMessageBox.alert） -->
    <DetailDialog
      v-model="detailVisible"
      title="用户详情"
      :data="currentRow"
      :rows="detailRows"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { userService } from '../../api/user'
import { orgService } from '../../api/org'
import { accountService } from '../../api/account'
import { formatDate, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import {
  buildListPayload,
  appendExact,
  appendBoolean,
  appendRegExp,
  appendDateRange
} from '../../utils/listPayload'
import { USER_ROLES, formatUserRole } from '../../utils/enums'
import { useListPage } from '../../composables/useListPage'
import DetailDialog from '../../components/DetailDialog.vue'
import AdvancedSearch from '../../components/AdvancedSearch.vue'

/* ===== 列表 + 批量 ===== */
const {
  items,
  loading,
  selectedRows,
  pagination,
  fetchList,
  handleSizeChange: onSizeChange,
  handleCurrentChange: onPageChange,
  handleSelectionChange,
  batchUpdateField,
  batchDeactivate
} = useListPage()

/* ===== 高级搜索 ===== */
const advancedFilters = ref({
  keyword: '',
  dateRange: [],
  role: '',
  status: '',
  org: ''
})

/* ===== 基础筛选 ===== */
const filters = reactive({
  org: '',
  role: '',
  isActive: ''
})

/* ===== 关联资源 ===== */
const orgOptions = ref([])
const availableAccounts = ref([])

const fetchOrgs = async () => {
  try {
    const resp = await orgService.getOrgs({
      filter: {},
      options: { limit: 1000 }
    })
    if (resp.data.success) orgOptions.value = resp.data.data.items || []
  } catch (e) {
    console.error('获取组织列表失败:', e)
  }
}
const fetchAccounts = async () => {
  try {
    const resp = await accountService.getAccounts({
      filter: { isActive: true, accountType: 'User' },
      options: { limit: 1000 }
    })
    if (resp.data.success) availableAccounts.value = resp.data.data.items || []
  } catch (e) {
    console.error('获取账户列表失败:', e)
  }
}

/* ===== 详情面板 ===== */
const detailVisible = ref(false)
const currentRow = ref({})
const detailRows = [
  { label: '真实姓名',   field: 'Account.name' },
  { label: '昵称',       field: 'nickname' },
  { label: '手机号',     field: 'Account.phone' },
  { label: '邮箱',       field: 'Account.email' },
  { label: '身份证号',   field: 'Account.identityNo' },
  { label: '角色',       field: 'roleTemp', render: r => formatUserRole(r.roleTemp) },
  { label: '所属组织',   field: 'Org.name' },
  { label: '排序',       field: 'sort' },
  { label: '状态',       field: 'isActive', render: r => formatActiveStatus(r.isActive) },
  { label: '创建时间',   field: 'createdAt', render: r => formatDate(r.createdAt) },
  { label: '最后更新时间', field: 'updatedAt', render: r => formatDate(r.updatedAt) }
]
const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

/* ===== 表单对话框 ===== */
const dialog = reactive({
  visible: false,
  mode: 'create',
  activeTab: 'user',
  loading: false,
  form: {
    nickname: '', roleTemp: 'teacher', sort: 0, isActive: true, orgId: '',
    selectedAccount: '',
    accountCode: '', accountName: '', accountPhone: '', accountEmail: '',
    accountGender: 'male', accountIdentityNo: '', accountAddress: '',
    accountPassword: ''
  },
  rules: {
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 26, message: '昵称长度应在2-26个字符之间', trigger: 'blur' }
    ],
    roleTemp: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    accountCode: [
      { required: true, message: '请输入账户名称', trigger: 'blur' },
      { min: 4, max: 16, message: '账户名称长度应在4-16个字符之间', trigger: 'blur' }
    ],
    accountName: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '真实姓名长度应在2-50个字符之间', trigger: 'blur' }
    ],
    accountEmail: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }],
    accountPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ]
  }
})
const userFormRef = ref()

const onAccountSelect = (accountId) => {
  if (!accountId) return
  const acc = availableAccounts.value.find(a => a._id === accountId)
  if (!acc) return
  dialog.form.accountCode = acc.code
  dialog.form.accountName = acc.name
  dialog.form.accountPhone = acc.phone || ''
  dialog.form.accountEmail = acc.email || ''
  dialog.form.accountGender = acc.gender || 'male'
  dialog.form.accountIdentityNo = acc.identityNo || ''
  dialog.form.accountAddress = acc.address || ''
}
const getSelectedAccountInfo = () => {
  const acc = availableAccounts.value.find(a => a._id === dialog.form.selectedAccount)
  return acc ? `${acc.code} (${acc.name})` : ''
}

/* ===== 列表拉取（v8.0.2 统一走 buildListPayload） ===== */
const fetchUsers = async () => {
  const filter = {}

  // 基础筛选
  appendExact(filter, 'Org', filters.org)
  appendExact(filter, 'roleTemp', filters.role)
  appendBoolean(filter, 'isActive', filters.isActive)

  // 高级搜索：关键词走 regExp（后端 User listVD 仅支持 filter.regExp）
  appendRegExp(filter, advancedFilters.value.keyword)
  appendExact(filter, 'roleTemp', advancedFilters.value.role)
  appendBoolean(filter, 'isActive', advancedFilters.value.status)
  appendExact(filter, 'Org', advancedFilters.value.org)
  appendDateRange(filter, advancedFilters.value.dateRange, 'createdAt')

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { sort: -1, createdAt: -1 },
    populateKeys: ['Org', 'Account']
  })

  await fetchList(userService.getUsers.bind(userService), payload)
}

const handleAdvancedSearch = (data) => {
  Object.assign(advancedFilters.value, data)
  pagination.currentPage = 1
  fetchUsers()
}
const handleAdvancedReset = () => {
  advancedFilters.value = { keyword: '', dateRange: [], role: '', status: '', org: '' }
  fetchUsers()
}
const resetFilters = () => {
  filters.org = ''
  filters.role = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchUsers()
}

/* ===== 批量操作 ===== */
const onBatchActivate = () => batchUpdateField({
  field: 'isActive',
  value: true,
  label: '激活',
  apply: (ids, body) => Promise.allSettled(ids.map(id => userService.updateUser(id, body))),
  onComplete: fetchUsers
})
const onBatchDeactivate = () => batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => userService.updateUser(id, { isActive: false }))),
  onComplete: fetchUsers
})

/* ===== 打开/保存 ===== */
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  dialog.activeTab = 'user'
  Object.assign(dialog.form, {
    nickname: '', roleTemp: 'teacher', sort: 0, isActive: true, orgId: '',
    selectedAccount: '',
    accountCode: '', accountName: '', accountPhone: '', accountEmail: '',
    accountGender: 'male', accountIdentityNo: '', accountAddress: '',
    accountPassword: ''
  })
}
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  Object.assign(dialog.form, {
    _id: row._id,
    nickname: row.nickname || '',
    roleTemp: row.roleTemp || 'teacher',
    sort: row.sort || 0,
    isActive: row.isActive,
    orgId: row.Org?._id || '',
    selectedAccount: '',
    accountCode: row.Account?.code || '',
    accountName: row.Account?.name || '',
    accountPhone: row.Account?.phone || '',
    accountEmail: row.Account?.email || '',
    accountGender: row.Account?.gender || 'male',
    accountIdentityNo: row.Account?.identityNo || '',
    accountAddress: row.Account?.address || ''
  })
}
const closeDialog = () => {
  dialog.visible = false
  if (userFormRef.value) userFormRef.value.clearValidate()
}

const pickDefined = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
)

const buildUserBody = () => pickDefined({
  nickname: dialog.form.nickname,
  roleTemp: (dialog.form.roleTemp || '').toLowerCase(),
  sort: dialog.form.sort,
  isActive: dialog.form.isActive,
  Org: dialog.form.orgId
})

const buildAccountBody = () => pickDefined({
  code: dialog.form.accountCode,
  name: dialog.form.accountName,
  accountType: 'User',
  password: dialog.form.accountPassword,
  phone: dialog.form.accountPhone,
  email: dialog.form.accountEmail,
  gender: (dialog.form.accountGender || '').toLowerCase(),
  identityNo: dialog.form.accountIdentityNo,
  address: dialog.form.accountAddress
})

const saveUser = async () => {
  if (!userFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }
  if (dialog.mode === 'edit') {
    if (!dialog.form.nickname || !dialog.form.nickname.trim()) {
      ElMessage.error('请输入昵称')
      return
    }
    if (!dialog.form.roleTemp) {
      ElMessage.error('请选择角色')
      return
    }
  } else {
    try {
      await userFormRef.value.validate()
    } catch (_) {
      return
    }
  }

  dialog.loading = true
  try {
    let response
    if (dialog.mode === 'edit') {
      response = await userService.updateUser(dialog.form._id, buildUserBody())
    } else if (dialog.form.selectedAccount) {
      // 创建 + 绑定现有账户
      response = await userService.createUser({
        user: { ...buildUserBody(), Account: dialog.form.selectedAccount }
      })
    } else {
      // 创建 + 新建账户
      const accountBody = buildAccountBody()
      if (!accountBody.code || !accountBody.name || !accountBody.password) {
        ElMessage.error('账户名称、真实姓名、密码必填')
        dialog.loading = false
        return
      }
      response = await userService.createUser({
        user: buildUserBody(),
        account: accountBody
      })
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建用户成功' : '更新用户成功')
      dialog.visible = false
      fetchUsers()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error(error.response?.data?.message || '保存用户失败')
  } finally {
    dialog.loading = false
  }
}

/* ===== 打印 ===== */
const printTable = (data) => {
  const columns = [
    { prop: 'Account.name', label: '真实姓名' },
    { prop: 'Account.phone', label: '手机号' },
    { prop: 'Account.email', label: '邮箱' },
    { prop: 'Account.identityNo', label: '身份证号' },
    { prop: 'nickname', label: '昵称' },
    { prop: 'roleTemp', label: '角色', formatter: r => formatUserRole(r.roleTemp) },
    { prop: 'Org.name', label: '所属组织' },
    { prop: 'isActive', label: '状态', formatter: r => formatActiveStatus(r.isActive) },
    { prop: 'sort', label: '排序', formatter: r => r.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: r => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '用户管理数据报表')
}

onMounted(async () => {
  await fetchOrgs()
  await fetchAccounts()
  fetchUsers()
})
</script>

<style scoped>
.users-page {
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

.batch-operation,
.print-operation {
  margin-top: 16px;
}
.batch-toolbar,
.print-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.selection-info,
.print-info {
  font-weight: 500;
  color: #606266;
}
.batch-buttons,
.print-buttons {
  display: flex;
  gap: 8px;
}

.el-tabs {
  min-height: 300px;
}
</style>
