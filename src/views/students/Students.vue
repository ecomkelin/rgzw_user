<template>
  <div class="students-page">
    <h2 class="page-title">学生管理</h2>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="真实姓名">
          <el-input v-model="filters.name" placeholder="请输入学生真实姓名" clearable style="width: 150px;"></el-input>
        </el-form-item>

        <el-form-item label="学校">
          <el-input v-model="filters.school" placeholder="请输入学校" clearable style="width: 150px;"></el-input>
        </el-form-item>

        <el-form-item label="身份证号">
          <el-input v-model="filters.identityNo" placeholder="请输入身份证号" clearable style="width: 180px;"></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.isActive" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="激活" :value="true"></el-option>
            <el-option label="未激活" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchStudents">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增学生</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 高级搜索组件 -->
    <AdvancedSearch @search="handleAdvancedSearch" @reset="handleAdvancedReset" />

    <el-card class="table-card">
      <el-table
        :data="students"
        v-loading="loading"
        style="width: 100%"
        row-key="_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="真实姓名" width="120"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ formatGender(row.gender) }}
          </template>
        </el-table-column>
        <el-table-column prop="birthday" label="出生日期/年龄" width="150">
          <template #default="{ row }">
            {{ row.birthday ? formatDate(row.birthday) + ' (' + calculateAge(row.birthday) + '岁)' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="identityNo" label="身份证号" width="180"></el-table-column>
        <el-table-column prop="isActive" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ formatActiveStatus(row.isActive) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Account.name" label="账号名称" width="120"></el-table-column>
        <el-table-column prop="Account.phone" label="账号联系方式" width="150"></el-table-column>
        <el-table-column prop="school" label="学校" width="150"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
        <el-table-column prop="address" label="证件地址" width="200"></el-table-column>
        <el-table-column prop="currentAddress" label="现居住地址" width="200"></el-table-column>
        <el-table-column prop="sourceType" label="来源类型" width="120"></el-table-column>
        <el-table-column prop="Org.name" label="所属组织" width="150"></el-table-column>
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

      <!-- 批量操作工具栏 -->
      <div class="batch-operation" v-if="selectedRows.length > 0">
        <el-divider />
        <div class="batch-toolbar">
          <span class="selection-info">已选择 {{ selectedCount }} 项</span>
          <div class="batch-buttons">
            <el-button @click="batchUpdateStatus(true)" type="success" size="small">
              批量激活
            </el-button>
            <el-button @click="batchUpdateStatus(false)" type="warning" size="small">
              批量禁用
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
            <el-button @click="printTable(students)" type="primary" size="small">
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
      :title="dialog.mode === 'create' ? '创建学生' : '编辑学生'"
      v-model="dialog.visible"
      width="700px"
      :before-close="closeDialog"
    >
      <el-form
        :model="dialog.form"
        :rules="dialog.rules"
        ref="studentFormRef"
        label-width="120px"
      >
        <el-tabs v-model="dialog.activeTab" v-if="dialog.mode === 'create'">
          <el-tab-pane label="学生信息" name="student">
            <el-form-item label="真实姓名" prop="name">
              <el-input v-model="dialog.form.name" placeholder="请输入学生真实姓名"></el-input>
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="dialog.form.gender">
                <el-radio label="Male">男</el-radio>
                <el-radio label="Female">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="出生日期" prop="birthday">
              <el-date-picker
                v-model="dialog.form.birthday"
                type="date"
                placeholder="请选择出生日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>

            <el-form-item label="身份证号" prop="identityNo">
              <el-input v-model="dialog.form.identityNo" placeholder="请输入身份证号"></el-input>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input v-model="dialog.form.phone" placeholder="请输入手机号"></el-input>
            </el-form-item>

            <el-form-item label="学校" prop="school">
              <el-input v-model="dialog.form.school" placeholder="请输入学校"></el-input>
            </el-form-item>

            <el-form-item label="证件地址" prop="address">
              <el-input
                v-model="dialog.form.address"
                type="textarea"
                :rows="2"
                placeholder="请输入证件地址"
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

            <el-form-item label="来源类型" prop="sourceType">
              <el-select v-model="dialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
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

            <el-form-item label="备注" prop="description">
              <el-input
                v-model="dialog.form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
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
          </el-tab-pane>

          <el-tab-pane label="账户信息" name="account">
            <el-form-item label="选择现有账户">
              <el-select v-model="dialog.form.selectedAccount" placeholder="请选择现有账户" style="width: 100%" clearable filterable @change="onAccountSelect">
                <el-option
                  v-for="account in availableAccounts.filter(acc => acc.accountType === 'Student')"
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

              <el-form-item label="状态" prop="accountIsActive">
                <el-switch
                  v-model="dialog.form.accountIsActive"
                  active-text="激活"
                  inactive-text="未激活"
                ></el-switch>
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

        <!-- 编辑模式下只有学生信息，没有账户信息标签 -->
        <div v-else>
          <el-form-item label="真实姓名" prop="name">
            <el-input v-model="dialog.form.name" placeholder="请输入学生真实姓名"></el-input>
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="dialog.form.gender">
              <el-radio label="Male">男</el-radio>
              <el-radio label="Female">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="出生日期" prop="birthday">
            <el-date-picker
              v-model="dialog.form.birthday"
              type="date"
              placeholder="请选择出生日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="身份证号" prop="identityNo">
            <el-input v-model="dialog.form.identityNo" placeholder="请输入身份证号"></el-input>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="dialog.form.phone" placeholder="请输入手机号"></el-input>
          </el-form-item>

          <el-form-item label="学校" prop="school">
            <el-input v-model="dialog.form.school" placeholder="请输入学校"></el-input>
          </el-form-item>

          <el-form-item label="学校" prop="school">
            <el-input v-model="dialog.form.school" placeholder="请输入学校"></el-input>
          </el-form-item>

          <el-form-item label="证件地址" prop="address">
            <el-input
              v-model="dialog.form.address"
              type="textarea"
              :rows="2"
              placeholder="请输入证件地址"
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

          <el-form-item label="来源类型" prop="sourceType">
            <el-select v-model="dialog.form.sourceType" placeholder="请选择来源类型" style="width: 100%">
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

          <el-form-item label="备注" prop="description">
            <el-input
              v-model="dialog.form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
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
        </div>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveStudent" :loading="dialog.loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { studentService } from '../../api/student'
import { accountService } from '../../api/account'
import { formatDate, formatGender, formatActiveStatus } from '../../utils/format'
import { printTable as printTableUtil } from '../../utils/print'
import AdvancedSearch from '../../components/AdvancedSearch.vue'

// 状态变量
const students = ref([])
const loading = ref(false)
const studentFormRef = ref()
const selectedRows = ref([]) // 批量操作选中的行
const availableAccounts = ref([]) // 可用账户选项

// 高级搜索参数
const advancedFilters = ref({
  keyword: '',
  dateRange: [],
  gender: '',
  ageRange: [0, 100],
  status: '',
  sourceType: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const filters = reactive({
  name: '',
  school: '',
  identityNo: '', // 添加身份证号筛选条件
  isActive: ''
})

// 对话框
const dialog = reactive({
  visible: false,
  mode: 'create', // 'create' 或 'edit'
  activeTab: 'student',
  loading: false,
  form: {
    // 学生信息
    name: '',
    school: '',
    sourceType: '其他',
    description: '',
    sort: 0,

    // 个人/证件信息
    phone: '',
    identityNo: '',
    gender: 'Male',
    birthday: '',
    address: '',
    currentAddress: '',

    // 地址信息（从省份到区域）
    Nation: '',
    Provence: '',  // 注意：后端模型使用Provence而非Province
    City: '',
    Area: '',

    // 账户相关的信息
    accountName: '',  // 账户名称
    accountPhone: '', // 账户联系方式

    // 状态信息
    isActive: true,

    // 选择现有账户
    selectedAccount: '',

    // 账户信息
    accountCode: '',
    accountEmail: '',
    accountGender: 'male',
    accountIdentityNo: '',
    accountAddress: '',
    accountIsActive: true,
    accountPassword: ''
  },
  rules: {
    name: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '真实姓名长度应在2-50个字符之间', trigger: 'blur' }
    ],
    accountName: [
      { required: true, message: '请输入关联账号名称', trigger: 'blur' },
      { min: 2, max: 50, message: '账号名称长度应在2-50个字符之间', trigger: 'blur' }
    ],
    phone: [
      { min: 10, max: 15, message: '手机号长度应在10-15个字符之间', trigger: 'blur' }
    ],
    identityNo: [
      { min: 15, max: 18, message: '身份证号长度应在15-18个字符之间', trigger: 'blur' }
    ],
    accountCode: [
      { required: true, message: '请输入账户名称', trigger: 'blur' },
      { min: 4, max: 16, message: '账户名称长度应在4-16个字符之间', trigger: 'blur' }
    ],
    accountEmail: [
      { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ],
    accountPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, max: 16, message: '密码长度应在8-16个字符之间', trigger: 'blur' }
    ]
  }
})

// 获取账户列表
const fetchAccounts = async () => {
  try {
    const response = await accountService.getAccounts({
      filter: {
        isActive: true,
        accountType: 'Student' // 只获取账户类型为Student的账户
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
    // 如果选择了账户，则填充账户信息
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
  }
}

// 获取选中账户信息
const getSelectedAccountInfo = () => {
  const selectedAccount = availableAccounts.value.find(acc => acc._id === dialog.form.selectedAccount)
  return selectedAccount ? `${selectedAccount.code} (${selectedAccount.name})` : ''
}

// 计算年龄的函数
const calculateAge = (birthday) => {
  if (!birthday) return '-'
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    const skipValue = (pagination.currentPage - 1) * pagination.pageSize;
    const options = {
      limit: pagination.pageSize,
      sortObj: { sort: -1, createdAt: -1 }, // 先按sort排序，再按创建时间排序
      populate: [
        { path: 'Org', select: 'name' },
        { path: 'Account', select: 'name phone email' } // 添加Account信息的populate
      ]
    };

    // 只有当skipValue大于0时才添加skip参数，避免后端验证错误
    if (skipValue > 0) {
      options.skip = skipValue;
    }

    // 构建查询条件
    const filter = {};

    // 基础搜索条件
    // 身份证号搜索
    if (filters.identityNo) {
      filter.identityNo = { $regex: filters.identityNo, $options: 'i' };
    }

    // 真实姓名搜索
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: 'i' };
    }

    // 学校搜索
    if (filters.school) {
      filter.school = { $regex: filters.school, $options: 'i' };
    }

    // 状态筛选
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      filter.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    // 高级搜索条件
    // 关键词搜索（在姓名、学校、来源类型中搜索）
    if (advancedFilters.value.keyword) {
      filter.$or = [
        { name: { $regex: advancedFilters.value.keyword, $options: 'i' } },
        { school: { $regex: advancedFilters.value.keyword, $options: 'i' } },
        { sourceType: { $regex: advancedFilters.value.keyword, $options: 'i' } }
      ];
    }

    // 性别筛选
    if (advancedFilters.value.gender) {
      filter.gender = advancedFilters.value.gender;
    }

    // 年龄范围筛选
    if (advancedFilters.value.ageRange &&
        (advancedFilters.value.ageRange[0] > 0 || advancedFilters.value.ageRange[1] < 100)) {
      // 计算出生日期范围（从年龄推算）
      const currentYear = new Date().getFullYear();
      const maxBirthYear = currentYear - advancedFilters.value.ageRange[0]; // 最小年龄对应的最晚出生年份
      const minBirthYear = currentYear - advancedFilters.value.ageRange[1]; // 最大年龄对应最早出生年份

      if (minBirthYear <= maxBirthYear) { // 确保范围有效
        filter.birthday = {
          $gte: `${minBirthYear}-01-01`,
          $lte: `${maxBirthYear}-12-31`
        };
      }
    }

    // 高级状态筛选
    if (advancedFilters.value.status !== '' && advancedFilters.value.status !== null && advancedFilters.value.status !== undefined) {
      filter.isActive = advancedFilters.value.status === 'true' || advancedFilters.value.status === true;
    }

    // 来源类型筛选
    if (advancedFilters.value.sourceType) {
      filter.sourceType = advancedFilters.value.sourceType;
    }

    // 时间范围筛选（创建时间）
    if (advancedFilters.value.dateRange && advancedFilters.value.dateRange.length === 2) {
      filter.createdAt = {
        $gte: new Date(advancedFilters.value.dateRange[0]),
        $lte: new Date(advancedFilters.value.dateRange[1])
      };
    }

    const params = {
      filter: filter,
      options: options
    }

    console.log('Sending request with params:', params);
    console.log('Filters state:', filters);
    console.log('Advanced filters state:', advancedFilters.value);

    const response = await studentService.getStudents(params)
    console.log('Received response:', response);
    if (response.data.success) {
      const { items, total } = response.data.data
      console.log('Filtered items count:', items.length, 'Total:', total);
      students.value = items
      pagination.total = total
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 高级搜索处理函数
const handleAdvancedSearch = (searchData) => {
  Object.assign(advancedFilters.value, searchData);
  pagination.currentPage = 1; // 重置到第一页
  fetchStudents();
};

// 高级搜索重置处理函数
const handleAdvancedReset = () => {
  // 重置高级搜索参数
  advancedFilters.value = {
    keyword: '',
    dateRange: [],
    gender: '',
    ageRange: [0, 100],
    status: '',
    sourceType: ''
  };
  fetchStudents();
};

// 重置筛选条件
const resetFilters = () => {
  filters.name = ''
  filters.school = ''
  filters.identityNo = ''  // 重置身份证号筛选条件
  filters.isActive = ''  // 重置为字符串空值
  pagination.currentPage = 1
  fetchStudents()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  fetchStudents()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  fetchStudents()
}

// 打开创建对话框
const openCreateDialog = () => {
  dialog.mode = 'create'
  dialog.visible = true
  dialog.activeTab = 'student'
  // 重置表单
  Object.assign(dialog.form, {
    // 学生信息
    name: '',
    school: '',
    sourceType: '其他',
    description: '',
    sort: 0,

    // 个人/证件信息
    phone: '',
    identityNo: '',
    gender: 'Male',
    birthday: '',
    address: '',
    currentAddress: '',

    // 地址信息（从省份到区域）
    Nation: '',
    Provence: '',  // 注意：后端模型使用Provence而非Province
    City: '',
    Area: '',

    // 账户相关的信息
    accountName: '',  // 账户名称
    accountPhone: '', // 账户联系方式

    // 状态信息
    isActive: true,

    // 选择现有账户
    selectedAccount: '',

    // 账户信息
    accountCode: '',
    accountEmail: '',
    accountGender: 'male',
    accountIdentityNo: '',
    accountAddress: '',
    accountIsActive: true,
    accountPassword: ''
  })
}

// 打开编辑对话框
const openEditDialog = (row) => {
  dialog.mode = 'edit'
  dialog.visible = true
  dialog.activeTab = 'student'

  // 填充表单数据
  Object.assign(dialog.form, {
    _id: row._id, // 添加学生记录ID

    // 学生信息
    name: row.name || '',
    school: row.school || '',
    sourceType: row.sourceType || '其他',
    description: row.description || '',
    sort: row.sort || 0,

    // 个人/证件信息
    phone: row.phone || '',
    identityNo: row.identityNo || '',
    gender: row.gender || 'Male',
    birthday: row.birthday ? new Date(row.birthday).toISOString().split('T')[0] : '',
    address: row.address || '',
    currentAddress: row.currentAddress || '',

    // 地址信息（从省份到区域）
    Nation: row.Nation || '',
    Provence: row.Provence || '',  // 注意：后端模型使用Provence而非Province
    City: row.City || '',
    Area: row.Area || '',

    // 账户相关的信息
    accountName: row.Account?.name || '',  // 从关联Account获取账号名称
    accountPhone: row.Account?.phone || '', // 从关联Account获取联系方式

    // 状态信息
    isActive: row.isActive,

    // 选择现有账户 - 编辑时不显示此选项
    selectedAccount: '',

    // 账户信息 - 从关联的Account获取，编辑时只读
    accountCode: row.Account?.code || '',
    accountEmail: row.Account?.email || '',
    accountGender: row.Account?.gender || 'male',
    accountIdentityNo: row.Account?.identityNo || '',
    accountAddress: row.Account?.address || '',

    // 保存原始值用于比较
    originalAccountName: row.Account?.name || '',
    originalAccountPhone: row.Account?.phone || '',
    originalAccountEmail: row.Account?.email || '',
    originalAccountGender: row.Account?.gender || 'male',
    originalAccountIdentityNo: row.Account?.identityNo || '',
    originalAccountAddress: row.Account?.address || '',
    originalAccountIsActive: row.Account?.isActive
  })
}

// 查看详情
const viewDetail = (row) => {
  ElMessageBox.alert(`
    <div><strong>真实姓名:</strong> ${row.name || '-'}</div>
    <div><strong>性别:</strong> ${formatGender(row.gender)}</div>
    <div><strong>出生日期:</strong> ${row.birthday ? formatDate(row.birthday) + ' (' + calculateAge(row.birthday) + '岁)' : '-'}</div>
    <div><strong>身份证号:</strong> ${row.identityNo || '-'}</div>
    <div><strong>状态:</strong> ${formatActiveStatus(row.isActive)}</div>
    <div><strong>账号名称:</strong> ${row.Account?.name || '-'}</div>
    <div><strong>账号联系方式:</strong> ${row.Account?.phone || '-'}</div>
    <div><strong>学校:</strong> ${row.school || '-'}</div>
    <div><strong>来源类型:</strong> ${row.sourceType || '-'}</div>
    <div><strong>手机号:</strong> ${row.phone || '-'}</div>
    <div><strong>证件地址:</strong> ${row.address || '-'}</div>
    <div><strong>现居住地址:</strong> ${row.currentAddress || '-'}</div>
    <div><strong>备注:</strong> ${row.description || '-'}</div>
    <div><strong>排序:</strong> ${row.sort || 0}</div>
    <div><strong>所属组织:</strong> ${row.Org?.name || '-'}</div>
    <div><strong>创建时间:</strong> ${formatDate(row.createdAt)}</div>
  `, '学生详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 保存学生
const saveStudent = async () => {
  if (!studentFormRef.value) {
    ElMessage.error('表单引用不存在')
    return
  }

  // 在编辑模式下，手动验证关键字段
  if (dialog.mode === 'edit') {
    if (!dialog.form.name || dialog.form.name.trim() === '') {
      ElMessage.error('请输入真实姓名')
      return
    }

    // 如果手动验证通过，继续执行保存
    dialog.loading = true
    try {
      const studentData = {
        name: dialog.form.name
      }

      // 只有当字段有值时才添加到请求数据中
      if (dialog.form.school && dialog.form.school.trim() !== '') {
        // 验证学校字段长度 (2-100)
        if (dialog.form.school.length < 2 || dialog.form.school.length > 100) {
          ElMessage.error('学校长度应在2-100个字符之间')
          dialog.loading = false
          return
        }
        studentData.school = dialog.form.school
      }

      if (dialog.form.sourceType && dialog.form.sourceType.trim() !== '') {
        studentData.sourceType = dialog.form.sourceType
      }

      if (dialog.form.description && dialog.form.description.trim() !== '') {
        studentData.description = dialog.form.description
      }

      if (dialog.form.phone && dialog.form.phone.trim() !== '') {
        // 验证手机号长度 (10-15)
        if (dialog.form.phone.length < 10 || dialog.form.phone.length > 15) {
          ElMessage.error('手机号长度应在10-15个字符之间')
          dialog.loading = false
          return
        }
        studentData.phone = dialog.form.phone
      }

      if (dialog.form.identityNo && dialog.form.identityNo.trim() !== '') {
        studentData.identityNo = dialog.form.identityNo
      }

      if (dialog.form.gender && dialog.form.gender.trim() !== '') {
        studentData.gender = dialog.form.gender
      }

      if (dialog.form.birthday) {
        // 验证日期格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(dialog.form.birthday)) {
          ElMessage.error('请选择合法的出生日期')
          dialog.loading = false
          return
        }
        studentData.birthday = dialog.form.birthday
      }

      if (dialog.form.address && dialog.form.address.trim() !== '') {
        // 验证证件地址长度 (5-200)
        if (dialog.form.address.length < 5 || dialog.form.address.length > 200) {
          ElMessage.error('证件地址长度应在5-200个字符之间')
          dialog.loading = false
          return
        }
        studentData.address = dialog.form.address
      }

      if (dialog.form.currentAddress && dialog.form.currentAddress.trim() !== '') {
        // 验证现居住地址长度 (5-200)
        if (dialog.form.currentAddress.length < 5 || dialog.form.currentAddress.length > 200) {
          ElMessage.error('现居住地址长度应在5-200个字符之间')
          dialog.loading = false
          return
        }
        studentData.currentAddress = dialog.form.currentAddress
      }

      // 确保在编辑时也更新isActive
      studentData.isActive = dialog.form.isActive

      // 更新学生信息
      const studentResponse = await studentService.updateStudent(dialog.form._id, studentData)

      if (studentResponse.data.success) {
        ElMessage.success('更新学生成功')
        dialog.visible = false
        fetchStudents()
      } else {
        ElMessage.error(studentResponse.data.message || '更新学生失败')
      }
    } catch (error) {
      console.error('保存学生失败:', error)
      ElMessage.error(error.response?.data?.message || '保存学生失败')
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
        const studentData = {
          student: {
            name: dialog.form.name
          }
        }

        // 只有当字段有值时才添加到请求数据中
        if (dialog.form.school && dialog.form.school.trim() !== '') {
          // 验证学校字段长度 (2-100)
          if (dialog.form.school.length < 2 || dialog.form.school.length > 100) {
            ElMessage.error('学校长度应在2-100个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.school = dialog.form.school
        }

        if (dialog.form.sourceType && dialog.form.sourceType.trim() !== '') {
          studentData.student.sourceType = dialog.form.sourceType
        }

        if (dialog.form.description && dialog.form.description.trim() !== '') {
          studentData.student.description = dialog.form.description
        }

        if (dialog.form.phone && dialog.form.phone.trim() !== '') {
          // 验证手机号长度 (10-15)
          if (dialog.form.phone.length < 10 || dialog.form.phone.length > 15) {
            ElMessage.error('手机号长度应在10-15个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.phone = dialog.form.phone
        }

        if (dialog.form.identityNo && dialog.form.identityNo.trim() !== '') {
          studentData.student.identityNo = dialog.form.identityNo
        }

        if (dialog.form.gender && dialog.form.gender.trim() !== '') {
          studentData.student.gender = dialog.form.gender
        }

        if (dialog.form.birthday) {
          // 验证日期格式
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(dialog.form.birthday)) {
            ElMessage.error('请选择合法的出生日期')
            dialog.loading = false
            return
          }
          studentData.student.birthday = dialog.form.birthday
        }

        if (dialog.form.address && dialog.form.address.trim() !== '') {
          // 验证证件地址长度 (5-200)
          if (dialog.form.address.length < 5 || dialog.form.address.length > 200) {
            ElMessage.error('证件地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.address = dialog.form.address
        }

        if (dialog.form.currentAddress && dialog.form.currentAddress.trim() !== '') {
          // 验证现居住地址长度 (5-200)
          if (dialog.form.currentAddress.length < 5 || dialog.form.currentAddress.length > 200) {
            ElMessage.error('现居住地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.currentAddress = dialog.form.currentAddress
        }

        studentData.student.isActive = dialog.form.isActive // 添加状态信息
        studentData.student.Account = dialog.form.selectedAccount // 直接关联现有账户

        const response = await studentService.createStudent(studentData)

        if (response.data.success) {
          ElMessage.success('创建学生成功')
          dialog.visible = false
          fetchStudents()
        } else {
          ElMessage.error(response.data.message || '创建学生失败')
        }
      } else {
        // 验证账户信息字段（当未选择现有账户时）
        if (!dialog.form.accountCode || dialog.form.accountCode.trim() === '') {
          ElMessage.error('请输入账户名称')
          return
        }
        if (!dialog.form.accountName || dialog.form.accountName.trim() === '') {
          ElMessage.error('请输入关联账号名称')
          return
        }
        if (!dialog.form.accountPassword || dialog.form.accountPassword.length < 8) {
          ElMessage.error('密码长度至少8位')
          return
        }

        // 检查账户名称长度
        if (dialog.form.accountCode.length < 4 || dialog.form.accountCode.length > 16) {
          ElMessage.error('账户名称长度应在4-16个字符之间')
          return
        }

        // 检查账号名称长度
        if (dialog.form.accountName.length < 2 || dialog.form.accountName.length > 50) {
          ElMessage.error('账号名称长度应在2-50个字符之间')
          return
        }

        // 创建新账户并关联学生
        const studentData = {
          student: {
            name: dialog.form.name
          }
        }

        // 动态构建账户信息，只包含有值的字段
        const accountData = {
          code: dialog.form.accountCode,
          name: dialog.form.accountName,  // 使用accountName作为账户的真实姓名
          accountType: 'Student',
          password: dialog.form.accountPassword
        }

        if (dialog.form.accountPhone && dialog.form.accountPhone.trim() !== '') {
          // 验证手机号长度 (10-15)
          if (dialog.form.accountPhone.length < 10 || dialog.form.accountPhone.length > 15) {
            ElMessage.error('手机号长度应在10-15个字符之间')
            dialog.loading = false
            return
          }
          accountData.phone = dialog.form.accountPhone
        }

        if (dialog.form.accountEmail && dialog.form.accountEmail.trim() !== '') {
          accountData.email = dialog.form.accountEmail
        }

        if (dialog.form.accountGender && dialog.form.accountGender.trim() !== '') {
          accountData.gender = dialog.form.accountGender.toLowerCase()
        }

        if (dialog.form.accountIdentityNo && dialog.form.accountIdentityNo.trim() !== '') {
          // 验证身份证号长度 (15-18)
          if (dialog.form.accountIdentityNo.length < 15 || dialog.form.accountIdentityNo.length > 18) {
            ElMessage.error('身份证号长度应在15-18个字符之间')
            dialog.loading = false
            return
          }
          accountData.identityNo = dialog.form.accountIdentityNo
        }

        if (dialog.form.accountAddress && dialog.form.accountAddress.trim() !== '') {
          // 验证地址长度 (5-200)
          if (dialog.form.accountAddress.length < 5 || dialog.form.accountAddress.length > 200) {
            ElMessage.error('地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          accountData.address = dialog.form.accountAddress
        }

        accountData.isActive = dialog.form.accountIsActive
        studentData.account = accountData

        // 只有当字段有值时才添加到请求数据中
        if (dialog.form.school && dialog.form.school.trim() !== '') {
          // 验证学校字段长度 (2-100)
          if (dialog.form.school.length < 2 || dialog.form.school.length > 100) {
            ElMessage.error('学校长度应在2-100个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.school = dialog.form.school
        }

        if (dialog.form.sourceType && dialog.form.sourceType.trim() !== '') {
          studentData.student.sourceType = dialog.form.sourceType
        }

        if (dialog.form.description && dialog.form.description.trim() !== '') {
          studentData.student.description = dialog.form.description
        }

        if (dialog.form.phone && dialog.form.phone.trim() !== '') {
          // 验证手机号长度 (10-15)
          if (dialog.form.phone.length < 10 || dialog.form.phone.length > 15) {
            ElMessage.error('手机号长度应在10-15个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.phone = dialog.form.phone
        }

        if (dialog.form.identityNo && dialog.form.identityNo.trim() !== '') {
          studentData.student.identityNo = dialog.form.identityNo
        }

        if (dialog.form.gender && dialog.form.gender.trim() !== '') {
          studentData.student.gender = dialog.form.gender
        }

        if (dialog.form.birthday) {
          // 验证日期格式
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(dialog.form.birthday)) {
            ElMessage.error('请选择合法的出生日期')
            dialog.loading = false
            return
          }
          studentData.student.birthday = dialog.form.birthday
        }

        if (dialog.form.address && dialog.form.address.trim() !== '') {
          // 验证证件地址长度 (5-200)
          if (dialog.form.address.length < 5 || dialog.form.address.length > 200) {
            ElMessage.error('证件地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.address = dialog.form.address
        }

        if (dialog.form.currentAddress && dialog.form.currentAddress.trim() !== '') {
          // 验证现居住地址长度 (5-200)
          if (dialog.form.currentAddress.length < 5 || dialog.form.currentAddress.length > 200) {
            ElMessage.error('现居住地址长度应在5-200个字符之间')
            dialog.loading = false
            return
          }
          studentData.student.currentAddress = dialog.form.currentAddress
        }

        studentData.student.isActive = dialog.form.isActive // 添加状态信息

        const response = await studentService.createStudent(studentData)

        if (response.data.success) {
          ElMessage.success('创建学生成功')
          dialog.visible = false
          fetchStudents()
        } else {
          ElMessage.error(response.data.message || '创建学生失败')
        }
      }
    } catch (error) {
      console.error('保存学生失败:', error)
      ElMessage.error(error.response?.data?.message || '保存学生失败')
    } finally {
      dialog.loading = false
    }
  }
}

// 关闭对话框
const closeDialog = () => {
  dialog.visible = false
  if (studentFormRef.value) {
    studentFormRef.value.clearValidate()
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量更新状态
const batchUpdateStatus = async (status) => {
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

    const ids = selectedRows.value.map(item => item._id)
    const promises = ids.map(id =>
      studentService.updateStudent(id, { isActive: status })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchStudents() // 刷新数据
    selectedRows.value = [] // 清空选择
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
      `确定要禁用选中的 ${selectedRows.value.length} 项吗？此操作将取消这些学生的激活状态。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const ids = selectedRows.value.map(item => item._id)
    const promises = ids.map(id =>
      studentService.updateStudent(id, { isActive: false })
    )

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(result => result.status === 'fulfilled').length

    ElMessage.success(`批量操作完成，成功${succeeded}项，共${selectedRows.value.length}项`)
    fetchStudents() // 刷新数据
    selectedRows.value = [] // 清空选择
  } catch {
    // 用户取消操作
  }
}

// 获取选中行的数量
const selectedCount = computed(() => selectedRows.value.length)

// 打印表格功能
const printTable = (data) => {
  const columns = [
    { prop: 'name', label: '真实姓名' },
    { prop: 'gender', label: '性别', formatter: (row) => formatGender(row.gender) },
    { prop: 'birthday', label: '出生日期/年龄', formatter: (row) =>
      row.birthday ? formatDate(row.birthday) + ' (' + calculateAge(row.birthday) + '岁)' : '-'
    },
    { prop: 'identityNo', label: '身份证号' },
    { prop: 'isActive', label: '状态', formatter: (row) => formatActiveStatus(row.isActive) },
    { prop: 'Account.name', label: '账号名称' },
    { prop: 'Account.phone', label: '账号联系方式' },
    { prop: 'school', label: '学校' },
    { prop: 'phone', label: '手机号' },
    { prop: 'address', label: '证件地址' },
    { prop: 'currentAddress', label: '现居住地址' },
    { prop: 'sourceType', label: '来源类型' },
    { prop: 'Org.name', label: '所属组织' },
    { prop: 'sort', label: '排序', formatter: (row) => row.sort || 0 },
    { prop: 'createdAt', label: '创建时间', formatter: (row) => formatDate(row.createdAt) }
  ]

  printTableUtil(data, columns, '学生管理数据报表')
}

onMounted(async () => {
  await fetchAccounts() // 获取账户列表
  fetchStudents()
})
</script>

<style scoped>
.students-page {
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

.el-tabs {
  min-height: 300px;
}
</style>