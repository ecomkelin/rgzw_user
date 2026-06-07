/**
 * 业务枚举集中管理
 *
 * 之前散落在各 .vue 文件里的硬编码字面量（房间状态、科目分类、用户角色…）会
 * 出现 3 个问题：
 *   1. 同一枚举在 template 和 formatter 里复制 2 份，改动时容易漏改
 *   2. 文档散落，无法"一站式"看清楚后端到底接受了哪些字面量
 *   3. 多语言（如以后加 i18n）找不到枚举点
 *
 * 这里把每个枚举抽成 `value / label / tagType` 三元组，template 直接
 * `v-for="opt in ROOM_STATUS"` 即可，formatter 里也走 `ROOM_STATUS_MAP`。
 *
 * ⚠️ 命名约定：字面量值（后端存的）保持 PascalCase / snake_case 不变；
 * 中文 label 放在这里集中管理，不要再写死到 .vue。
 */

/**
 * 枚举项的通用形态
 * @typedef {Object} EnumItem
 * @property {string} value
 * @property {string} label
 * @property {string} [tagType]   Element Plus el-tag 的 type
 */

/** 教室状态（Room.status） */
export const ROOM_STATUS = Object.freeze([
  { value: 'available',   label: '可用',     tagType: 'success' },
  { value: 'in_use',      label: '使用中',   tagType: 'warning' },
  { value: 'maintenance', label: '维护中',   tagType: 'danger' }
])
export const ROOM_STATUS_MAP = Object.freeze(
  Object.fromEntries(ROOM_STATUS.map(s => [s.value, s]))
)
export const formatRoomStatus = (s) => ROOM_STATUS_MAP[s]?.label ?? '-'
export const roomStatusTagType = (s) => ROOM_STATUS_MAP[s]?.tagType ?? 'info'

/** 科目分类（Subject.category） */
export const SUBJECT_CATEGORIES = Object.freeze([
  { value: 'C++',           label: 'C++',             tagType: 'danger' },
  { value: 'Python',        label: 'Python',          tagType: 'primary' },
  { value: 'Scratch',       label: 'Scratch',         tagType: 'warning' },
  { value: 'Spike',         label: 'Spike',           tagType: 'success' },
  { value: '电子智慧大颗粒', label: '电子智慧大颗粒',  tagType: 'info' }
])
export const SUBJECT_CATEGORY_MAP = Object.freeze(
  Object.fromEntries(SUBJECT_CATEGORIES.map(c => [c.value, c]))
)
export const formatSubjectCategory = (c) => SUBJECT_CATEGORY_MAP[c]?.label ?? c ?? '-'
export const subjectCategoryTagType = (c) => SUBJECT_CATEGORY_MAP[c]?.tagType ?? 'info'

/** 账户类型（Account.accountType）
 *
 * 历史：v2026-06-04 后端 JwtUtil.js 移除了 'Admin' 死分支（账户类型仅剩 'User' | 'Student'）。
 * 这里同步只保留这两种。
 */
export const ACCOUNT_TYPES = Object.freeze([
  { value: 'User',    label: '公司用户' },
  { value: 'Student', label: '学生'     }
])
export const ACCOUNT_TYPE_MAP = Object.freeze(
  Object.fromEntries(ACCOUNT_TYPES.map(t => [t.value, t]))
)
export const formatAccountTypeEnum = (t) => ACCOUNT_TYPE_MAP[t]?.label ?? t ?? '-'

/** 用户角色（User.roleTemp —— 注意是 'manager' / 'teacher'，全小写） */
export const USER_ROLES = Object.freeze([
  { value: 'manager', label: '管理者' },
  { value: 'teacher', label: '老师'   }
])
export const USER_ROLE_MAP = Object.freeze(
  Object.fromEntries(USER_ROLES.map(r => [r.value, r]))
)
export const formatUserRole = (r) => USER_ROLE_MAP[r]?.label ?? r ?? '-'

/** 性别（Account.gender / Student.gender，注意大小写不一致） */
export const GENDER_OPTIONS = Object.freeze([
  { value: 'Male',   label: '男' },
  { value: 'Female', label: '女' }
])
export const GENDER_MAP = Object.freeze(
  Object.fromEntries(GENDER_OPTIONS.map(g => [g.value, g]))
)
export const formatGenderEnum = (g) => GENDER_MAP[g]?.label ?? g ?? '-'

/** 课包订单支付状态（OrderPack.payStatus） */
export const PAY_STATUS_OPTIONS = Object.freeze([
  { value: 'Pending',   label: '待支付',  tagType: 'warning' },
  { value: 'Paid',      label: '已支付',  tagType: 'success' },
  { value: 'Cancelled', label: '已取消',  tagType: 'info'    },
  { value: 'Refunded',  label: '已退款',  tagType: 'danger'  }
])
export const PAY_STATUS_MAP = Object.freeze(
  Object.fromEntries(PAY_STATUS_OPTIONS.map(s => [s.value, s]))
)
export const formatPayStatus = (s) => PAY_STATUS_MAP[s]?.label ?? s ?? '-'
export const payStatusTagType = (s) => PAY_STATUS_MAP[s]?.tagType ?? 'info'

/** 课包订单支付方式（OrderPack.payMethod） */
export const PAY_METHOD_OPTIONS = Object.freeze([
  { value: 'wechat',   label: '微信'   },
  { value: 'alipay',   label: '支付宝' },
  { value: 'cash',     label: '现金'   },
  { value: 'card',     label: '刷卡'   },
  { value: 'transfer', label: '转账'   }
])
export const PAY_METHOD_MAP = Object.freeze(
  Object.fromEntries(PAY_METHOD_OPTIONS.map(m => [m.value, m]))
)
export const formatPayMethod = (m) => PAY_METHOD_MAP[m]?.label ?? m ?? '-'

/** 学生课包状态（StudentPack.status） */
export const STUDENT_PACK_STATUS = Object.freeze([
  { value: 'active',    label: '激活中', tagType: 'success' },
  { value: 'frozen',    label: '已冻结', tagType: 'warning' },
  { value: 'exhausted', label: '已耗尽', tagType: 'info'    },
  { value: 'refunded',  label: '已退费', tagType: 'danger'  }
])
export const STUDENT_PACK_STATUS_MAP = Object.freeze(
  Object.fromEntries(STUDENT_PACK_STATUS.map(s => [s.value, s]))
)
export const formatStudentPackStatus = (s) => STUDENT_PACK_STATUS_MAP[s]?.label ?? s ?? '-'
export const studentPackStatusTagType = (s) => STUDENT_PACK_STATUS_MAP[s]?.tagType ?? 'info'

/** 学生课包来源（StudentPack.resource） */
export const STUDENT_PACK_RESOURCE = Object.freeze([
  { value: 'OrderPack', label: '订单购买', tagType: 'primary' },
  { value: 'free',      label: '免费赠送', tagType: 'success' }
])
export const STUDENT_PACK_RESOURCE_MAP = Object.freeze(
  Object.fromEntries(STUDENT_PACK_RESOURCE.map(r => [r.value, r]))
)
export const formatStudentPackResource = (r) => STUDENT_PACK_RESOURCE_MAP[r]?.label ?? r ?? '-'
export const studentPackResourceTagType = (r) => STUDENT_PACK_RESOURCE_MAP[r]?.tagType ?? 'info'
