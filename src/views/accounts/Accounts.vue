<template>
  <div class="accounts-page">
    <h2 class="page-title">账户管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="账号类型">
          <el-select v-model="filters.accountType" placeholder="请选择账号类型" clearable style="width: 150px;">
            <el-option v-for="opt in USER_VISIBLE_ACCOUNT_TYPES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="filters.name" placeholder="请输入姓名" clearable style="width: 150px;"></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 150px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchAccounts">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增账户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        :expand-row-keys="expandedRows"
        @expand-change="handleExpandChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="sub-table-container">
              <el-tabs v-model="row.currentSubTable">
                <el-tab-pane label="关联用户" name="users" v-if="row.accountType === 'User' || row.accountType === 'Admin'">
                  <el-table :data="row.relatedUsers || []" style="width: 100%; margin-left: 40px;">
                    <el-table-column prop="nickname" label="用户昵称" width="120"></el-table-column>
                    <el-table-column prop="roleTemp" label="角色" width="120">
                      <template #default="{ row: userRow }">
                        {{ formatUserRole(userRow.roleTemp) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
                    <el-table-column prop="isActive" label="状态" width="100">
                      <template #default="{ row: userRow }">
                        <el-tag :type="userRow.isActive ? 'success' : 'danger'">
                          {{ formatActiveStatus(userRow.isActive) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="创建时间" width="180">
                      <template #default="{ row: userRow }">
                        {{ formatDate(userRow.createdAt) }}
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
                <el-tab-pane label="关联学生" name="students" v-if="row.accountType === 'Student'">
                  <el-table :data="row.relatedStudents || []" style="width: 100%; margin-left: 40px;">
                    <el-table-column prop="name" label="真实姓名" width="120"></el-table-column>
                    <el-table-column prop="school" label="学校" width="150"></el-table-column>
                    <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
                    <el-table-column prop="sourceType" label="来源类型" width="120"></el-table-column>
                    <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
                    <el-table-column prop="isActive" label="状态" width="100">
                      <template #default="{ row: studentRow }">
                        <el-tag :type="studentRow.isActive ? 'success' : 'danger'">
                          {{ formatActiveStatus(studentRow.isActive) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="创建时间" width="180">
                      <template #default="{ row: studentRow }">
                        {{ formatDate(studentRow.createdAt) }}
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="账号" width="150"></el-table-column>
        <el-table-column prop="name" label="姓名" width="120"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="identityNo" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="accountType" label="账号类型" width="120">
          <template #default="{ row }">
            {{ formatAccountTypeEnum(row.accountType) }}
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ formatGender(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentUser.nickname" label="当前用户" width="120"></el-table-column>
        <el-table-column prop="currentUser.roleTemp" label="当前角色" width="120">
          <template #default="{ row }">
            {{ formatUserRole(row.currentUser?.roleTemp) }}
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-dropdown>
                <el-button size="small">
                  新增关联 <el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.accountType === 'User' || row.accountType === 'Admin'"
                      @click="openCreateUserDialog(row)"
                    >
                      新增用户
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.accountType === 'Student'"
                      @click="openCreateStudentDialog(row)"
                    >
                      新增学生
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
      :title="dialog.mode === 'create' ? '创建账户' : '编辑账户'"
      v-model="dialog.visible"
      width="700px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="accountFormRef"
        label-width="120px"
      >
        <el-form-item label="账号" prop="code">
          <el-input v-model="dialog.form.code" :disabled="dialog.mode === 'edit'" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="dialog.form.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="身份证号" prop="identityNo">
          <el-input v-model="dialog.form.identityNo" placeholder="请输入身份证号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="dialog.form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="账号类型" prop="accountType">
          <el-select v-model="dialog.form.accountType" placeholder="请选择账号类型" style="width: 100%">
            <el-option v-for="opt in USER_VISIBLE_ACCOUNT_TYPES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="dialog.form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="dialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
        </el-form-item>
        <el-form-item label="密码" v-if="dialog.mode === 'create'" prop="password">
          <el-input v-model="dialog.form.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveAccount" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增关联用户对话框 -->
    <el-dialog title="新增用户" v-model="createUserDialog.visible" width="500px" :before-close="closeCreateUserDialog">
      <el-form :model="createUserDialog.form" label-width="120px">
        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="createUserDialog.form.nickname" placeholder="请输入用户昵称"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="roleTemp">
          <el-select v-model="createUserDialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="opt in USER_ROLES" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="orgId">
          <el-select v-model="createUserDialog.form.orgId" placeholder="请选择组织" style="width: 100%">
            <el-option v-for="org in orgOptions" :key="org._id" :label="org.name" :value="org._id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="createUserDialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateUserDialog">取消</el-button>
        <el-button type="primary" :loading="createUserDialog.loading" @click="saveRelatedUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增关联学生对话框 -->
    <el-dialog title="新增学生" v-model="createStudentDialog.visible" width="500px" :before-close="closeCreateStudentDialog">
      <el-form :model="createStudentDialog.form" label-width="120px">
        <el-form-item label="学生姓名" prop="name">
          <el-input v-model="createStudentDialog.form.name" placeholder="请输入学生姓名"></el-input>
        </el-form-item>
        <el-form-item label="学校" prop="school">
          <el-input v-model="createStudentDialog.form.school" placeholder="请输入学校"></el-input>
        </el-form-item>
        <el-form-item label="来源类型" prop="sourceType">
          <el-select v-model="createStudentDialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
            <el-option v-for="opt in STUDENT_SOURCE_TYPES" :key="opt" :label="opt" :value="opt"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="orgId">
          <el-select v-model="createStudentDialog.form.orgId" placeholder="请选择组织" style="width: 100%">
            <el-option v-for="org in orgOptions" :key="org._id" :label="org.name" :value="org._id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="createStudentDialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateStudentDialog">取消</el-button>
        <el-button type="primary" :loading="createStudentDialog.loading" @click="saveRelatedStudent">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框（v8.0.2：替代 ElMessageBox.alert） -->
    <DetailDialog
      v-model="detailVisible"
      title="账户详情"
      :data="currentRow"
      :rows="detailRows"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { accountService } from '../../api/account'
import { orgService } from '../../api/org'
import { userService } from '../../api/user'
import { studentService } from '../../api/student'
import { formatDate, formatGender, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import {
  buildListPayload,
  appendExact,
  appendBoolean
} from '../../utils/listPayload'
import {
  USER_ROLES,
  formatUserRole,
  formatAccountTypeEnum,
  ACCOUNT_TYPES
} from '../../utils/enums'
import { useListPage } from '../../composables/useListPage'
import DetailDialog from '../../components/DetailDialog.vue'

/* ===== 业务枚举（Accounts 页面可见的 accountType 子集 —— 不要在这里给用户开 Admin） ===== */
const USER_VISIBLE_ACCOUNT_TYPES = Object.freeze(
  ACCOUNT_TYPES.filter(t => t.value !== 'Admin')
)
const STUDENT_SOURCE_TYPES = Object.freeze([
  '地推', '传单', '活动', '介绍', '听说', '路过', '抖音', '朋友圈', '其他'
])

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

/* ===== 基础筛选 ===== */
const filters = reactive({
  accountType: '',
  name: '',
  isActive: ''
})

/* ===== 关联资源 ===== */
const orgOptions = ref([])
const expandedRows = ref([]) // 当前展开的 account _id 列表

const fetchOrgs = async () => {
  try {
    const resp = await orgService.getOrgs({
      filter: { isActive: true },
      options: { limit: 1000 }
    })
    if (resp.data.success) orgOptions.value = resp.data.data.items || []
  } catch (e) {
    console.error('获取组织列表失败:', e)
  }
}

/* ===== 详情面板 ===== */
const detailVisible = ref(false)
const currentRow = ref({})
const detailRows = [
  { label: '账号',         field: 'code' },
  { label: '姓名',         field: 'name' },
  { label: '手机号',       field: 'phone' },
  { label: '邮箱',         field: 'email' },
  { label: '身份证号',     field: 'identityNo' },
  { label: '账号类型',     field: 'accountType', render: r => formatAccountTypeEnum(r.accountType) },
  { label: '性别',         field: 'gender', render: r => formatGender(r.gender) },
  { label: '排序',         field: 'sort' },
  { label: '状态',         field: 'isActive', render: r => formatActiveStatus(r.isActive) },
  { label: '当前用户',     field: 'currentUser.nickname' },
  { label: '当前角色',     field: 'currentUser.roleTemp', render: r => formatUserRole(r.currentUser?.roleTemp) },
  { label: '最后登录时间', field: 'lastLoginAt', render: r => r.lastLoginAt ? formatDate(r.lastLoginAt) : '-' },
  { label: '最后登录IP',   field: 'lastLoginIP' },
  { label: '上次登出时间', field: 'lastLogoutAt', render: r => r.lastLogoutAt ? formatDate(r.lastLogoutAt) : '-' },
  { label: '创建时间',     field: 'createdAt', render: r => formatDate(r.createdAt) }
]
const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

/* ===== 账户编辑/创建对话框 ===== */
const dialog = reactive({
  visible: false,
  mode: 'create',
  loading: false,
  form: {
    code: '', name: '', phone: '', email: '', identityNo: '',
    accountType: 'User', gender: 'male',
    sort: 0, isActive: true, password: ''
  },
  rules: {
    code: [
      { required: true, message: '请输入账号', trigger: 'blur' },
      { min: 4, max: 16, message: '账号长度应在4-16个字符之间', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '姓名长度应在2-50个字符之间', trigger: 'blur' }
    ],
    phone: [{ min: 10, max: 15, message: '手机号长度应在10-15个字符之间', trigger: 'blur' }],
    identityNo: [{ min: 15, max: 18, message: '身份证号长度应在15-18个字符之间', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ],
    accountType: [{ required: true, message: '请选择账号类型', trigger: 'change' }]
  }
})
const accountFormRef = ref()

/* ===== 关联用户对话框（行展开后的"新增用户"） ===== */
const createUserDialog = reactive({
  visible: false,
  loading: false,
  account: null,
  form: { nickname: '', roleTemp: 'teacher', orgId: '', isActive: true }
})

/* ===== 关联学生对话框 ===== */
const createStudentDialog = reactive({
  visible: false,
  loading: false,
  account: null,
  form: { name: '', school: '', sourceType: '其他', orgId: '', isActive: true }
})

/* ===== 列表拉取（v8.0.2 统一走 buildListPayload） ===== */
const fetchAccounts = async () => {
  const filter = {}
  appendExact(filter, 'accountType', filters.accountType)
  appendBoolean(filter, 'isActive', filters.isActive)
  // 账户模块 listVD 不支持 name 模糊搜索（后端未提供 regExp），name 字段不入 filter

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { createdAt: -1 },
    populateKeys: ['currentUser']
  })
  await fetchList(accountService.getAccounts.bind(accountService), payload)
}

const resetFilters = () => {
  filters.accountType = ''
  filters.name = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchAccounts()
}

/* ===== 行展开 → 加载关联 User / Student ===== */
const handleExpandChange = async (row, expanded) => {
  if (expanded) {
    await loadRelatedData(row)
    if (!expandedRows.value.includes(row._id)) expandedRows.value.push(row._id)
  } else {
    const i = expandedRows.value.indexOf(row._id)
    if (i > -1) expandedRows.value.splice(i, 1)
  }
}

const loadRelatedData = async (row) => {
  try {
    if (row.accountType === 'User' || row.accountType === 'Admin') {
      const userResp = await userService.getUsers({
        filter: { Account: row._id },
        options: { populate: [{ path: 'Org', select: 'name' }] }
      })
      if (userResp.data.success) row.relatedUsers = userResp.data.data.items || []
    }
    if (row.accountType === 'Student') {
      const stuResp = await studentService.getStudents({
        filter: { Account: row._id },
        options: { populate: [{ path: 'Org', select: 'name' }] }
      })
      if (stuResp.data.success) row.relatedStudents = stuResp.data.data.items || []
    }
  } catch (e) {
    console.error('加载关联数据失败:', e)
  }
}

/* ===== 批量操作 ===== */
const onBatchActivate = () => batchUpdateField({
  field: 'isActive',
  value: true,
  label: '激活',
  apply: (ids, body) => Promise.allSettled(ids.map(id => accountService.updateAccount(id, body))),
  onComplete: fetchAccounts
})
const onBatchDeactivate = () => batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => accountService.updateAccount(id, { isActive: false }))),
  onComplete: fetchAccounts
})

/* ===== 打开/保存主对话框 ===== */
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  Object.assign(dialog.form, {
    code: '', name: '', phone: '', email: '', identityNo: '',
    accountType: 'User', gender: 'male',
    sort: 0, isActive: true, password: ''
  })
}
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  Object.assign(dialog.form, {
    _id: row._id,
    code: row.code || '',
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    identityNo: row.identityNo || '',
    accountType: row.accountType || 'User',
    gender: row.gender || 'male',
    sort: row.sort || 0,
    isActive: row.isActive,
    password: ''
  })
}
const closeDialog = () => {
  dialog.visible = false
  if (accountFormRef.value) accountFormRef.value.clearValidate()
}

const pickDefined = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
)

