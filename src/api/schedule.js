/**
 * 排课管理 API
 */
import http from './http'

export const scheduleService = {
  /** 预览: 按规则生成 Lesson 列表, 不写库 */
  previewLessons(payload) {
    return http.post('/schedule/lessons/preview', payload)
  },

  /** 真正写库生成 Lesson */
  generateLessons(payload) {
    return http.post('/schedule/lessons/generate', payload)
  },

  /** 四维度查询 */
  listByCourse(courseId, payload) {
    return http.post(`/schedule/lessons/by-course/${courseId}`, payload)
  },
  listByRoom(roomId, payload) {
    return http.post(`/schedule/lessons/by-room/${roomId}`, payload)
  },
  listByTeacher(teacherId, payload) {
    return http.post(`/schedule/lessons/by-teacher/${teacherId}`, payload)
  },
  listByStudent(studentId, payload) {
    return http.post(`/schedule/lessons/by-student/${studentId}`, payload)
  },

  /** 单条编辑/取消 (手动微调) */
  editLesson(id, payload) {
    return http.post(`/schedule/lessons/edit/${id}`, payload)
  },
  cancelLesson(id) {
    return http.post(`/schedule/lessons/cancel/${id}`)
  },

  /** 全校汇总 */
  overview(payload) {
    return http.post('/schedule/lessons/overview', payload)
  },

  /** 冲突检测 */
  checkConflicts(payload) {
    return http.post('/schedule/conflicts/check', payload)
  },

  /** AI 解析自然语言 → TimeBlock 列表 */
  parseSlots(payload) {
    return http.post('/schedule/ai/parse-slots', payload)
  },

  /** AI 解析确认写入实体 */
  confirmSlots(payload) {
    return http.post('/schedule/ai/parse-slots/confirm', payload)
  }
}
