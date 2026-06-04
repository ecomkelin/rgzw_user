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
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
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

        <el-form-item label="民族" prop="Nation">
          <el-select v-model="dialog.form.Nation" placeholder="请选择民族" style="width: 100%" clearable>
            <el-option label="汉族" value="han"></el-option>
            <el-option label="壮族" value="zhuang"></el-option>
            <el-option label="满族" value="man"></el-option>
            <el-option label="回族" value="hui"></el-option>
            <el-option label="苗族" value="miao"></el-option>
            <el-option label="维吾尔族" value="weiwu"></el-option>
            <el-option label="土家族" value="tujia"></el-option>
            <el-option label="彝族" value="yi"></el-option>
            <el-option label="蒙古族" value="menggu"></el-option>
            <el-option label="藏族" value="zang"></el-option>
            <!-- 更多民族选项可以根据实际需求添加 -->
          </el-select>
        </el-form-item>

        <el-form-item label="省/市" prop="Province">
          <el-input v-model="dialog.form.Province" placeholder="请输入省/市"></el-input>
        </el-form-item>

        <el-form-item label="城市" prop="City">
          <el-input v-model="dialog.form.City" placeholder="请输入城市"></el-input>
        </el-form-item>

        <el-form-item label="区/县" prop="Area">
          <el-input v-model="dialog.form.Area" placeholder="请输入区/县"></el-input>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="dialog.form.nickname" placeholder="请输入昵称"></el-input>
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
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { accountService } from '../../api/account'
import { userService } from '../../api/user'
import { studentService } from '../../api/student'
import { formatDate, formatGender, formatAccountType, formatActiveStatus } from '../../utils/format'

// 状态变量
const accounts = ref([])
const loading = ref(false)
const expandedRows = ref([]) // 用于跟踪展开的行
const accountFormRef = ref()

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
    Nation: '',
    Province: '',
    City: '',
    Area: '',
    nickname: '',
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
      sort: { createdAt: -1 }, // 根据后端API文档使用sort
      // 不populate Org字段，因为Account模型中没有这个字段
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
      options: {
        limit: pagination.pageSize,
        sort: { createdAt: -1 }, // 根据后端API文档使用sort
        populate: [{ path: 'currentUser', select: 'nickname roleTemp isActive Org' }] // populate currentUser信息
      }
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
        filter: { 'account._id': row._id },
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
    Nation: '',
    Province: '',
    City: '',
    Area: '',
    nickname: '',
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
    Nation: row.Nation,
    Province: row.Province,
    City: row.City,
    Area: row.Area,
    nickname: row.nickname,
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
          const response = await accountService.createAccount({
            code: dialog.form.code,
            name: dialog.form.name,
            phone: dialog.form.phone,
            email: dialog.form.email,
            identityNo: dialog.form.identityNo,
            accountType: dialog.form.accountType,
            gender: dialog.form.gender,
            birthday: dialog.form.birthday,
            address: dialog.form.address,
            currentAddress: dialog.form.currentAddress,
            Nation: dialog.form.Nation,
            Province: dialog.form.Province,
            City: dialog.form.City,
            Area: dialog.form.Area,
            nickname: dialog.form.nickname,
            sort: dialog.form.sort,
            isActive: dialog.form.isActive,
            password: dialog.form.password
          })

          if (response.data.success) {
            ElMessage.success('创建账户成功')
            dialog.visible = false
            fetchAccounts()
          } else {
            ElMessage.error(response.data.message || '创建账户失败')
          }
        } else {
          const response = await accountService.updateAccount(dialog.form._id, {
            name: dialog.form.name,
            phone: dialog.form.phone,
            email: dialog.form.email,
            identityNo: dialog.form.identityNo,
            gender: dialog.form.gender,
            birthday: dialog.form.birthday,
            address: dialog.form.address,
            currentAddress: dialog.form.currentAddress,
            Nation: dialog.form.Nation,
            Province: dialog.form.Province,
            City: dialog.form.City,
            Area: dialog.form.Area,
            nickname: dialog.form.nickname,
            sort: dialog.form.sort,
            isActive: dialog.form.isActive
          })

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

onMounted(() => {
  fetchAccounts()
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
  padding: 15px 0;
  background-color: #fafafa;
  border-left: 4px solid #dcdfe6;
}
</style>