<template>
  <div class="rooms-page">
    <h2 class="page-title">教室管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="教室名称">
          <el-input v-model="filters.name" placeholder="请输入教室名称" clearable></el-input>
        </el-form-item>

        <el-form-item label="所属组织">
          <el-select v-model="filters.Org" placeholder="请选择组织" clearable filterable style="width: 200px;">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择教室状态" clearable style="width: 140px;">
            <el-option label="可用" value="available"></el-option>
            <el-option label="使用中" value="in_use"></el-option>
            <el-option label="维护中" value="maintenance"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="是否激活">
          <el-select v-model="filters.isActive" placeholder="请选择激活状态" clearable style="width: 120px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="fetchRooms">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增教室</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="rooms"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="教室名称" width="200"></el-table-column>
        <el-table-column prop="capacity" label="容纳人数" width="120">
          <template #default="{ row }">
            {{ row.capacity || 0 }} 人
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="200"></el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="200"></el-table-column>
        <el-table-column prop="status" label="教室状态" width="120">
          <template #default="{ row }">
            <el-tag :type="formatStatusType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="激活状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" width="200" show-overflow-tooltip></el-table-column>
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

      <!-- 批量操作工具栏 -->
      <div class="batch-operation" v-if="selectedRows.length > 0">
        <el-divider />
        <div class="batch-toolbar">
          <span class="selection-info">已选择 {{ selectedRows.length }} 项</span>
          <div class="batch-buttons">
            <el-button @click="batchUpdateStatus('available')" type="success" size="small">
              批量设为可用
            </el-button>
            <el-button @click="batchUpdateStatus('maintenance')" type="warning" size="small">
              批量设为维护中
            </el-button>
            <el-button @click="batchDelete" type="danger" size="small">
              批量删除
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
            <el-button @click="printTable(rooms)" type="primary" size="small">
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
      :title="dialog.mode === 'create' ? '创建教室' : '编辑教室'"
      v-model="dialog.visible"
      width="600px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="roomFormRef"
        label-width="120px"
      >
        <el-form-item label="教室名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入教室名称"></el-input>
        </el-form-item>

        <el-form-item label="容纳人数" prop="capacity">
          <el-input-number v-model="dialog.form.capacity" :min="0" placeholder="请输入容纳人数" style="width: 100%;"></el-input-number>
        </el-form-item>

        <el-form-item label="位置" prop="location">
          <el-input v-model="dialog.form.location" placeholder="请输入位置描述"></el-input>
        </el-form-item>

        <el-form-item label="所属组织" prop="Org">
          <el-select v-model="dialog.form.Org" :disabled="dialog.mode === 'edit'" placeholder="请选择组织" style="width: 100%" filterable>
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="教室状态" prop="status">
          <el-select v-model="dialog.form.status" placeholder="请选择教室状态" style="width: 100%">
            <el-option label="可用" value="available"></el-option>
            <el-option label="使用中" value="in_use"></el-option>
            <el-option label="维护中" value="maintenance"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="是否激活" prop="isActive">
          <el-switch
            v-model="dialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注/设备情况"
          ></el-input>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前" style="width: 100%;"></el-input-number>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveRoom" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roomService } from '../../api/room'
import { orgService } from '../../api/org'
import { formatDate, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'

// 状态变量
const rooms = ref([])
const orgOptions = ref([]) // 组织选项
const loading = ref(false)
const roomFormRef = ref()
const selectedRows = ref([]) // 选中的行

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  name: '',
  Org: '',
  status: '',
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  form: {
    name: '',
    capacity: 0,
    location: '',
    Org: '',
    status: 'available',
    isActive: true,
    description: '',
    sort: 0
  },
  rules: {
    name: [
      { required: true, message: '请输入教室名称', trigger: 'blur' },
      { min: 2, max: 100, message: '教室名称长度应在2-100个字符之间', trigger: 'blur' }
    ],
    capacity: [
      { required: true, message: '请输入容纳人数', trigger: 'blur' },
      { type: 'number', min: 0, message: '容纳人数不能小于0', trigger: 'blur' }
    ],
    location: [
      { min: 2, max: 100, message: '位置描述长度应在2-100个字符之间', trigger: 'blur' }
    ],
    status: [
      { required: true, message: '请选择教室状态', trigger: 'change' }
    ],
    isActive: [
      { required: true, message: '请设置激活状态', trigger: 'change' }
    ],
    description: [
      { min: 2, max: 200, message: '备注长度应在2-200个字符之间', trigger: 'blur' }
    ]
  }
})

// 教室状态格式化
const formatStatus = (status) => {
  const statusMap = {
    available: '可用',
    in_use: '使用中',
    maintenance: '维护中'
  }
  return statusMap[status] || '-'
}

