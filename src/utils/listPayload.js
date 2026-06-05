/**
 * listVD payload 构造器（v8.0.x 后端）
 *
 * 背景：后端 listVD 用 `matchedData()` 只放行白名单字段，前端如果传
 *   `filter.$or` / `filter.field.$regex` 等会**被静默剔除**，表现就是
 *   "我明明传了筛选条件，为什么没生效？"
 *
 * 本文件集中：
 *   - buildListPayload()      —— 构造 { filter, options }，自动套用本项目通用规约
 *   - appendRegExp()          —— 关键词搜索（替代过去的 $or + 多字段 $regex）
 *   - appendExact()           —— 精确等值（仅当值非空时写入）
 *   - appendBoolean()         —— 布尔筛选（处理 el-select 字符串 / null / undefined）
 *   - appendDateRange()       —— createdAt / updatedAt 时间范围
 *   - APP_DEFAULT_POPULATE    —— 几乎每个表都要 populate 的两个关联
 *
 * 所有页面（Rooms/Subjects/Courses/Orgs/Users/Students/Accounts）的 list 调用
 * 都应该走这里，不要再在 .vue 里手搓 filter / options。
 */

/**
 * 后端 listVD 通用白名单 options 字段
 *   - limit / skip / sort / populate 是后端 options allowlist 真正接受的
 *   - projection / lean / 其它都属于历史遗留，本项目不传
 * @typedef {Object} ListOptions
 * @property {number} [limit]
 * @property {number} [skip]
 * @property {{[k:string]: 1 | -1}} [sort]
 * @property {Array<{path: string, select?: string}>} [populate]
 */

/**
 * 在 filter 上追加一个精确匹配的字段（仅当 value 非空时）
 * @param {Object} filter
 * @param {string} field
 * @param {*} value
 * @returns {boolean} 是否真的写入了
 */
export function appendExact (filter, field, value) {
  if (value === '' || value === null || value === undefined) return false
  filter[field] = value
  return true
}

/**
 * 在 filter 上追加布尔字段。Element Plus 的 el-select 当 value 是 boolean 时
 * 既可能是 `true` 也可能是 `'true'`（取决于 v-model 的设定），这里统一归一。
 * @param {Object} filter
 * @param {string} field
 * @param {*} value
 * @returns {boolean}
 */
export function appendBoolean (filter, field, value) {
  if (value === '' || value === null || value === undefined) return false
  filter[field] = value === 'true' || value === true
  return true
}

/**
 * 关键词搜索：把"第一个非空"作为 regExp 写入。
 *
 * 后端约定：Subject / User / Org 的 listVD 接受 `filter.regExp`（DAO 内部走
 * name / nickname 模糊）；Student / Account 等模块暂未提供 regExp 模糊搜索
 * 支持（会静默剔除）。调用方负责保证目标模块支持 regExp。
 *
 * @param {Object} filter
 * @param  {...any} candidates 按优先级传入若干个可能的值
 * @returns {boolean}
 */
export function appendRegExp (filter, ...candidates) {
  const kw = candidates.find(v => v && String(v).trim() !== '')
  if (!kw) return false
  filter.regExp = String(kw).trim()
  return true
}

/**
 * 在 filter 上追加 createdAt / updatedAt 的时间范围
 * @param {Object} filter
 * @param {[Date|string, Date|string]} range
 * @param {string} [field='createdAt']
 * @returns {boolean}
 */
export function appendDateRange (filter, range, field = 'createdAt') {
  if (!Array.isArray(range) || range.length !== 2) return false
  const [a, b] = range
  if (!a || !b) return false
  filter[field] = {
    $gte: a instanceof Date ? a : new Date(a),
    $lte: b instanceof Date ? b : new Date(b)
  }
  return true
}

/**
 * 默认 populate：本项目大部分列表都需要 Org / Account / currentUser 的可读名
 *  - `Org`  → Org.name
 *  - `Account` → Account.name / phone / email
 *  - `currentUser` → nickname / roleTemp / isActive / Org
 */
export const APP_DEFAULT_POPULATE = Object.freeze({
  Org: [{ path: 'Org', select: 'name' }],
  Account: [{ path: 'Account', select: 'name phone email identityNo isActive' }],
  currentUser: [{ path: 'currentUser', select: 'nickname roleTemp isActive Org' }]
})

/**
 * 拼装 listVD 的完整 payload
 *
 * @param {Object} cfg
 * @param {Object} [cfg.filter={}]          调用方已构建好的 filter（白名单字段）
 * @param {Object} [cfg.baseOptions={}]     调用方已构建好的 options
 * @param {number} [cfg.page=1]
 * @param {number} [cfg.pageSize=10]
 * @param {{[k:string]: 1 | -1}} [cfg.sort]
 * @param {Array<string>} [cfg.populateKeys]  在 APP_DEFAULT_POPULATE 里点名要追加的 key
 * @returns {{ filter: Object, options: ListOptions }}
 */
export function buildListPayload (cfg = {}) {
  const {
    filter = {},
    baseOptions = {},
    page = 1,
    pageSize = 10,
    sort,
    populateKeys = []
  } = cfg

  const options = { ...baseOptions }

  // limit / skip
  options.limit = pageSize
  const skipValue = (page - 1) * pageSize
  if (skipValue > 0) options.skip = skipValue

  // sort：调用方传了用调用方的，否则给一个稳定的默认
  if (sort) options.sort = sort

  // populate：合并默认 + 显式
  const pops = []
  for (const key of populateKeys) {
    const list = APP_DEFAULT_POPULATE[key]
    if (list) pops.push(...list)
  }
  if (pops.length) {
    options.populate = options.populate ? [...options.populate, ...pops] : pops
  }

  return { filter, options }
}

/**
 * 把分页 / 列表响应统一归一为前端可用形态
 * 后端 listVD 返回 `data: { items: [...], total: number }`
 * 早期 / 部分模块可能返回 `list`，这里做个兜底
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {{ items: Array, total: number }}
 */
export function unwrapListResponse (response) {
  const data = response?.data?.data || {}
  const items = data.items || data.list || []
  const total = data.total || 0
  return { items, total }
}
