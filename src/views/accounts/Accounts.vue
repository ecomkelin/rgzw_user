<template>
  <div class="accounts-page">
    <h2 class="page-title">账户管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="账号类型">
          <el-select v-model="filters.accountType" placeholder="请选择账号类型" clearable style="width: 150px;">
            <el-option label="公司用户" value="User"></el-option>
            <el-option label="学生" value="Student"></el-option>
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
        :data="accounts"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        :expand-row-keys="expandedRows"
        @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="sub-table-container">
              <el-tabs v-model="row.currentSubTable">
                <el-tab-pane label="关联用户" name="users" v-if="row.accountType === 'User' || row.accountType === 'Admin'">
                  <el-table
                    :data="row.relatedUsers || []"
                    style="width: 100%; margin-left: 40px;"
                  >
                    <el-table-column prop="nickname" label="用户昵称" width="120"></el-table-column>
                    <el-table-column prop="roleTemp" label="角色" width="120"></el-table-column>
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
                  <el-table
                    :data="row.relatedStudents || []"
                    style="width: 100%; margin-left: 40px;"
                  >
                    <el-table-column prop="className" label="班级" width="120"></el-table-column>
                    <el-table-column prop="grade" label="年级" width="100"></el-table-column>
                    <el-table-column prop="parentName" label="家长姓名" width="120"></el-table-column>
                    <el-table-column prop="parentPhone" label="家长电话" width="150"></el-table-column>
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
            {{ formatAccountType(row.accountType) }}
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ formatGender(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column prop="birthday" label="生日" width="120">
          <template #default="{ row }">
            {{ row.birthday ? formatDate(row.birthday) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="currentUser.nickname" label="当前用户" width="120"></el-table-column>
        <el-table-column prop="currentUser.roleTemp" label="当前角色" width="120"></el-table-column>
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
              <el-button size="small" type="primary" @click="viewDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

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
          <el-input
            v-model="dialog.form.code"
            :disabled="dialog.mode === 'edit'"
            placeholder="请输入账号"
          ></el-input>
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
            <el-option label="公司用户" value="User"></el-option>
            <el-option label="学生" value="Student"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="dialog.form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="生日" prop="birthday">
          <el-date-picker
            v-model="dialog.form.birthday"
            type="date"
            placeholder="请选择生日"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input
            v-model="dialog.form.address"
            type="textarea"
            :rows="2"
            placeholder="请输入地址"
          ></el-input>
        </el-form-item>

        <el-form-item label="现居住地址" prop="currentAddress">
          <el-input
            v-model="dialog.form.currentAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入现居住地址"
          ></el-input>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="dialog.form.sort" :min="0" placeholder="排序值，越大越靠前"></el-input-number>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="dialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>

        <el-form-item label="密码" v-if="dialog.mode === 'create'" prop="password">
          <el-input
            v-model="dialog.form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveAccount" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户对话框 -->
    <el-dialog
      title="新增用户"
      v-model="createUserDialog.visible"
      width="500px"
      :before-close="closeCreateUserDialog"
    >
      <el-form
        :model="createUserDialog.form"
        label-width="120px"
      >
        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="createUserDialog.form.nickname" placeholder="请输入用户昵称"></el-input>
        </el-form-item>

        <el-form-item label="角色" prop="roleTemp">
          <el-select v-model="createUserDialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
            <el-option label="老师" value="teacher"></el-option>
            <el-option label="管理者" value="manager"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="所属组织" prop="orgId">
          <el-select v-model="createUserDialog.form.orgId" placeholder="请选择组织" style="width: 100%">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="createUserDialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateUserDialog">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="createUserDialog.loading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增学生对话框 -->
    <el-dialog
      title="新增学生"
      v-model="createStudentDialog.visible"
      width="500px"
      :before-close="closeCreateStudentDialog"
    >
      <el-form
        :model="createStudentDialog.form"
        label-width="120px"
      >
        <el-form-item label="学生姓名" prop="name">
          <el-input v-model="createStudentDialog.form.name" placeholder="请输入学生姓名"></el-input>
        </el-form-item>

        <el-form-item label="学校" prop="school">
          <el-input v-model="createStudentDialog.form.school" placeholder="请输入学校"></el-input>
        </el-form-item>

        <el-form-item label="来源类型" prop="sourceType">
          <el-select v-model="createStudentDialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
            <el-option label="地推" value="地推"></el-option>
            <el-option label="传单" value="传单"></el-option>
            <el-option label="活动" value="活动"></el-option>
            <el-option label="介绍" value="介绍"></el-option>
            <el-option label="听说" value="听说"></el-option>
            <el-option label="路过" value="路过"></el-option>
            <el-option label="抖音" value="抖音"></el-option>
            <el-option label="朋友圈" value="朋友圈"></el-option>
            <el-option label="其他" value="其他"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="所属组织" prop="orgId">
          <el-select v-model="createStudentDialog.form.orgId" placeholder="请选择组织" style="width: 100%">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="createStudentDialog.form.isActive"
            active-text="激活"
            inactive-text="未激活"
          ></el-switch>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateStudentDialog">取消</el-button>
        <el-button type="primary" @click="saveStudent" :loading="createStudentDialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { accountService } from '../../api/account'
import { userService } from '../../api/user'
import { studentService } from '../../api/student'
import { orgService } from '../../api/org'
import { formatDate, formatGender, formatAccountType, formatActiveStatus } from '../../utils/format'

// 状态变量
const accounts = ref([])
const loading = ref(false)
const expandedRows = ref([]) // 用于跟踪展开的行
const accountFormRef = ref()
const orgOptions = ref([]) // 组织选项

// 新增关联用户对话框
const createUserDialog = reactive({
  visible: false,
  loading: false,
  account: null, // 当前账户
  form: {
    nickname: '',
    roleTemp: 'teacher',
    orgId: '',
    isActive: true
  }
})

// 新增关联学生对话框
const createStudentDialog = reactive({
  visible: false,
  loading: false,
  account: null, // 当前账户
  form: {
    name: '',
    school: '',
    sourceType: '其他',
    orgId: '',
    isActive: true
  }
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  accountType: '',
  name: '',
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  loading: false,
  form: {
    code: '',
    name: '',
    phone: '',
    email: '',
    identityNo: '',
    accountType: 'User',
    gender: 'male', // 改为小写
    birthday: '',
    address: '',
    currentAddress: '',
    sort: 0,
    isActive: true,
    password: ''
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
    phone: [
      { min: 10, max: 15, message: '手机号长度应在10-15个字符之间', trigger: 'blur' }
    ],
    identityNo: [
      { min: 15, max: 18, message: '身份证号长度应在15-18个字符之间', trigger: 'blur' }
    ],
    address: [
      { min: 5, max: 200, message: '地址长度应在5-200个字符之间', trigger: 'blur' }
    ],
    currentAddress: [
      { min: 5, max: 200, message: '现居住地址长度应在5-200个字符之间', trigger: 'blur' }
    ],
    nickname: [
      { min: 2, max: 50, message: '昵称长度应在2-50个字符之间', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ],
    accountType: [
      { required: true, message: '请选择账号类型', trigger: 'change' }
    ]
  }
})

// 获取账户列表
const fetchAccounts = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize;
    const options = {
      limit: pagination.pageSize,
      sortObj: { createdAt: -1 }, // 根据后端API文档使用sortObj
      populate: [{ path: 'currentUser', select: 'nickname roleTemp isActive Org' }] // populate currentUser信息
    };

    // 只有当skipValue大于0时才添加skip参数，避免后端验证错误
    if (skipValue > 0) {
      options.skip = skipValue;
    }

    const params = {
      filter: {
        ...(filters.accountType && { accountType: filters.accountType }),
        ...(filters.name && { name: { $regex: filters.name, $options: 'i' } }),
        ...(filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined && { isActive: filters.isActive === 'true' || filters.isActive === true })
      },
      options: options
    }

    const response = await accountService.getAccounts(params)
    if (response.data.success) {
      const { items, total } = response.data.data

      // 为每个账户添加临时属性用于子表
      const accountsWithSubTables = items.map(account => ({
        ...account,
        currentSubTable: account.accountType === 'Student' ? 'students' : 'users', // 根据账号类型设置默认显示的标签页
        relatedUsers: [], // 关联的用户
        relatedStudents: [] // 关联的学生
      }))

      accounts.value = accountsWithSubTables
      pagination.total = total
    }
  } catch (error) {
    console.error('获取账户列表失败:', error)
    ElMessage.error('获取账户列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 处理行展开/收起
const handleExpandChange = async (row, expanded) => {
  if (expanded) {
    // 行展开时，获取关联的用户和学生信息
    await loadRelatedData(row)
    // 将行ID添加到展开列表
    if (!expandedRows.value.includes(row._id)) {
      expandedRows.value.push(row._id)
    }
  } else {
    // 行收起时，从展开列表中移除行ID
    const index = expandedRows.value.indexOf(row._id)
    if (index > -1) {
      expandedRows.value.splice(index, 1)
    }
  }
}

// 加载关联数据
const loadRelatedData = async (row) => {
  try {
    // 根据账号类型加载相应的关联数据
    if (row.accountType === 'User' || row.accountType === 'Admin') {
      // 获取关联的用户 - 通过 Account 字段查找 User
      const userResponse = await userService.getUsers({
        filter: { Account: row._id },
        options: {
          populate: [{ path: 'Org', select: 'name' }]
        }
      })

      if (userResponse.data.success) {
        row.relatedUsers = userResponse.data.data.items
      }
    }

    if (row.accountType === 'Student') {
      // 获取关联的学生 - 通过 Account 字段查找 Student
      const studentResponse = await studentService.getStudents({
        filter: { Account: row._id },
        options: {
          populate: [{ path: 'Org', select: 'name' }]
        }
      })

      if (studentResponse.data.success) {
        row.relatedStudents = studentResponse.data.data.items
      }
    }
  } catch (error) {
    console.error('加载关联数据失败:', error)
    ElMessage.error('加载关联数据失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.accountType = ''
  filters.name = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchAccounts()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchAccounts()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchAccounts()
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  // 重置表单
  Object.assign(dialog.form, {
    code: '',
    name: '',
    phone: '',
    email: '',
    identityNo: '',
    accountType: 'User',
    gender: 'male', // 改为小写
    birthday: '',
    address: '',
    currentAddress: '',
    sort: 0,
    isActive: true,
    password: ''
  })
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  // 填充表单数据
  Object.assign(dialog.form, {
    _id: row._id,
    code: row.code,
    name: row.name,
    phone: row.phone,
    email: row.email,
    identityNo: row.identityNo,
    accountType: row.accountType,
    gender: row.gender,
    birthday: row.birthday,
    address: row.address,
    currentAddress: row.currentAddress,
    sort: row.sort || 0,
    isActive: row.isActive,
    password: '' // 编辑时不显示原密码
  })
}

// 查看详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>账号:</strong> ${row.code}</div>
    <div><strong>姓名:</strong> ${row.name}</div>
    <div><strong>手机号:</strong> ${row.phone || '-'}</div>
    <div><strong>邮箱:</strong> ${row.email || '-'}</div>
    <div><strong>身份证号:</strong> ${row.identityNo || '-'}</div>
    <div><strong>账号类型:</strong> ${formatAccountType(row.accountType)}</div>
    <div><strong>性别:</strong> ${formatGender(row.gender)}</div>
    <div><strong>生日:</strong> ${row.birthday ? formatDate(row.birthday) : '-'}</div>
    <div><strong>地址:</strong> ${row.address || '-'}</div>
    <div><strong>现居住地址:</strong> ${row.currentAddress || '-'}</div>
    <div><strong>民族:</strong> ${row.Nation || '-'}</div>
    <div><strong>省/市:</strong> ${row.Province || '-'}</div>
    <div><strong>城市:</strong> ${row.City || '-'}</div>
    <div><strong>区/县:</strong> ${row.Area || '-'}</div>
    <div><strong>昵称:</strong> ${row.nickname || '-'}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
    <div><strong>最后登录时间:</strong> ${row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'}</div>
    <div><strong>最后登录IP:</strong> ${row.lastLoginIP || '-'}</div>
    <div><strong>上次登出时间:</strong> ${row.lastLogoutAt ? formatDate(row.lastLogoutAt) : '-'}</div>
  `, '账户详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 保存账户
const saveAccount = async () => {
  if (!accountFormRef.value) return

  await accountFormRef.value.validate(async (valid) => {
    if (valid) {
      dialog.loading = true
      try {
        if (dialog.mode === 'create') {
          const accountData = {
            code: dialog.form.code,
            name: dialog.form.name,
            accountType: dialog.form.accountType,
            password: dialog.form.password
          };

          // 只有当字段有值时才添加到请求数据中
          if (dialog.form.phone && dialog.form.phone.trim() !== '') {
            // 验证手机号长度 (10-15)
            if (dialog.form.phone.length < 10 || dialog.form.phone.length > 15) {
              ElMessage.error('手机号长度应在10-15个字符之间')
              dialog.loading = false
              return
            }
            accountData.phone = dialog.form.phone
          }

          if (dialog.form.email && dialog.form.email.trim() !== '') {
            accountData.email = dialog.form.email
          }

          if (dialog.form.identityNo && dialog.form.identityNo.trim() !== '') {
            // 验证身份证号长度 (15-18)
            if (dialog.form.identityNo.length < 15 || dialog.form.identityNo.length > 18) {
              ElMessage.error('身份证号长度应在15-18个字符之间')
              dialog.loading = false
              return
            }
            accountData.identityNo = dialog.form.identityNo
          }

          if (dialog.form.gender && dialog.form.gender.trim() !== '') {
            accountData.gender = dialog.form.gender
          }

          if (dialog.form.birthday) {
            accountData.birthday = dialog.form.birthday
          }

          if (dialog.form.address && dialog.form.address.trim() !== '') {
            // 验证地址长度 (5-200)
            if (dialog.form.address.length < 5 || dialog.form.address.length > 200) {
              ElMessage.error('地址长度应在5-200个字符之间')
              dialog.loading = false
              return
            }
            accountData.address = dialog.form.address
          }

          if (dialog.form.currentAddress && dialog.form.currentAddress.trim() !== '') {
            // 验证现居住地址长度 (5-200)
            if (dialog.form.currentAddress.length < 5 || dialog.form.currentAddress.length > 200) {
              ElMessage.error('现居住地址长度应在5-200个字符之间')
              dialog.loading = false
              return
            }
            accountData.currentAddress = dialog.form.currentAddress
          }

          if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
            accountData.sort = dialog.form.sort
          }

          accountData.isActive = dialog.form.isActive

          const response = await accountService.createAccount(accountData)

          if (response.data.success) {
            ElMessage.success('创建账户成功')
            dialog.visible = false
            fetchAccounts()
          } else {
            ElMessage.error(response.data.message || '创建账户失败')
          }
        } else {
          const accountData = {};

          // 只有当字段有值时才添加到请求数据中
          if (dialog.form.name && dialog.form.name.trim() !== '') {
            // 验证姓名长度 (2-50)
            if (dialog.form.name.length < 2 || dialog.form.name.length > 50) {
              ElMessage.error('姓名长度应在2-50个字符之间')
              dialog.loading = false
              return
            }
            accountData.name = dialog.form.name
          }

          if (dialog.form.phone && dialog.form.phone.trim() !== '') {
            // 验证手机号长度 (10-15)
            if (dialog.form.phone.length < 10 || dialog.form.phone.length > 15) {
              ElMessage.error('手机号长度应在10-15个字符之间')
              dialog.loading = false
              return
            }
            accountData.phone = dialog.form.phone
          }

          if (dialog.form.email && dialog.form.email.trim() !== '') {
            accountData.email = dialog.form.email
          }

          if (dialog.form.identityNo && dialog.form.identityNo.trim() !== '') {
            // 验证身份证号长度 (15-18)
            if (dialog.form.identityNo.length < 15 || dialog.form.identityNo.length > 18) {
              ElMessage.error('身份证号长度应在15-18个字符之间')
              dialog.loading = false
              return
            }
            accountData.identityNo = dialog.form.identityNo
          }

          if (dialog.form.gender && dialog.form.gender.trim() !== '') {
            accountData.gender = dialog.form.gender
          }

          if (dialog.form.birthday) {
            accountData.birthday = dialog.form.birthday
          }

          if (dialog.form.address && dialog.form.address.trim() !== '') {
            // 验证地址长度 (5-200)
            if (dialog.form.address.length < 5 || dialog.form.address.length > 200) {
              ElMessage.error('地址长度应在5-200个字符之间')
              dialog.loading = false
              return
            }
            accountData.address = dialog.form.address
          }

          if (dialog.form.currentAddress && dialog.form.currentAddress.trim() !== '') {
            // 验证现居住地址长度 (5-200)
            if (dialog.form.currentAddress.length < 5 || dialog.form.currentAddress.length > 200) {
              ElMessage.error('现居住地址长度应在5-200个字符之间')
              dialog.loading = false
              return
            }
            accountData.currentAddress = dialog.form.currentAddress
          }

          if (dialog.form.sort !== undefined && dialog.form.sort !== null) {
            accountData.sort = dialog.form.sort
          }

          accountData.isActive = dialog.form.isActive

          const response = await accountService.updateAccount(dialog.form._id, accountData)

          if (response.data.success) {
            ElMessage.success('更新账户成功')
            dialog.visible = false
            fetchAccounts()
          } else {
            ElMessage.error(response.data.message || '更新账户失败')
          }
        }
      } catch (error) {
        console.error('保存账户失败:', error)
        ElMessage.error(error.response?.data?.message || error.message || '保存账户失败')
      } finally {
        dialog.loading = false
      }
    }
  })
}

// 删除账户
const deleteAccount = async (id) => {
  try {
    const response = await accountService.updateAccount(id, { isActive: false })
    if (response.data.success) {
      ElMessage.success('删除账户成功')
      fetchAccounts()
    } else {
      ElMessage.error(response.data.message || '删除账户失败')
    }
  } catch (error) {
    console.error('删除账户失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '删除账户失败')
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (accountFormRef.value) {
    accountFormRef.value.clearValidate()
  }
}

// 获取组织列表
const fetchOrgs = async () => {
  try {
    const response = await orgService.getOrgs({
      filter: { isActive: true }, // 只获取激活的组织
      options: {
        limit: 1000  // 获取所有激活组织
      }
    })
    if (response.data.success) {
      orgOptions.value = response.data.data.items
    }
  } catch (error) {
    console.error('获取组织列表失败:', error)
    ElMessage.error('获取组织列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 打开新增用户对话框
const openCreateUserDialog = async (account) => {
  createUserDialog.account = account
  // 获取该账户已有的用户所属组织，以排除它们
  try {
    const userResponse = await userService.getUsers({
      filter: { Account: account._id },
      options: {
        populate: [{ path: 'Org', select: 'name' }]
      }
    })

    if (userResponse.data.success) {
      const existingUserOrgIds = userResponse.data.data.items.map(user => user.Org._id)

      // 过滤掉已经存在的组织
      const availableOrgs = orgOptions.value.filter(org => !existingUserOrgIds.includes(org._id))

      // 如果可用组织为空，显示警告
      if (availableOrgs.length === 0) {
        ElMessage.warning('该账户已在所有组织中有用户，无法新增更多用户')
        return
      }
    }
  } catch (error) {
    console.error('获取已有用户失败:', error)
  }

  createUserDialog.visible = true
  // 重置表单
  Object.assign(createUserDialog.form, {
    nickname: '',
    roleTemp: 'teacher',
    orgId: '',
    isActive: true
  })
}

// 打开新增学生对话框
const openCreateStudentDialog = (account) => {
  createStudentDialog.account = account
  createStudentDialog.visible = true
  // 重置表单
  Object.assign(createStudentDialog.form, {
    name: '',
    school: '',
    sourceType: '其他',
    orgId: '',
    isActive: true
  })
}

// 保存新增用户
const saveUser = async () => {
  if (!createUserDialog.form.nickname || !createUserDialog.form.orgId) {
    ElMessage.error('请填写必填项')
    return
  }

  // 检查昵称长度
  if (createUserDialog.form.nickname.length < 2 || createUserDialog.form.nickname.length > 26) {
    ElMessage.error('昵称长度应在2-26个字符之间')
    return
  }

  createUserDialog.loading = true
  try {
    const userData = {
      user: {
        nickname: createUserDialog.form.nickname,
        roleTemp: createUserDialog.form.roleTemp,
        Org: createUserDialog.form.orgId,
        Account: createUserDialog.account._id, // 设置当前账户ID
        isActive: createUserDialog.form.isActive
      }
    }

    const response = await userService.createUser(userData)

    if (response.data.success) {
      ElMessage.success('创建用户成功')
      createUserDialog.visible = false
      fetchAccounts() // 刷新账户列表
    } else {
      ElMessage.error(response.data.message || '创建用户失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '创建用户失败')
  } finally {
    createUserDialog.loading = false
  }
}

// 保存新增学生
const saveStudent = async () => {
  if (!createStudentDialog.form.name || !createStudentDialog.form.orgId) {
    ElMessage.error('请填写必填项')
    return
  }

  // 检查姓名长度
  if (createStudentDialog.form.name.length < 2 || createStudentDialog.form.name.length > 50) {
    ElMessage.error('姓名长度应在2-50个字符之间')
    return
  }

  createStudentDialog.loading = true
  try {
    const studentData = {
      student: {
        name: createStudentDialog.form.name,
        school: createStudentDialog.form.school,
        sourceType: createStudentDialog.form.sourceType,
        Org: createStudentDialog.form.orgId,
        Account: createStudentDialog.account._id, // 设置当前账户ID
        isActive: createStudentDialog.form.isActive
      }
    }

    const response = await studentService.createStudent(studentData)

    if (response.data.success) {
      ElMessage.success('创建学生成功')
      createStudentDialog.visible = false
      fetchAccounts() // 刷新账户列表
    } else {
      ElMessage.error(response.data.message || '创建学生失败')
    }
  } catch (error) {
    console.error('创建学生失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '创建学生失败')
  } finally {
    createStudentDialog.loading = false
  }
}

// 关闭新增用户对话框
const closeCreateUserDialog = () => {
  createUserDialog.visible = false
}

// 关闭新增学生对话框
const closeCreateStudentDialog = () => {
  createStudentDialog.visible = false
}

onMounted(async () => {
  await fetchOrgs()  // 先获取组织列表
  fetchAccounts()    // 再获取账户列表
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

.sub-table-container {
  padding: 15px 0 15px 40px; /* 左侧缩进40px，上下padding */
  background-color: #fafafa;
  border-left: 4px solid #dcdfe6;
}
</style>