// 教室状态标签类型
const formatStatusType = (status) => {
  const typeMap = {
    available: 'success',
    in_use: 'warning',
    maintenance: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取组织选项
const fetchOrgs = async () => {
  try {
    const response = await orgService.getOrgs({
      filter: { isActive: true },
      options: {
        limit: 1000,
        sortObj: { sort: -1 }
      }
    })

    if (response.data.success) {
      orgOptions.value = response.data.data.items || []
    }
  } catch (error) {
    console.error('获取组织列表失败:', error)
  }
}

// 获取教室列表
const fetchRooms = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize

    // 构建筛选条件
    const filter = {}

    // 教室名称搜索
    if (filters.name) {
      filter.regExp = filters.name
    }

    // 所属组织
    if (filters.Org) {
      filter.Org = filters.Org
    }

    // 教室状态
    if (filters.status) {
      filter.status = filters.status
    }

    // 是否激活
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true
    }

    const options = {
      limit: pagination.pageSize,
      sortObj: { sort: -1, createdAt: -1 },
      populate: [
        { path: 'Org', select: 'name' }
      ]
    }

    if (skipValue > 0) {
      options.skip = skipValue
    }

    const params = {
      filter,
      options
    }

    console.log('Fetching rooms with params:', params)

    const response = await roomService.getRooms(params)
    console.log('Rooms response:', response)

    if (response.data.success) {
      const { items, total } = response.data.data
      rooms.value = items || []
      pagination.total = total || 0
    } else {
      ElMessage.error(response.data.message || '获取教室列表失败')
    }
  } catch (error) {
    console.error('获取教室列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取教室列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.Org = ''
  filters.status = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchRooms()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchRooms()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchRooms()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  // 重置表单
  Object.assign(dialog.form, {
    name: '',
    capacity: 0,
    location: '',
    Org: '',
    status: 'available',
    isActive: true,
    description: '',
    sort: 0
  })
  // 清除验证
  setTimeout(() => {
    if (roomFormRef.value) {
      roomFormRef.value.clearValidate()
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
    capacity: row.capacity || 0,
    location: row.location || '',
    Org: row.Org?._id || row.Org || '',
    status: row.status || 'available',
    isActive: row.isActive !== undefined ? row.isActive : true,
    description: row.description || '',
    sort: row.sort || 0
  })
  // 清除验证
  setTimeout(() => {
    if (roomFormRef.value) {
      roomFormRef.value.clearValidate()
    }
  }, 0)
}

// 查看教室详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>教室名称:</strong> ${row.name || '-'}</div>
    <div><strong>容纳人数:</strong> ${row.capacity || 0} 人</div>
    <div><strong>位置:</strong> ${row.location || '-'}</div>
    <div><strong>所属组织:</strong> ${row.Org?.name || '-'}</div>
    <div><strong>教室状态:</strong> ${formatStatus(row.status)}</div>
    <div><strong>激活状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>备注:</strong> ${row.description || '-'}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
  `, '教室详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

// 保存教室
const saveRoom = async () => {
  if (!roomFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  try {
    await roomFormRef.value.validate()
    dialog.loading = true

    // 构建请求数据
    const roomData = {
      name: dialog.form.name,
      capacity: dialog.form.capacity,
      status: dialog.form.status,
      isActive: dialog.form.isActive
    }

    // 可选字段
    if (dialog.form.location && dialog.form.location.trim() !== '') {
      roomData.location = dialog.form.location
    }

    if (dialog.form.description && dialog.form.description.trim() !== '') {
      roomData.description = dialog.form.description
    }

    if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
      roomData.sort = dialog.form.sort
    }

    if (dialog.form.Org) {
      roomData.Org = dialog.form.Org
    }

    let response
    if (dialog.mode === 'create') {
      response = await roomService.createRoom(roomData)
    } else {
      response = await roomService.updateRoom(dialog.form._id, roomData)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建教室成功' : '更新教室成功')
      dialog.visible = false
      fetchRooms()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '创建教室失败' : '更新教室失败'))
    }
  } catch (error) {
    console.error('保存教室失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存教室失败')
    }
  } finally {
    dialog.loading = false
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (roomFormRef.value) {
    roomFormRef.value.clearValidate()
  }
}

// 批量更新状态
const batchUpdateStatus = async (status) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行操作')
    return
  }

  try {
    const statusText = formatStatus(status)
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 个教室状态设为"${statusText}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value.map(item =>
      roomService.updateRoom(item._id, { status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchRooms()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 项吗？删除后将无法恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const promises = selectedRows.value.map(item => roomService.deleteRoom(item._id))

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量删除成功，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchRooms()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 打印表格功能
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '教室名称' },
    { prop: 'capacity', label: '容纳人数', formatter: (row) => `${row.capacity || 0} 人` },
    { prop: 'location', label: '位置' },
    { prop: 'Org.name', label: '所属组织' },
    { prop: 'status', label: '教室状态', formatter: (row) => formatStatus(row.status) },
    { prop: 'isActive', label: '激活状态', formatter: (row) => formatActiveStatus(row.isActive) },
    { prop: 'description', label: '备注' },
    { prop: 'sort', label: '排序', formatter: (row) => row.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: (row) => formatDate(row.createdAt) }
  ]

  printTableUtil(data, columns, '教室管理数据报表')
}

onMounted(async () => {
  await fetchOrgs() // 先获取组织列表
  fetchRooms()     // 再获取教室列表
})
</script>

<style scoped>
.rooms-page {
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
</style>
