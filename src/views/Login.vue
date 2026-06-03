<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h2>RGZW 用户管理系统</h2>
        <p>请登录您的账户</p>
      </div>

      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        label-width="80px"
        size="large"
      >
        <el-form-item label="账号" prop="code">
          <el-input
            v-model="loginForm.code"
            placeholder="请输入账号"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            style="width: 100%"
            size="large"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authService } from '../api/auth'
import { userService } from '../api/user'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive({
  code: '',
  password: ''
})

const loginRules = {
  code: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const loading = ref(false)
const loginFormRef = ref()

/**
 * 登录成功后，通过 account.currentUser 拉取当前 User 详情，
 * 把 User.Org 写入 store + localStorage，供后续课程管理等页面的 Org 过滤使用。
 *
 * 说明：登录接口返回的 account.currentUser 仅为 ObjectId，
 * 真实的 Org 字段在 User 文档上，因此需要再请求一次 user detail。
 */
const loadCurrentUserOrg = async (account) => {
  const currentUserId = account?.currentUser
  if (!currentUserId) {
    // Student 账户没有 currentUser.Org；管理员（isAdmin）通常无 Org 限制
    return null
  }
  try {
    const res = await userService.getUserById(currentUserId)
    const userItem = res?.data?.data?.item
    return userItem?.Org || null
  } catch (e) {
    console.error('Failed to load current user Org after login:', e)
    return null
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await authService.login(loginForm)
        if (response.data.success) {
          const { accessToken, account } = response.data.data

          // 存储token和用户信息
          authStore.setTokens(accessToken, null)
          authStore.setUser(account)

          // 异步加载当前用户所属 Org（不阻塞登录跳转）
          // 拉取失败也允许进入系统，业务页面会再走实时获取兜底
          loadCurrentUserOrg(account).then((orgId) => {
            authStore.setCurrentOrgId(orgId)
          })

          ElMessage.success('登录成功')
          router.push('/layout/dashboard')
        } else {
          ElMessage.error(response.data.message || '登录失败')
        }
      } catch (error) {
        console.error('Login error:', error)
        ElMessage.error(error.response?.data?.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh; /* 移动端动态视口高度，避开地址栏 */
  padding: 16px;
  background: linear-gradient(135deg, #74b9ff, #0984e3);
}

.login-form {
  width: 400px;
  max-width: 100%;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #2d3436;
  margin-bottom: 8px;
}

.login-header p {
  color: #636e72;
  font-size: 14px;
}

@media (max-width: 480px) {
  .login-form {
    padding: 24px 20px;
  }
  .login-header h2 {
    font-size: 20px;
  }
}
</style>