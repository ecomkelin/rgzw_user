<template>
  <div class="studentcourses-page">
    <h2 class="page-title">学生选课管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择"
            clearable
            style="width: 130px;"
          >
            <el-option
              v-for="opt in STUDENT_COURSE_STATUS"
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

        <el-form-item label="课程">
          <el-select
            v-model="filters.Course"
            placeholder="请选择课程"
            clearable
            filterable
            remote
            :remote-method="searchCourses"
            :loading="courseLoading"
            style="width: 220px;"
          >
            <el-option
              v-for="c in courseOptions"
              :key="c._id"
              :label="c.name"
              :value="c._id"
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
              登记选课
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

        <el-table-column label="选课ID" width="110">
          <template #default="{ row }">
            <span class="record-id">{{ shortId(row._id) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="学生" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.Student?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="家长账户" min-width="180" show-overflow-tooltip>
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

        <el-table-column label="课程" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.nameCourse || row.Course?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="课包" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.StudentPack">
              <span>{{ row.StudentPack.packName || row.StudentPack.Pack?.name || '-' }}</span>
              <span class="muted">
                (剩余 {{ row.StudentPack.remainingLesson ?? 0 }} /
                总 {{ row.StudentPack.totalLesson || 0 }})
              </span>
            </template>
            <span v-else class="muted">未绑定</span>
          </template>
        </el-table-column>

        <el-table-column label="报名日期" width="120">
          <template #default="{ row }">
            {{ formatDateOnly(row.StudentCourseDate) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="studentCourseStatusTagType(row.status)">
              {{ formatStudentCourseStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="所属校区" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.Org?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="muted">{{ row.remark || '-' }}</span>
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

    <!-- 登记 / 编辑 弹窗 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '登记选课' : '编辑学生选课'"
      v-model="dialog.visible"
      width="640px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="formRules"
        ref="formRef"
        label-width="110px"
      >
        <!-- =================== 新建 (登记) =================== -->
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
              @change="onStudentChangeForCreate"
            >
              <el-option
                v-for="s in studentOptions"
                :key="s._id"
                :label="s.name"
                :value="s._id"
              ></el-option>
            </el-select>
            <div class="field-hint">只能为本公司学生登记（后端强制 Org 隔离）</div>
          </el-form-item>

          <el-form-item label="课程" prop="Course">
            <el-select
              v-model="dialog.form.Course"
              placeholder="请选择课程"
              filterable
              remote
              :remote-method="searchCourses"
              :loading="courseLoading"
              style="width: 100%"
            >
              <el-option
                v-for="c in courseOptions"
                :key="c._id"
                :label="c.name"
                :value="c._id"
              ></el-option>
            </el-select>
            <div class="field-hint">课程必须与当前用户同 Org（后端校验）</div>
          </el-form-item>

          <el-form-item label="绑定课包">
            <el-select
              v-model="dialog.form.StudentPack"
              placeholder="可留空, 后续可绑定（可选）"
              clearable
              filterable
              :loading="packLoading"
              style="width: 100%"
              :disabled="!dialog.form.Student"
              @focus="onPackFocusCreate"
            >
              <el-option
                v-for="p in packOptions"
                :key="p._id"
                :label="`${p.packName || p.Pack?.name || '-'} (剩余 ${p.remainingLesson ?? 0} / 总 ${p.totalLesson || 0})`"
                :value="p._id"
              ></el-option>
            </el-select>
            <div class="field-hint">该学生持有的课包；不选可在编辑时再绑定</div>
          </el-form-item>

          <el-form-item label="报名日期">
            <el-date-picker
              v-model="dialog.form.StudentCourseDate"
              type="date"
              placeholder="留空则使用当前时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="dialog.form.status"
              placeholder="默认「在读中」"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="opt in STUDENT_COURSE_STATUS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="dialog.form.remark"
              type="textarea"
              :rows="2"
              placeholder="特殊要求 / 需要关注的点（可选，≤500 字符）"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>
        </template>

        <!-- =================== 编辑 =================== -->
        <template v-else>
          <el-divider content-position="left">基础信息（只读）</el-divider>

          <el-form-item label="学生">
            <span class="readonly-line">{{ dialog.form._studentName || '-' }}</span>
          </el-form-item>

          <el-form-item label="家长账户">
            <span class="readonly-line">{{ dialog.form._accountName || '-' }}</span>
          </el-form-item>

          <el-form-item label="课程">
            <span class="readonly-line">{{ dialog.form._courseName || '-' }}</span>
          </el-form-item>

          <el-form-item label="报名日期">
            <span class="readonly-line">
              {{ formatDateOnly(dialog.form.StudentCourseDate) || '-' }}
            </span>
          </el-form-item>

          <el-form-item label="所属校区">
            <span class="readonly-line">{{ dialog.form._orgName || '-' }}</span>
          </el-form-item>

          <el-divider content-position="left">可编辑字段</el-divider>

          <el-form-item label="课包">
            <el-select
              v-model="dialog.form.StudentPack"
              placeholder="可留空, 传 null 解绑"
              clearable
              filterable
              :loading="packLoading"
              style="width: 100%"
              @focus="onPackFocusEdit"
            >
              <el-option
                v-for="p in packOptions"
                :key="p._id"
                :label="`${p.packName || p.Pack?.name || '-'} (剩余 ${p.remainingLesson ?? 0} / 总 ${p.totalLesson || 0})`"
                :value="p._id"
              ></el-option>
            </el-select>
            <div class="field-hint">清空选项 = 解绑课包；不修改 = 保持原状</div>
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-select
              v-model="dialog.form.status"
              placeholder="请选择状态"
              style="width: 100%"
            >
              <el-option
                v-for="opt in STUDENT_COURSE_STATUS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="dialog.form.remark"
              type="textarea"
              :rows="2"
              placeholder="备注（可选）"
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
          @click="saveRecord"
          :loading="dialog.loading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      title="学生选课详情"
      v-model="detailDialog.visible"
      width="640px"
    >
      <el-descriptions
        v-if="detailDialog.data"
        :column="2"
        border
        size="default"
      >
        <el-descriptions-item label="选课ID" :span="2">
          {{ detailDialog.data._id }}
        </el-descriptions-item>
        <el-descriptions-item label="学生">
          {{ detailDialog.data.Student?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="家长账户">
          <template v-if="detailDialog.data.Account">
            {{ detailDialog.data.Account.name }}
            <span v-if="detailDialog.data.Account.phone" class="muted">
              ({{ detailDialog.data.Account.phone }})
            </span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="课程" :span="2">
          {{ detailDialog.data.nameCourse || detailDialog.data.Course?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="绑定课包" :span="2">
          <template v-if="detailDialog.data.StudentPack">
            {{ detailDialog.data.StudentPack.packName || detailDialog.data.StudentPack.Pack?.name || '-' }}
            <span class="muted">
              (剩余 {{ detailDialog.data.StudentPack.remainingLesson ?? 0 }} /
              总 {{ detailDialog.data.StudentPack.totalLesson || 0 }})
            </span>
          </template>
          <span v-else>未绑定</span>
        </el-descriptions-item>
        <el-descriptions-item label="报名日期">
          {{ formatDateOnly(detailDialog.data.StudentCourseDate) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="studentCourseStatusTagType(detailDialog.data.status)">
            {{ formatStudentCourseStatus(detailDialog.data.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ detailDialog.data.remark || '-' }}
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
        <el-descriptions-item label="更新时间" :span="2">
          {{ formatDate(detailDialog.data.updatedAt) }}
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
  STUDENT_COURSE_STATUS,
  formatStudentCourseStatus,
  studentCourseStatusTagType
} from '../../utils/enums'
import { printTable as printTableUtil } from '../../utils/print'
import { useAuthStore } from '../../stores/auth'
import { useAccount } from '../../composables/useAccount'
import { studentCourseService } from '../../api/studentCourse'
import { studentService } from '../../api/student'
import { courseService } from '../../api/course'
import { studentPackService } from '../../api/studentPack'
import { orgService } from '../../api/org'

const authStore = useAuthStore()

// ===================== 权限计算 =====================
// 后端权限：
//   - list / detail : isStudent / isUser (含 teacher / manager / isAdmin)
//   - add / edit    : 仅 isManager (含 isAdmin)
const { isAdmin, isManager } = useAccount()
const canAdd = computed(() => isManager.value)
const canEdit = computed(() => isManager.value)

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
  status: '',
  Student: '',
  Course: '',
  Org: ''
})

// ===================== 选项(远程搜索) =====================
const studentOptions = ref([])
const courseOptions = ref([])
const packOptions = ref([])
const orgOptions = ref([])
const studentLoading = ref(false)
const courseLoading = ref(false)
const packLoading = ref(false)

// ===================== 工具函数 =====================
const shortId = (id) => {
  if (!id) return '-'
  return id.slice(-8).toUpperCase()
}

const setIf = (obj, field, value) => {
  if (value === undefined || value === null || value === '') return
  obj[field] = value
}

// Org 选择器：admin 可改；manager 在筛选区看不到 Org（页面级隐藏）
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

const searchCourses = async (query) => {
  courseLoading.value = true
  try {
    const filter = buildOrgFilter({ isActive: true })
    appendRegExp(filter, query)
    const response = await courseService.getCourses({
      filter,
      options: {
        limit: 200,
        sort: { createdAt: -1 }
      }
    })
    if (response.data.success) {
      courseOptions.value = response.data.data?.items || []
    }
  } catch (e) {
    console.error('搜索课程失败:', e)
  } finally {
    courseLoading.value = false
  }
}

// 加载该学生持有的课包（仅 active + 同 Org）
const loadPacksForStudent = async (studentId, { keepSelection = null } = {}) => {
  if (!studentId) {
    packOptions.value = []
    return
  }
  packLoading.value = true
  try {
    const filter = { Student: studentId }
    if (authStore.currentOrgId) filter.Org = authStore.currentOrgId
    const response = await studentPackService.getStudentPacks({
      filter,
      options: { limit: 200, sort: { createdAt: -1 } }
    })
    if (response.data.success) {
      const list = response.data.data?.items || []
      // 如果 keepSelection 不在最新结果里，保留它
      const ids = new Set(list.map(p => p._id))
      packOptions.value = keepSelection && !ids.has(keepSelection)
        ? [keepSelection, ...list]
        : list
    }
  } catch (e) {
    console.error('加载学生课包失败:', e)
  } finally {
    packLoading.value = false
  }
}

const onStudentChangeForCreate = () => {
  // 切换学生后, 已选课包清空 (新学生持有的课包肯定不一样)
  dialog.form.StudentPack = ''
  if (dialog.form.Student) {
    loadPacksForStudent(dialog.form.Student)
  } else {
    packOptions.value = []
  }
}

const onPackFocusCreate = () => {
  if (dialog.form.Student) {
    loadPacksForStudent(dialog.form.Student)
  }
}

const onPackFocusEdit = () => {
  // 编辑模式下 _studentId 是当前记录的学生
  if (dialog.form._studentId) {
    loadPacksForStudent(dialog.form._studentId, { keepSelection: dialog.form.StudentPack })
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
const fetchStudentCourses = async () => {
  const filter = {}
  appendExact(filter, 'status', filters.status)
  appendExact(filter, 'Student', filters.Student)
  appendExact(filter, 'Course', filters.Course)
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
    sort: { createdAt: -1 }
  })

  payload.options.populate = [
    { path: 'Student',     select: 'name Account' },
    { path: 'Account',     select: 'name phone' },
    { path: 'Course',      select: 'name' },
    { path: 'StudentPack', select: 'packName Pack remainingLesson totalLesson' },
    { path: 'Org',         select: 'name' },
    { path: 'createdBy',   select: 'nickname' }
  ]

  await fetchList(studentCourseService.getStudentCourses.bind(studentCourseService), payload)
}

const onSearch = () => {
  pagination.currentPage = 1
  fetchStudentCourses()
}

const resetFilters = () => {
  filters.status = ''
  filters.Student = ''
  filters.Course = ''
  filters.Org = ''
  pagination.currentPage = 1
  fetchStudentCourses()
}

const onSizeChange = (size) => {
  handleSizeChange(size)
  fetchStudentCourses()
}

const onPageChange = (page) => {
  handleCurrentChange(page)
  fetchStudentCourses()
}

// ===================== 弹窗 =====================
const formRef = ref()
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

    // 新建
    Student: '',
    Course: '',
    StudentPack: '',
    StudentCourseDate: '',
    status: 'active',
    remark: '',

    // 编辑 (只读展示)
    _studentId: '',
    _studentName: '',
    _accountName: '',
    _courseName: '',
    _orgName: ''
  }
}

const formRules = computed(() => {
  if (dialog.mode === 'create') {
    return {
      Student: [{ required: true, message: '请选择学生', trigger: 'change' }],
      Course:  [{ required: true, message: '请选择课程', trigger: 'change' }]
    }
  }
  return {
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }
})

// 打开登记对话框
const openCreateDialog = async () => {
  dialog.mode = 'create'
  dialog.visible = true
  Object.assign(dialog.form, createEmptyForm())
  // 预拉学生 / 课程列表
  await Promise.all([searchStudents(''), searchCourses('')])
  nextTick(() => {
    formRef.value?.clearValidate?.()
  })
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  const studentId = row.Student?._id || row.Student || ''
  Object.assign(dialog.form, createEmptyForm(), {
    _id: row._id,
    status: row.status || 'active',
    StudentCourseDate: formatDateOnly(row.StudentCourseDate) || '',
    remark: row.remark || '',
    StudentPack: row.StudentPack?._id || row.StudentPack || '',
    // 只读字段
    _studentId: studentId,
    _studentName: row.Student?.name || '-',
    _accountName: row.Account
      ? `${row.Account.name || '-'}${row.Account.phone ? ` (${row.Account.phone})` : ''}`
      : '-',
    _courseName: row.nameCourse || row.Course?.name || '-',
    _orgName: row.Org?.name || '-'
  })
  // 预拉该学生持有的课包 (保留当前绑定的那一个)
  await loadPacksForStudent(studentId, { keepSelection: dialog.form.StudentPack })
  nextTick(() => {
    formRef.value?.clearValidate?.()
  })
}

// 关闭弹窗
const closeDialog = () => {
  dialog.visible = false
  formRef.value?.clearValidate?.()
}

// 保存
const saveRecord = async () => {
  if (!formRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }
  try {
    await formRef.value.validate()
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
      // 登记:必填 Student / Course
      setIf(data, 'Student', dialog.form.Student)
      setIf(data, 'Course', dialog.form.Course)
      // 可选:StudentPack / StudentCourseDate / status / remark
      setIf(data, 'StudentPack', dialog.form.StudentPack)
      setIf(data, 'StudentCourseDate', trimDate(dialog.form.StudentCourseDate))
      setIf(data, 'status', dialog.form.status)
      setIf(data, 'remark', (dialog.form.remark || '').trim())
      // Account / Org / nameCourse / createdBy / updatedBy 由后端自动注入
    } else {
      // 编辑:仅允许 StudentPack / status / remark
      //  - StudentPack: 传新值=更换, 传 null=解绑, 不传=保持
      //  - StudentCourseDate 不可改（模型不可变字段；业务上报名日期不应调整）
      if (dialog.form.StudentPack === '' && dialog.form._originalPack) {
        // 用户从有值清空 → 显式解绑
        data.StudentPack = null
      } else if (dialog.form.StudentPack) {
        data.StudentPack = dialog.form.StudentPack
      }
      setIf(data, 'status', dialog.form.status)
      setIf(data, 'remark', (dialog.form.remark || '').trim())
    }

    let response
    if (dialog.mode === 'create') {
      console.log('[StudentCourses] create payload:', JSON.stringify(data))
      response = await studentCourseService.createStudentCourse(data)
    } else {
      console.log('[StudentCourses] edit payload:', JSON.stringify(data))
      response = await studentCourseService.updateStudentCourse(dialog.form._id, data)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '登记选课成功' : '更新选课成功')
      dialog.visible = false
      fetchStudentCourses()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '登记选课失败' : '更新选课失败'))
    }
  } catch (error) {
    console.error('保存选课失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存选课失败')
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
    const response = await studentCourseService.getStudentCourseById(row._id)
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
    { prop: '_id', label: '选课ID', formatter: (r) => shortId(r._id) },
    { prop: 'Student', label: '学生', formatter: (r) => r.Student?.name || '-' },
    { prop: 'Account', label: '家长账户', formatter: (r) => r.Account?.name || '-' },
    { prop: 'Course', label: '课程', formatter: (r) => r.nameCourse || r.Course?.name || '-' },
    { prop: 'StudentPack', label: '课包', formatter: (r) => r.StudentPack ? (r.StudentPack.packName || '-') : '未绑定' },
    { prop: 'StudentCourseDate', label: '报名日期', formatter: (r) => formatDateOnly(r.StudentCourseDate) },
    { prop: 'status', label: '状态', formatter: (r) => formatStudentCourseStatus(r.status) },
    { prop: 'Org', label: '所属校区', formatter: (r) => r.Org?.name || '-' },
    { prop: 'remark', label: '备注' },
    { prop: 'createdAt', label: '创建时间', formatter: (r) => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '学生选课数据报表')
}

onMounted(async () => {
  if (isAdmin.value) {
    await searchOrgs()
  }
  await Promise.all([searchStudents(''), searchCourses('')])
  fetchStudentCourses()
})
</script>

<style scoped>
.studentcourses-page {
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

.record-id {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: #606266;
}
</style>
