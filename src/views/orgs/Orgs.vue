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
        :data="items"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
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
              <el-button size="small" type="primary" @click="openDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作工具栏（v8.0.2 新增：与 Rooms/Subjects 对齐） -->
      <div class="batch-operation" v-if="selectedRows.length > 0">
        <el-divider />
        <div class="batch-toolbar">
          <span class="selection-info">已选择 {{ selectedRows.length }} 项</span>
          <div class="batch-buttons">
            <el-button @click="onBatchActivate" type="success" size="small">批量激活</el-button>
            <el-button @click="onBatchDeactivate" type="warning" size="small">批量禁用</el-button>
            <el-button @click="onBatchMain(true)" type="primary" size="small">批量设为主机构</el-button>
            <el-button @click="onBatchMain(false)" type="info" size="small">批量取消主机构</el-button>
            <el-button @click="selectedRows = []" size="small">取消选择</el-button>
          </div>
        </div>
      </div>

      <!-- 打印操作工具栏（v8.0.2 新增） -->
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
            >打印选中项</el-button>
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

    <!-- 详情对话框（v8.0.2 新增：替代 ElMessageBox.alert） -->
    <DetailDialog
      v-model="detailVisible"
      title="组织详情"
      :data="currentRow"
      :rows="detailRows"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { orgService } from '../../api/org'
import { formatDate, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import {
  buildListPayload,
  appendExact,
  appendBoolean,
  appendRegExp
} from '../../utils/listPayload'
import { useListPage } from '../../composables/useListPage'
import DetailDialog from '../../components/DetailDialog.vue'

/* ===== 列表 + 批量（统一来自 useListPage） ===== */
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

/* ===== 筛选条件 ===== */
const filters = reactive({
  name: '',
  unionCode: '',
  isActive: '',
  isMain: ''
})

/* ===== 详情面板 ===== */
const detailVisible = ref(false)
const currentRow = ref({})
const detailRows = [
  { label: '组织名称',     field: 'name' },
  { label: '组织简称',     field: 'nickname' },
  { label: '统一社会信用代码', field: 'unionCode' },
  { label: '是否主机构',   field: 'isMain', render: r => r.isMain ? '主机构' : '普通机构' },
  { label: '状态',         field: 'isActive', render: r => formatActiveStatus(r.isActive) },
  { label: '联系电话',     field: 'phone' },
  { label: '联系邮箱',     field: 'email' },
  { label: '网站',         field: 'website' },
  { label: '地址',         field: 'address' },
  { label: '排序',         field: 'sort' },
  { label: '创建时间',     field: 'createdAt', render: r => formatDate(r.createdAt) },
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
const orgFormRef = ref()

/* ===== 列表拉取（v8.0.2 统一走 buildListPayload） ===== */
const fetchOrgs = async () => {
  const filter = {}
  // 后端 v7.x Org listVD 接受 `filter.regExp`（DAO 内部走 name/nickname 模糊）
  // 旧的 $or 多字段正则会被 matchedData() 静默剔除。
  appendRegExp(filter, filters.name)
  appendExact(filter, 'unionCode', filters.unionCode)
  appendBoolean(filter, 'isActive', filters.isActive)
  appendBoolean(filter, 'isMain', filters.isMain)

  const payload = buildListPayload({
    filter,
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    sort: { sort: -1, createdAt: -1 }
  })

  await fetchList(orgService.getOrgs.bind(orgService), payload)
}

const resetFilters = () => {
  filters.name = ''
  filters.unionCode = ''
  filters.isActive = ''
  filters.isMain = ''
  pagination.currentPage = 1
  fetchOrgs()
}

/* ===== 批量操作（v8.0.2 新增） ===== */
const onBatchActivate = () => batchUpdateField({
  field: 'isActive',
  value: true,
  label: '激活',
  apply: (ids, body) => Promise.allSettled(ids.map(id => orgService.updateOrg(id, body))),
  onComplete: fetchOrgs
})
const onBatchDeactivate = () => batchDeactivate({
  label: '禁用',
  apply: (ids) => Promise.allSettled(ids.map(id => orgService.updateOrg(id, { isActive: false }))),
  onComplete: fetchOrgs
})
const onBatchMain = (val) => batchUpdateField({
  field: 'isMain',
  value: val,
  label: val ? '设为主机构' : '取消主机构',
  apply: (ids, body) => Promise.allSettled(ids.map(id => orgService.updateOrg(id, body))),
  onComplete: fetchOrgs
})

/* ===== 打开/保存 ===== */
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
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
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
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

const closeDialog = () => {
  dialog.visible = false
  if (orgFormRef.value) orgFormRef.value.clearValidate()
}

// pickDefined: 过滤 undefined / null / 空字符串字段，匹配后端 matchedData() 的白名单语义
const pickDefined = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
)

const saveOrg = async () => {
  if (!orgFormRef.value) return
  let valid = false
  try {
    valid = await orgFormRef.value.validate().catch(() => false)
  } catch (_) { valid = false }
  if (!valid) return

  dialog.loading = true
  try {
    const baseData = pickDefined({
      name: dialog.form.name,
      nickname: dialog.form.nickname,
      unionCode: dialog.form.unionCode,
      phone: dialog.form.phone,
      email: dialog.form.email,
      website: dialog.form.website,
      address: dialog.form.address,
      isMain: dialog.form.isMain,
      isActive: dialog.form.isActive,
      sort: dialog.form.sort
    })

    const response = dialog.mode === 'create'
      ? await orgService.createOrg(baseData)
      : await orgService.updateOrg(dialog.form._id, baseData)

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建组织成功' : '更新组织成功')
      dialog.visible = false
      fetchOrgs()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存组织失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '保存组织失败')
  } finally {
    dialog.loading = false
  }
}

/* ===== 打印 ===== */
const printTable = (data) => {
  const columns = [
    { prop: 'name',      label: '组织名称' },
    { prop: 'nickname',  label: '组织简称' },
    { prop: 'unionCode', label: '统一社会信用代码' },
    { prop: 'isMain',    label: '是否主机构', formatter: r => r.isMain ? '主机构' : '普通机构' },
    { prop: 'isActive',  label: '状态', formatter: r => formatActiveStatus(r.isActive) },
    { prop: 'phone',     label: '联系电话' },
    { prop: 'email',     label: '联系邮箱' },
    { prop: 'website',   label: '网站' },
    { prop: 'address',   label: '地址' },
    { prop: 'sort',      label: '排序', formatter: r => r.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: r => formatDate(r.createdAt) }
  ]
  printTableUtil(data, columns, '组织管理数据报表')
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

/* v8.0.2 批量 / 打印工具栏（与 Rooms/Subjects 对齐） */
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
  flex-wrap: wrap;
}
</style>
