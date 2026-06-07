<template>
  <div class="studentpacks-page">
    <h2 class="page-title">学生课包管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            placeholder="模糊匹配课包名称"
            clearable
            style="width: 180px;"
          ></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择"
            clearable
            style="width: 130px;"
          >
            <el-option
              v-for="opt in STUDENT_PACK_STATUS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="来源">
          <el-select
            v-model="filters.resource"
            placeholder="请选择"
            clearable
            style="width: 130px;"
          >
            <el-option
              v-for="opt in STUDENT_PACK_RESOURCE"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="学生">
          <el-select
            v-model="filters.Student"
            placeholder="请选择学生"
            clearable
            filterable
            remote
            :remote-method="searchStudents"
            :loading="studentLoading"
            style="width: 200px;"
          >
            <el-option
              v-for="s in studentOptions"
              :key="s._id"
              :label="s.name"
              :value="s._id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="所属校区" v-if="isAdmin">
          <el-select
            v-model="filters.Org"
            placeholder="请选择校区"
            clearable
            filterable
            style="width: 200px;"
          >
            <el-option
              v-for="o in orgOptions"
              :key="o._id"
              :label="o.name"
              :value="o._id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button
              v-if="canAdd"
              type="success"
              @click="openCreateDialog"
            >
              赠送课包
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column label="课包ID" width="110">
          <template #default="{ row }">
            <span class="pack-id">{{ shortId(row._id) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="学生" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.Student?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="关联账户" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.Account">
              <span>{{ row.Account.name || '-' }}</span>
              <span v-if="row.Account.phone" class="muted">
                ({{ row.Account.phone }})
              </span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="课包名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.packName || row.Pack?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="studentPackResourceTagType(row.resource)">
              {{ formatStudentPackResource(row.resource) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="课时进度" width="160">
          <template #default="{ row }">
            <span class="lesson-progress">
              {{ row.remainingLesson ?? 0 }} / {{ row.totalLesson || 0 }}
            </span>
            <el-progress
              :percentage="lessonProgressPct(row)"
              :stroke-width="6"
              :show-text="false"
              :status="lessonProgressStatus(row)"
              style="margin-top: 4px;"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="studentPackStatusTagType(row.status)">
              {{ formatStudentPackStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="激活日期" width="120">
          <template #default="{ row }">
            {{ formatDateOnly(row.activeDate) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="到期日期" width="120">
          <template #default="{ row }">
            {{ formatDateOnly(row.expireDate) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="所属校区" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.Org?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="viewDetail(row)">查看</el-button>
              <el-button
                v-if="canEdit"
                size="small"
                type="primary"
                @click="openEditDialog(row)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="print-operation">
        <el-divider />
        <div class="print-toolbar">
          <span class="print-info">打印功能</span>
          <div class="print-buttons">
            <el-button
              @click="printTable(selectedRows)"
              type="primary"
              size="small"
              :disabled="selectedRows.length === 0"
            >
              打印选中项
            </el-button>
            <el-button
              @click="printTable(items)"
              type="primary"
              size="small"
            >
              打印全部数据
            </el-button>
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

    <!-- 赠送 / 编辑 弹窗 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '赠送课包' : '编辑学生课包'"
      v-model="dialog.visible"
      width="640px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="formRules"
        ref="packFormRef"
        label-width="110px"
      >
        <!-- =================== 新建 (赠送) =================== -->
        <template v-if="dialog.mode === 'create'">
          <el-form-item label="学生" prop="Student">
            <el-select
              v-model="dialog.form.Student"
              placeholder="请选择学生"
              filterable
              remote
              :remote-method="searchStudents"
              :loading="studentLoading"
              style="width: 100%"
            >
              <el-option
                v-for="s in studentOptions"
                :key="s._id"
                :label="s.name"
                :value="s._id"
              ></el-option>
            </el-select>
            <div class="field-hint">
              只能为本公司学生赠送（后端强制 Org 隔离）
            </div>
          </el-form-item>

          <el-form-item label="赠送课时" prop="totalLesson">
            <el-input-number
              v-model="dialog.form.totalLesson"
              :min="1"
              :precision="0"
              placeholder="赠送课时数"
              style="width: 100%;"
            ></el-input-number>
            <div class="field-hint">默认剩余课时 = 赠送课时；下方可单独指定剩余课时（补发场景）</div>
          </el-form-item>

          <el-form-item label="剩余课时">
            <el-input-number
              v-model="dialog.form.remainingLesson"
              :min="0"
              :max="dialog.form.totalLesson || 0"
              :precision="0"
              placeholder="留空则等于赠送课时"
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>

          <el-form-item label="课包名称">
            <el-input
              v-model="dialog.form.packName"
              placeholder="留空则使用「赠送课时」"
              maxlength="50"
            ></el-input>
          </el-form-item>

          <el-form-item label="赠送说明">
            <el-input
              v-model="dialog.form.description"
              type="textarea"
              :rows="2"
              placeholder="活动名称 / 赠送原因（可选，≤500 字符）"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item label="激活日期">
            <el-date-picker
              v-model="dialog.form.activeDate"
              type="date"
              placeholder="留空则使用当前时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="到期日期">
            <el-date-picker
              v-model="dialog.form.expireDate"
              type="date"
              placeholder="留空则默认 +365 天"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="dialog.form.status"
              placeholder="默认「激活中」"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="opt in STUDENT_PACK_STATUS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </template>

        <!-- =================== 编辑 =================== -->
        <template v-else>
          <el-divider content-position="left">基础信息（只读）</el-divider>

          <el-form-item label="学生">
            <span class="readonly-line">{{ dialog.form._studentName || '-' }}</span>
          </el-form-item>

          <el-form-item label="关联账户">
            <span class="readonly-line">{{ dialog.form._accountName || '-' }}</span>
          </el-form-item>

          <el-form-item label="课包名称">
            <span class="readonly-line">{{ dialog.form._packName || '-' }}</span>
          </el-form-item>

          <el-form-item label="来源">
            <el-tag :type="studentPackResourceTagType(dialog.form._resource)">
              {{ formatStudentPackResource(dialog.form._resource) }}
            </el-tag>
          </el-form-item>

          <el-form-item label="总/剩余课时">
            <span class="readonly-line">
              剩余 {{ dialog.form.remainingLesson ?? 0 }} / 总 {{ dialog.form._totalLesson || 0 }} 课时
            </span>
          </el-form-item>

          <el-form-item label="所属校区">
            <span class="readonly-line">{{ dialog.form._orgName || '-' }}</span>
          </el-form-item>

          <el-divider content-position="left">可编辑字段</el-divider>

          <el-form-item label="状态" prop="status">
            <el-select
              v-model="dialog.form.status"
              placeholder="请选择状态"
              style="width: 100%"
            >
              <el-option
                v-for="opt in STUDENT_PACK_STATUS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="激活日期">
            <el-date-picker
              v-model="dialog.form.activeDate"
              type="date"
              placeholder="激活日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="到期日期">
            <el-date-picker
              v-model="dialog.form.expireDate"
              type="date"
              placeholder="到期日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="剩余课时" prop="remainingLesson">
            <el-input-number
              v-model="dialog.form.remainingLesson"
              :min="0"
              :max="dialog.form._totalLesson || 0"
              :precision="0"
              placeholder="剩余课时"
              style="width: 100%;"
            ></el-input-number>
            <div class="field-hint">不能超过总课时 {{ dialog.form._totalLesson || 0 }}</div>
          </el-form-item>

          <el-form-item label="赠送说明">
            <el-input
              v-model="dialog.form.description"
              type="textarea"
              :rows="2"
              placeholder="赠送说明（可选）"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          type="primary"
          @click="savePack"
          :loading="dialog.loading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      title="学生课包详情"
      v-model="detailDialog.visible"
      width="640px"
    >
      <el-descriptions
        v-if="detailDialog.data"
        :column="2"
        border
        size="default"
      >
        <el-descriptions-item label="课包ID" :span="2">
          {{ detailDialog.data._id }}
        </el-descriptions-item>
        <el-descriptions-item label="学生">
          {{ detailDialog.data.Student?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联账户">
          <template v-if="detailDialog.data.Account">
            {{ detailDialog.data.Account.name }}
            <span v-if="detailDialog.data.Account.phone" class="muted">
              ({{ detailDialog.data.Account.phone }})
            </span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="课包名称" :span="2">
          {{ detailDialog.data.packName || detailDialog.data.Pack?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="来源">
          <el-tag :type="studentPackResourceTagType(detailDialog.data.resource)">
            {{ formatStudentPackResource(detailDialog.data.resource) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="studentPackStatusTagType(detailDialog.data.status)">
            {{ formatStudentPackStatus(detailDialog.data.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总课时">
          {{ detailDialog.data.totalLesson || 0 }} 课时
        </el-descriptions-item>
        <el-descriptions-item label="剩余课时">
          {{ detailDialog.data.remainingLesson ?? 0 }} 课时
        </el-descriptions-item>
        <el-descriptions-item label="激活日期">
          {{ formatDateOnly(detailDialog.data.activeDate) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="到期日期">
          {{ formatDateOnly(detailDialog.data.expireDate) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="已上课程" :span="2">
          {{ detailDialog.data.LessonAttendances?.length || 0 }} 节
        </el-descriptions-item>
        <el-descriptions-item label="关联订单" :span="2">
          <span v-if="detailDialog.data.OrderPack">
            {{ detailDialog.data.OrderPack._id || detailDialog.data.OrderPack }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="关联课包" :span="2">
          <span v-if="detailDialog.data.Pack">
            {{ detailDialog.data.Pack.name || detailDialog.data.Pack._id || detailDialog.data.Pack }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="所属校区">
          {{ detailDialog.data.Org?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ detailDialog.data.createdBy?.nickname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDate(detailDialog.data.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="赠送说明" :span="2">
          {{ detailDialog.data.description || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button type="primary" @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useListPage } from '../../composables/useListPage'
import {
  buildListPayload,
  appendRegExp,
  appendExact
} from '../../utils/listPayload'
import { formatDate, formatDateOnly } from '../../utils/format'
import {
  STUDENT_PACK_STATUS,
  STUDENT_PACK_RESOURCE,
  formatStudentPackStatus,
  studentPackStatusTagType,
  formatStudentPackResource,
  studentPackResourceTagType
} from '../../utils/enums'
import { printTable as printTableUtil } from '../../utils/print'
import { useAuthStore } from '../../stores/auth'
import { useAccount } from '../../composables/useAccount'
import { studentPackService } from '../../api/studentPack'
import { studentService } from '../../api/student'
import { orgService } from '../../api/org'

const authStore = useAuthStore()

// ===================== 权限计算 =====================
const { isAdmin, isManager } = useAccount()
// 列表/详情: isManager
// 赠送 (add) / 编辑 (edit): isAdmin（页面按钮按 isAdmin 控制，后端 Permission.add/edit 也只放行 Admin）
const canAdd = computed(() => isAdmin.value)
const canEdit = computed(() => isAdmin.value)
const orgFilterEnabled = isManager  // 给模板 v-if 用
void orgFilterEnabled

// ===================== 列表 composable =====================
const {
  items,
  loading,
  selectedRows,
  pagination,
  fetchList,
  handleSelectionChange,
  handleSizeChange,
  handleCurrentChange
} = useListPage({ defaultPageSize: 10 })

// ===================== 筛选条件 =====================
const filters = reactive({
  keyword: '',
  status: '',
  resource: '',
  Student: '',
  Org: ''
})

// ===================== 选项(远程搜索) =====================
const studentOptions = ref([])
const orgOptions = ref([])
const studentLoading = ref(false)

// ===================== 工具函数 =====================
const shortId = (id) => {
  if (!id) return '-'
  return id.slice(-8).toUpperCase()
}

const lessonProgressPct = (row) => {
  const total = Number(row.totalLesson) || 0
  if (total === 0) return 0
  const remain = Number(row.remainingLesson) || 0
  return Math.max(0, Math.min(100, Math.round((remain / total) * 100)))
}

const lessonProgressStatus = (row) => {
  if (row.status === 'frozen') return 'warning'
  if (row.status === 'refunded') return 'exception'
  if (row.status === 'exhausted' || (row.remainingLesson ?? 0) === 0) return 'exception'
  return 'success'
}

const setIf = (obj, field, value) => {
  if (value === undefined || value === null || value === '') return
  obj[field] = value
}

// ===================== 远程搜索 =====================
// Org 选择器：admin 可改；manager 在筛选区看不到 Org（页面级隐藏）
// 在弹窗中创建赠送时，Student 必选本 Org 的学生 —— 由后端强制校验
const buildOrgFilter = (extra = {}) => {
  const orgId = authStore.currentOrgId
  const filter = { ...extra }
  if (orgId) filter.Org = orgId
  return filter
}

const searchStudents = async (query) => {
  studentLoading.value = true
  try {
    const filter = buildOrgFilter()
    appendRegExp(filter, query)
    const response = await studentService.getStudents({
      filter,
      options: {
        limit: 200,
        sort: { createdAt: -1 },
        populate: [{ path: 'Account', select: 'name phone' }]
      }
    })
    if (response.data.success) {
      studentOptions.value = response.data.data?.items || []
    }
  } catch (e) {
    console.error('搜索学生失败:', e)
  } finally {
    studentLoading.value = false
  }
}

const searchOrgs = async () => {
  try {
    const response = await orgService.getOrgs({
      filter: {},
      options: { limit: 200, sort: { createdAt: -1 } }
    })
    if (response.data.success) {
      orgOptions.value = response.data.data?.items || []
    }
  } catch (e) {
    console.error('加载组织列表失败:', e)
  }
}

// ===================== 列表查询 =====================
const fetchStudentPacks = async () => {
  const filter = {}
  appendRegExp(filter, filters.keyword)
  appendExact(filter, 'status', filters.status)
  appendExact(filter, 'resource', filters.resource)
  appendExact(filter, 'Student', filters.Student)
  // 列表里的 Org 过滤：非超管永远用 currentOrgId；超管可以选 Org
  if (isAdmin.value) {
    appendExact(filter, 'Org', filters.Org)
  } else if (authStore.currentOrgId) {
    filter.Org = authStore.currentOrgId
  }

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { createdAt: -1 },
    populateKeys: []  // 自定义 populate
  })

  // 显式声明要 populate 的字段
  payload.options.populate = [
    { path: 'Student',     select: 'name Account' },
    { path: 'Account',     select: 'name phone' },
    { path: 'Pack',        select: 'name' },
    { path: 'Org',         select: 'name' },
    { path: 'createdBy',   select: 'nickname' }
  ]

  await fetchList(studentPackService.getStudentPacks.bind(studentPackService), payload)
}

const onSearch = () => {
  pagination.currentPage = 1
  fetchStudentPacks()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.resource = ''
  filters.Student = ''
  filters.Org = ''
  pagination.currentPage = 1
  fetchStudentPacks()
}

const onSizeChange = (size) => {
  handleSizeChange(size)
  fetchStudentPacks()
}

const onPageChange = (page) => {
  handleCurrentChange(page)
  fetchStudentPacks()
}

// ===================== 弹窗 =====================
const packFormRef = ref()
const dialog = reactive({
  visible: false,
  mode: 'create',  // 'create' | 'edit'
  loading: false,
  form: createEmptyForm()
})

function createEmptyForm () {
  return {
    // 通用
    _id: undefined,

    // 新建（赠送）
    Student: '',
    totalLesson: 0,
    remainingLesson: undefined,
    packName: '',
    description: '',
    activeDate: '',
    expireDate: '',
    status: 'active',

    // 编辑 (只读展示)
    _studentName: '',
    _accountName: '',
    _packName: '',
    _resource: '',
    _totalLesson: 0,
    _orgName: ''
  }
}

const formRules = computed(() => {
  if (dialog.mode === 'create') {
    return {
      Student:     [{ required: true, message: '请选择学生', trigger: 'change' }],
      totalLesson: [
        { required: true, message: '请输入赠送课时', trigger: 'blur' },
        { type: 'number', min: 1, message: '赠送课时不能小于 1', trigger: 'blur' }
      ]
    }
  }
  return {
    status:          [{ required: true, message: '请选择状态', trigger: 'change' }],
    remainingLesson: [
      { type: 'number', min: 0, message: '剩余课时不能小于 0', trigger: 'blur' }
    ]
  }
})

// 打开赠送对话框
const openCreateDialog = async () => {
  dialog.mode = 'create'
  dialog.visible = true
  Object.assign(dialog.form, createEmptyForm())
  // 预拉学生列表
  await searchStudents('')
  nextTick(() => {
    packFormRef.value?.clearValidate?.()
  })
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  Object.assign(dialog.form, createEmptyForm(), {
    _id: row._id,
    status: row.status || 'active',
    activeDate: formatDateOnly(row.activeDate) || '',
    expireDate: formatDateOnly(row.expireDate) || '',
    description: row.description || '',
    remainingLesson: row.remainingLesson ?? 0,
    // 只读字段
    _studentName: row.Student?.name || '-',
    _accountName: row.Account
      ? `${row.Account.name || '-'}${row.Account.phone ? ` (${row.Account.phone})` : ''}`
      : '-',
    _packName: row.packName || row.Pack?.name || '-',
    _resource: row.resource || '',
    _totalLesson: row.totalLesson || 0,
    _orgName: row.Org?.name || '-'
  })
  nextTick(() => {
    packFormRef.value?.clearValidate?.()
  })
}

// 关闭弹窗
const closeDialog = () => {
  dialog.visible = false
  packFormRef.value?.clearValidate?.()
}

// 保存
const savePack = async () => {
  if (!packFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }
  try {
    await packFormRef.value.validate()
  } catch {
    return
  }

  dialog.loading = true
  try {
    const data = {}

    // 后端 optionalDate 校验只接受 YYYY-MM-DD
    const trimDate = (v) => {
      if (!v || typeof v !== 'string') return v
      return v.length >= 10 ? v.slice(0, 10) : v
    }

    if (dialog.mode === 'create') {
      // 赠送:必填 Student / totalLesson
      setIf(data, 'Student', dialog.form.Student)
      setIf(data, 'totalLesson', dialog.form.totalLesson)
      // 可选:remainingLesson / packName / description / activeDate / expireDate / status
      if (dialog.form.remainingLesson !== undefined && dialog.form.remainingLesson !== null) {
        setIf(data, 'remainingLesson', dialog.form.remainingLesson)
      }
      setIf(data, 'packName', (dialog.form.packName || '').trim())
      setIf(data, 'description', (dialog.form.description || '').trim())
      setIf(data, 'activeDate', trimDate(dialog.form.activeDate))
      setIf(data, 'expireDate', trimDate(dialog.form.expireDate))
      setIf(data, 'status', dialog.form.status)
      // Account / Org / OrderPack / Pack / resource / createdBy 由后端自动处理
    } else {
      // 编辑:仅允许 status / activeDate / expireDate / description / remainingLesson
      setIf(data, 'status', dialog.form.status)
      setIf(data, 'activeDate', trimDate(dialog.form.activeDate))
      setIf(data, 'expireDate', trimDate(dialog.form.expireDate))
      setIf(data, 'description', (dialog.form.description || '').trim())
      if (dialog.form.remainingLesson !== undefined && dialog.form.remainingLesson !== null) {
        setIf(data, 'remainingLesson', dialog.form.remainingLesson)
      }
    }

    let response
    if (dialog.mode === 'create') {
      console.log('[StudentPacks] create payload:', JSON.stringify(data))
      response = await studentPackService.createStudentPack(data)
    } else {
      console.log('[StudentPacks] edit payload:', JSON.stringify(data))
      response = await studentPackService.updateStudentPack(dialog.form._id, data)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '赠送课包成功' : '更新课包成功')
      dialog.visible = false
      fetchStudentPacks()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '赠送课包失败' : '更新课包失败'))
    }
  } catch (error) {
    console.error('保存课包失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存课包失败')
    }
  } finally {
    dialog.loading = false
  }
}

// ===================== 详情弹窗 =====================
const detailDialog = reactive({
  visible: false,
  data: null
})

const viewDetail = async (row) => {
  try {
    detailDialog.data = row
    detailDialog.visible = true
    const response = await studentPackService.getStudentPackById(row._id)
    if (response.data.success) {
      detailDialog.data = response.data.data?.item || row
    }
  } catch (e) {
    console.error('加载详情失败:', e)
  }
}

// ===================== 打印 =====================
const printTable = (data) => {
  const columns = [
    { prop: '_id', label: '课包ID', formatter: (r) => shortId(r._id) },
    { prop: 'Student', label: '学生', formatter: (r) => r.Student?.name || '-' },
    { prop: 'Account', label: '关联账户', formatter: (r) => r.Account?.name || '-' },
    { prop: 'packName', label: '课包名称' },
    { prop: 'resource', label: '来源', formatter: (r) => formatStudentPackResource(r.resource) },
    { prop: 'remainingLesson', label: '剩余课时', formatter: (r) => `${r.remainingLesson ?? 0} / ${r.totalLesson || 0}` },
    { prop: 'status', label: '状态', formatter: (r) => formatStudentPackStatus(r.status) },
    { prop: 'activeDate', label: '激活日期', formatter: (r) => formatDateOnly(r.activeDate) },
    { prop: 'expireDate', label: '到期日期', formatter: (r) => formatDateOnly(r.expireDate) },
    { prop: 'Org', label: '所属校区', formatter: (r) => r.Org?.name || '-' },
    { prop: 'createdAt', label: '创建时间', formatter: (r) => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '学生课包数据报表')
}

onMounted(async () => {
  if (isAdmin.value) {
    await searchOrgs()
  }
  await searchStudents('')
  fetchStudentPacks()
})
</script>

<style scoped>
.studentpacks-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
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

.print-operation {
  margin-top: 16px;
}

.print-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.print-info {
  font-weight: 500;
  color: #606266;
}

.print-buttons {
  display: flex;
  gap: 8px;
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.readonly-line {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.muted {
  color: #909399;
  font-size: 12px;
}

.pack-id {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: #606266;
}

.lesson-progress {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: #303133;
}
</style>
