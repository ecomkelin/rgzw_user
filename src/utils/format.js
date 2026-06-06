/**
 * 通用格式化工具
 *
 * 集中放置所有"展示层"的格式化逻辑，避免在模板中散落 `g ? '激活' : '未激活'` 之类硬编码
 */

/**
 * 把 ISO/时间戳格式化为 zh-CN 风格的 yyyy/MM/dd hh:mm
 * @param {string|number|Date|null|undefined} dateString
 * @returns {string} 格式化结果；空值返回空字符串
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 把 ISO/时间戳格式化为 YYYY-MM-DD（仅日期，无时间）
 *
 * 适用场景：Element Plus `<el-date-picker value-format="YYYY-MM-DD">` 初始化时的回填，
 * 以及后端 `isDate()` 校验通过的标准 ISO 日期。
 *
 * 注意：不能直接对 `new Date()` 取 `toISOString().slice(0, 10)` —— 那会按 UTC 切，
 *       在东八区容易出现"差一天"的 bug。这里使用本地时区逐位补零。
 *
 * @param {string|number|Date|null|undefined} dateString
 * @returns {string} YYYY-MM-DD；空值返回空字符串
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 性别枚举 -> 中文
 * @param {'Male'|'Female'|string|null|undefined} gender
 * @returns {string}
 */
export const formatGender = (gender) => {
  switch (gender) {
    case 'Male':
      return '男'
    case 'Female':
      return '女'
    default:
      return gender
  }
}

/**
 * 账户类型枚举 -> 中文
 *
 * 历史：v2026-06-04 后端 JwtUtil.js 移除了 'Admin' 死分支，账户类型仅剩 'User' | 'Student'。
 * 这里同步只保留这两种；'Admin' 输入会原样返回（兜底）。
 *
 * @param {'User'|'Student'|string|null|undefined} accountType
 * @returns {string}
 */
export const formatAccountType = (accountType) => {
  switch (accountType) {
    case 'User':
      return '公司用户'
    case 'Student':
      return '学生'
    default:
      return accountType
  }
}

/**
 * 布尔激活状态 -> 中文
 * @param {boolean} isActive
 * @returns {'激活'|'未激活'}
 */
export const formatActiveStatus = (isActive) => {
  return isActive ? '激活' : '未激活'
}

/**
 * 把"出生日期"格式化为"yyyy/MM/dd (xx岁)"，无值返回 '-'
 *
 * 之前散落在 Students.vue 的 calculateAge + 模板拼接（'yyyy/MM/dd (xx岁)'），
 * 升级为统一工具：直接拿 birthday 字符串就能用。
 *
 * @param {string|number|Date|null|undefined} birthday
 * @returns {string}
 */
export const formatBirthdayAge = (birthday) => {
  if (!birthday) return '-'
  const d = new Date(birthday)
  if (isNaN(d.getTime())) return '-'
  const dateStr = formatDate(d)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return `${dateStr} (${age}岁)`
}