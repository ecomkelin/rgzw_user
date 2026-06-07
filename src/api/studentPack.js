/**
 * 学生课包（StudentPack）管理 API
 *
 * 后端模块位于 `rgzw_backend/src/modules/_school/studentPack`，
 * 路由前缀 `/api/studentPack`。详细接口/权限说明参见 `apiDesc.md`。
 *
 * 权限要点（后端 enforce）：
 *   - list:
 *     - Student：仅看自己（filter.Student = payload.currentStudent._id）
 *     - manager (含 isAdmin)：全公司；非超管自动 Org 过滤
 *   - detail:
 *     - Student：仅看自己
 *     - manager (含 isAdmin)：同公司
 *   - add:
 *     - **仅 isAdmin**：手动 free 赠送；学生必须与当前用户同 Org
 *     - 必填 Student / totalLesson；其他字段后端从 Student 自动推导
 *   - edit: **仅 isAdmin**，且 target.Org === currentUser.Org
 *     - 可改: status / activeDate / expireDate / description / remainingLesson
 *     - 禁改: Student / Account / Org / OrderPack / Pack / resource / totalLesson / packName
 *
 * 数据流向：
 *   - 购买 Pack → OrderPack (Paid) → 后端自动落地 StudentPack（resource='OrderPack'）
 *   - 超管手动 add → resource='free'（赠送/活动/补偿）
 *
 * 提示：本 rgzw_user 管理后台只走 manager / isAdmin 路径；
 *       Student 路径服务于 rgzw_wx_student 小程序。
 */
import http from './http'

export const studentPackService = {
  /**
   * 学生课包分页列表
   * @param {object} params 搜索条件
   *   - filter.regExp:    模糊搜索关键字（匹配 packName）
   *   - filter.Student:   学生 ObjectId
   *   - filter.Account:   家长账户 ObjectId
   *   - filter.OrderPack: 关联订单 ObjectId
   *   - filter.Pack:      课包 ObjectId
   *   - filter.Org:       组织 ObjectId
   *   - filter.status:    状态枚举 ('active' | 'frozen' | 'exhausted' | 'refunded')
   *   - filter.resource:  来源枚举 ('OrderPack' | 'free')
   *   - options:          分页/排序/填充
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudentPacks(params) {
    return http.post('/studentPack/list', params)
  },

  /**
   * 学生课包详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudentPackById(id) {
    return http.post(`/studentPack/detail/${id}`)
  },

  /**
   * 手动添加 free 赠送课包（仅超管）
   *
   * 后端会从 Student 自动推导 Account / Org / resource（='free'），
   * 前端**不要**手动传 Account / Org / OrderPack / Pack / resource。
   * 必填: Student / totalLesson；其他可选。
   *
   * @param {object} data
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createStudentPack(data) {
    return http.post('/studentPack/add', data)
  },

  /**
   * 更新学生课包（仅超管）
   *
   * 可更新字段：status / activeDate / expireDate / description / remainingLesson
   * 不可改：Student / Account / Org / OrderPack / Pack / resource / totalLesson / packName
   *
   * @param {string|number} id
   * @param {object} data
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateStudentPack(id, data) {
    return http.post(`/studentPack/edit/${id}`, data)
  }
}
