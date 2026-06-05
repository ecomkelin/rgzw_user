import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { unwrapListResponse } from '../utils/listPayload'

/**
 * 通用列表页 composable
 *
 * 把 7 个 CRUD 页面里重复了 7 遍的状态机抽出来：
 *   - items / loading / selectedRows / pagination
 *   - fetchList(loader)             —— 拉数据
 *   - resetPagination()             —— 重置回第 1 页
 *   - handleSizeChange / handleCurrentChange
 *   - handleSelectionChange
 *   - batchUpdate(field, value, label) —— 批量更新某个布尔字段
 *   - batchDeactivate(apiFn, label)  —— 批量软删除
 *
 * 调用方只需要提供：
 *   - `loader(payload)`：一个返回 `Promise<AxiosResponse>` 的函数
 *   - 各动作的具体 service 调用（在 batchUpdate / batchDeactivate 的 caller 里）
 *
 * 这样 Rooms / Subjects / Courses / Orgs / Users / Students / Accounts
 * 7 个页面都能瘦身 30%+，且不重复实现分页 + 多选 + 批量 promise 编排。
 *
 * @param {Object} [opts]
 * @param {number} [opts.defaultPageSize=10]
 */
export function useListPage (opts = {}) {
  const defaultPageSize = opts.defaultPageSize || 10

  const items = ref([])
  const loading = ref(false)
  const selectedRows = ref([])

  const pagination = reactive({
    currentPage: 1,
    pageSize: defaultPageSize,
    total: 0
  })

  /**
   * 拉数据
   * @param {(payload:any)=>Promise<import('axios').AxiosResponse>} loader
   * @param {Object} payload —— buildListPayload() 的结果
   */
  const fetchList = async (loader, payload) => {
    loading.value = true
    try {
      const resp = await loader(payload)
      const { items: rows, total } = unwrapListResponse(resp)
      items.value = rows
      pagination.total = total
    } catch (e) {
      // 401 / 业务失败 / 网络错误已经在 http.js 里统一提示过
      // 这里只负责兜底
      console.error('[useListPage] fetchList failed:', e)
    } finally {
      loading.value = false
    }
  }

  const resetPagination = () => {
    pagination.currentPage = 1
  }

  const handleSizeChange = (size) => {
    pagination.pageSize = size
    pagination.currentPage = 1
  }

  const handleCurrentChange = (page) => {
    pagination.currentPage = page
  }

  const handleSelectionChange = (selection) => {
    selectedRows.value = selection
  }

  /**
   * 批量更新一个布尔字段（典型：isActive、isShow、isMain）
   * @param {Object} cfg
   * @param {string} cfg.field
   * @param {boolean} cfg.value
   * @param {string} cfg.label
   * @param {(ids: string[], payload: Object) => Promise<any[]>} cfg.apply
   *   - ids 是 selectedRows 的 _id 列表
   *   - payload 是 { [field]: value }
   *   - 返回 Promise.allSettled 的 results
   * @param {() => void} cfg.onComplete
   */
  const batchUpdateField = async (cfg) => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请至少选择一项进行操作')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定要${cfg.label}选中的 ${selectedRows.value.length} 项吗？`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    const ids = selectedRows.value.map(r => r._id)
    const results = await cfg.apply(ids, { [cfg.field]: cfg.value })
    const ok = results.filter(r => r && r.status === 'fulfilled').length
    ElMessage.success(`批量操作完成，成功 ${ok} 项，共 ${ids.length} 项`)
    selectedRows.value = []
    cfg.onComplete && cfg.onComplete()
  }

  /**
   * 批量软删除：把 isActive 置 false
   * @param {Object} cfg
   * @param {string} cfg.label         提示语前缀（如 '删除' / '停用' / '禁用'）
   * @param {(ids: string[]) => Promise<any[]>} cfg.apply
   * @param {() => void} cfg.onComplete
   */
  const batchDeactivate = async (cfg) => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请至少选择一项进行操作')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定要${cfg.label}选中的 ${selectedRows.value.length} 项吗？`,
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'error' }
      )
    } catch {
      return
    }
    const ids = selectedRows.value.map(r => r._id)
    const results = await cfg.apply(ids)
    const ok = results.filter(r => r && r.status === 'fulfilled').length
    ElMessage.success(`批量操作完成，成功 ${ok} 项，共 ${ids.length} 项`)
    selectedRows.value = []
    cfg.onComplete && cfg.onComplete()
  }

  return {
    // state
    items,
    loading,
    selectedRows,
    pagination,

    // queries
    fetchList,
    resetPagination,

    // pagination handlers
    handleSizeChange,
    handleCurrentChange,

    // selection
    handleSelectionChange,

    // batch actions
    batchUpdateField,
    batchDeactivate
  }
}
