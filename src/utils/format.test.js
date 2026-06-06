/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateOnly,
  formatGender,
  formatAccountType,
  formatActiveStatus,
  formatBirthdayAge
} from './format'

describe('formatDate', () => {
  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('正常日期返回 zh-CN 格式', () => {
    const out = formatDate('2026-01-15T08:30:00Z')
    expect(out).toMatch(/2026/)
    expect(out).toMatch(/01/)
    expect(out).toMatch(/15/)
  })
})

describe('formatDateOnly', () => {
  it('空值返回空字符串', () => {
    expect(formatDateOnly(null)).toBe('')
    expect(formatDateOnly(undefined)).toBe('')
    expect(formatDateOnly('')).toBe('')
  })

  it('非法日期返回空字符串', () => {
    expect(formatDateOnly('not-a-date')).toBe('')
  })

  it('正常日期返回 YYYY-MM-DD（用本地时区，不会因 UTC 切片差一天）', () => {
    // 用本地 0 点构造，避开 UTC 切片问题
    const local = new Date(2026, 0, 15) // 2026-01-15 本地时间
    expect(formatDateOnly(local)).toBe('2026-01-15')
  })

  it('月份和日期补零', () => {
    const local = new Date(2026, 2, 5) // 2026-03-05
    expect(formatDateOnly(local)).toBe('2026-03-05')
  })
})

describe('formatGender', () => {
  it('Male -> 男', () => expect(formatGender('Male')).toBe('男'))
  it('Female -> 女', () => expect(formatGender('Female')).toBe('女'))
  it('未知值原样返回', () => expect(formatGender('Other')).toBe('Other'))
  it('null 原样返回', () => expect(formatGender(null)).toBe(null))
})

describe('formatAccountType', () => {
  // 历史：v2026-06-04 后端 JwtUtil.js 移除了 'Admin' 死分支
  it('User -> 公司用户', () => expect(formatAccountType('User')).toBe('公司用户'))
  it('Student -> 学生', () => expect(formatAccountType('Student')).toBe('学生'))
  it('未知值原样返回', () => expect(formatAccountType('God')).toBe('God'))
  it("'Admin' 也原样返回（兜底，不再翻译为'管理员'）", () => expect(formatAccountType('Admin')).toBe('Admin'))
})

describe('formatActiveStatus', () => {
  it('true -> 激活', () => expect(formatActiveStatus(true)).toBe('激活'))
  it('false -> 未激活', () => expect(formatActiveStatus(false)).toBe('未激活'))
})

describe('formatBirthdayAge', () => {
  it('空值/非法返回 "-"', () => {
    expect(formatBirthdayAge(null)).toBe('-')
    expect(formatBirthdayAge('')).toBe('-')
    expect(formatBirthdayAge('not-a-date')).toBe('-')
  })

  it('合法日期返回 "yyyy/... (xx岁)"', () => {
    // 用本地 0 点构造，避免 UTC 切片
    const d = new Date(2010, 0, 15) // 2010-01-15 本地时间
    const out = formatBirthdayAge(d)
    expect(out).toMatch(/^2010/)
    expect(out).toMatch(/岁\)$/)
  })
})
