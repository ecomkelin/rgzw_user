/**
 * useAccount 单元测试
 *
 * 这是后端 `src/utils/payloadChecker.js` 的前端镜像，必须保证派生关系一一对应：
 *
 *   isAdmin   ⇒  isManager   ⇒  isUser
 *                                ⇓
 *                            isStudent (互斥)
 *
 * 测试策略：用一个 Probe 组件包裹 useAccount()，把各 computed 序列化到 DOM，
 *           通过 setProps 切换 authStore.user / currentOrgId 状态后断言。
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, watchEffect } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAccount } from './useAccount'
import { useAuthStore } from '../stores/auth'

/**
 * 把 4 个 identity helper + 2 个状态 + ensureCurrentOrgId 序列化到 DOM 的探针组件
 *  - props.authUser     模拟 authStore.user
 *  - props.currentOrgId 模拟 authStore.currentOrgId
 *
 * 注意：setup() 只在挂载时跑一次，但响应式测试要切 props，所以用 watchEffect 把
 *       props 同步到 authStore，让 computed 跟着更新。
 */
const Probe = defineComponent({
  props: {
    authUser: { type: Object, default: null },
    currentOrgId: { type: String, default: null }
  },
  setup(props) {
    const acc = useAccount()
    const auth = useAuthStore()
    // 同步外部 props 到 store（响应式）
    watchEffect(() => {
      auth.user = props.authUser
      auth.currentOrgId = props.currentOrgId
    })

    return () => h('div', { class: 'probe' }, [
      h('span', { class: 'accountType' }, acc.accountType.value),
      h('span', { class: 'isUser' }, String(acc.isUser.value)),
      h('span', { class: 'isStudent' }, String(acc.isStudent.value)),
      h('span', { class: 'isManager' }, String(acc.isManager.value)),
      h('span', { class: 'isAdmin' }, String(acc.isAdmin.value)),
      h('span', { class: 'currentOrgId' }, acc.currentOrgId.value || ''),
      h('span', { class: 'ensureOrgId' }, acc.ensureCurrentOrgId())
    ])
  }
})

function mountProbe (user, orgId) {
  return mount(Probe, { props: { authUser: user, currentOrgId: orgId } })
}

describe('useAccount — 未登录 / 加载中', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('user=null 时所有 helper 都是 false', () => {
    const w = mountProbe(null, null)
    expect(w.find('.accountType').text()).toBe('')
    expect(w.find('.isUser').text()).toBe('false')
    expect(w.find('.isStudent').text()).toBe('false')
    expect(w.find('.isManager').text()).toBe('false')
    expect(w.find('.isAdmin').text()).toBe('false')
    expect(w.find('.ensureOrgId').text()).toBe('')
  })

  it('user=null 时 currentOrgId 也为 null', () => {
    const w = mountProbe(null, null)
    expect(w.find('.currentOrgId').text()).toBe('')
  })
})

describe('useAccount — Student 账户', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('Student 用户：isStudent=true，其余 false', () => {
    const w = mountProbe({ accountType: 'Student' }, null)
    expect(w.find('.accountType').text()).toBe('Student')
    expect(w.find('.isUser').text()).toBe('false')
    expect(w.find('.isStudent').text()).toBe('true')
    expect(w.find('.isManager').text()).toBe('false')
    expect(w.find('.isAdmin').text()).toBe('false')
  })

  it('Student 账户即使有 isAdmin=true 也仍是 Student（互斥）', () => {
    // 防御性：理论上后端不会给 Student 设 isAdmin，但前端不应崩
    const w = mountProbe({ accountType: 'Student', isAdmin: true }, null)
    expect(w.find('.isStudent').text()).toBe('true')
    expect(w.find('.isAdmin').text()).toBe('false')
  })
})

describe('useAccount — 普通 User 账户（teacher）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('teacher User：isUser=true，isManager=false，isAdmin=false', () => {
    const w = mountProbe(
      { accountType: 'User', isAdmin: false, currentUser: { roleTemp: 'teacher' } },
      null
    )
    expect(w.find('.accountType').text()).toBe('User')
    expect(w.find('.isUser').text()).toBe('true')
    expect(w.find('.isManager').text()).toBe('false')
    expect(w.find('.isAdmin').text()).toBe('false')
  })

  it('currentUser 是字符串（未 populate）时 isManager=false', () => {
    // 没 populate 的边界态：roleTemp 不可读
    const w = mountProbe(
      { accountType: 'User', isAdmin: false, currentUser: 'someId123' },
      null
    )
    expect(w.find('.isManager').text()).toBe('false')
  })
})

