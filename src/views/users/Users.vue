<template>
  <div class="users-page">
    <h2 class="page-title">用户管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="组织">
          <el-select v-model="filters.org" placeholder="请选择组织" clearable style="width: 150px;">
            <el-option
              v-for="org in orgOptions"
              :key="org._id"
              :label="org.name"
              :value="org._id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="请选择角色" clearable style="width: 150px;">
            <el-option label="管理者" value="manager"></el-option>
            <el-option label="老师" value="teacher"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 150px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
      >
        <el-table-column prop="Account.name" label="真实姓名" width="120"></el-table-column>
        <el-table-column prop="Account.phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="Account.email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="Account.identityNo" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120"></el-table-column>
        <el-table-column prop="roleTemp" label="角色" width="120"></el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
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
      :title="dialog.mode === 'create' ? '创建用户' : '编辑用户'"
      v-model="dialog.visible"
      width="600px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="userFormRef"
        label-width="120px"
      >
        <el-tabs v-model="dialog.activeTab" v-if="dialog.mode === 'create'">
          <el-tab-pane label="用户信息" name="user">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="dialog.form.nickname" placeholder="请输入昵称"></el-input>
            </el-form-item>

            <el-form-item label="角色" prop="roleTemp">
              <el-select v-model="dialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
                <el-option label="管理者" value="manager"></el-option>
                <el-option label="老师" value="teacher"></el-option>
              </el-select>
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

            <el-form-item label="所属组织" prop="orgId">
              <el-select v-model="dialog.form.orgId" :disabled="dialog.mode === 'edit'" placeholder="请选择组织" style="width: 100%">
                <el-option
                  v-for="org in orgOptions"
                  :key="org._id"
                  :label="org.name"
                  :value="org._id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="账户信息" name="account">
            <el-form-item label="选择现有账户">
              <el-select v-model="dialog.form.selectedAccount" placeholder="请选择现有账户" style="width: 100%" clearable filterable @change="onAccountSelect">
                <el-option
                  v-for="account in availableAccounts.filter(acc => acc.accountType === 'User')"
                  :key="account._id"
                  :label="`${account.code} (${account.name})`"
                  :value="account._id">
                </el-option>
              </el-select>
            </el-form-item>

            <div v-if="!dialog.form.selectedAccount">
              <el-form-item label="账户名称" prop="accountCode">
                <el-input
                  v-model="dialog.form.accountCode"
                  placeholder="请输入账户名称"
                ></el-input>
              </el-form-item>

              <el-form-item label="真实姓名" prop="accountName">
                <el-input v-model="dialog.form.accountName" placeholder="请输入真实姓名"></el-input>
              </el-form-item>

              <el-form-item label="手机号" prop="accountPhone">
                <el-input v-model="dialog.form.accountPhone" placeholder="请输入手机号"></el-input>
              </el-form-item>

              <el-form-item label="邮箱" prop="accountEmail">
                <el-input v-model="dialog.form.accountEmail" placeholder="请输入邮箱"></el-input>
              </el-form-item>

              <el-form-item label="性别" prop="accountGender">
                <el-radio-group v-model="dialog.form.accountGender">
                  <el-radio label="male">男</el-radio>
                  <el-radio label="female">女</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="身份证号" prop="accountIdentityNo">
                <el-input v-model="dialog.form.accountIdentityNo" placeholder="请输入身份证号"></el-input>
              </el-form-item>

              <el-form-item label="地址" prop="accountAddress">
                <el-input v-model="dialog.form.accountAddress" placeholder="请输入地址"></el-input>
              </el-form-item>

              <el-form-item label="密码" prop="accountPassword">
                <el-input
                  v-model="dialog.form.accountPassword"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                ></el-input>
              </el-form-item>
            </div>
            <div v-else>
              <p>已选择现有账户：{{ getSelectedAccountInfo() }}</p>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 编辑模式下只有用户信息，没有账户信息标签 -->
        <div v-else>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="dialog.form.nickname" placeholder="请输入昵称"></el-input>
          </el-form-item>

          <el-form-item label="角色" prop="roleTemp">
            <el-select v-model="dialog.form.roleTemp" placeholder="请选择角色" style="width: 100%">
              <el-option label="管理者" value="manager"></el-option>
              <el-option label="老师" value="teacher"></el-option>
            </el-select>
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
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userService } from '../../api/user'
import { orgService } from '../../api/org'  // 导入组织服务
import { accountService } from '../../api/account'  // 导入账户服务
import { formatDate, formatActiveStatus } from '../../utils/format'