const buildAccountBody = (isCreate) => {
  const base = pickDefined({
    name: dialog.form.name,
    phone: dialog.form.phone,
    email: dialog.form.email,
    identityNo: dialog.form.identityNo,
    accountType: dialog.form.accountType,
    gender: dialog.form.gender,
    sort: dialog.form.sort,
    isActive: dialog.form.isActive
  })
  if (isCreate) {
    base.code = dialog.form.code
    if (dialog.form.password) base.password = dialog.form.password
  }
  return base
}

const saveAccount = async () => {
  if (!accountFormRef.value) return
  try {
    await accountFormRef.value.validate()
  } catch (_) {
    return
  }
  dialog.loading = true
  try {
    const isCreate = dialog.mode === 'create'
    const response = isCreate
      ? await accountService.createAccount(buildAccountBody(true))
      : await accountService.updateAccount(dialog.form._id, buildAccountBody(false))

    if (response.data.success) {
      ElMessage.success(isCreate ? '创建账户成功' : '更新账户成功')
      dialog.visible = false
      fetchAccounts()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存账户失败:', error)
    ElMessage.error(error.response?.data?.message || '保存账户失败')
  } finally {
    dialog.loading = false
  }
}

/* ===== 打开/保存关联用户对话框 ===== */
const openCreateUserDialog = async (account) => {
  createUserDialog.account = account
  try {
    const userResp = await userService.getUsers({
      filter: { Account: account._id },
      options: { populate: [{ path: 'Org', select: 'name' }] }
    })
    if (userResp.data.success) {
      const existingOrgIds = (userResp.data.data.items || [])
        .map(u => u.Org?._id).filter(Boolean)
      const availableOrgs = orgOptions.value.filter(o => !existingOrgIds.includes(o._id))
      if (availableOrgs.length === 0) {
        ElMessage.warning('该账户已在所有组织中有用户，无法新增更多用户')
        return
      }
    }
  } catch (e) {
    console.error('获取已有用户失败:', e)
  }
  createUserDialog.visible = true
  Object.assign(createUserDialog.form, {
    nickname: '', roleTemp: 'teacher', orgId: '', isActive: true
  })
}
const closeCreateUserDialog = () => { createUserDialog.visible = false }
const saveRelatedUser = async () => {
  if (!createUserDialog.form.nickname || !createUserDialog.form.orgId) {
    ElMessage.error('请填写昵称和组织')
    return
  }
  createUserDialog.loading = true
  try {
    const resp = await userService.createUser({
      user: {
        nickname: createUserDialog.form.nickname,
        roleTemp: createUserDialog.form.roleTemp,
        Org: createUserDialog.form.orgId,
        Account: createUserDialog.account._id,
        isActive: createUserDialog.form.isActive
      }
    })
    if (resp.data.success) {
      ElMessage.success('创建用户成功')
      createUserDialog.visible = false
      fetchAccounts()
    } else {
      ElMessage.error(resp.data.message || '创建用户失败')
    }
  } catch (e) {
    console.error('创建用户失败:', e)
    ElMessage.error(e.response?.data?.message || '创建用户失败')
  } finally {
    createUserDialog.loading = false
  }
}

/* ===== 打开/保存关联学生对话框 ===== */
const openCreateStudentDialog = (account) => {
  createStudentDialog.account = account
  createStudentDialog.visible = true
  Object.assign(createStudentDialog.form, {
    name: '', school: '', sourceType: '其他', orgId: '', isActive: true
  })
}
const closeCreateStudentDialog = () => { createStudentDialog.visible = false }
const saveRelatedStudent = async () => {
  if (!createStudentDialog.form.name || !createStudentDialog.form.orgId) {
    ElMessage.error('请填写姓名和组织')
    return
  }
  createStudentDialog.loading = true
  try {
    const resp = await studentService.createStudent({
      student: {
        name: createStudentDialog.form.name,
        school: createStudentDialog.form.school,
        sourceType: createStudentDialog.form.sourceType,
        Org: createStudentDialog.form.orgId,
        Account: createStudentDialog.account._id,
        isActive: createStudentDialog.form.isActive
      }
    })
    if (resp.data.success) {
      ElMessage.success('创建学生成功')
      createStudentDialog.visible = false
      fetchAccounts()
    } else {
      ElMessage.error(resp.data.message || '创建学生失败')
    }
  } catch (e) {
    console.error('创建学生失败:', e)
    ElMessage.error(e.response?.data?.message || '创建学生失败')
  } finally {
    createStudentDialog.loading = false
  }
}

/* ===== 打印 ===== */
const printTable = (data) => {
  const columns = [
    { prop: 'code', label: '账号' },
    { prop: 'name', label: '姓名' },
    { prop: 'phone', label: '手机号' },
    { prop: 'email', label: '邮箱' },
    { prop: 'identityNo', label: '身份证号' },
    { prop: 'accountType', label: '账号类型', formatter: r => formatAccountTypeEnum(r.accountType) },
    { prop: 'gender', label: '性别', formatter: r => formatGender(r.gender) },
    { prop: 'isActive', label: '状态', formatter: r => formatActiveStatus(r.isActive) },
    { prop: 'createdAt', label: '创建时间', formatter: r => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '账户管理数据报表')
}

onMounted(async () => {
  await fetchOrgs()
  fetchAccounts()
})
</script>

<style scoped>
.accounts-page {
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

.sub-table-container {
  padding: 15px 0 15px 40px;
  background-color: #fafafa;
  border-left: 4px solid #dcdfe6;
}
</style>
