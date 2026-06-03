<template>
  <div class="courses-page">
    <h2 class="page-title">课程管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="班级名称">
          <el-input v-model="filters.name" placeholder="请输入班级名称" clearable></el-input>
        </el-form-item>

        <el-form-item label="所属科目">
          <el-select v-model="filters.Subject" placeholder="请选择科目" clearable filterable style="width: 180px;">
            <el-option
              v-for="subject in subjectOptions"
              :key="subject._id"
              :label="subject.name"
              :value="subject._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="主讲老师">
          <el-select v-model="filters.mainTeacher" placeholder="请选择老师" clearable filterable style="width: 160px;">
            <el-option
              v-for="user in userOptions"
              :key="user._id"
              :label="user.Account?.name || user.nickname"
              :value="user._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="课程状态">
          <el-select v-model="filters.status" placeholder="请选择课程状态" clearable style="width: 130px;">
            <el-option label="草稿" value="draft"></el-option>
            <el-option label="招生中" value="enrolling"></el-option>
            <el-option label="进行中" value="ongoing"></el-option>
            <el-option label="已结束" value="finished"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="排课频率">
          <el-select v-model="filters.frequency" placeholder="请选择排课频率" clearable style="width: 130px;">
            <el-option label="每周" value="weekly"></el-option>
            <el-option label="每日" value="daily"></el-option>
            <el-option label="自定义" value="custom"></el-option>
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
            <el-button type="primary" @click="fetchCourses">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="openCreateDialog">新增课程</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="courses"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="班级名称" width="240" show-overflow-tooltip></el-table-column>
        <el-table-column prop="Subject.name" label="所属科目" width="150"></el-table-column>
        <el-table-column prop="mainTeacher" label="主讲老师" width="120">
          <template #default="{ row }">
            {{ getTeacherName(row.mainTeacher) }}
          </template>
        </el-table-column>
        <el-table-column prop="defaultRoom" label="默认教室" width="120">
          <template #default="{ row }">
            {{ getRoomName(row.defaultRoom) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSessions" label="总课次" width="100"></el-table-column>
        <el-table-column prop="maxStudents" label="最大学生数" width="100"></el-table-column>
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">
            {{ formatPrice(row.price) }}
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="排课频率" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ formatFrequency(row.frequency) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="课程状态" width="120">
          <template #default="{ row }">
            <el-tag :type="formatStatusType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="激活状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开班日期" width="120">
          <template #default="{ row }">
            {{ row.startDate ? formatDate(row.startDate) : '-' }}
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
            <el-button @click="batchUpdateStatus('enrolling')" type="primary" size="small">
              设为招生中
            </el-button>
            <el-button @click="batchUpdateStatus('finished')" type="info" size="small">
              设为已结束
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
            <el-button @click="printTable(courses)" type="primary" size="small">
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
      :title="dialog.mode === 'create' ? '创建课程' : '编辑课程'"
      v-model="dialog.visible"
      width="800px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="courseFormRef"
        label-width="120px"
      >
        <el-tabs v-model="dialog.activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="班级名称" prop="name">
              <el-input v-model="dialog.form.name" placeholder="如：2026春Python初级班"></el-input>
            </el-form-item>

            <el-form-item label="所属科目" prop="Subject">
              <el-select
                v-model="dialog.form.Subject"
                :disabled="dialog.mode === 'edit'"
                placeholder="请选择科目"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="subject in subjectOptions"
                  :key="subject._id"
                  :label="`${subject.name} (${formatCategory(subject.category)})`"
                  :value="subject._id">
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="主讲老师" prop="mainTeacher">
              <el-select
                v-model="dialog.form.mainTeacher"
                placeholder="请选择主讲老师"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user._id"
                  :label="user.Account?.name || user.nickname"
                  :value="user._id">
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="助教" prop="assistantTeacher">
              <el-select
                v-model="dialog.form.assistantTeacher"
                placeholder="请选择助教（可选）"
                style="width: 100%"
                clearable
                filterable
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user._id"
                  :label="user.Account?.name || user.nickname"
                  :value="user._id">
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="默认教室" prop="defaultRoom">
              <el-select
                v-model="dialog.form.defaultRoom"
                placeholder="请选择默认教室"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="room in roomOptions"
                  :key="room._id"
                  :label="`${room.name} (容纳 ${room.capacity} 人)`"
                  :value="room._id">
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="开班日期" prop="startDate">
              <el-date-picker
                v-model="dialog.form.startDate"
                type="date"
                placeholder="选择开班日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>

            <el-form-item label="结课日期" prop="endDate">
              <el-date-picker
                v-model="dialog.form.endDate"
                type="date"
                placeholder="选择预计结课日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>

            <el-form-item label="对外发布日" prop="publishDate">
              <el-date-picker
                v-model="dialog.form.publishDate"
                type="date"
                placeholder="选择对外发布/招生日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="排课信息" name="schedule">
            <el-form-item label="总课次" prop="totalSessions">
              <el-input-number v-model="dialog.form.totalSessions" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>

            <el-form-item label="排课频率" prop="frequency">
              <el-select v-model="dialog.form.frequency" placeholder="请选择排课频率" style="width: 100%">
                <el-option label="每周" value="weekly"></el-option>
                <el-option label="每日（周一到周五）" value="daily"></el-option>
                <el-option label="自定义" value="custom"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="排课规则">
              <div class="schedule-rules-list">
                <div v-for="(rule, index) in dialog.form.scheduleRules" :key="index" class="schedule-rule-item">
                  <el-select v-model="rule.dayOfWeek" placeholder="星期" style="width: 120px; margin-right: 10px;">
                    <el-option label="周日" :value="0"></el-option>
                    <el-option label="周一" :value="1"></el-option>
                    <el-option label="周二" :value="2"></el-option>
                    <el-option label="周三" :value="3"></el-option>
                    <el-option label="周四" :value="4"></el-option>
                    <el-option label="周五" :value="5"></el-option>
                    <el-option label="周六" :value="6"></el-option>
                  </el-select>
                  <el-time-picker
                    v-model="rule.startTime"
                    placeholder="开始时间"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 130px; margin-right: 10px;"
                  ></el-time-picker>
                  <el-time-picker
                    v-model="rule.endTime"
                    placeholder="结束时间"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 130px; margin-right: 10px;"
                  ></el-time-picker>
                  <el-button type="danger" @click="removeScheduleRule(index)" size="small">删除</el-button>
                </div>
                <el-button type="primary" @click="addScheduleRule" size="small" plain>
                  + 添加排课规则
                </el-button>
              </div>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="招生信息" name="recruit">
            <el-form-item label="最大学生数" prop="maxStudents">
              <el-input-number v-model="dialog.form.maxStudents" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>

            <el-form-item label="报名价格" prop="price">
              <el-input-number v-model="dialog.form.price" :min="0" style="width: 100%;">
                <template #append>分</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="课程状态" prop="status">
              <el-select v-model="dialog.form.status" placeholder="请选择课程状态" style="width: 100%">
                <el-option label="草稿" value="draft"></el-option>
                <el-option label="招生中" value="enrolling"></el-option>
                <el-option label="进行中" value="ongoing"></el-option>
                <el-option label="已结束" value="finished"></el-option>
                <el-option label="已取消" value="cancelled"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="是否激活" prop="isActive">
              <el-switch
                v-model="dialog.form.isActive"
                active-text="激活"
                inactive-text="未激活"
              ></el-switch>
            </el-form-item>

            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="dialog.form.sort" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="内容包装" name="content">
            <el-form-item label="本期特色" prop="features">
              <el-input
                v-model="dialog.form.features"
                type="textarea"
                :rows="3"
                placeholder="本期特色（如：本期由特级老师授课，赠送教材等）"
                maxlength="500"
                show-word-limit
              ></el-input>
            </el-form-item>

            <el-form-item label="详细描述" prop="description">
              <el-input
                v-model="dialog.form.description"
                type="textarea"
                :rows="5"
                placeholder="详细描述（课程内容、目标等）"
                maxlength="2000"
                show-word-limit
              ></el-input>
            </el-form-item>

            <el-form-item label="海报URL" prop="posterUrl">
              <el-input v-model="dialog.form.posterUrl" placeholder="课程海报图片URL"></el-input>
            </el-form-item>

            <el-form-item label="视频URL" prop="videoUrl">
              <el-input v-model="dialog.form.videoUrl" placeholder="整体课程视频URL"></el-input>
            </el-form-item>

            <el-form-item label="精彩集锦URL" prop="highlightVideoUrl">
              <el-input v-model="dialog.form.highlightVideoUrl" placeholder="精彩集锦视频URL"></el-input>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveCourse" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { courseService } from '../../api/course'
import { subjectService } from '../../api/subject'
import { userService } from '../../api/user'
import { roomService } from '../../api/room'
import { formatDate, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'

// 状态变量
const courses = ref([])
const subjectOptions = ref([]) // 科目选项
const userOptions = ref([]) // 老师选项
const roomOptions = ref([]) // 教室选项
const loading = ref(false)
const courseFormRef = ref()
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
  Subject: '',
  mainTeacher: '',
  status: '',
  frequency: '',
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  activeTab: 'basic',
  form: {
    name: '',
    Subject: '',
    mainTeacher: '',
    assistantTeacher: '',
    defaultRoom: '',
    startDate: '',
    endDate: '',
    publishDate: '',
    totalSessions: 0,
    frequency: 'weekly',
    scheduleRules: [],
    maxStudents: 8,
    price: 0,
    status: 'draft',
    isActive: true,
    sort: 0,
    features: '',
    description: '',
    posterUrl: '',
    videoUrl: '',
    highlightVideoUrl: ''
  },
  rules: {
    name: [
      { required: true, message: '请输入班级名称', trigger: 'blur' },
      { min: 2, max: 100, message: '班级名称长度应在2-100个字符之间', trigger: 'blur' }
    ],
    Subject: [
      { required: true, message: '请选择所属科目', trigger: 'change' }
    ],
    mainTeacher: [
      { required: true, message: '请选择主讲老师', trigger: 'change' }
    ],
    defaultRoom: [
      { required: true, message: '请选择默认教室', trigger: 'change' }
    ],
    totalSessions: [
      { required: true, message: '请输入总课次', trigger: 'blur' },
      { type: 'number', min: 0, message: '总课次不能小于0', trigger: 'blur' }
    ],
    frequency: [
      { required: true, message: '请选择排课频率', trigger: 'change' }
    ],
    maxStudents: [
      { required: true, message: '请输入最大学生数', trigger: 'blur' },
      { type: 'number', min: 0, message: '最大学生数不能小于0', trigger: 'blur' }
    ],
    price: [
      { required: true, message: '请输入价格', trigger: 'blur' },
      { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
    ],
    status: [
      { required: true, message: '请选择课程状态', trigger: 'change' }
    ],
    isActive: [
      { required: true, message: '请设置激活状态', trigger: 'change' }
    ]
  }
})

// 课程状态格式化
const formatStatus = (status) => {
  const statusMap = {
    draft: '草稿',
    enrolling: '招生中',
    ongoing: '进行中',
    finished: '已结束',
    cancelled: '已取消'
  }
  return statusMap[status] || status || '-'
}

// 课程状态标签类型
const formatStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    enrolling: 'success',
    ongoing: 'primary',
    finished: 'warning',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 排课频率格式化
const formatFrequency = (frequency) => {
  const frequencyMap = {
    weekly: '每周',
    daily: '每日',
    custom: '自定义'
  }
  return frequencyMap[frequency] || frequency || '-'
}

// 科目分类格式化（简化版）
const formatCategory = (category) => {
  return category || '-'
}

// 格式化价格（分转元）
const formatPrice = (priceInCents) => {
  if (priceInCents === undefined || priceInCents === null) return '0.00元'
  return `${(priceInCents / 100).toFixed(2)}元`
}

// 获取老师名称
const getTeacherName = (teacher) => {
  if (!teacher) return '-'
  if (typeof teacher === 'object' && teacher.Account) {
    return teacher.Account.name || teacher.nickname || '-'
  }
  // 简化版本：直接显示 ID
  return '老师ID:' + (teacher._id || teacher).substring(0, 8) + '...'
}

// 获取教室名称
const getRoomName = (room) => {
  if (!room) return '-'
  if (typeof room === 'object' && room.name) {
    return room.name
  }
  return '教室ID:' + (room._id || room).substring(0, 8) + '...'
}

// 获取科目选项
const fetchSubjects = async () => {
  try {
    const response = await subjectService.getSubjects({
      filter: { isActive: true },
      options: {
        limit: 1000,
        sortObj: { sort: -1 }
      }
    })
    if (response.data.success) {
      subjectOptions.value = response.data.data.items || []
    }
  } catch (error) {
    console.error('获取科目列表失败:', error)
  }
}

// 获取用户选项（作为老师候选）
const fetchUsers = async () => {
  try {
    const response = await userService.getUsers({
      filter: { isActive: true },
      options: {
        limit: 1000,
        sortObj: { sort: -1 }
      }
    })
    if (response.data.success) {
      userOptions.value = response.data.data.items || []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 获取教室选项
const fetchRooms = async () => {
  try {
    const response = await roomService.getRooms({
      filter: { isActive: true },
      options: {
        limit: 1000,
        sortObj: { sort: -1 }
      }
    })
    if (response.data.success) {
      roomOptions.value = response.data.data.items || []
    }
  } catch (error) {
    console.error('获取教室列表失败:', error)
  }
}

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize

    // 构建筛选条件
    const filter = {}

    // 班级名称搜索
    if (filters.name) {
      filter.regExp = filters.name
    }

    // 所属科目
    if (filters.Subject) {
      filter.Subject = filters.Subject
    }

    // 主讲老师
    if (filters.mainTeacher) {
      filter.mainTeacher = filters.mainTeacher
    }

    // 课程状态
    if (filters.status) {
      filter.status = filters.status
    }

    // 排课频率
    if (filters.frequency) {
      filter.frequency = filters.frequency
    }

    // 是否激活
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true
    }

    const options = {
      limit: pagination.pageSize,
      sortObj: { sort: -1, createdAt: -1 },
      populate: [
        { path: 'Subject', select: 'name category' }
      ]
    }

    if (skipValue > 0) {
      options.skip = skipValue
    }

    const params = {
      filter,
      options
    }

    console.log('Fetching courses with params:', params)

    const response = await courseService.getCourses(params)
    console.log('Courses response:', response)

    if (response.data.success) {
      const { items, total } = response.data.data
      courses.value = items || []
      pagination.total = total || 0
    } else {
      ElMessage.error(response.data.message || '获取课程列表失败')
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取课程列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.Subject = ''
  filters.mainTeacher = ''
  filters.status = ''
  filters.frequency = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchCourses()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchCourses()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchCourses()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  dialog.activeTab = 'basic'
  // 重置表单
  Object.assign(dialog.form, {
    _id: undefined,
    name: '',
    Subject: '',
    mainTeacher: '',
    assistantTeacher: '',
    defaultRoom: '',
    startDate: '',
    endDate: '',
    publishDate: '',
    totalSessions: 0,
    frequency: 'weekly',
    scheduleRules: [],
    maxStudents: 8,
    price: 0,
    status: 'draft',
    isActive: true,
    sort: 0,
    features: '',
    description: '',
    posterUrl: '',
    videoUrl: '',
    highlightVideoUrl: ''
  })
  setTimeout(() => {
    if (courseFormRef.value) {
      courseFormRef.value.clearValidate()
    }
  }, 0)
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  dialog.activeTab = 'basic'
  // 填充表单数据
  Object.assign(dialog.form, {
    _id: row._id,
    name: row.name || '',
    Subject: row.Subject?._id || row.Subject || '',
    mainTeacher: row.mainTeacher?._id || row.mainTeacher || '',
    assistantTeacher: row.assistantTeacher?._id || row.assistantTeacher || '',
    defaultRoom: row.defaultRoom?._id || row.defaultRoom || '',
    startDate: row.startDate ? formatDate(row.startDate) : '',
    endDate: row.endDate ? formatDate(row.endDate) : '',
    publishDate: row.publishDate ? formatDate(row.publishDate) : '',
    totalSessions: row.totalSessions || 0,
    frequency: row.frequency || 'weekly',
    scheduleRules: row.scheduleRules ? JSON.parse(JSON.stringify(row.scheduleRules)) : [],
    maxStudents: row.maxStudents || 8,
    price: row.price || 0,
    status: row.status || 'draft',
    isActive: row.isActive !== undefined ? row.isActive : true,
    sort: row.sort || 0,
    features: row.features || '',
    description: row.description || '',
    posterUrl: row.posterUrl || '',
    videoUrl: row.videoUrl || '',
    highlightVideoUrl: row.highlightVideoUrl || ''
  })
  setTimeout(() => {
    if (courseFormRef.value) {
      courseFormRef.value.clearValidate()
    }
  }, 0)
}

// 查看课程详情
const viewDetail = (row) => {
  let scheduleHTML = ''
  if (row.scheduleRules && row.scheduleRules.length > 0) {
    scheduleHTML = '<div><strong>排课规则:</strong></div>'
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    row.scheduleRules.forEach((rule, index) => {
      scheduleHTML += `<div>${index + 1}. ${weekDays[rule.dayOfWeek] || rule.dayOfWeek} ${rule.startTime} - ${rule.endTime}</div>`
    })
  } else {
    scheduleHTML = '<div><strong>排课规则:</strong> -</div>'
  }

  ElMessageBox.alert(`
    <div><strong>班级名称:</strong> ${row.name || '-'}</div>
    <div><strong>所属科目:</strong> ${row.Subject?.name || '-'}</div>
    <div><strong>主讲老师:</strong> ${getTeacherName(row.mainTeacher)}</div>
    <div><strong>助教:</strong> ${getTeacherName(row.assistantTeacher)}</div>
    <div><strong>默认教室:</strong> ${getRoomName(row.defaultRoom)}</div>
    <div><strong>开班日期:</strong> ${row.startDate ? formatDate(row.startDate) : '-'}</div>
    <div><strong>结课日期:</strong> ${row.endDate ? formatDate(row.endDate) : '-'}</div>
    <div><strong>总课次:</strong> ${row.totalSessions || 0}</div>
    <div><strong>排课频率:</strong> ${formatFrequency(row.frequency)}</div>
    <div><strong>最大学生数:</strong> ${row.maxStudents || 0}</div>
    <div><strong>价格:</strong> ${formatPrice(row.price)}</div>
    <div><strong>课程状态:</strong> ${formatStatus(row.status)}</div>
    <div><strong>激活状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    ${scheduleHTML}
    <div><strong>本期特色:</strong> ${row.features || '-'}</div>
    <div><strong>详细描述:</strong> ${row.description || '-'}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
  `, '课程详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

// 添加排课规则
const addScheduleRule = () => {
  if (!dialog.form.scheduleRules) {
    dialog.form.scheduleRules = []
  }
  dialog.form.scheduleRules.push({
    dayOfWeek: 1,
    startTime: '18:30',
    endTime: '20:00'
  })
}

// 删除排课规则
const removeScheduleRule = (index) => {
  if (dialog.form.scheduleRules && dialog.form.scheduleRules.length > index) {
    dialog.form.scheduleRules.splice(index, 1)
  }
}

// 保存课程
const saveCourse = async () => {
  if (!courseFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  try {
    await courseFormRef.value.validate()
    dialog.loading = true

    // 构建请求数据
    const courseData = {
      name: dialog.form.name,
      Subject: dialog.form.Subject,
      mainTeacher: dialog.form.mainTeacher,
      defaultRoom: dialog.form.defaultRoom,
      totalSessions: dialog.form.totalSessions,
      frequency: dialog.form.frequency,
      maxStudents: dialog.form.maxStudents,
      price: dialog.form.price,
      status: dialog.form.status,
      isActive: dialog.form.isActive
    }

    // 可选字段
    if (dialog.form.assistantTeacher) {
      courseData.assistantTeacher = dialog.form.assistantTeacher
    }

    if (dialog.form.startDate) {
      courseData.startDate = dialog.form.startDate
    }

    if (dialog.form.endDate) {
      courseData.endDate = dialog.form.endDate
    }

    if (dialog.form.publishDate) {
      courseData.publishDate = dialog.form.publishDate
    }

    if (dialog.form.scheduleRules && dialog.form.scheduleRules.length > 0) {
      courseData.scheduleRules = dialog.form.scheduleRules
    }

    if (dialog.form.features && dialog.form.features.trim()) {
      courseData.features = dialog.form.features
    }

    if (dialog.form.description && dialog.form.description.trim()) {
      courseData.description = dialog.form.description
    }

    if (dialog.form.posterUrl && dialog.form.posterUrl.trim()) {
      courseData.posterUrl = dialog.form.posterUrl
    }

    if (dialog.form.videoUrl && dialog.form.videoUrl.trim()) {
      courseData.videoUrl = dialog.form.videoUrl
    }

    if (dialog.form.highlightVideoUrl && dialog.form.highlightVideoUrl.trim()) {
      courseData.highlightVideoUrl = dialog.form.highlightVideoUrl
    }

    if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
      courseData.sort = dialog.form.sort
    }

    let response
    if (dialog.mode === 'create') {
      response = await courseService.createCourse(courseData)
    } else {
      response = await courseService.updateCourse(dialog.form._id, courseData)
    }

    if (response.data.success) {
      ElMessage.success(dialog.mode === 'create' ? '创建课程成功' : '更新课程成功')
      dialog.visible = false
      fetchCourses()
    } else {
      ElMessage.error(response.data.message || (dialog.mode === 'create' ? '创建课程失败' : '更新课程失败'))
    }
  } catch (error) {
    console.error('保存课程失败:', error)
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || error.message || '保存课程失败')
    }
  } finally {
    dialog.loading = false
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (courseFormRef.value) {
    courseFormRef.value.clearValidate()
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
      courseService.updateCourse(item._id, { isActive: status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchCourses()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量更新课程状态
const batchUpdateStatus = async (status) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行操作')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 项课程状态修改为"${formatStatus(status)}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value.map(item =>
      courseService.updateCourse(item._id, { status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    if (succeeded < selectedRows.value.length) {
      ElMessage.warning(`批量操作部分完成，成功${succeeded}项，共${selectedRows.value.length}项。部分课程可能因状态约束无法修改。`)
    } else {
      ElMessage.success(`批量操作完成，成功${succeeded}项`)
    }
    fetchCourses()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 批量删除（软删除）
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一项进行删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要禁用选中的 ${selectedRows.value.length} 项吗？此操作将取消这些课程的激活状态。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const promises = selectedRows.value.map(item =>
      courseService.deleteCourse(item._id)
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchCourses()
    selectedRows.value = []
  } catch {
    // 用户取消操作
  }
}

// 打印表格功能
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '班级名称' },
    { prop: 'Subject.name', label: '所属科目' },
    { prop: 'mainTeacher', label: '主讲老师', formatter: (row) => getTeacherName(row.mainTeacher) },
    { prop: 'defaultRoom', label: '默认教室', formatter: (row) => getRoomName(row.defaultRoom) },
    { prop: 'totalSessions', label: '总课次' },
    { prop: 'maxStudents', label: '最大学生数' },
    { prop: 'price', label: '价格', formatter: (row) => formatPrice(row.price) },
    { prop: 'frequency', label: '排课频率', formatter: (row) => formatFrequency(row.frequency) },
    { prop: 'status', label: '课程状态', formatter: (row) => formatStatus(row.status) },
    { prop: 'isActive', label: '激活状态', formatter: (row) => formatActiveStatus(row.isActive) },
    { prop: 'startDate', label: '开班日期', formatter: (row) => row.startDate ? formatDate(row.startDate) : '-' },
    { prop: 'createdAt', label: '创建时间', formatter: (row) => formatDate(row.createdAt) }
  ]

  printTableUtil(data, columns, '课程管理数据报表')
}

onMounted(async () => {
  await Promise.all([fetchSubjects(), fetchUsers(), fetchRooms()])
  fetchCourses()
})
</script>

<style scoped>
.courses-page {
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

.schedule-rules-list {
  width: 100%;
}

.schedule-rule-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
