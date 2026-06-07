/**
 * Schedule.vue 测试
 *
 * 验证 5 个 tab (course/room/teacher/student/overview) 都能触发对应 service 调用
 * 由于 Schedule.vue 依赖 FullCalendar (浏览器 API) + 4 个子组件, 此处用最小可挂载策略:
 *   - stub 掉 Schedule.vue 里 import 的所有子组件, 只保留 el-tabs / el-tab-pane 的基础交互
 *   - 挂载后通过 click 触发 el-tab-pane, 验证相应 service 被调一次
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// mock 5 个 schedule service 方法
const mockListByCourse  = vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } })
const mockListByRoom    = vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } })
const mockListByTeacher = vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } })
const mockListByStudent = vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } })
const mockOverview      = vi.fn().mockResolvedValue({ data: { data: { days: [] } } })

vi.mock('@/api/schedule', () => ({
  scheduleService: {
    listByCourse:  (...a) => mockListByCourse(...a),
    listByRoom:    (...a) => mockListByRoom(...a),
    listByTeacher: (...a) => mockListByTeacher(...a),
    listByStudent: (...a) => mockListByStudent(...a),
    overview:      (...a) => mockOverview(...a),
    parseSlots:    vi.fn(),
    confirmSlots:  vi.fn(),
    previewLessons:vi.fn(),
    generateLessons:vi.fn(),
    editLesson:    vi.fn(),
    cancelLesson:  vi.fn(),
    checkConflicts:vi.fn()
  }
}))

// mock 5 个下拉 selector 的 service (FilterBar 会用)
vi.mock('@/api/course',   () => ({
  courseService: { getCourses: vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } }) }
}))
vi.mock('@/api/room',     () => ({
  roomService:   { getRooms:   vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } }) }
}))
vi.mock('@/api/user',     () => ({
  userService:   { getUsers:   vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } }) }
}))
vi.mock('@/api/student',  () => ({
  studentService:{ getStudents:vi.fn().mockResolvedValue({ data: { data: { items: [], total: 0 } } }) }
}))

// stub 掉 FullCalendar (jsdom 不支持 canvas) + 三个子组件
vi.mock('@fullcalendar/vue3', () => ({ default: { template: '<div class="fc-stub" />' } }))
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }))
vi.mock('@fullcalendar/interaction', () => ({ default: {} }))
vi.mock('./components/FilterBar.vue', () => ({
  default: {
    name: 'FilterBar',
    props: ['entity', 'entityId', 'range', 'showGenerate', 'showAi'],
    emits: ['update:entityId', 'update:range', 'reload', 'generate', 'aiParse'],
    template: '<div class="filter-bar-stub" @click="$emit(\'reload\')" />'
  }
}))
vi.mock('./components/LessonDrawer.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./components/OverviewCalendar.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./components/AISlotDialog.vue', () => ({ default: { template: '<div />' } }))

// 动态 import 组件 (mock 已生效)
import Schedule from './Schedule.vue'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('Schedule.vue tabs', () => {
  it('5 个 tab 切换后都触发对应 service 调用', async () => {
    const wrapper = mount(Schedule, {
      global: {
        plugins: [createPinia()],
        stubs: {
          // 把 el-tabs / el-tab-pane 替换为最简单的占位 (element-plus jsdom 渲染不稳定)
          'el-tabs': {
            template: '<div class="el-tabs-stub" @tab-change="$emit(\'tab-change\', $event)"><slot /></div>',
          },
          'el-tab-pane': { template: '<div class="el-tab-pane-stub" v-show="$attrs.name === parentActiveTab" />' }
        }
      }
    })
    await flushPromises()

    // 默认 activeTab = 'course', Schedule.vue 的 onMounted 没有自动 load, 需切 tab 触发
    // 实际看 Schedule.vue: 没有 onMounted 自动 load, 监听 tab-change, 但 tab-change 仅在 activeTab 变化时触发
    // 这里通过修改 activeTab 模拟切换
    const tabs = [
      { tab: 'course',   mock: mockListByCourse },
      { tab: 'room',     mock: mockListByRoom },
      { tab: 'teacher',  mock: mockListByTeacher },
      { tab: 'student',  mock: mockListByStudent },
      { tab: 'overview', mock: mockOverview }
    ]

    for (const { tab, mock } of tabs) {
      // 设实体 id (避免 '请先选择' / 早返回)
      if (tab === 'course')  wrapper.vm.courseId  = 'c1'
      if (tab === 'room')    wrapper.vm.roomId    = 'r1'
      if (tab === 'teacher') wrapper.vm.teacherId = 't1'
      if (tab === 'student') wrapper.vm.studentId = 's1'

      // Schedule.vue 在 <script setup> 里定义了 onTabChange, 不能直接通过 vm 调
      // 改用 watch range: 替换 range.value 触发 watch(range) -> reloadCurrentTab
      wrapper.vm.activeTab = tab
      wrapper.vm.range = [new Date('2026-06-01'), new Date('2026-06-30')]
      await flushPromises()
      await new Promise(r => setTimeout(r, 50))
      await flushPromises()
      expect(mock).toHaveBeenCalled()
    }
  })
})
