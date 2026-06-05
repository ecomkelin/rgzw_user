/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  buildListPayload,
  appendExact,
  appendBoolean,
  appendRegExp,
  appendDateRange,
  unwrapListResponse,
  APP_DEFAULT_POPULATE
} from './listPayload'

describe('appendExact', () => {
  it('空值不写入', () => {
    const f = {}
    expect(appendExact(f, 'name', '')).toBe(false)
    expect(appendExact(f, 'name', null)).toBe(false)
    expect(appendExact(f, 'name', undefined)).toBe(false)
    expect(f).toEqual({})
  })

  it('非空写入并返回 true', () => {
    const f = {}
    expect(appendExact(f, 'name', 'foo')).toBe(true)
    expect(f.name).toBe('foo')
  })
})

describe('appendBoolean', () => {
  it('空值不写入', () => {
    const f = {}
    expect(appendBoolean(f, 'isActive', '')).toBe(false)
    expect(appendBoolean(f, 'isActive', null)).toBe(false)
    expect(f).toEqual({})
  })

  it('true / "true" 都归一为 true', () => {
    expect(appendBoolean({}, 'a', true)).toBe(true)
    expect(appendBoolean({}, 'a', 'true')).toBe(true)
  })

  it('false / "false" 都归一为 false', () => {
    const f = {}
    appendBoolean(f, 'a', false)
    expect(f.a).toBe(false)
    const f2 = {}
    appendBoolean(f2, 'a', 'false')
    expect(f2.a).toBe(false)
  })
})

describe('appendRegExp', () => {
  it('全部空不写入', () => {
    const f = {}
    expect(appendRegExp(f, '', '   ', null, undefined)).toBe(false)
    expect(f).toEqual({})
  })

  it('取第一个非空值', () => {
    const f = {}
    appendRegExp(f, '', '  ', 'hello', 'world')
    expect(f.regExp).toBe('hello')
  })

  it('自动 trim', () => {
    const f = {}
    appendRegExp(f, '  hello  ')
    expect(f.regExp).toBe('hello')
  })
})

describe('appendDateRange', () => {
  it('空数组 / 缺一端不写入', () => {
    const f = {}
    expect(appendDateRange(f, [])).toBe(false)
    expect(appendDateRange(f, [null, new Date()])).toBe(false)
    expect(appendDateRange(f, [new Date(), null])).toBe(false)
    expect(f).toEqual({})
  })

  it('合法范围写入 createdAt', () => {
    const f = {}
    const a = '2026-01-01'
    const b = '2026-12-31'
    expect(appendDateRange(f, [a, b])).toBe(true)
    expect(f.createdAt).toBeDefined()
    expect(f.createdAt.$gte).toBeInstanceOf(Date)
    expect(f.createdAt.$lte).toBeInstanceOf(Date)
  })

  it('支持自定义 field', () => {
    const f = {}
    appendDateRange(f, [new Date(), new Date()], 'updatedAt')
    expect(f.updatedAt).toBeDefined()
  })
})

describe('buildListPayload', () => {
  it('空 cfg 返回 { filter: {}, options: { limit: 10 } }', () => {
    const out = buildListPayload()
    expect(out.filter).toEqual({})
    expect(out.options.limit).toBe(10)
    expect(out.options.skip).toBeUndefined()
  })

  it('skip = (page-1) * pageSize', () => {
    const out = buildListPayload({ page: 3, pageSize: 20 })
    expect(out.options.limit).toBe(20)
    expect(out.options.skip).toBe(40)
  })

  it('第 1 页不写 skip', () => {
    const out = buildListPayload({ page: 1, pageSize: 10 })
    expect(out.options.skip).toBeUndefined()
  })

  it('sort 透传', () => {
    const out = buildListPayload({ sort: { sort: -1, createdAt: -1 } })
    expect(out.options.sort).toEqual({ sort: -1, createdAt: -1 })
  })

  it('populateKeys 自动从 APP_DEFAULT_POPULATE 展开', () => {
    const out = buildListPayload({ populateKeys: ['Org', 'Account'] })
    expect(out.options.populate).toEqual([
      ...APP_DEFAULT_POPULATE.Org,
      ...APP_DEFAULT_POPULATE.Account
    ])
  })

  it('调用方已有 populate 时合并', () => {
    const out = buildListPayload({
      baseOptions: { populate: [{ path: 'Subject', select: 'name' }] },
      populateKeys: ['Org']
    })
    expect(out.options.populate).toEqual([
      { path: 'Subject', select: 'name' },
      ...APP_DEFAULT_POPULATE.Org
    ])
  })

  it('未识别的 populateKeys 被忽略', () => {
    const out = buildListPayload({ populateKeys: ['NoSuchKey'] })
    expect(out.options.populate).toBeUndefined()
  })
})

describe('unwrapListResponse', () => {
  it('标准响应: data.data.items / total', () => {
    const r = { data: { data: { items: [1, 2, 3], total: 3 } } }
    expect(unwrapListResponse(r)).toEqual({ items: [1, 2, 3], total: 3 })
  })

  it('兜底 list 字段', () => {
    const r = { data: { data: { list: [1], total: 1 } } }
    expect(unwrapListResponse(r)).toEqual({ items: [1], total: 1 })
  })

  it('缺省返回空数组 + 0', () => {
    expect(unwrapListResponse({})).toEqual({ items: [], total: 0 })
    expect(unwrapListResponse(null)).toEqual({ items: [], total: 0 })
  })
})
