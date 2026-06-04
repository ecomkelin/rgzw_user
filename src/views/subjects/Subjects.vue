<template>
  <div class="subjects-page">
    <h2 class="page-title">科目管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="科目名称">
          <el-input v-model="filters.name" placeholder="请输入科目名称" clearable></el-input>
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

        <el-form-item label="科目分类">
          <el-select v-model="filters.category" placeholder="请选择科目分类" clearable style="width: 160px;">
            <el-option label="C++" value="C++"></el-option>
            <el-option label="Python" value="Python"></el-option>
            <el-option label="Scratch" value="Scratch"></el-option>
            <el-option label="Spike" value="Spike"></el-option>
            <el-option label="电子智慧大颗粒" value="电子智慧大颗粒"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="是否展示">
          <el-select v-model="filters.isShow" placeholder="请选择是否展示" clearable style="width: 120px;">
            <el-option label="展示" :value="true"></el-option>
            <el-option label="隐藏" :value="false"></el-option>
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
            <el-button type="primary" @click="fetchSubjects">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增科目</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="subjects"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="科目名称" width="200"></el-table-column>
        <el-table-column prop="category" label="科目分类" width="120">
          <template #default="{ row }">
            <el-tag :type="formatCategoryType(row.category)">
              {{ formatCategory(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">
            {{ formatPrice(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="课程时长" width="120">
          <template #default="{ row }">
            {{ row.duration_minutes || 0 }} 分钟
          </template>
        </el-table-column>
        <el-table-column prop="default_lesson_count" label="标准课时" width="120">
          <template #default="{ row }">
            {{ row.default_lesson_count || 0 }} 节
          </template>
        </el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="200"></el-table-column>
        <el-table-column prop="isShow" label="是否展示" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isShow ? 'success' : 'info'">
              {{ row.isShow ? '展示' : '隐藏' }}
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
            <el-button @click="batchUpdateActive(true)" type="success" size="small">
              批量激活
            </el-button>
            <el-button @click="batchUpdateActive(false)" type="warning" size="small">
              批量禁用
            </el-button>
            <el-button @click="batchUpdateShow(true)" type="primary" size="small">
              批量展示
            </el-button>
            <el-button @click="batchUpdateShow(false)" type="info" size="small">
              批量隐藏
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
            <el-button @click="printTable(subjects)" type="primary" size="small">
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
      :title="dialog.mode === 'create' ? '创建科目' : '编辑科目'"
      v-model="dialog.visible"
      width="700px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="subjectFormRef"
        label-width="120px"
      >
        <el-form-item label="科目名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入科目名称"></el-input>
        </el-form-item>

        <el-form-item label="科目分类" prop="category">
          <el-select v-model="dialog.form.category" placeholder="请选择科目分类" style="width: 100%">
            <el-option label="C++" value="C++"></el-option>
            <el-option label="Python" value="Python"></el-option>
            <el-option label="Scratch" value="Scratch"></el-option>
            <el-option label="Spike" value="Spike"></el-option>
            <el-option label="电子智慧大颗粒" value="电子智慧大颗粒"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="价格（分）" prop="price">
          <el-input-number v-model="dialog.form.price" :min="0" placeholder="每堂课价格（单位：分）" style="width: 100%;"></el-input-number>
        </el-form-item>

        <el-form-item label="课程时长" prop="duration_minutes">
          <el-input-number v-model="dialog.form.duration_minutes" :min="0" placeholder="课程时长（单位：分钟）" style="width: 100%;"></el-input-number>
        </el-form-item>

        <el-form-item label="标准课时" prop="default_lesson_count">
          <el-input-number v-model="dialog.form.default_lesson_count" :min="0" placeholder="标准课时数" style="width: 100%;"></el-input-number>
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

        <el-form-item label="是否展示" prop="isShow">
          <el-switch
            v-model="dialog.form.isShow"
            active-text="展示"
            inactive-text="隐藏"
          ></el-switch>
        </el-form-item>

        <el-form-item label="是否激活" prop="isActive">
          <el-switch
            v-model="dialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前" style="width: 100%;"></el-input-number>
        </el-form-item>

        <el-form-item label="教学大纲">
          <div class="syllabus-list">
            <div v-for="(item, index) in dialog.form.syllabus" :key="index" class="syllabus-item">
              <el-input v-model="item.title" placeholder="教学大纲标题" style="width: 30%; margin-right: 10px;"></el-input>
              <el-input v-model="item.description" placeholder="教学大纲描述" style="width: 50%; margin-right: 10px;"></el-input>
              <el-button type="danger" @click="removeSyllabus(index)" size="small">删除</el-button>
            </div>
            <el-button type="primary" @click="addSyllabus" size="small" plain>
              + 添加教学大纲
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveSubject" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { subjectService } from '../../api/subject'
import { orgService } from '../../api/org'
import { formatDate, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'

// 状态变量
const subjects = ref([])
const orgOptions = ref([]) // 组织选项
const loading = ref(false)
const subjectFormRef = ref()
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
  category: '',
  isShow: '',
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  form: {
    name: '',
    category: 'C++',
    price: 0,
    duration_minutes: 0,
    default_lesson_count: 0,
    Org: '',
    isShow: true,
    isActive: true,
    sort: 0,
    syllabus: []
  },
  rules: {
    name: [
      { required: true, message: '请输入科目名称', trigger: 'blur' },
      { min: 2, max: 100, message: '科目名称长度应在2-100个字符之间', trigger: 'blur' }
    ],
    category: [
      { required: true, message: '请选择科目分类', trigger: 'change' }
    ],
    price: [
      { required: true, message: '请输入价格', trigger: 'blur' },
      { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
    ],
    duration_minutes: [
      { required: true, message: '请输入课程时长', trigger: 'blur' },
      { type: 'number', min: 0, message: '课程时长不能小于0', trigger: 'blur' }
    ],
    default_lesson_count: [
      { required: true, message: '请输入标准课时数', trigger: 'blur' },
      { type: 'number', min: 0, message: '标准课时数不能小于0', trigger: 'blur' }
    ],
    isShow: [
      { required: true, message: '请设置是否展示', trigger: 'change' }
    ],
    isActive: [
      { required: true, message: '请设置激活状态', trigger: 'change' }
    ]
  }
})

// 科目分类格式化
const formatCategory = (category) => {
  const categoryMap = {
    'C++': 'C++',
    'Python': 'Python',
    'Scratch': 'Scratch',
    'Spike': 'Spike',
    '电子智慧大颗粒': '电子智慧大颗粒'
  }
  return categoryMap[category] || category || '-'
}

// 科目分类标签类型
const formatCategoryType = (category) => {
  const typeMap = {
    'C++': 'danger',
    'Python': 'primary',
    'Scratch': 'warning',
    'Spike': 'success',
    '电子智慧大颗粒': 'info'
  }
  return typeMap[category] || 'info'
}

// 格式化价格（分转换为元）
const formatPrice = (priceInCents) => {
  if (!priceInCents) return '0.00元'
  return `${(priceInCents / 100).toFixed(2)}元`
}

// 获取组织选项
const fetchOrgs = async () => {
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

// 获取科目列表
const fetchSubjects = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize

    // 构建筛选条件
    const filter = {}

    // 科目名称搜索
    if (filters.name) {
      filter.regExp = filters.name
    }

    // 所属组织
    if (filters.Org) {
      filter.Org = filters.Org
    }

    // 科目分类
    if (filters.category) {
      filter.category = filters.category
    }

    // 是否展示
    if (filters.isShow !== '' && filters.isShow !== null && filters.isShow !== undefined) {
      filter.isShow = filters.isShow === 'true' || filters.isShow === true
    }

    // 是否激活
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true
    }

    const options = {
      limit: pagination.pageSize,
      sort: { sort: -1, createdAt: -1 },
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

    console.log('Fetching subjects with params:', params)

    const response = await subjectService.getSubjects(params)
    console.log('Subjects response:', response)

    if (response.data.success) {
      const { items, total } = response.data.data
      subjects.value = items || []
      pagination.total = total || 0
    } else {
      ElMessage.error(response.data.message || '获取科目列表失败')
    }
  } catch (error) {
    console.error('获取科目列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取科目列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.Org = ''
  filters.category = ''
  filters.isShow = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchSubjects()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchSubjects()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchSubjects()
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
    category: 'C++',
    price: 0,
    duration_minutes: 0,
    default_lesson_count: 0,
    Org: '',
    isShow: true,
    isActive: true,
    sort: 0,
    syllabus: []
  })
  // 清除验证
  setTimeout(() => {
    if (subjectFormRef.value) {
      subjectFormRef.value.clearValidate()
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
    category: row.category || 'C++',
    price: row.price || 0,
    duration_minutes: row.duration_minutes || 0,
    default_lesson_count: row.default_lesson_count || 0,
    Org: row.Org?._id || row.Org || '',
    isShow: row.isShow !== undefined ? row.isShow : true,
    isActive: row.isActive !== undefined ? row.isActive : true,
    sort: row.sort || 0,
    syllabus: row.syllabus ? JSON.parse(JSON.stringify(row.syllabus)) : []
  })
  // 清除验证
  setTimeout(() => {
    if (subjectFormRef.value) {
      subjectFormRef.value.clearValidate()
    }
  }, 0)
}

// 查看科目详情
const viewDetail = (row) => {
  let syllabusHTML = ''
  if (row.syllabus && row.syllabus.length > 0) {
    syllabusHTML = '<div><strong>教学大纲:</strong></div>'
    row.syllabus.forEach((item, index) => {
      syllabusHTML += `<div>${index + 1}. ${item.title}: ${item.description}</div>`
    })
  } else {
    syllabusHTML = '<div><strong>教学大纲:</strong> -</div>'
  }

  ElMessageBox.alert(`
    <div><strong>科目名称:</strong> ${row.name || '-'}</div>
    <div><strong>科目分类:</strong> ${formatCategory(row.category)}</div>
    <div><strong>价格:</strong> ${formatPrice(row.price)}</div>
    <div><strong>课程时长:</strong> ${row.duration_minutes || 0} 分钟</div>
    <div><strong>标准课时:</strong> ${row.default_lesson_count || 0} 节</div>
    <div><strong>所属组织:</strong> ${row.Org?.name || '-'}</div>
    <div><strong>是否展示:</strong> ${row.isShow ? '展示' : '隐藏'}</div>
    <div><strong>激活状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    ${syllabusHTML}
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
  `, '科目详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

// 添加教学大纲项
const addSyllabus = () => {
  if (!dialog.form.syllabus) {
    dialog.form.syllabus = []
  }
  dialog.form.syllabus.push({
    title: '',
    description: ''
  })
}

// 删除教学大纲项
const removeSyllabus = (index) => {
  if (dialog.form.syllabus && dialog.form.syllabus.length > index) {
    dialog.form.syllabus.splice(index, 1)
  }
}

// 保存科目
const saveSubject = async () => {
  if (!subjectFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  try {
    await subjectFormRef.value.validate()
    dialog.loading = true

    // 构建请求数据
    const subjectData = {
      name: dialog.form.name,
      category: dialog.form.category,
      price: dialog.form.price,
      duration_minutes: dialog.form.duration_minutes,
      default_lesson_count: dialog.form.default_lesson_count,
      isShow: dialog.form.isShow,
      isActive: dialog.form.isActive
    }

    // 可选字段
    if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
      subjectData.sort = dialog.form.sort
    }

    if (dialog.form.Org) {
      subjectData.Org = dialog.form.Org
    }

    // 处理教学大纲，过滤空项
    if (dialog.form.syllabus && dialog.form.syllabus.length > 0) {
      const validSyllabus = dialog.form.syllabus.filter(
        item => item.title && item.title.trim() && item.description && item.description.trim()
      )
      if (validSyllabus.length > 0) {
        subjectData.syllabus = validSyllabus
      }
    }

    let response
    if (dialog.mode === 'create') {
      response = await subjectService.createSubject(subjectData)
    } else {
      response = await subjectService.updateSubject(dialog.form._id, subjectData)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建科目成功' : '更新科目成功')
      dialog.visible = false
      fetchSubjects()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '创建科目失败' : '更新科目失败'))
    }
  } catch (error) {
    console.error('保存科目失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存科目失败')
    }
  } finally {
    dialog.loading = false
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (subjectFormRef.value) {
    subjectFormRef.value.clearValidate()
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
      subjectService.updateSubject(item._id, { isActive: status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchSubjects()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量更新展示状态
const batchUpdateShow = async (status) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行操作')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要${status ? '展示' : '隐藏'}选中的 ${selectedRows.value.length} 项吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value.map(item =>
      subjectService.updateSubject(item._id, { isShow: status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchSubjects()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量删除（软删除：将 isActive 设置为 false）
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要禁用选中的 ${selectedRows.value.length} 项吗？此操作将取消这些科目的激活状态。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const promises = selectedRows.value.map(item =>
      subjectService.deleteSubject(item._id)
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchSubjects()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 打印表格功能
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '科目名称' },
    { prop: 'category', label: '科目分类', formatter: (row) => formatCategory(row.category) },
    { prop: 'price', label: '价格', formatter: (row) => formatPrice(row.price) },
    { prop: 'duration_minutes', label: '课程时长', formatter: (row) => `${row.duration_minutes || 0} 分钟` },
    { prop: 'default_lesson_count', label: '标准课时', formatter: (row) => `${row.default_lesson_count || 0} 节` },
    { prop: 'Org.name', label: '所属组织' },
    { prop: 'isShow', label: '是否展示', formatter: (row) => row.isShow ? '展示' : '隐藏' },
    { prop: 'isActive', label: '激活状态', formatter: (row) => formatActiveStatus(row.isActive) },
    { prop: 'sort', label: '排序', formatter: (row) => row.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: (row) => formatDate(row.createdAt) }
  ]

  printTableUtil(data, columns, '科目管理数据报表')
}

onMounted(async () => {
  await fetchOrgs() // 先获取组织列表
  fetchSubjects()  // 再获取科目列表
})
</script>

<style scoped>
.subjects-page {
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

.syllabus-list {
  width: 100%;
}

.syllabus-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
