/**
 * 学生选课（StudentCourse）API
 *
 * 后端模块位于 `rgzw_backend/src/modules/_school/studentCourse`，
 * 路由前缀 `/api/studentCourse`。详细接口/权限说明参见后端 `apiDesc.md`。
 *
 * 业务背景:
 *   - 学生确认上课后, 由管理员在管理后台手动 add 选课记录
 *   - StudentPack（学生持有的课包）可在 add 时绑定, 也可在后续 edit 时绑定 / 更换 / 解绑
 *   - 不可物理删除, 退课请把 status 改为 'dropped' 或 'transferred'
 *
 * 权限要点（后端 enforce, 前端仅 UX 兜底）:
 *   - list / detail:
 *     - Student       : 仅自己
 *     - 普通老师     : 仅自己主讲/助教课程的选课
 *     - manager / isAdmin: 本 Org（业务数据 Org 隔离，超管也只能看本公司）
 *   - add / edit: **仅 manager / isAdmin**（业务数据 Org 隔离同上）
 *
 * 提示：本 rgzw_user 管理后台只走 manager / isAdmin / teacher 路径；
 *       Student 路径服务于 rgzw_wx_student 小程序。
 */
import http from './http'

export const studentCourseService = {
  /**
   * 学生选课分页列表
   * @param {object} params
   *   - filter.Student:   学生 ObjectId
   *   - filter.Course:    课程 ObjectId
   *   - filter.Account:   家长账户 ObjectId
   *   - filter.StudentPack: 学生课包 ObjectId
   *   - filter.Org:       组织 ObjectId
   *   - filter.status:    'active' | 'finished' | 'dropped' | 'transferred'
   *   - options:          分页/排序/填充
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudentCourses(params) {
    return http.post('/studentCourse/list', params)
  },

  /**
   * 学生选课详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getStudentCourseById(id) {
    return http.post(`/studentCourse/detail/${id}`, {})
  },

  /**
   * 添加学生选课（仅 manager / isAdmin）
   *
   * 业务背景：学生确认上课后, 管理员在管理后台手动填写。
   * 必填: Student / Course；可选: StudentPack / StudentCourseDate / status / remark。
   *
   * 后端会从 Student 自动推导 Account / Org / nameCourse；
   * 前端**不要**手动传 Account / Org / nameCourse / createdBy / updatedBy。
   *
   * @param {object} data
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createStudentCourse(data) {
    return http.post('/studentCourse/add', data)
  },

  /**
   * 更新学生选课（仅 manager / isAdmin）
   *
   * 路径参数: id (ObjectId)
   * 可更新字段: StudentPack（绑/换/解绑）/ StudentCourseDate / status / remark
   * 不可改: Student / Account / Course / Org / nameCourse / createdBy / updatedBy
   *
   * @param {string|number} id
   * @param {object} data
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateStudentCourse(id, data) {
    return http.post(`/studentCourse/edit/${id}`, data)
  }
}
