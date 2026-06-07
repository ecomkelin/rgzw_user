<template>
  <div class="schedule-page">
    <div class="page-header">
      <h2 class="page-title">排课管理</h2>
      <div class="header-actions">
        <el-button @click="activeTab = 'overview'; loadOverview()">
          查看全校汇总
        </el-button>
        <el-button type="primary" @click="goToGenerate">
          <el-icon><MagicStick /></el-icon>
          生成排课
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card" class="schedule-tabs" @tab-change="onTabChange">
      <!-- 1. 按课程 -->
      <el-tab-pane label="按课程" name="course">
        <FilterBar
          entity="course"
          v-model:entity-id="courseId"
          v-model:range="range"
          :show-generate="true"
          :show-ai="false"
          @reload="loadByCourse"
          @generate="onGenerate"
        />
        <FullCalendar v-show="activeTab === 'course'" :ref="setCalendarRef('course')" :options="courseCalOptions" />
      </el-tab-pane>

      <!-- 2. 按教室 -->
      <el-tab-pane label="按教室" name="room">
        <FilterBar
          entity="room"
          v-model:entity-id="roomId"
          v-model:range="range"
          :show-generate="false"
          :show-ai="false"
          @reload="loadByRoom"
        />
        <FullCalendar v-show="activeTab === 'room'" :ref="setCalendarRef('room')" :options="roomCalOptions" />
      </el-tab-pane>

      <!-- 3. 按老师 -->
      <el-tab-pane label="按老师" name="teacher">
        <FilterBar
          entity="teacher"
          v-model:entity-id="teacherId"
          v-model:range="range"
          :show-generate="false"
          :show-ai="true"
          @reload="loadByTeacher"
          @ai-parse="openAiDialog('teacher', teacherId)"
        />
        <FullCalendar v-show="activeTab === 'teacher'" :ref="setCalendarRef('teacher')" :options="teacherCalOptions" />
      </el-tab-pane>

      <!-- 4. 按学生 -->
      <el-tab-pane label="按学生" name="student">
        <FilterBar
          entity="student"
          v-model:entity-id="studentId"
          v-model:range="range"
          :show-generate="false"
          :show-ai="true"
          @reload="loadByStudent"
          @ai-parse="openAiDialog('student', studentId)"
        />
        <FullCalendar v-show="activeTab === 'student'" :ref="setCalendarRef('student')" :options="studentCalOptions" />
      </el-tab-pane>

      <!-- 5. 全校汇总 -->
      <el-tab-pane label="全校汇总" name="overview">
        <FilterBar
          entity="overview"
          v-model:range="range"
          :show-generate="false"
          :show-ai="false"
          @reload="loadOverview"
        />
        <OverviewCalendar :days="overviewDays" />
      </el-tab-pane>
    </el-tabs>

    <LessonDrawer
      v-model:visible="drawerVisible"
      :lesson="currentLesson"
      @saved="reloadCurrentTab"
    />

    <AISlotDialog
      v-model:visible="aiDialogVisible"
      :target="aiTarget"
      :target-id="aiTargetId"
      @saved="reloadCurrentTab"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import FilterBar from './components/FilterBar.vue'
import LessonDrawer from './components/LessonDrawer.vue'
import OverviewCalendar from './components/OverviewCalendar.vue'
import AISlotDialog from './components/AISlotDialog.vue'

import { scheduleService } from '@/api/schedule'
import { courseService } from '@/api/course'
import { roomService }   from '@/api/room'
import { userService }   from '@/api/user'
import { studentService } from '@/api/student'

const activeTab   = ref('course')
const courseId    = ref('')
const roomId      = ref('')
const teacherId   = ref('')
const studentId   = ref('')
const range       = ref([new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)])
const courseEvents = ref([])
const roomEvents   = ref([])
const teacherEvents= ref([])
const studentEvents= ref([])
const overviewDays = ref([])

