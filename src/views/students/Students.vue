<template>
  <div class="students-page">
    <h2 class="page-title">学生管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="真实姓名">
          <el-input v-model="filters.name" placeholder="请输入学生真实姓名" clearable style="width: 150px;"></el-input>
        </el-form-item>

        <el-form-item label="学校">
          <el-input v-model="filters.school" placeholder="请输入学校" clearable style="width: 150px;"></el-input>
        </el-form-item>

        <el-form-item label="身份证号">
          <el-input v-model="filters.identityNo" placeholder="请输入身份证号" clearable style="width: 180px;"></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchStudents">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增学生</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 高级搜索组件（v8.0.2：关键词搜索也走 regExp） -->
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
        <el-table-column prop="name" label="真实姓名" width="120"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ formatGender(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column prop="birthday" label="出生日期/年龄" width="150">
          <template #default="{ row }">
            {{ formatBirthdayAge(row.birthday) }}
          </template>
        </el-table-column>
        <el-table-column prop="identityNo" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="isActive" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Account.name" label="账号名称" width="120"></el-table-column>
        <el-table-column prop="Account.phone" label="账号联系方式" width="150"></el-table-column>
        <el-table-column prop="school" label="学校" width="150"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
        <el-table-column prop="address" label="证件地址" width="200"></el-table-column>
        <el-table-column prop="currentAddress" label="现居住地址" width="200"></el-table-column>
        <el-table-column prop="sourceType" label="来源类型" width="120"></el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
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
      :title="dialog.mode === 'create' ? '创建学生' : '编辑学生'"
      v-model="dialog.visible"
      width="700px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="studentFormRef"
        label-width="120px"
      >
        <el-tabs v-model="dialog.activeTab" v-if="dialog.mode === 'create'">
          <el-tab-pane label="学生信息" name="student">
            <el-form-item label="真实姓名" prop="name">
              <el-input v-model="dialog.form.name" placeholder="请输入学生真实姓名"></el-input>
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="dialog.form.gender">
                <el-radio label="Male">男</el-radio>
                <el-radio label="Female">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="出生日期" prop="birthday">
              <el-date-picker
                v-model="dialog.form.birthday"
                type="date"
                placeholder="请选择出生日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>

            <el-form-item label="身份证号" prop="identityNo">
              <el-input v-model="dialog.form.identityNo" placeholder="请输入身份证号"></el-input>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input v-model="dialog.form.phone" placeholder="请输入手机号"></el-input>
            </el-form-item>

            <el-form-item label="学校" prop="school">
              <el-input v-model="dialog.form.school" placeholder="请输入学校"></el-input>
            </el-form-item>

            <el-form-item label="证件地址" prop="address">
              <el-input v-model="dialog.form.address" type="textarea" :rows="2" placeholder="请输入证件地址"></el-input>
            </el-form-item>

            <el-form-item label="现居住地址" prop="currentAddress">
              <el-input v-model="dialog.form.currentAddress" type="textarea" :rows="2" placeholder="请输入现居住地址"></el-input>
            </el-form-item>

            <el-form-item label="来源类型" prop="sourceType">
              <el-select v-model="dialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
                <el-option v-for="opt in SOURCE_TYPES" :key="opt" :label="opt" :value="opt"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="备注" prop="description">
              <el-input v-model="dialog.form.description" type="textarea" :rows="3" placeholder="请输入备注信息"></el-input>
            </el-form-item>

            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
            </el-form-item>

            <el-form-item label="状态" prop="isActive">
              <el-switch v-model="dialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
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
              <el-form-item label="状态" prop="accountIsActive">
                <el-switch v-model="dialog.form.accountIsActive" active-text="激活" inactive-text="未激活"></el-switch>
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

        <!-- 编辑模式：仅学生信息 -->
        <div v-else>
          <el-form-item label="真实姓名" prop="name">
            <el-input v-model="dialog.form.name" placeholder="请输入学生真实姓名"></el-input>
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="dialog.form.gender">
              <el-radio label="Male">男</el-radio>
              <el-radio label="Female">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="出生日期" prop="birthday">
            <el-date-picker
              v-model="dialog.form.birthday"
              type="date"
              placeholder="请选择出生日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="身份证号" prop="identityNo">
            <el-input v-model="dialog.form.identityNo" placeholder="请输入身份证号"></el-input>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="dialog.form.phone" placeholder="请输入手机号"></el-input>
          </el-form-item>

          <el-form-item label="学校" prop="school">
            <el-input v-model="dialog.form.school" placeholder="请输入学校"></el-input>
          </el-form-item>

          <el-form-item label="证件地址" prop="address">
            <el-input v-model="dialog.form.address" type="textarea" :rows="2" placeholder="请输入证件地址"></el-input>
          </el-form-item>

          <el-form-item label="现居住地址" prop="currentAddress">
            <el-input v-model="dialog.form.currentAddress" type="textarea" :rows="2" placeholder="请输入现居住地址"></el-input>
          </el-form-item>

          <el-form-item label="来源类型" prop="sourceType">
            <el-select v-model="dialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
              <el-option v-for="opt in SOURCE_TYPES" :key="opt" :label="opt" :value="opt"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="备注" prop="description">
            <el-input v-model="dialog.form.description" type="textarea" :rows="3" placeholder="请输入备注信息"></el-input>
          </el-form-item>

          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
          </el-form-item>

          <el-form-item label="状态" prop="isActive">
            <el-switch v-model="dialog.form.isActive" active-text="激活" inactive-text="未激活"></el-switch>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveStudent" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框（v8.0.2：替代 ElMessageBox.alert） -->
    <DetailDialog
      v-model="detailVisible"
      title="学生详情"
      :data="currentRow"
      :rows="detailRows"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { studentService } from '../../api/student'
import { accountService } from '../../api/account'
import { formatDate, formatGender, formatActiveStatus, formatBirthdayAge } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import {
  buildListPayload,
  appendExact,
  appendBoolean,
  appendRegExp,
  appendDateRange
} from '../../utils/listPayload'
import { useListPage } from '../../composables/useListPage'
import { useAccount } from '../../composables/useAccount'
import DetailDialog from '../../components/DetailDialog.vue'
import AdvancedSearch from '../../components/AdvancedSearch.vue'

/* ===== 来源类型枚举（v8.0.2：从 Subject/Org 模式延伸，把硬编码 9 个 option 抽到顶部） ===== */
const SOURCE_TYPES = Object.freeze([
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

/* ===== 高级搜索参数 ===== */
const advancedFilters = ref({
  keyword: '',
  dateRange: [],
  gender: '',
  ageRange: [0, 100],
  status: '',
  sourceType: ''
})

/* ===== 基础筛选 ===== */
const filters = reactive({
  name: '',
  school: '',
  identityNo: '',
  isActive: ''
})

/* ===== 详情面板 ===== */
const detailVisible = ref(false)
const currentRow = ref({})
const detailRows = [
  { label: '真实姓名',     field: 'name' },
  { label: '性别',         field: 'gender',    render: r => formatGender(r.gender) },
  { label: '出生日期/年龄', field: 'birthday',  render: r => formatBirthdayAge(r.birthday) },
  { label: '身份证号',     field: 'identityNo' },
  { label: '状态',         field: 'isActive',  render: r => formatActiveStatus(r.isActive) },
  { label: '账号名称',     field: 'Account.name' },
  { label: '账号联系方式', field: 'Account.phone' },
  { label: '学校',         field: 'school' },
  { label: '手机号',       field: 'phone' },
  { label: '证件地址',     field: 'address' },
  { label: '现居住地址',   field: 'currentAddress' },
  { label: '来源类型',     field: 'sourceType' },
  { label: '备注',         field: 'description' },
  { label: '排序',         field: 'sort' },
  { label: '所属组织',     field: 'Org.name' },
  { label: '创建时间',     field: 'createdAt', render: r => formatDate(r.createdAt) }
]
const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

/* ===== 表单对话框 ===== */
const dialog = reactive({
  visible: false,
  mode: 'create',
  activeTab: 'student',
  loading: false,
  form: {
    name: '', school: '', sourceType: '其他', description: '', sort: 0,
    phone: '', identityNo: '', gender: 'Male', birthday: '',
    address: '', currentAddress: '',
    isActive: true,
    selectedAccount: '',
    accountCode: '', accountName: '', accountPhone: '', accountEmail: '',
    accountGender: 'male', accountIdentityNo: '', accountAddress: '',
    accountIsActive: true, accountPassword: ''
  },
  rules: {
    name: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '真实姓名长度应在2-50个字符之间', trigger: 'blur' }
    ],
    accountName: [
      { required: true, message: '请输入关联账号名称', trigger: 'blur' }
    ],
    accountCode: [
      { required: true, message: '请输入账户名称', trigger: 'blur' },
      { min: 4, max: 16, message: '账户名称长度应在4-16个字符之间', trigger: 'blur' }
    ],
    accountEmail: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }],
    accountPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ]
  }
})
const studentFormRef = ref()

