/**
 * 教室管理 API
 */
import http from './http'

export const roomService = {
  /**
   * 教室分页列表
   * @param {object} params 搜索条件
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getRooms(params) {
    return http.post('/room/list', params)
  },

  /**
   * 教室详情
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getRoomById(id) {
    return http.post(`/room/detail/${id}`)
  },

  /**
   * 创建教室
   * @param {object} roomData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  createRoom(roomData) {
    return http.post('/room/add', roomData)
  },

  /**
   * 更新教室
   * @param {string|number} id
   * @param {object} roomData
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  updateRoom(id, roomData) {
    return http.post(`/room/edit/${id}`, roomData)
  },

  /**
   * 删除教室
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  deleteRoom(id) {
    return http.post(`/room/remove/${id}`)
  }
}
