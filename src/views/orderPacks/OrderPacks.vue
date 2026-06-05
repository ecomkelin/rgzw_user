<template>
  <div class="orderpacks-page">
    <h2 class="page-title">课包订单管理</h2>

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

        <el-form-item label="支付状态">
          <el-select
            v-model="filters.payStatus"
            placeholder="请选择"
            clearable
            style="width: 130px;"
          >
            <el-option
              v-for="opt in PAY_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="支付方式">
          <el-select
            v-model="filters.payMethod"
            placeholder="请选择"
            clearable
            style="width: 130px;"
          >
            <el-option
              v-for="opt in PAY_METHOD_OPTIONS"
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

        <el-form-item label="课包">
          <el-select
            v-model="filters.Pack"
            placeholder="请选择课包"
            clearable
            filterable
            remote
            :remote-method="searchPacks"
            :loading="packLoading"
            style="width: 200px;"
          >
            <el-option
              v-for="p in packOptions"
              :key="p._id"
              :label="p.name"
              :value="p._id"
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
              新建订单
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

        <el-table-column label="订单号" width="110">
          <template #default="{ row }">
            <span class="order-id">{{ shortId(row._id) }}</span>
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

        <el-table-column label="课包" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.packName || row.Pack?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="课时数" width="90">
          <template #default="{ row }">
            {{ row.totalLesson || 0 }} 课时
          </template>
        </el-table-column>

        <el-table-column label="实付金额" width="120">
          <template #default="{ row }">
            {{ formatPrice(row.finalPrice) }}
          </template>
        </el-table-column>

        <el-table-column label="支付状态" width="110">
          <template #default="{ row }">
            <el-tag :type="payStatusTagType(row.payStatus)">
              {{ formatPayStatus(row.payStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            {{ formatPayMethod(row.payMethod) }}
          </template>
        </el-table-column>

        <el-table-column label="支付时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.paidAt) }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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

      <!-- 打印工具条（订单是审计关键，不开放批量操作） -->
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

    <!-- 新建/编辑订单 弹窗 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '新建课包订单' : '编辑课包订单'"
      v-model="dialog.visible"
      width="720px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="formRules"
        ref="orderFormRef"
        label-width="120px"
      >
        <!-- =================== 新建模式 =================== -->
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
              @change="onStudentChange"
            >
              <el-option
                v-for="s in studentOptions"
                :key="s._id"
                :label="s.name"
                :value="s._id"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="selectedStudent" label=" ">
            <div class="readonly-line">
              <span class="muted">家长账户：</span>
              <span>{{ selectedStudent.Account?.name || '未关联账户' }}</span>
              <span v-if="selectedStudent.Account?.phone" class="muted">
                ({{ selectedStudent.Account.phone }})
              </span>
            </div>
          </el-form-item>

          <el-form-item label="课包" prop="Pack">
            <el-select
              v-model="dialog.form.Pack"
              placeholder="请选择课包"
              filterable
              remote
              :remote-method="searchPacks"
              :loading="packLoading"
              style="width: 100%"
              @change="onPackChange"
            >
              <el-option
                v-for="p in packOptions"
                :key="p._id"
                :label="p.name"
                :value="p._id"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="selectedPack" label=" ">
            <div class="readonly-line">
              <span class="muted">课包快照：</span>
              <span>{{ selectedPack.totalLesson || 0 }} 课时</span>
              <span v-if="selectedPack.validDays" class="muted">
                / {{ selectedPack.validDays }} 天
              </span>
              <span class="muted">/ 原价 {{ formatPrice(selectedPack.priceOrigin) }}</span>
              <span class="muted">/ 常规 {{ formatPrice(selectedPack.priceRegular) }}</span>
              <span
                v-if="selectedPack.priceSale !== undefined && selectedPack.priceSale !== null && selectedPack.priceSale !== ''"
                class="muted"
              >
                / 活动 {{ formatPrice(selectedPack.priceSale) }}
              </span>
            </div>
          </el-form-item>

          <el-form-item label="实付金额" prop="finalPrice">
            <el-input-number
              v-model="dialog.form.finalPrice"
              :min="0"
              :precision="0"
              placeholder="单位:分"
              style="width: 100%;"
            >
              <template #append>分</template>
            </el-input-number>
            <div class="field-hint">实付金额，单位为分（1 元 = 100 分）</div>
          </el-form-item>

          <el-form-item label="关联课程">
            <el-select
              v-model="dialog.form.Course"
              placeholder="强烈建议填写（直接报名班级场景）"
              clearable
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
          </el-form-item>

          <el-form-item label="支付方式">
            <el-select
              v-model="dialog.form.payMethod"
              placeholder="请选择支付方式"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="opt in PAY_METHOD_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="交易流水号">
            <el-input
              v-model="dialog.form.transactionId"
              placeholder="第三方支付流水号（可选，≤100 字符）"
              maxlength="100"
            ></el-input>
          </el-form-item>

          <el-form-item label="支付时间">
            <el-date-picker
              v-model="dialog.form.paidAt"
              type="datetime"
              placeholder="选择支付时间（可选）"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="dialog.form.remark"
              type="textarea"
              :rows="2"
              placeholder="备注（可选，≤500 字符）"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>

          <el-form-item v-if="authStore.currentOrgId" label=" ">
            <el-tag type="info">
              系统将自动使用学生所在校区: {{ orgName || '加载中...' }}
            </el-tag>
          </el-form-item>
        </template>

        <!-- =================== 编辑模式 =================== -->
        <template v-else>
          <el-divider content-position="left">基础信息（只读）</el-divider>

          <el-form-item label="订单号">
            <span class="readonly-line">{{ dialog.form._id }}</span>
          </el-form-item>

          <el-form-item label="学生">
            <span class="readonly-line">{{ dialog.form._studentName || '-' }}</span>
          </el-form-item>

          <el-form-item label="家长账户">
            <span class="readonly-line">{{ dialog.form._accountName || '-' }}</span>
          </el-form-item>

          <el-form-item label="课包">
            <span class="readonly-line">{{ dialog.form.packName || '-' }}</span>
          </el-form-item>

          <el-form-item label="课时数">
            <span class="readonly-line">{{ dialog.form.totalLesson || 0 }} 课时</span>
          </el-form-item>

          <el-form-item label="原价 / 常规 / 活动">
            <span class="readonly-line">
              {{ formatPrice(dialog.form.priceOrigin) }} /
              {{ formatPrice(dialog.form.priceRegular) }} /
              <span v-if="dialog.form.priceSale !== undefined && dialog.form.priceSale !== null && dialog.form.priceSale !== ''">
                {{ formatPrice(dialog.form.priceSale) }}
              </span>
              <span v-else>-</span>
            </span>
          </el-form-item>

          <el-form-item label="实付金额">
            <span class="readonly-line">{{ formatPrice(dialog.form.finalPrice) }}</span>
          </el-form-item>

          <el-form-item label="所属校区">
            <span class="readonly-line">{{ dialog.form._orgName || '-' }}</span>
          </el-form-item>

          <el-divider content-position="left">支付信息（可编辑）</el-divider>

          <el-form-item label="支付状态" prop="payStatus">
            <el-select
              v-model="dialog.form.payStatus"
              placeholder="请选择支付状态"
              style="width: 100%"
            >
              <el-option
                v-for="opt in PAY_STATUS_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="支付方式" prop="payMethod">
            <el-select
              v-model="dialog.form.payMethod"
              placeholder="请选择支付方式"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="opt in PAY_METHOD_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="交易流水号">
            <el-input
              v-model="dialog.form.transactionId"
              placeholder="第三方支付流水号（可选）"
              maxlength="100"
            ></el-input>
          </el-form-item>

          <el-form-item label="支付时间" prop="paidAt">
            <el-date-picker
              v-model="dialog.form.paidAt"
              type="datetime"
              placeholder="选择支付时间（可选）"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            ></el-date-picker>
            <div class="field-hint">
              若支付状态变更为「已支付」且未填写支付时间，后端会自动写入当前时间
            </div>
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
          @click="saveOrder"
          :loading="dialog.loading"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      title="课包订单详情"
      v-model="detailDialog.visible"
      width="640px"
    >
      <el-descriptions
        v-if="detailDialog.data"
        :column="2"
        border
        size="default"
      >
        <el-descriptions-item label="订单号" :span="2">
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
        <el-descriptions-item label="课包" :span="2">
          {{ detailDialog.data.packName || detailDialog.data.Pack?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="课时数">
          {{ detailDialog.data.totalLesson || 0 }} 课时
        </el-descriptions-item>
        <el-descriptions-item label="有效天数">
          {{ detailDialog.data.validDays ? detailDialog.data.validDays + ' 天' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="原价">
          {{ formatPrice(detailDialog.data.priceOrigin) }}
        </el-descriptions-item>
        <el-descriptions-item label="常规售价">
          {{ formatPrice(detailDialog.data.priceRegular) }}
        </el-descriptions-item>
        <el-descriptions-item label="活动价">
          <span v-if="detailDialog.data.priceSale !== undefined && detailDialog.data.priceSale !== null && detailDialog.data.priceSale !== ''">
            {{ formatPrice(detailDialog.data.priceSale) }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="实付金额">
          {{ formatPrice(detailDialog.data.finalPrice) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="payStatusTagType(detailDialog.data.payStatus)">
            {{ formatPayStatus(detailDialog.data.payStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ formatPayMethod(detailDialog.data.payMethod) }}
        </el-descriptions-item>
        <el-descriptions-item label="交易流水号" :span="2">
          {{ detailDialog.data.transactionId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间" :span="2">
          {{ formatDate(detailDialog.data.paidAt) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联课程">
          {{ detailDialog.data.Course?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属校区">
          {{ detailDialog.data.Org?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ detailDialog.data.createdBy?.nickname || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(detailDialog.data.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ detailDialog.data.remark || '-' }}
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useListPage } from '../../composables/useListPage'
import {
  buildListPayload,
  appendRegExp,
  appendExact
} from '../../utils/listPayload'
import { formatDate } from '../../utils/format'
import {
  PAY_STATUS_OPTIONS,
  PAY_METHOD_OPTIONS,
  formatPayStatus,
  payStatusTagType,
  formatPayMethod
} from '../../utils/enums'
import { printTable as printTableUtil } from '../../utils/print'
import { useAuthStore } from '../../stores/auth'
import { orderPackService } from '../../api/orderPack'
import { studentService } from '../../api/student'
import { packService } from '../../api/pack'
import { courseService } from '../../api/course'
import { orgService } from '../../api/org'

const authStore = useAuthStore()

// ===================== 权限计算 =====================
// 权限字段说明（authStore.user 是 Account 对象,Login 流程对 currentUser 做了 populate）:
//   - Account.isAdmin                          : 是否超管
//   - Account.accountType                      : 'User' | 'Student' | 'Admin'
//   - Account.currentUser.roleTemp             : 'manager' | 'teacher' | 'admin'
//   - Account.currentUser.Org                  : 所属机构(populate 后的 User 对象上)
const accountType = computed(() => authStore.user?.accountType || '')
const currentUserObj = computed(() => authStore.user?.currentUser)
const isAdmin = computed(() => Boolean(authStore.user?.isAdmin))
const isManager = computed(() =>
  accountType.value === 'User' &&
  currentUserObj.value &&
  typeof currentUserObj.value === 'object' &&
  currentUserObj.value.roleTemp === 'manager'
)
const canAdd = computed(() => isAdmin.value || isManager.value)
const canEdit = computed(() => isAdmin.value)

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
  payStatus: '',
  payMethod: '',
  Student: '',
  Pack: ''
})

// ===================== 选项(远程搜索) =====================
const studentOptions = ref([])
const packOptions = ref([])
const courseOptions = ref([])
const studentLoading = ref(false)
const packLoading = ref(false)
const courseLoading = ref(false)
const orgName = ref('')

// 学生/课包在弹窗里"已选中"的完整对象(用于显示快照)
const selectedStudent = ref(null)
const selectedPack = ref(null)

// ===================== 工具函数 =====================
const formatPrice = (priceInCents) => {
  if (priceInCents === undefined || priceInCents === null || priceInCents === '') return '0.00元'
  return `${(priceInCents / 100).toFixed(2)}元`
}

const shortId = (id) => {
  if (!id) return '-'
  return id.slice(-8).toUpperCase()
}

// 过滤空值的辅助函数
const setIf = (obj, field, value) => {
  if (value === undefined || value === null || value === '') return
  obj[field] = value
}

// ===================== 远程搜索 =====================
const searchStudents = async (query) => {
  studentLoading.value = true
  try {
    const response = await studentService.getStudents({
      filter: { regExp: query || '', isActive: true },
      options: { limit: 50, sort: { createdAt: -1 } }
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

const searchPacks = async (query) => {
  packLoading.value = true
  try {
    const response = await packService.getPacks({
      filter: { regExp: query || '', isActive: true },
      options: { limit: 50, sort: { createdAt: -1 } }
    })
    if (response.data.success) {
      packOptions.value = response.data.data?.items || []
    }
  } catch (e) {
    console.error('搜索课包失败:', e)
  } finally {
    packLoading.value = false
  }
}

const searchCourses = async (query) => {
  courseLoading.value = true
  try {
    const response = await courseService.getCourses({
      filter: { regExp: query || '' },
      options: { limit: 50, sort: { createdAt: -1 } }
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

// 学生切换时,把选中的学生对象存起来(用于显示账户/校区)
const onStudentChange = (studentId) => {
  selectedStudent.value = studentOptions.value.find(s => s._id === studentId) || null
}

// 课包切换时,存起来用于显示快照
const onPackChange = (packId) => {
  selectedPack.value = packOptions.value.find(p => p._id === packId) || null
}

// ===================== 列表查询 =====================
const fetchOrderPacks = async () => {
  const filter = {}
  appendRegExp(filter, filters.keyword)
  appendExact(filter, 'payStatus', filters.payStatus)
  appendExact(filter, 'payMethod', filters.payMethod)
  appendExact(filter, 'Student', filters.Student)
  appendExact(filter, 'Pack', filters.Pack)

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { createdAt: -1 },
    populateKeys: []  // 自定义 populate,不走 APP_DEFAULT_POPULATE
  })

  // 显式声明要 populate 的字段
  payload.options.populate = [
    { path: 'Student', select: 'name Account' },
    { path: 'Account', select: 'name phone' },
    { path: 'Pack',    select: 'name' },
    { path: 'Course',  select: 'name' },
    { path: 'Org',     select: 'name' },
    { path: 'createdBy', select: 'nickname' }
  ]

  await fetchList(orderPackService.getOrderPacks.bind(orderPackService), payload)
}

const onSearch = () => {
  pagination.currentPage = 1
  fetchOrderPacks()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.payStatus = ''
  filters.payMethod = ''
  filters.Student = ''
  filters.Pack = ''
  pagination.currentPage = 1
  fetchOrderPacks()
}

const onSizeChange = (size) => {
  handleSizeChange(size)
  fetchOrderPacks()
}

const onPageChange = (page) => {
  handleCurrentChange(page)
  fetchOrderPacks()
}

// ===================== 弹窗 =====================
const orderFormRef = ref()
const dialog = reactive({
  visible: false,
  mode: 'create',  // 'create' | 'edit'
  loading: false,
  form: createEmptyForm()
})

function createEmptyForm () {
  return {
    _id: undefined,
    Student: '',
    Pack: '',
    finalPrice: 0,
    Course: '',
    payStatus: 'Pending',
    payMethod: '',
    transactionId: '',
    paidAt: '',
    remark: '',
    // 只读展示字段(编辑模式)
    packName: '',
    totalLesson: 0,
    validDays: undefined,
    priceOrigin: 0,
    priceRegular: 0,
    priceSale: undefined,
    _studentName: '',
    _accountName: '',
    _orgName: ''
  }
}

const formRules = {
  Student:    [{ required: true, message: '请选择学生', trigger: 'change' }],
  Pack:       [{ required: true, message: '请选择课包', trigger: 'change' }],
  finalPrice: [
    { required: true, message: '请输入实付金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '实付金额不能小于 0', trigger: 'blur' }
  ],
  payStatus:  [{ required: true, message: '请选择支付状态', trigger: 'change' }]
}

// 打开新建对话框
const openCreateDialog = async () => {
  dialog.mode = 'create'
  dialog.visible = true
  Object.assign(dialog.form, createEmptyForm())
  selectedStudent.value = null
  selectedPack.value = null
  // 预拉学生和课包列表(空 query,默认列表)
  await Promise.all([searchStudents(''), searchPacks(''), searchCourses('')])
  // 加载 org 名称(用于提示)
  await loadOrgName()
  nextTick(() => {
    orderFormRef.value?.clearValidate?.()
  })
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  Object.assign(dialog.form, createEmptyForm(), {
    _id: row._id,
    payStatus: row.payStatus || 'Pending',
    payMethod: row.payMethod || '',
    transactionId: row.transactionId || '',
    paidAt: row.paidAt || '',
    remark: row.remark || '',
    // 只读字段
    packName: row.packName || '',
    totalLesson: row.totalLesson || 0,
    validDays: row.validDays,
    priceOrigin: row.priceOrigin || 0,
    priceRegular: row.priceRegular || 0,
    priceSale: (row.priceSale !== undefined && row.priceSale !== null && row.priceSale !== '')
      ? row.priceSale
      : undefined,
    finalPrice: row.finalPrice || 0,
    _studentName: row.Student?.name || '-',
    _accountName: row.Account
      ? `${row.Account.name || '-'}${row.Account.phone ? ` (${row.Account.phone})` : ''}`
      : '-',
    _orgName: row.Org?.name || '-'
  })
  nextTick(() => {
    orderFormRef.value?.clearValidate?.()
  })
}

// 关闭弹窗
const closeDialog = () => {
  dialog.visible = false
  orderFormRef.value?.clearValidate?.()
}

// 保存订单
const saveOrder = async () => {
  if (!orderFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }
  try {
    await orderFormRef.value.validate()
  } catch {
    return
  }

  dialog.loading = true
  try {
    const data = {}

    if (dialog.mode === 'create') {
      // 新建:必填 Student / Pack / finalPrice,其他可选
      setIf(data, 'Student', dialog.form.Student)
      setIf(data, 'Pack', dialog.form.Pack)
      setIf(data, 'finalPrice', dialog.form.finalPrice)
      setIf(data, 'Course', dialog.form.Course)
      setIf(data, 'payMethod', dialog.form.payMethod)
      setIf(data, 'transactionId', (dialog.form.transactionId || '').trim())
      setIf(data, 'paidAt', dialog.form.paidAt)
      setIf(data, 'remark', (dialog.form.remark || '').trim())
      // 注意:Account / 快照 / Org / createdBy 由后端自动处理
    } else {
      // 编辑:仅允许更新 payStatus / payMethod / transactionId / paidAt / remark
      setIf(data, 'payStatus', dialog.form.payStatus)
      setIf(data, 'payMethod', dialog.form.payMethod)
      setIf(data, 'transactionId', (dialog.form.transactionId || '').trim())
      setIf(data, 'paidAt', dialog.form.paidAt)
      setIf(data, 'remark', (dialog.form.remark || '').trim())
    }

    let response
    if (dialog.mode === 'create') {
      response = await orderPackService.createOrderPack(data)
    } else {
      response = await orderPackService.updateOrderPack(dialog.form._id, data)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建订单成功' : '更新订单成功')
      dialog.visible = false
      fetchOrderPacks()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '创建订单失败' : '更新订单失败'))
    }
  } catch (error) {
    console.error('保存订单失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存订单失败')
    }
  } finally {
    dialog.loading = false
  }
}

// 加载 org 名称(用于"系统将自动使用学生所在校区"提示)
const loadOrgName = async () => {
  const orgId = authStore.currentOrgId
  if (!orgId) {
    orgName.value = ''
    return
  }
  try {
    const response = await orgService.getOrgs({
      filter: { _id: orgId },
      options: { limit: 1 }
    })
    if (response.data.success && response.data.data?.items?.length) {
      orgName.value = response.data.data.items[0].name || ''
    }
  } catch (e) {
    console.error('加载组织名称失败:', e)
  }
}

// ===================== 详情弹窗 =====================
const detailDialog = reactive({
  visible: false,
  data: null
})

const viewDetail = async (row) => {
  try {
    // 优先用表格里已有的数据,如果没有完整字段再请求详情接口
    detailDialog.data = row
    detailDialog.visible = true
    // 后台异步拉一份完整数据,确保所有字段都 populate 到位
    const response = await orderPackService.getOrderPackById(row._id)
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
    { prop: '_id', label: '订单号', formatter: (r) => shortId(r._id) },
    { prop: 'Student', label: '学生', formatter: (r) => r.Student?.name || '-' },
    { prop: 'Account', label: '家长账户', formatter: (r) => r.Account?.name || '-' },
    { prop: 'packName', label: '课包' },
    { prop: 'totalLesson', label: '课时数', formatter: (r) => `${r.totalLesson || 0} 课时` },
    { prop: 'finalPrice', label: '实付金额', formatter: (r) => formatPrice(r.finalPrice) },
    { prop: 'payStatus', label: '支付状态', formatter: (r) => formatPayStatus(r.payStatus) },
    { prop: 'payMethod', label: '支付方式', formatter: (r) => formatPayMethod(r.payMethod) },
    { prop: 'paidAt', label: '支付时间', formatter: (r) => formatDate(r.paidAt) },
    { prop: 'createdAt', label: '创建时间', formatter: (r) => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '课包订单数据报表')
}

onMounted(async () => {
  // 调试:打印当前账号权限,确认 "新建订单" 按钮为什么没显示
  console.log('[OrderPacks] 权限自检:', {
    accountType: accountType.value,
    isAdmin: authStore.user?.isAdmin,
    isManager: isManager.value,
    canAdd: canAdd.value,
    canEdit: canEdit.value,
    currentUserType: typeof currentUserObj.value,
    currentUserRoleTemp: currentUserObj.value?.roleTemp,
    currentUserOrg: currentUserObj.value?.Org
  })

  // 初始化时预拉学生/课包选项,确保筛选区可用
  await Promise.all([searchStudents(''), searchPacks('')])
  await loadOrgName()
  fetchOrderPacks()
})
</script>

<style scoped>
.orderpacks-page {
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

.order-id {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: #606266;
}
</style>
