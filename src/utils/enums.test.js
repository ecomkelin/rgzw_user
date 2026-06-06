/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  ROOM_STATUS,
  ROOM_STATUS_MAP,
  formatRoomStatus,
  roomStatusTagType,
  SUBJECT_CATEGORIES,
  formatSubjectCategory,
  subjectCategoryTagType,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_MAP,
  formatAccountTypeEnum,
  USER_ROLES,
  USER_ROLE_MAP,
  formatUserRole,
  GENDER_OPTIONS,
  GENDER_MAP,
  formatGenderEnum
} from './enums'

describe('ROOM_STATUS', () => {
  it('包含三个枚举值', () => {
    expect(ROOM_STATUS).toHaveLength(3)
    expect(ROOM_STATUS.map(s => s.value)).toEqual(['available', 'in_use', 'maintenance'])
  })

  it('formatRoomStatus 已知值返回中文', () => {
    expect(formatRoomStatus('available')).toBe('可用')
    expect(formatRoomStatus('in_use')).toBe('使用中')
    expect(formatRoomStatus('maintenance')).toBe('维护中')
  })

  it('formatRoomStatus 未知值返回 "-"', () => {
    expect(formatRoomStatus('xxx')).toBe('-')
    expect(formatRoomStatus(null)).toBe('-')
  })

  it('roomStatusTagType 给出 tag 类型', () => {
    expect(roomStatusTagType('available')).toBe('success')
    expect(roomStatusTagType('in_use')).toBe('warning')
    expect(roomStatusTagType('maintenance')).toBe('danger')
    expect(roomStatusTagType('xxx')).toBe('info')
  })

  it('ROOM_STATUS_MAP 与 ROOM_STATUS 一一对应', () => {
    for (const s of ROOM_STATUS) {
      expect(ROOM_STATUS_MAP[s.value]).toEqual(s)
    }
  })
})

describe('SUBJECT_CATEGORIES', () => {
  it('包含 5 个分类', () => {
    expect(SUBJECT_CATEGORIES).toHaveLength(5)
  })

  it('formatSubjectCategory 已知值返回中文', () => {
    expect(formatSubjectCategory('C++')).toBe('C++')
    expect(formatSubjectCategory('Python')).toBe('Python')
    expect(formatSubjectCategory('电子智慧大颗粒')).toBe('电子智慧大颗粒')
  })

  it('formatSubjectCategory 未知值原样返回', () => {
    expect(formatSubjectCategory('Ruby')).toBe('Ruby')
  })

  it('subjectCategoryTagType 给出 tag 类型', () => {
    expect(subjectCategoryTagType('C++')).toBe('danger')
    expect(subjectCategoryTagType('Python')).toBe('primary')
    expect(subjectCategoryTagType('Scratch')).toBe('warning')
    expect(subjectCategoryTagType('Spike')).toBe('success')
    expect(subjectCategoryTagType('电子智慧大颗粒')).toBe('info')
  })
})

describe('ACCOUNT_TYPES', () => {
  // 历史：v2026-06-04 后端 JwtUtil.js 移除了 'Admin' 死分支，账户类型仅剩 User/Student
  it('包含 User / Student 两个（Admin 已移除）', () => {
    expect(ACCOUNT_TYPES.map(t => t.value)).toEqual(['User', 'Student'])
  })

  it('formatAccountTypeEnum 已知值返回中文', () => {
    expect(formatAccountTypeEnum('User')).toBe('公司用户')
    expect(formatAccountTypeEnum('Student')).toBe('学生')
  })

  it('formatAccountTypeEnum 未知值原样返回', () => {
    expect(formatAccountTypeEnum('God')).toBe('God')
  })

  it('ACCOUNT_TYPE_MAP 与 ACCOUNT_TYPES 一一对应', () => {
    for (const t of ACCOUNT_TYPES) {
      expect(ACCOUNT_TYPE_MAP[t.value]).toEqual(t)
    }
  })
})

describe('USER_ROLES', () => {
  it('包含 manager / teacher（全小写）', () => {
    expect(USER_ROLES.map(r => r.value)).toEqual(['manager', 'teacher'])
  })

  it('formatUserRole 已知值返回中文', () => {
    expect(formatUserRole('manager')).toBe('管理者')
    expect(formatUserRole('teacher')).toBe('老师')
  })

  it('formatUserRole 未知值原样返回', () => {
    expect(formatUserRole('xxx')).toBe('xxx')
  })

  it('USER_ROLE_MAP 与 USER_ROLES 一一对应', () => {
    for (const r of USER_ROLES) {
      expect(USER_ROLE_MAP[r.value]).toEqual(r)
    }
  })
})

describe('GENDER_OPTIONS', () => {
  it('包含 Male / Female', () => {
    expect(GENDER_OPTIONS.map(g => g.value)).toEqual(['Male', 'Female'])
  })

  it('formatGenderEnum 已知值返回中文', () => {
    expect(formatGenderEnum('Male')).toBe('男')
    expect(formatGenderEnum('Female')).toBe('女')
  })

  it('formatGenderEnum 未知值原样返回', () => {
    expect(formatGenderEnum('xxx')).toBe('xxx')
  })

  it('GENDER_MAP 与 GENDER_OPTIONS 一一对应', () => {
    for (const g of GENDER_OPTIONS) {
      expect(GENDER_MAP[g.value]).toEqual(g)
    }
  })
})