// FullCalendar 引用: 用于 tab 切换后强制 updateSize + changeView 解决"日期混乱"
// 4 个日历用 v-show 一次性 mount, 切 tab 时不 remount, 只 CSS 切换.
// 在 onTabChange 里对"刚变可见的那个"调 forceRelayout, 不需要用户手动点 toolbar.
const calendarApis = {}
const setCalendarRef = (key) => (el) => {
    if (el) {
        // @fullcalendar/vue3 暴露 getApi() 拿到 Calendar 实例
        calendarApis[key] = el.getApi ? el.getApi() : el
    } else {
        delete calendarApis[key]
    }
}

const drawerVisible = ref(false)
const currentLesson = ref(null)

const aiDialogVisible = ref(false)
const aiTarget = ref('student')
const aiTargetId = ref('')

// 把 lesson[] 映射为 FullCalendar events
const toEvents = (items) => (items || []).map(l => ({
  id:    l._id,
  title: `${l.Course?.name || '课'} · ${l.teacher?.nickname || '老师'}`,
  start: l.plannedDate,
  end:   l.plannedEndDate,
  extendedProps: { lesson: l }
}))

const baseCalOptions = computed(() => ({
  plugins: [timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  firstDay: 1,  // 周一作为一周的第一列, 周日排到最后一列
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' },
  locale: 'zh-cn',
  height: 'auto',
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  eventClick: (info) => {
    currentLesson.value = info.event.extendedProps.lesson
    drawerVisible.value = true
  }
}))

const courseCalOptions = computed(() => ({
  ...baseCalOptions.value,
  events: courseEvents.value
}))
const roomCalOptions = computed(() => ({
  ...baseCalOptions.value,
  events: roomEvents.value
}))
const teacherCalOptions = computed(() => ({
  ...baseCalOptions.value,
  events: teacherEvents.value
}))
const studentCalOptions = computed(() => ({
  ...baseCalOptions.value,
  events: studentEvents.value
}))

/** 安全把 Date 序列化为 ISO 字符串; 无效值返回 undefined (不传) */
const toISO = (v) => (v instanceof Date && !isNaN(v.getTime())) ? v.toISOString() : undefined
const buildRangePayload = () => {
  const payload = {}
  const f = toISO(range.value?.[0])
  const t = toISO(range.value?.[1])
  if (f) payload.from = f
  if (t) payload.to   = t
  return payload
}

// 切到某 tab 但 entityId 未选时, 之前是 `if (!xxxId.value) return` 静默退出
// → FullCalendar 仍显示上一刻的 events, 切 tab 后用户看到"什么也没有, 但没错误提示".
// 改成: 清空 events + 友好提示用户去选. 同时保证 calendar 立即 re-render 到空状态,
// 避免"上一个 tab 的数据残留"错觉.
const loadByCourse = async () => {
  if (!courseId.value) {
    courseEvents.value = []
    return
  }
  try {
    const { data } = await scheduleService.listByCourse(courseId.value, buildRangePayload())
    courseEvents.value = toEvents(data?.data?.items || [])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载课程排课失败')
  }
}
const loadByRoom = async () => {
  if (!roomId.value) {
    roomEvents.value = []
    return
  }
  try {
    const { data } = await scheduleService.listByRoom(roomId.value, buildRangePayload())
    roomEvents.value = toEvents(data?.data?.items || [])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载教室排课失败')
  }
}
const loadByTeacher = async () => {
  if (!teacherId.value) {
    teacherEvents.value = []
    return
  }
  try {
    const { data } = await scheduleService.listByTeacher(teacherId.value, buildRangePayload())
    teacherEvents.value = toEvents(data?.data?.items || [])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载老师排课失败')
  }
}
const loadByStudent = async () => {
  if (!studentId.value) {
    studentEvents.value = []
    return
  }
  try {
    const { data } = await scheduleService.listByStudent(studentId.value, buildRangePayload())
    studentEvents.value = toEvents(data?.data?.items || [])
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载学生排课失败')
  }
}
const loadOverview = async () => {
  try {
    const { data } = await scheduleService.overview(buildRangePayload())
    overviewDays.value = data?.data?.days || []
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载汇总失败')
  }
}

const reloadCurrentTab = () => {
  if (activeTab.value === 'course')   return loadByCourse()
  if (activeTab.value === 'room')     return loadByRoom()
  if (activeTab.value === 'teacher')  return loadByTeacher()
  if (activeTab.value === 'student')  return loadByStudent()
  if (activeTab.value === 'overview') return loadOverview()
}

/**
 * 解决 "切 tab 后日期混乱, 必须点这个 tab 内的某个按钮才好".
 *
 * 历史 fix 失败的真正根因 (5 次都没修好):
 *  1. el-tab-pane 默认 v-show (display: none ↔ block) 切换;
 *  2. 我们在 FullCalendar 上加 v-if="activeTab === '...'", 所以切到目标 tab 时
 *     FullCalendar 是 FRESH mount, 而 v-show 的父容器刚变 block, reflow 未必完成.
 *     FullCalendar 拿到的 clientWidth 是 0 或 stale, 把 view 的 activeStart/activeEnd
 *     + cell pixel width 算错. 之后 updateSize() 只重算 height/scroll, 不会重算
 *     日期列范围, 错误状态被"缓存"住.
 *  3. 用户手动点 tab 内的某个按钮 (entity select 触发 reload / 刷新 / week/day)
 *     之所以修好, 是因为这些动作都改变了 FullCalendar 的 options 引用,
 *     触发 wrapper 的 `options` watcher → resetOptions + updateSize, 此时父容器
 *     已 reflow 完, 修好.
 *
 * 真正修法 (v6.1.20 verified):
 *  - 把 FullCalendar 的 v-if 改成 v-show, 4 个日历一次性全部 mount, 不再 remount.
 *  - 隐藏的 3 个日历在 width=0 父容器下首屏 layout 是错的, 但因为它们不在视口内
 *    用户看不到; 切到这个 tab 时, 我们调用 updateSize() + changeView(viewType)
 *    强制 full re-render, 把日期列范围重算到当前正确宽度.
 *  - 包在 nextTick + rAF 之后, 让 el-tab-pane 的 display 切换先 reflow.
 *  - 100ms setTimeout 兜底 (字体加载 / transition 延迟).
 */
const forceRelayout = (tabName) => {
    const api = calendarApis[tabName]
    if (!api || typeof api.updateSize !== 'function') return
    const viewType = api.view && api.view.type
    // 1) updateSize 重算 height/scroll
    api.updateSize()
    // 2) 强制重渲 view — 真正修"日期列范围错位"的关键一步
    if (viewType) {
        try { api.changeView(viewType) } catch (e) { /* ignore */ }
    }
}

const updateWhenVisible = (tabName) => {
    // 1) 立即试一次 (nextTick 之后 Vue 的 v-show 切换已生效)
    nextTick(() => {
        requestAnimationFrame(() => {
            forceRelayout(tabName)
            // 2) 100ms 兜底 (字体加载 / 动画 / 浏览器首帧延迟)
            setTimeout(() => forceRelayout(tabName), 100)
        })
    })
}

const onTabChange = async (name) => {
  // 1) 切到 tab 时若已有实体 id, 自动加载
  setTimeout(reloadCurrentTab, 50)
  // 2) 提示用户当前 tab 需要先选 entity 才能看数据
  //    (loadByXxx 在 entityId 空时只是清空 events 不弹错, 不提示用户就以为页面坏了)
  const needPick = (name === 'course'   && !courseId.value)
                || (name === 'room'     && !roomId.value)
                || (name === 'teacher'  && !teacherId.value)
                || (name === 'student'  && !studentId.value)
  if (needPick) {
    const tip = { course: '请先选择课程', room: '请先选择教室', teacher: '请先选择老师', student: '请先选择学生' }[name]
    ElMessage.info(tip)
  }
  // 3) 等 v-if 重新挂载 FullCalendar + 容器从 display:none 变可见
  //    至少等一个 layout 周期再 updateSize, 避免测到 0 宽度
  await nextTick()
  updateWhenVisible(activeTab.value)
}

const onGenerate = async () => {
  if (!courseId.value) {
    ElMessage.warning('请先选择课程和时间范围, 然后点击"预览并生成"')
    return
  }
  const rangePayload = buildRangePayload()
  try {
    const preview = await scheduleService.previewLessons({
      courseId: courseId.value, ...rangePayload
    })
    const items = preview.data?.data?.items || []
    if (!items.length) {
      ElMessage.info('该课程没有可生成的排课规则, 或时间窗口内无匹配日期')
      return
    }
    const conflictCount = items.filter(p => (p.conflicts || []).length > 0).length
    let msg = `将生成 ${items.length} 条 Lesson`
    if (conflictCount > 0) msg += `, 其中 ${conflictCount} 条存在冲突, 是否继续?`
    await ElMessageBox.confirm(msg, '确认生成', { type: 'warning' })

    await scheduleService.generateLessons({
      courseId: courseId.value, ...rangePayload, replace: false
    })
    ElMessage.success('已生成')
    loadByCourse()
  } catch (e) {
    // 用户取消 confirm 时 ElMessageBox.confirm 抛 'cancel' 字符串, 直接吞
    if (e === 'cancel' || e === 'close') return

    // 后端: 该课程已存在 N 个未取消 Lesson, 请传 replace=true 重新生成
    // → 给用户两个选项: 1) 删旧的重新生成 (replace=true)  2) 保留旧的直接追加 (不传 replace)
    const serverMsg = e?.response?.data?.message || ''
    if (/未取消 Lesson.*replace=true/.test(serverMsg)) {
      try {
        await ElMessageBox.confirm(
          `${serverMsg}\n\n点 "确定" 将清空旧的 scheduled Lesson 后重新生成;\n点 "取消" 保留旧 Lesson, 本次不再生成。`,
          '检测到已存在该课程的排课',
          { type: 'warning', confirmButtonText: '清空旧课并重新生成', cancelButtonText: '保留旧课' }
        )
        // 用户确认: 清空旧 scheduled Lesson, 重新插入
        await scheduleService.generateLessons({
          courseId: courseId.value, ...rangePayload, replace: true
        })
        ElMessage.success('已重新生成')
        loadByCourse()
      } catch (e2) {
        // 用户点 "保留旧课" 关闭弹窗, 啥也不做
        if (e2 === 'cancel' || e2 === 'close') return
        ElMessage.error(e2?.response?.data?.message || '重新生成失败')
      }
      return
    }
    ElMessage.error(serverMsg || '生成失败')
  }
}

const openAiDialog = (target, targetId) => {
  if (!targetId) {
    ElMessage.warning('请先选择实体')
    return
  }
  aiTarget.value = target
  aiTargetId.value = targetId
  aiDialogVisible.value = true
}

/** 顶部"生成排课"入口: 等价于 "在按课程 Tab 里点预览并生成"
 * - 若当前已在按课程 Tab 且已选 courseId: 直接走 onGenerate 完整流程
 * - 否则: 切到按课程 Tab, 提示用户先选课程 + 时间范围
 */
const goToGenerate = () => {
  activeTab.value = 'course'
  if (courseId.value) {
      // 走完整预览 → 确认 → 生成流程
      onGenerate()
  } else {
      ElMessage.warning('请先选择课程和时间范围, 然后点击"预览并生成"')
  }
}

// 监听 range 变化
watch(range, () => reloadCurrentTab())

// 浏览器窗口尺寸变化时, 同步 resize 当前 tab 的 FullCalendar
// 避免窄屏切换 / 侧边栏折叠导致日历宽度没刷新
const onWindowResize = () => {
    updateWhenVisible(activeTab.value)
}
onMounted(() => window.addEventListener('resize', onWindowResize))
onBeforeUnmount(() => window.removeEventListener('resize', onWindowResize))
</script>

<style scoped>
.schedule-page { padding: 16px; }
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.header-actions { display: flex; gap: 8px; }
.page-title { margin: 0; font-size: 20px; }
.schedule-tabs :deep(.el-tabs__content) { padding-top: 12px; }

/* FullCalendar 头部 toolbar: 防止窄屏时按钮 / 标题重叠 */
.schedule-page :deep(.fc-header-toolbar) {
  margin-bottom: 12px;
  flex-wrap: wrap;
  row-gap: 8px;
}
.schedule-page :deep(.fc-toolbar.fc-header-toolbar) {
  align-items: center;
}
.schedule-page :deep(.fc-toolbar-title) {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
/* 让 header 左中右三块有最小宽度, 避免挤在一起 */
.schedule-page :deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
  min-width: 0;
}
</style>