/* ===== 账户选项（创建学生时供选择 / 自动补全） ===== */
const availableAccounts = ref([])
const fetchAccounts = async () => {
  try {
    const resp = await accountService.getAccounts({
      filter: { isActive: true, accountType: 'Student' },
      options: { limit: 1000 }
    })
    if (resp.data.success) {
      availableAccounts.value = resp.data.data.items || []
    }
  } catch (e) {
    console.error('获取账户列表失败:', e)
  }
}

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
const fetchStudents = async () => {
  const filter = {}

  // 基础搜索：name / school / identityNo 走 regExp（取第一个非空值）
  // 后端 v7.x Student 模块的 listVD 只接受 filter.regExp（模糊匹配 name），
  // 旧的 $or 多字段正则会被 matchedData() 静默剔除。
  appendRegExp(filter, filters.name, filters.school, filters.identityNo)
  appendBoolean(filter, 'isActive', filters.isActive)

  // 高级搜索：关键词也走 regExp
  if (advancedFilters.value.keyword) {
    filter.regExp = advancedFilters.value.keyword
  }
  appendExact(filter, 'gender', advancedFilters.value.gender)
  appendExact(filter, 'sourceType', advancedFilters.value.sourceType)
  appendBoolean(filter, 'isActive', advancedFilters.value.status)

  // 年龄范围 → 出生日期范围
  if (Array.isArray(advancedFilters.value.ageRange) &&
      (advancedFilters.value.ageRange[0] > 0 || advancedFilters.value.ageRange[1] < 100)) {
    const currentYear = new Date().getFullYear()
    const maxBirthYear = currentYear - advancedFilters.value.ageRange[0]
    const minBirthYear = currentYear - advancedFilters.value.ageRange[1]
    if (minBirthYear <= maxBirthYear) {
      filter.birthday = {
        $gte: `${minBirthYear}-01-01`,
        $lte: `${maxBirthYear}-12-31`
      }
    }
  }

  appendDateRange(filter, advancedFilters.value.dateRange, 'createdAt')

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { sort: -1, createdAt: -1 },
    populateKeys: ['Org', 'Account']
  })

  await fetchList(studentService.getStudents.bind(studentService), payload)
}

