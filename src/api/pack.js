/**
 * 课包（Pack）管理 API
 *
 * 后端模块位于 `src/modules/_school/pack`，对应路由前缀 `/api/pack`。
 * 文档参见 `rgzw_backend/src/modules/_school/pack/apiDesc.md`。
 */
import http from './http'

export const packService = {
  /**
   * 课包分页列表
   * @param {object} params 搜索条件
   *   - filter.regExp: 模糊搜索关键字
   *   - filter.isActive: 激活状态
   *   - filter.type: 课包类型 ('课时包' | '学期包' | '体验包' | '定制包')
   *   - filter.Org: 组织 ObjectId
   *   - options: 分页/排序/填充
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getPacks(params) {
    return http.post('/pack/list', params)
  },

  /**
   * 课包详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getPackById(id) {
    return http.post(`/pack/detail/${id}`)
  },

  /**
   * 创建课包
   * @param {object} packData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createPack(packData) {
    return http.post('/pack/add', packData)
  },

  /**
   * 更新课包
   * @param {string|number} id
   * @param {object} packData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updatePack(id, packData) {
    return http.post(`/pack/edit/${id}`, packData)
  },

  /**
   * 删除课包
   *
   * 后端会校验是否存在关联 OrderPack 订单，存在则拒绝删除。
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deletePack(id) {
    return http.post(`/pack/remove/${id}`)
  },

  /**
   * 软删除（逻辑下架）：将 isActive 设置为 false。
   * 当课包已产生订单无法物理删除时，可使用此方式下架。
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deactivatePack(id) {
    return http.post(`/pack/edit/${id}`, { isActive: false })
  }
}
