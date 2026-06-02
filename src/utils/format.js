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
 * @param {'Admin'|'User'|'Student'|string|null|undefined} accountType
 * @returns {string}
 */
export const formatAccountType = (accountType) => {
  switch (accountType) {
    case 'Admin':
      return '管理员'
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