const handleAdvancedSearch = (data) => {
  Object.assign(advancedFilters.value, data)
  pagination.currentPage = 1
  fetchStudents()
}
const handleAdvancedReset = () => {
  advancedFilters.value = {
    keyword: '', dateRange: [], gender: '', ageRange: [0, 100], status: '', sourceType: ''
  }
  fetchStudents()
}
const resetFilters = () => {
  filters.name = ''
  filters.school = ''
  filters.identityNo = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchStudents()
}

/* ===== 批量操作 ===== */
const onBatchActivate = () => batchUpdateField({
  field: 'isActive',
  value: true,
  label: '激活',
  apply: (ids, body) => Promise.allSettled(ids.map(id => studentService.updateStudent(id, body))),
  onComplete: fetchStudents
})
const onBatchDeactivate = () => batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => studentService.updateStudent(id, { isActive: false }))),
  onComplete: fetchStudents
})

/* ===== 打开/保存 ===== */
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  dialog.activeTab = 'student'
  Object.assign(dialog.form, {
    name: '', school: '', sourceType: '其他', description: '', sort: 0,
    phone: '', identityNo: '', gender: 'Male', birthday: '',
    address: '', currentAddress: '',
    isActive: true,
    selectedAccount: '',
    accountCode: '', accountName: '', accountPhone: '', accountEmail: '',
    accountGender: 'male', accountIdentityNo: '', accountAddress: '',
    accountIsActive: true, accountPassword: ''
  })
}

