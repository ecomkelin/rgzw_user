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
   * 删除科目（软删除：将 isActive 设置为 false）
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deleteSubject(id) {
    return http.post(`/subject/edit/${id}`, { isActive: false })
  }
}