// 状态变量
const users = ref([])
const loading = ref(false)
const userFormRef = ref()
const orgOptions = ref([])  // 组织选项
const availableAccounts = ref([]) // 可用账户选项

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  org: '',
  role: '',
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  activeTab: 'user',
  loading: false,
  form: {
    // 用户信息
    nickname: '',
    roleTemp: 'teacher', // 改为小写
    sort: 0,
    isActive: true,
    orgId: '',

    // 选择现有账户
    selectedAccount: '',

    // 账户信息
    accountCode: '',
    accountName: '',
    accountPhone: '',
    accountEmail: '',
    accountGender: 'male', // 改为小写
    accountIdentityNo: '',
    accountAddress: '',
    accountPassword: ''
  },
  rules: {
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 26, message: '昵称长度应在2-26个字符之间', trigger: 'blur' }
    ],
    roleTemp: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    accountCode: [
      { required: true, message: '请输入账户名称', trigger: 'blur' },
      { min: 4, max: 16, message: '账户名称长度应在4-16个字符之间', trigger: 'blur' }
    ],
    accountName: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '真实姓名长度应在2-50个字符之间', trigger: 'blur' }
    ],
    accountPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ]
  }
})

// 获取组织列表
const fetchOrgs = async () => {
  try {
    const response = await orgService.getOrgs({
      filter: {},
      options: {
        limit: 1000  // 获取所有组织
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

// 获取账户列表
const fetchAccounts = async () => {
  try {
    const response = await accountService.getAccounts({
      filter: {
        isActive: true,
        accountType: 'User' // 只获取账户类型为User的账户
      },
      options: {
        limit: 1000  // 获取所有激活账户
      }
    })
    if (response.data.success) {
      availableAccounts.value = response.data.data.items
    }
  } catch (error) {
    console.error('获取账户列表失败:', error)
    ElMessage.error('获取账户列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 当选择账户时
const onAccountSelect = (accountId) => {
  if (accountId) {
    // 如果选择了账户，则清空新建账户的信息
    const selectedAccount = availableAccounts.value.find(acc => acc._id === accountId)
    if (selectedAccount) {
      dialog.form.accountCode = selectedAccount.code
      dialog.form.accountName = selectedAccount.name
      dialog.form.accountPhone = selectedAccount.phone || ''
      dialog.form.accountEmail = selectedAccount.email || ''
      dialog.form.accountGender = selectedAccount.gender || 'male'
      dialog.form.accountIdentityNo = selectedAccount.identityNo || ''
      dialog.form.accountAddress = selectedAccount.address || ''
    }
  } else {
    // 如果取消了选择，保持现有表单内容或清空
    // 不做任何操作，保留当前值
  }
}

// 获取选择账户信息的显示文字
const getSelectedAccountInfo = () => {
  if (dialog.form.selectedAccount) {
    const account = availableAccounts.value.find(acc => acc._id === dialog.form.selectedAccount)
    if (account) {
      return `${account.code} (${account.name})`
    }
  }
  return ''
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize;
    const options = {
      limit: pagination.pageSize,
      sortObj: { sort: -1, createdAt: -1 } // 先按sort排序，再按创建时间排序
    };

    // 只有当skipValue大于0时才添加skip参数，避免后端验证错误
    if (skipValue > 0) {
      options.skip = skipValue;
    }

    // 构建查询条件
    const filter = {};

    // 组织筛选
    if (filters.org) {
      filter.Org = filters.org;
    }

    // 角色筛选
    if (filters.role) {
      filter.roleTemp = filters.role;
    }

    // 状态筛选
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    const params = {
      filter: filter,
      options: {
        ...options,
        populate: [
          { path: 'Account', select: 'name phone email gender identityNo address isActive createdAt lastLoginAt' },
          { path: 'Org', select: 'name' } // 添加 Org 信息
        ]
      }
    }

    console.log('Sending request with params:', params);
    console.log('Filters state:', filters);

    const response = await userService.getUsers(params)
    console.log('Received response:', response);
    if (response.data.success) {
      const { items, total } = response.data.data
      console.log('Filtered items count:', items.length, 'Total:', total);
      users.value = items
      pagination.total = total
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.org = ''
  filters.role = ''
  filters.isActive = ''
  pagination.currentPage = 1
  fetchUsers()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchUsers()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchUsers()
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  dialog.activeTab = 'user'
  // 重置表单
  Object.assign(dialog.form, {
    // 用户信息
    nickname: '',
    roleTemp: 'teacher', // 改为小写
    sort: 0,
    isActive: true,
    orgId: '',

    // 选择现有账户
    selectedAccount: '',

    // 账户信息
    accountCode: '',
    accountName: '',
    accountPhone: '',
    accountEmail: '',
    accountGender: 'male', // 改为小写
    accountIdentityNo: '',
    accountAddress: '',
    accountPassword: ''
  })
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  dialog.activeTab = 'user'

  // 填充表单数据
  Object.assign(dialog.form, {
    // 用户信息
    _id: row._id,
    nickname: row.nickname || '',
    roleTemp: row.roleTemp || 'teacher', // 确保使用小写
    sort: row.sort || 0,
    isActive: row.isActive,
    orgId: row.Org?._id || '',

    // 选择现有账户 - 编辑时不显示此选项
    selectedAccount: '',

    // 账户信息（从关联的Account获取，编辑时只读）
    accountCode: row.Account?.code || '',
    accountName: row.Account?.name || '',
    accountPhone: row.Account?.phone || '',
    accountEmail: row.Account?.email || '',
    accountGender: row.Account?.gender || 'male', // 确保使用小写
    accountIdentityNo: row.Account?.identityNo || '',
    accountAddress: row.Account?.address || ''
  })
}

// 查看详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>真实姓名:</strong> ${row.Account?.name || '-'}</div>
    <div><strong>昵称:</strong> ${row.nickname || '-'}</div>
    <div><strong>手机号:</strong> ${row.Account?.phone || '-'}</div>
    <div><strong>邮箱:</strong> ${row.Account?.email || '-'}</div>
    <div><strong>身份证号:</strong> ${row.Account?.identityNo || '-'}</div>
    <div><strong>角色:</strong> ${row.roleTemp || '-'}</div>
    <div><strong>所属组织:</strong> ${row.Org?.name || '-'}</div>
    <div><strong>头像:</strong> ${row.avatar || '-'}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
    <div><strong>最后更新时间:</strong> ${formatDate(row.updatedAt)}</div>
  `, '用户详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 保存用户
const saveUser = async () => {
  if (!userFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  // 在编辑模式下，手动验证关键字段，而不依赖表单验证
  if (dialog.mode === 'edit') {
    if (!dialog.form.nickname || dialog.form.nickname.trim() === '') {
      ElMessage.error('请输入昵称')
      return
    }

    if (!dialog.form.roleTemp) {
      ElMessage.error('请选择角色')
      return
    }

    // 检查昵称长度
    if (dialog.form.nickname.length < 2 || dialog.form.nickname.length > 26) {
      ElMessage.error('昵称长度应在2-26个字符之间')
      return
    }

    // 如果手动验证通过，继续执行保存
    dialog.loading = true
    try {
      const userData = {
        nickname: dialog.form.nickname,
        roleTemp: dialog.form.roleTemp.toLowerCase(), // 确保角色是小写
        sort: dialog.form.sort,
        isActive: dialog.form.isActive
      }

      const response = await userService.updateUser(dialog.form._id, userData)

      if (response.data.success) {
        ElMessage.success('更新用户成功')
        dialog.visible = false
        fetchUsers()
      } else {
        ElMessage.error(response.data.message || '更新用户失败')
      }
    } catch (error) {
      console.error('保存用户失败:', error)
      ElMessage.error(error.response?.data?.message || error.message || '保存用户失败')
    } finally {
      dialog.loading = false
    }
  } else {
    // 创建模式下
    dialog.loading = true
    try {
      // 如果选择了现有账户
      if (dialog.form.selectedAccount) {
        // 直接使用选定的账户ID
        const userData = {
          user: {
            nickname: dialog.form.nickname,
            roleTemp: dialog.form.roleTemp.toLowerCase(), // 确保角色是小写
            sort: dialog.form.sort,
            isActive: dialog.form.isActive,
            Org: dialog.form.orgId,
            Account: dialog.form.selectedAccount // 直接关联现有账户
          }
        }

        const response = await userService.createUser(userData)

        if (response.data.success) {
          ElMessage.success('创建用户成功')
          dialog.visible = false
          fetchUsers()
        } else {
          ElMessage.error(response.data.message || '创建用户失败')
        }
      } else {
        // 验证账户信息字段（当未选择现有账户时）
        if (!dialog.form.accountCode || dialog.form.accountCode.trim() === '') {
          ElMessage.error('请输入账户名称')
          return
        }
        if (!dialog.form.accountName || dialog.form.accountName.trim() === '') {
          ElMessage.error('请输入真实姓名')
          return
        }
        if (!dialog.form.accountPassword || dialog.form.accountPassword.length < 8) {
          ElMessage.error('密码长度至少8位')
          return
        }

        // 检查账户名称和真实姓名长度
        if (dialog.form.accountCode.length < 4 || dialog.form.accountCode.length > 16) {
          ElMessage.error('账户名称长度应在4-16个字符之间')
          return
        }
        if (dialog.form.accountName.length < 2 || dialog.form.accountName.length > 50) {
          ElMessage.error('真实姓名长度应在2-50个字符之间')
          return
        }

        // 创建新账户并关联用户
        const userData = {
          user: {
            nickname: dialog.form.nickname,
            roleTemp: dialog.form.roleTemp.toLowerCase(), // 确保角色是小写
            sort: dialog.form.sort,
            isActive: dialog.form.isActive,
            Org: dialog.form.orgId
          },
          account: {
            code: dialog.form.accountCode,
            name: dialog.form.accountName,
            accountType: 'User' // 确保账户类型设置为User
          }
        }

        // 动态添加账户信息字段（仅在有值时添加）
        if (dialog.form.accountPhone && dialog.form.accountPhone.trim() !== '') {
          // 验证手机号长度 (10-15)
          if (dialog.form.accountPhone.length < 10 || dialog.form.accountPhone.length > 15) {
            ElMessage.error('手机号长度应在10-15个字符之间')
            dialog.loading = false
            return
          }
          userData.account.phone = dialog.form.accountPhone
        }

        if (dialog.form.accountEmail && dialog.form.accountEmail.trim() !== '') {
          userData.account.email = dialog.form.accountEmail
        }

        if (dialog.form.accountGender && dialog.form.accountGender.trim() !== '') {
          userData.account.gender = dialog.form.accountGender.toLowerCase() // 转换为小写以符合后端要求
        }

        if (dialog.form.accountIdentityNo && dialog.form.accountIdentityNo.trim() !== '') {
          // 验证身份证号长度 (15-18)
          if (dialog.form.accountIdentityNo.length < 15 || dialog.form.accountIdentityNo.length > 18) {
            ElMessage.error('身份证号长度应在15-18个字符之间')
            dialog.loading = false
            return
          }
          userData.account.identityNo = dialog.form.accountIdentityNo
        }

        if (dialog.form.accountAddress && dialog.form.accountAddress.trim() !== '') {
          // 验证地址长度 (5-200)
          if (dialog.form.accountAddress.length < 5 || dialog.form.accountAddress.length > 200) {
            ElMessage.error('地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          userData.account.address = dialog.form.accountAddress
        }

        // 验证密码长度
        if (dialog.form.accountPassword && dialog.form.accountPassword.length >= 8 && dialog.form.accountPassword.length <= 16) {
          userData.account.password = dialog.form.accountPassword
        } else if (dialog.form.accountPassword) {
          ElMessage.error('密码长度应在8-16个字符之间')
          dialog.loading = false
          return
        }

        const response = await userService.createUser(userData)

        if (response.data.success) {
          ElMessage.success('创建用户成功')
          dialog.visible = false
          fetchUsers()
        } else {
          ElMessage.error(response.data.message || '创建用户失败')
        }
      }
    } catch (error) {
      console.error('保存用户失败:', error)
      ElMessage.error(error.response?.data?.message || error.message || '保存用户失败')
    } finally {
      dialog.loading = false
    }
  }
}

// 删除用户
const deleteUser = async (id) => {
  try {
    const response = await userService.updateUser(id, { isActive: false })
    if (response.data.success) {
      ElMessage.success('删除用户成功')
      fetchUsers()
    } else {
      ElMessage.error(response.data.message || '删除用户失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '删除用户失败')
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
}

// 初始化组织选项
onMounted(async () => {
  await fetchOrgs()  // 先获取组织列表
  await fetchAccounts() // 获取账户列表
  fetchUsers()       // 再获取用户列表
})
</script>

<style scoped>
.users-page {
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

.el-tabs {
  min-height: 300px;
}
</style>