const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  Object.assign(dialog.form, {
    _id: row._id,
    name: row.name || '',
    school: row.school || '',
    sourceType: row.sourceType || '其他',
    description: row.description || '',
    sort: row.sort || 0,
    phone: row.phone || '',
    identityNo: row.identityNo || '',
    gender: row.gender || 'Male',
    birthday: row.birthday ? new Date(row.birthday).toISOString().split('T')[0] : '',
    address: row.address || '',
    currentAddress: row.currentAddress || '',
    isActive: row.isActive
  })
}

const closeDialog = () => {
  dialog.visible = false
  if (studentFormRef.value) studentFormRef.value.clearValidate()
}

// pickDefined: 过滤 undefined / null / 空字符串字段，匹配后端 matchedData() 的白名单语义
const pickDefined = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
)

const buildStudentBody = () => pickDefined({
  name: dialog.form.name,
  school: dialog.form.school,
  sourceType: dialog.form.sourceType,
  description: dialog.form.description,
  sort: dialog.form.sort,
  phone: dialog.form.phone,
  identityNo: dialog.form.identityNo,
  gender: dialog.form.gender,
  birthday: dialog.form.birthday,
  address: dialog.form.address,
  currentAddress: dialog.form.currentAddress,
  isActive: dialog.form.isActive
})

const buildAccountBody = () => pickDefined({
  code: dialog.form.accountCode,
  name: dialog.form.accountName,
  accountType: 'Student',
  password: dialog.form.accountPassword,
  phone: dialog.form.accountPhone,
  email: dialog.form.accountEmail,
  gender: dialog.form.accountGender,
  identityNo: dialog.form.accountIdentityNo,
  address: dialog.form.accountAddress,
  isActive: dialog.form.accountIsActive
})

const saveStudent = async () => {
  if (!studentFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }
  // 编辑模式：基础校验 + 走更新；创建模式：依赖 formRules 的 validate()
  if (dialog.mode === 'edit') {
    if (!dialog.form.name || !dialog.form.name.trim()) {
      ElMessage.error('请输入真实姓名')
      return
    }
  } else {
    try {
      await studentFormRef.value.validate()
    } catch (_) {
      return
    }
  }

  dialog.loading = true
  try {
    let response
    if (dialog.mode === 'edit') {
      // 编辑：只更新 student
      response = await studentService.updateStudent(dialog.form._id, buildStudentBody())
    } else if (dialog.form.selectedAccount) {
      // 创建 + 绑定现有账户
      response = await studentService.createStudent({
        student: { ...buildStudentBody(), Account: dialog.form.selectedAccount }
      })
    } else {
      // 创建 + 新建账户
      const accountBody = buildAccountBody()
      if (!accountBody.code || !accountBody.name || !accountBody.password) {
        ElMessage.error('账户名称、真实姓名、密码必填')
        dialog.loading = false
        return
      }
      response = await studentService.createStudent({
        student: buildStudentBody(),
        account: accountBody
      })
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建学生成功' : '更新学生成功')
      dialog.visible = false
      fetchStudents()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存学生失败:', error)
    ElMessage.error(error.response?.data?.message || '保存学生失败')
  } finally {
    dialog.loading = false
  }
}

/* ===== 打印 ===== */
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '真实姓名' },
    { prop: 'gender', label: '性别', formatter: r => formatGender(r.gender) },
    { prop: 'birthday', label: '出生日期/年龄', formatter: r => formatBirthdayAge(r.birthday) },
    { prop: 'identityNo', label: '身份证号' },
    { prop: 'isActive', label: '状态', formatter: r => formatActiveStatus(r.isActive) },
    { prop: 'Account.name', label: '账号名称' },
    { prop: 'Account.phone', label: '账号联系方式' },
    { prop: 'school', label: '学校' },
    { prop: 'phone', label: '手机号' },
    { prop: 'address', label: '证件地址' },
    { prop: 'currentAddress', label: '现居住地址' },
    { prop: 'sourceType', label: '来源类型' },
    { prop: 'Org.name', label: '所属组织' },
    { prop: 'sort', label: '排序', formatter: r => r.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: r => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '学生管理数据报表')
}

onMounted(async () => {
  await fetchAccounts()
  fetchStudents()
})
</script>

<style scoped>
.students-page {
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
</style>
