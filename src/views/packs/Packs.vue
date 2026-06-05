<template>
  <div class="packs-page">
    <h2 class="page-title">课包管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="课包名称">
          <el-input v-model="filters.name" placeholder="请输入课包名称" clearable></el-input>
        </el-form-item>

        <el-form-item label="课包类型">
          <el-select v-model="filters.type" placeholder="请选择类型" clearable style="width: 140px;">
            <el-option label="课时包" value="课时包"></el-option>
            <el-option label="学期包" value="学期包"></el-option>
            <el-option label="体验包" value="体验包"></el-option>
            <el-option label="定制包" value="定制包"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="是否激活">
          <el-select v-model="filters.isActive" placeholder="请选择激活状态" clearable style="width: 120px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="所属组织" v-if="isAdmin">
          <el-select v-model="filters.Org" placeholder="请选择组织" clearable filterable style="width: 200px;">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="fetchPacks">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增课包</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="packs"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="课包名称" width="220" show-overflow-tooltip></el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="formatTypeTag(row.type)">{{ formatType(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalLesson" label="总课时" width="90">
          <template #default="{ row }">
            {{ row.totalLesson || 0 }} 课时
          </template>
        </el-table-column>
        <el-table-column prop="priceOrigin" label="原价" width="110">
          <template #default="{ row }">
            {{ formatPrice(row.priceOrigin) }}
          </template>
        </el-table-column>
        <el-table-column prop="priceRegular" label="常规售价" width="110">
          <template #default="{ row }">
            {{ formatPrice(row.priceRegular) }}
          </template>
        </el-table-column>
        <el-table-column prop="priceSale" label="活动价" width="110">
          <template #default="{ row }">
            <span v-if="row.priceSale !== undefined && row.priceSale !== null && row.priceSale !== ''">
              <el-tag type="danger" size="small">{{ formatPrice(row.priceSale) }}</el-tag>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效天数" width="100">
          <template #default="{ row }">
            <span v-if="row.validDays">{{ row.validDays }} 天</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicableSubjects" label="适用科目" width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="applicableLevels" label="适用级别" width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="isActive" label="激活状态" width="100">
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
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="viewDetail(row)">查看</el-button>
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
            <el-button @click="batchUpdateActive(true)" type="success" size="small">
              批量激活
            </el-button>
            <el-button @click="batchUpdateActive(false)" type="warning" size="small">
              批量禁用
            </el-button>
            <el-button @click="batchDeactivate" type="danger" size="small">
              批量下架
            </el-button>
            <el-button @click="selectedRows = []" size="small">
              取消选择
            </el-button>
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
            <el-button @click="printTable(packs)" type="primary" size="small">
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      :title="dialog.mode === 'create' ? '创建课包' : '编辑课包'"
      v-model="dialog.visible"
      width="760px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="formRules"
        ref="packFormRef"
        label-width="120px"
      >
        <el-form-item label="课包名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="如：Python 16课时常规包"></el-input>
        </el-form-item>

        <el-form-item label="课包类型" prop="type">
          <el-select v-model="dialog.form.type" placeholder="请选择课包类型" style="width: 100%">
            <el-option label="课时包" value="课时包"></el-option>
            <el-option label="学期包" value="学期包"></el-option>
            <el-option label="体验包" value="体验包"></el-option>
            <el-option label="定制包" value="定制包"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="课包描述" prop="description">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="课包描述"
            maxlength="100"
            show-word-limit
          ></el-input>
        </el-form-item>

        <el-form-item label="总课时" prop="totalLesson">
          <el-input-number v-model="dialog.form.totalLesson" :min="0" placeholder="消课按次扣，1次课消耗1课时" style="width: 100%;">
            <template #append>课时</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="原价" prop="priceOrigin">
          <el-input-number v-model="dialog.form.priceOrigin" :min="0" :precision="0" style="width: 100%;">
            <template #append>分</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="常规售价" prop="priceRegular">
          <el-input-number v-model="dialog.form.priceRegular" :min="0" :precision="0" style="width: 100%;">
            <template #append>分</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="活动价" prop="priceSale">
          <el-input-number v-model="dialog.form.priceSale" :min="0" :precision="0" style="width: 100%;">
            <template #append>分</template>
          </el-input-number>
          <div class="field-hint">留空表示无活动价（可配合活动/优惠券使用）</div>
        </el-form-item>

        <el-form-item label="适用科目" prop="applicableSubjects">
          <el-input v-model="dialog.form.applicableSubjects" placeholder="如：Python、C++"></el-input>
        </el-form-item>

        <el-form-item label="适用级别" prop="applicableLevels">
          <el-input v-model="dialog.form.applicableLevels" placeholder="如：初级、中级"></el-input>
        </el-form-item>

        <el-form-item label="有效天数" prop="validDays">
          <el-input-number v-model="dialog.form.validDays" :min="0" placeholder="购买后有效天数（可选）" style="width: 100%;">
            <template #append>天</template>
          </el-input-number>
          <div class="field-hint">留空表示永久有效（除固定到期日）</div>
        </el-form-item>

        <el-form-item label="固定到期日" prop="expireDate">
          <el-date-picker
            v-model="dialog.form.expireDate"
            type="date"
            placeholder="选择固定到期日（可选）"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          ></el-date-picker>
          <div class="field-hint">一般不用，留空即可</div>
        </el-form-item>

        <el-form-item label="是否激活" prop="isActive">
          <el-switch
            v-model="dialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
          <div class="field-hint">未激活的课包学生端不可见</div>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前" style="width: 100%;"></el-input-number>
        </el-form-item>

        <el-form-item v-if="dialog.mode === 'create' && currentOrgId" label="所属组织">
          <el-tag type="info">系统将自动使用当前登录用户所属组织</el-tag>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="savePack" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { packService } from '../../api/pack'
import { orgService } from '../../api/org'
import { formatDate, formatActiveStatus, formatDateOnly } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import { useAuthStore } from '../../stores/auth'

// 状态变量
const packs = ref([])
const orgOptions = ref([]) // 组织选项（仅管理员可见过滤）
const loading = ref(false)
const packFormRef = ref()
const selectedRows = ref([]) // 选中的行

// 认证 store
const authStore = useAuthStore()

// 当前用户所属 Org
const currentOrgId = computed(() => authStore.currentOrgId || null)

// 是否管理员（管理员可看全平台组织、可不按 Org 过滤）
const isAdmin = computed(() => Boolean(authStore.user?.isAdmin))

// 兜底回拉：与 Courses.vue 同款模式
const ensureCurrentOrgId = async () => {
  if (authStore.currentOrgId) return authStore.currentOrgId
  const currentUser = authStore.user?.currentUser
  if (!currentUser) return null
  if (typeof currentUser === 'object') {
    const orgId = currentUser.Org || null
    authStore.setCurrentOrgId(orgId)
    return orgId
  }
  return null
}

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  name: '',
  type: '',
  isActive: '',
  Org: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  form: {
    name: '',
    type: '课时包',
    description: '',
    totalLesson: 16,
    priceOrigin: 0,
    priceRegular: 0,
    priceSale: undefined,
    applicableSubjects: '',
    applicableLevels: '',
    validDays: undefined,
    expireDate: '',
    isActive: true,
    sort: 0
  }
})

// 表单校验规则
const formRules = {
  name: [
    { required: true, message: '请输入课包名称', trigger: 'blur' },
    { min: 2, max: 100, message: '课包名称长度应在2-100个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择课包类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入课包描述', trigger: 'blur' },
    { min: 2, max: 100, message: '课包描述长度应在2-100个字符之间', trigger: 'blur' }
  ],
  totalLesson: [
    { required: true, message: '请输入总课时', trigger: 'blur' },
    { type: 'number', min: 0, message: '总课时不能小于0', trigger: 'blur' }
  ],
  priceOrigin: [
    { required: true, message: '请输入原价', trigger: 'blur' },
    { type: 'number', min: 0, message: '原价不能小于0', trigger: 'blur' }
  ],
  priceRegular: [
    { required: true, message: '请输入常规售价', trigger: 'blur' },
    { type: 'number', min: 0, message: '常规售价不能小于0', trigger: 'blur' }
  ],
  applicableSubjects: [
    { required: true, message: '请输入适用科目', trigger: 'blur' },
    { min: 2, max: 100, message: '适用科目长度应在2-100个字符之间', trigger: 'blur' }
  ],
  applicableLevels: [
    { required: true, message: '请输入适用级别', trigger: 'blur' },
    { min: 2, max: 100, message: '适用级别长度应在2-100个字符之间', trigger: 'blur' }
  ],
  isActive: [
    { required: true, message: '请设置激活状态', trigger: 'change' }
  ]
}

// 课包类型格式化
const formatType = (type) => {
  const typeMap = {
    '课时包': '课时包',
    '学期包': '学期包',
    '体验包': '体验包',
    '定制包': '定制包'
  }
  return typeMap[type] || type || '-'
}

// 课包类型标签类型
const formatTypeTag = (type) => {
  const typeMap = {
    '课时包': 'primary',
    '学期包': 'success',
    '体验包': 'warning',
    '定制包': 'danger'
  }
  return typeMap[type] || 'info'
}

// 格式化价格（分转换为元）
const formatPrice = (priceInCents) => {
  if (priceInCents === undefined || priceInCents === null || priceInCents === '') return '0.00元'
  return `${(priceInCents / 100).toFixed(2)}元`
}

// 获取组织选项（仅管理员场景）
const fetchOrgs = async () => {
  if (!isAdmin.value) return
  try {
    const response = await orgService.getOrgs({
      filter: { isActive: true },
      options: {
        limit: 1000,
        sort: { sort: -1 }
      }
    })
    if (response.data.success) {
      orgOptions.value = response.data.data.items || []
    }
  } catch (error) {
    console.error('获取组织列表失败:', error)
  }
}

// 获取课包列表
const fetchPacks = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize

    // 构建筛选条件
    const filter = {}

    // 课包名称搜索（regExp 模糊匹配 name 字段）
    if (filters.name) {
      filter.regExp = filters.name
    }

    // 课包类型
    if (filters.type) {
      filter.type = filters.type
    }

    // 是否激活
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true
    }

    // 所属组织（仅管理员可显式指定；非管理员由后端自动按 currentUser.Org 过滤）
    if (filters.Org) {
      filter.Org = filters.Org
    }

    const options = {
      limit: pagination.pageSize,
      sort: { sort: -1, createdAt: -1 },
      populate: [
        { path: 'Org', select: 'name' },
        { path: 'createdBy', select: 'nickname' },
        { path: 'updatedBy', select: 'nickname' }
      ]
    }

    if (skipValue > 0) {
      options.skip = skipValue
    }

    const params = { filter, options }

    console.log('Fetching packs with params:', params)

    const response = await packService.getPacks(params)
    console.log('Packs response:', response)

    if (response.data.success) {
      const { items, total } = response.data.data
      packs.value = items || []
      pagination.total = total || 0
    } else {
      ElMessage.error(response.data.message || '获取课包列表失败')
    }
  } catch (error) {
    console.error('获取课包列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取课包列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.type = ''
  filters.isActive = ''
  filters.Org = ''
  pagination.currentPage = 1
  fetchPacks()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchPacks()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchPacks()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 打开创建对话框
const openCreateDialog = async () => {
  const orgId = await ensureCurrentOrgId()
  if (!orgId && !isAdmin.value) {
    ElMessage.error('无法识别当前用户所属机构（Org），无法创建课包')
    return
  }

  dialog.mode = 'create'
  dialog.visible = true
  // 重置表单
  Object.assign(dialog.form, {
    _id: undefined,
    name: '',
    type: '课时包',
    description: '',
    totalLesson: 16,
    priceOrigin: 0,
    priceRegular: 0,
    priceSale: undefined,
    applicableSubjects: '',
    applicableLevels: '',
    validDays: undefined,
    expireDate: '',
    isActive: true,
    sort: 0
  })
  setTimeout(() => {
    if (packFormRef.value) {
      packFormRef.value.clearValidate()
    }
  }, 0)
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  // 填充表单数据
  Object.assign(dialog.form, {
    _id: row._id,
    name: row.name || '',
    type: row.type || '课时包',
    description: row.description || '',
    totalLesson: row.totalLesson ?? 16,
    priceOrigin: row.priceOrigin ?? 0,
    priceRegular: row.priceRegular ?? 0,
    // 编辑时若活动价缺失（null/undefined/''）则不预填
    priceSale: (row.priceSale !== undefined && row.priceSale !== null && row.priceSale !== '')
      ? row.priceSale
      : undefined,
    applicableSubjects: row.applicableSubjects || '',
    applicableLevels: row.applicableLevels || '',
    validDays: (row.validDays !== undefined && row.validDays !== null) ? row.validDays : undefined,
    expireDate: formatDateOnly(row.expireDate),
    isActive: row.isActive !== undefined ? row.isActive : true,
    sort: row.sort || 0
  })
  nextTick(() => {
    if (packFormRef.value && packFormRef.value.clearValidate) {
      packFormRef.value.clearValidate()
    }
  })
}

// 查看课包详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>课包名称:</strong> ${row.name || '-'}</div>
    <div><strong>课包类型:</strong> ${formatType(row.type)}</div>
    <div><strong>课包描述:</strong> ${row.description || '-'}</div>
    <div><strong>总课时:</strong> ${row.totalLesson || 0} 课时</div>
    <div><strong>原价:</strong> ${formatPrice(row.priceOrigin)}</div>
    <div><strong>常规售价:</strong> ${formatPrice(row.priceRegular)}</div>
    <div><strong>活动价:</strong> ${(row.priceSale !== undefined && row.priceSale !== null && row.priceSale !== '') ? formatPrice(row.priceSale) : '-'}</div>
    <div><strong>有效天数:</strong> ${row.validDays ? row.validDays + ' 天' : '-'}</div>
    <div><strong>固定到期日:</strong> ${row.expireDate ? formatDate(row.expireDate) : '-'}</div>
    <div><strong>适用科目:</strong> ${row.applicableSubjects || '-'}</div>
    <div><strong>适用级别:</strong> ${row.applicableLevels || '-'}</div>
    <div><strong>激活状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
  `, '课包详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

// 保存课包
const savePack = async () => {
  if (!packFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  try {
    if (packFormRef.value && packFormRef.value.clearValidate) {
      packFormRef.value.clearValidate()
    }
    await packFormRef.value.validate()
    dialog.loading = true

    // 构建请求数据：使用辅助函数过滤空值，避免后端报"字段不可为空"
    const setIf = (field, value) => {
      if (value === undefined || value === null || value === '') return
      packData[field] = value
    }

    const packData = {}

    // === 必填字段 ===
    setIf('name', (dialog.form.name || '').trim())
    setIf('type', dialog.form.type)
    setIf('description', (dialog.form.description || '').trim())
    setIf('totalLesson', dialog.form.totalLesson)
    setIf('priceOrigin', dialog.form.priceOrigin)
    setIf('priceRegular', dialog.form.priceRegular)
    setIf('applicableSubjects', (dialog.form.applicableSubjects || '').trim())
    setIf('applicableLevels', (dialog.form.applicableLevels || '').trim())
    setIf('isActive', dialog.form.isActive)

    // === 可选字段 ===
    // 活动价：仅当有正数时才传
    if (dialog.form.priceSale !== undefined && dialog.form.priceSale !== null && dialog.form.priceSale !== '' && dialog.form.priceSale >= 0) {
      packData.priceSale = dialog.form.priceSale
    }
    // 有效天数：仅当有正数时才传
    if (dialog.form.validDays !== undefined && dialog.form.validDays !== null && dialog.form.validDays !== '' && dialog.form.validDays > 0) {
      packData.validDays = dialog.form.validDays
    }
    setIf('expireDate', dialog.form.expireDate)
    setIf('sort', dialog.form.sort)

    // 创建模式下，把 Org 一起传给后端以便审计/前端一致性；
    // 后端 Pack.model 创建时会自动覆盖为 currentUser.Org
    if (dialog.mode === 'create') {
      const orgId = authStore.currentOrgId
      if (orgId) {
        packData.Org = orgId
      }
    }

    let response
    if (dialog.mode === 'create') {
      response = await packService.createPack(packData)
    } else {
      response = await packService.updatePack(dialog.form._id, packData)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建课包成功' : '更新课包成功')
      dialog.visible = false
      fetchPacks()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '创建课包失败' : '更新课包失败'))
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

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (packFormRef.value) {
    packFormRef.value.clearValidate()
  }
}

// 批量更新激活状态
const batchUpdateActive = async (status) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行操作')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要${status ? '激活' : '禁用'}选中的 ${selectedRows.value.length} 项吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value.map(item =>
      packService.updatePack(item._id, { isActive: status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchPacks()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量下架（软删除：将 isActive 设置为 false）
const batchDeactivate = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行下架')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要下架选中的 ${selectedRows.value.length} 项课包吗？此操作将取消这些课包的激活状态（学生端不可见）。`,
      '警告',
      {
        confirmButtonText: '确定下架',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const promises = selectedRows.value.map(item =>
      packService.deactivatePack(item._id)
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchPacks()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 打印表格功能
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '课包名称' },
    { prop: 'type', label: '类型', formatter: (row) => formatType(row.type) },
    { prop: 'totalLesson', label: '总课时', formatter: (row) => `${row.totalLesson || 0} 课时` },
    { prop: 'priceOrigin', label: '原价', formatter: (row) => formatPrice(row.priceOrigin) },
    { prop: 'priceRegular', label: '常规售价', formatter: (row) => formatPrice(row.priceRegular) },
    { prop: 'priceSale', label: '活动价', formatter: (row) => (row.priceSale !== undefined && row.priceSale !== null && row.priceSale !== '') ? formatPrice(row.priceSale) : '-' },
    { prop: 'validDays', label: '有效天数', formatter: (row) => row.validDays ? `${row.validDays} 天` : '-' },
    { prop: 'applicableSubjects', label: '适用科目' },
    { prop: 'applicableLevels', label: '适用级别' },
    { prop: 'isActive', label: '激活状态', formatter: (row) => formatActiveStatus(row.isActive) },
    { prop: 'createdAt', label: '创建时间', formatter: (row) => formatDate(row.createdAt) }
  ]

  printTableUtil(data, columns, '课包管理数据报表')
}

onMounted(async () => {
  // 进入页面时先确保拿到 currentOrgId
  await ensureCurrentOrgId()
  await fetchOrgs() // 仅管理员会拉取组织
  fetchPacks()
})
</script>

<style scoped>
.packs-page {
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

.batch-operation {
  margin-top: 16px;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selection-info {
  font-weight: 500;
  color: #606266;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
</style>
