/**
 * 科目管理 API
 */
import http from './http'

export const subjectService = {
  /**
   * 科目分页列表
   * @param {object} params 搜索条件
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getSubjects(params) {
    return http.post('/subject/list', params)
  },

  /**
   * 科目详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getSubjectById(id) {
    return http.post(`/subject/detail/${id}`)
  },

  /**
   * 创建科目
   * @param {object} subjectData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createSubject(subjectData) {
    return http.post('/subject/add', subjectData)
  },

  /**
   * 更新科目
   * @param {string|number} id
   * @param {object} subjectData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateSubject(id, subjectData) {
    return http.post(`/subject/edit/${id}`, subjectData)
  },

  /**
   * 停用科目（软删除：后端 v7.x 暂未开放 /remove/:id 路由，
   * 改用 update + isActive:false 实现「逻辑下架」）
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deactivateSubject(id) {
    return http.post(`/subject/edit/${id}`, { isActive: false })
  }
}