describe('useAccount — manager User 账户', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('manager User（isAdmin=false）：isManager=true，isAdmin=false', () => {
    const w = mountProbe(
      { accountType: 'User', isAdmin: false, currentUser: { roleTemp: 'manager', Org: 'org-1' } },
      'org-1'
    )
    expect(w.find('.isManager').text()).toBe('true')
    expect(w.find('.isAdmin').text()).toBe('false')
  })

  it('currentOrgId 来自 authStore.currentOrgId', () => {
    const w = mountProbe(
      { accountType: 'User', currentUser: { roleTemp: 'manager' } },
      'org-from-store'
    )
    expect(w.find('.currentOrgId').text()).toBe('org-from-store')
    expect(w.find('.ensureOrgId').text()).toBe('org-from-store')
  })
})

describe('useAccount — 超管 User 账户', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isAdmin=true：isUser/isManager/isAdmin 全 true', () => {
    const w = mountProbe(
      { accountType: 'User', isAdmin: true, currentUser: { roleTemp: 'manager', Org: 'org-1' } },
      'org-1'
    )
    expect(w.find('.isUser').text()).toBe('true')
    expect(w.find('.isManager').text()).toBe('true')
    expect(w.find('.isAdmin').text()).toBe('true')
  })

  it('isAdmin=true ⇒ isStudent 必须 false（互斥）', () => {
    const w = mountProbe(
      { accountType: 'User', isAdmin: true, currentUser: { roleTemp: 'manager' } },
      null
    )
    expect(w.find('.isStudent').text()).toBe('false')
  })
})

describe('useAccount — ensureCurrentOrgId fallback 顺序', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('1) authStore.currentOrgId 优先', () => {
    const w = mountProbe(
      { accountType: 'User', currentUser: { roleTemp: 'manager', Org: 'org-fallback' } },
      'org-primary'
    )
    expect(w.find('.ensureOrgId').text()).toBe('org-primary')
  })

  it('2) currentOrgId 为空时 fallback 到 currentUser.Org', () => {
    const w = mountProbe(
      { accountType: 'User', currentUser: { roleTemp: 'manager', Org: 'org-fallback' } },
      null
    )
    expect(w.find('.ensureOrgId').text()).toBe('org-fallback')
  })

  it('3) 都没有则返回空串', () => {
    const w = mountProbe(
      { accountType: 'User', currentUser: { roleTemp: 'manager' } },
      null
    )
    expect(w.find('.ensureOrgId').text()).toBe('')
  })

  it('4) currentUser 是字符串（裸 ID）时不能读 .Org，返回空串', () => {
    const w = mountProbe(
      { accountType: 'User', currentUser: 'just-a-string' },
      null
    )
    expect(w.find('.ensureOrgId').text()).toBe('')
  })

  it('5) currentUser=null 时返回空串', () => {
    const w = mountProbe({ accountType: 'User' }, null)
    expect(w.find('.ensureOrgId').text()).toBe('')
  })
})

describe('useAccount — 响应式', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('authStore.user 改变后 isAdmin 跟随更新', async () => {
    const w = mountProbe({ accountType: 'User', isAdmin: false }, null)
    expect(w.find('.isAdmin').text()).toBe('false')

    w.setProps({ authUser: { accountType: 'User', isAdmin: true, currentUser: { roleTemp: 'manager' } } })
    await nextTick()
    expect(w.find('.isAdmin').text()).toBe('true')
    expect(w.find('.isManager').text()).toBe('true')
  })

  it('currentOrgId 改变后 currentOrgId / ensureCurrentOrgId 跟随', async () => {
    const w = mountProbe({ accountType: 'User' }, 'org-A')
    expect(w.find('.currentOrgId').text()).toBe('org-A')

    w.setProps({ currentOrgId: 'org-B' })
    await nextTick()
    expect(w.find('.currentOrgId').text()).toBe('org-B')
    expect(w.find('.ensureOrgId').text()).toBe('org-B')
  })
})
