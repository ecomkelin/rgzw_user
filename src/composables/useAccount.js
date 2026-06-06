import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

/**
 * 账户身份与权限判断 composable
 *
 * 这是后端 `src/utils/payloadChecker.js` 里 `isStudent` / `isUser` / `isManager` / `isAdmin`
 * 四个 helper 的前端镜像。Login 时后端把 `req.payload` 注入到 token，前端通过
 * `authStore.user`（来自 `/api/account/self` 的 Account 文档）拿到同样的字段。
 *
 * 派生关系（必须与后端一致 —— 见 rgzw_backend/doc/PERMISSION_DESIGN.md §2.3）：
 *   isAdmin   ⇒  isManager   ⇒  isUser
 *                                ⇓
 *                            isStudent (互斥)
 *
 * 不变量：Account.isAdmin === true 的，其 currentUser.roleTemp 一定是 'manager'。
 *
 * 用法：
 *   const { isAdmin, isManager, accountType, currentOrgId } = useAccount()
 *   <el-button v-if="isManager" @click="onAdd">新增</el-button>
 *   if (!isAdmin.value) { ... }
 *
 * @returns {{
 *   user: import('vue').ComputedRef<object|null>,
 *   accountType: import('vue').ComputedRef<string>,
 *   currentUser: import('vue').ComputedRef<object|null>,
 *   currentOrgId: import('vue').ComputedRef<string|null>,
 *   isUser: import('vue').ComputedRef<boolean>,
 *   isStudent: import('vue').ComputedRef<boolean>,
 *   isManager: import('vue').ComputedRef<boolean>,
 *   isAdmin: import('vue').ComputedRef<boolean>,
 *   ensureCurrentOrgId: () => string
 * }}
 */
export function useAccount () {
  const auth = useAuthStore()

  // Account 文档本体（来自 /api/account/self）
  const user = computed(() => auth.user)

  // 'User' | 'Student'
  const accountType = computed(() => user.value?.accountType || '')

  // User 账户的关联 User 文档（Login 流程已 populate）
  const currentUser = computed(() => user.value?.currentUser || null)

  // 所属机构 Org._id
  const currentOrgId = computed(() => auth.currentOrgId || null)

  // 四个身份 helper
  const isUser = computed(() => accountType.value === 'User')
  const isStudent = computed(() => accountType.value === 'Student')
  // isManager 要求 currentUser 是对象（populate 成功）且 roleTemp === 'manager'
  const isManager = computed(() =>
    isUser.value &&
    !!currentUser.value &&
    typeof currentUser.value === 'object' &&
    currentUser.value.roleTemp === 'manager'
  )
  const isAdmin = computed(() => isUser.value && user.value?.isAdmin === true)

  /**
   * 取一个"可用"的 currentOrgId —— 不会抛错，不会返回空串。
   *
   * 顺序：
   *   1. authStore.currentOrgId（登录后已写入 localStorage）
   *   2. user.currentUser.Org（populate 后的对象，Login 流程通常有）
   *   3. 都没有则返回 ''（调用方需自行判空）
   *
   * 适用于：Org 选项回填、列表过滤、DAO 强制写 doc.Org 的前端兜底。
   * 若需要网络回拉（currentUser 是裸 ID 字符串时），调用方再额外实现。
   *
   * @returns {string} Org._id；若没有则返回空串
   */
  const ensureCurrentOrgId = () => {
    if (currentOrgId.value) return currentOrgId.value
    const cu = currentUser.value
    if (cu && typeof cu === 'object' && cu.Org) {
      return cu.Org
    }
    return ''
  }

  return {
    // state
    user,
    accountType,
    currentUser,
    currentOrgId,

    // 身份 helper（与后端 payloadChecker.js 4 个 helper 一一对应）
    isUser,
    isStudent,
    isManager,
    isAdmin,

    // utils
    ensureCurrentOrgId
  }
}
