// 工具函数
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

export const formatActiveStatus = (isActive) => {
  return isActive ? '激活' : '未激活'
}