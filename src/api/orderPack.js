/**
 * 课包订单（OrderPack）管理 API
 *
 * 后端模块位于 `rgzw_backend/src/modules/order/orderPack`，
 * 路由前缀 `/api/order/orderPack`。详细接口/权限说明参见 `apiDesc.md`。
 *
 * 权限要点（后端 enforce，与 PERMISSION_DESIGN.md §5.6 对齐）：
 *   - list:
 *     - Student：仅看自己（filter.Account = payload._id）
 *     - manager (含 isAdmin)：全公司；非超管自动 Org 过滤
 *   - detail:
 *     - Student：仅看自己
 *     - manager (含 isAdmin)：同公司
 *   - add:
 *     - Student：以 payload.currentStudent 自动注入 Student/Org/Account
 *     - manager：doc.Org = currentUser.Org
 *     - 超管：同上（不能跨公司 add，updatedBy 引用会跨公司）
 *   - edit: **仅 isAdmin**，且 target.Org === currentUser.Org
 *   - remove: 不开放（订单是审计关键数据）
 *
 * 提示：本 rgzw_user 管理后台只走 manager / isAdmin 路径；
 *       Student 路径服务于 rgzw_wx_student 小程序。
 */
import http from './http'

export const orderPackService = {
  /**
   * 课包订单分页列表
   * @param {object} params 搜索条件
   *   - filter.regExp:   模糊搜索关键字（匹配 packName）
   *   - filter.payStatus: 支付状态 ('Pending' | 'Paid' | 'Cancelled' | 'Refunded')
   *   - filter.payMethod: 支付方式 ('wechat' | 'alipay' | 'cash' | 'card' | 'transfer')
   *   - filter.Student:  学生 ObjectId
   *   - filter.Pack:     课包 ObjectId
   *   - filter.Org:      组织 ObjectId
   *   - options:         分页/排序/填充
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getOrderPacks(params) {
    return http.post('/order/orderPack/list', params)
  },

  /**
   * 课包订单详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getOrderPackById(id) {
    return http.post(`/order/orderPack/detail/${id}`)
  },

  /**
   * 创建课包订单
   *
   * 后端会从 `Student.Account` 自动推导 `Account`、从 `Pack` 拉取 6 个价格/课时快照、
   * 从 `currentUser.Org` 注入 `Org` —— 前端**不要**手动传 `Account` / 快照字段。
   * 必填: Student / Pack / finalPrice;可选: Course(强烈建议) / payStatus / payMethod / ...
   * @param {object} orderData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createOrderPack(orderData) {
    return http.post('/order/orderPack/add', orderData)
  },

  /**
   * 更新课包订单
   *
   * **仅管理员可调用**（后端 403 拦截 manager）。可更新字段：
   *   payStatus / payMethod / transactionId / paidAt / remark
   * 不可改: 关联字段（Student/Pack/Account）+ 快照字段 + Org/createdBy。
   * @param {string|number} id
   * @param {object} orderData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateOrderPack(id, orderData) {
    return http.post(`/order/orderPack/edit/${id}`, orderData)
  }
}
