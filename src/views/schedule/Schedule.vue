<template>
  <div class="schedule-page">
    <h2 class="page-title">排课管理</h2>

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
        <FullCalendar :options="courseCalOptions" />
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
        <FullCalendar :options="roomCalOptions" />
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
        <FullCalendar :options="teacherCalOptions" />
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
        <FullCalendar :options="studentCalOptions" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

const loadByCourse = async () => {
  if (!courseId.value) return
  try {
    const { data } = await scheduleService.listByCourse(courseId.value, {
      from: range.value[0],
      to:   range.value[1]
    })
    courseEvents.value = toEvents(data?.data?.items || [])
  } catch (e) {
    ElMessage.error('加载课程排课失败')
  }
}
const loadByRoom = async () => {
  if (!roomId.value) return
  try {
    const { data } = await scheduleService.listByRoom(roomId.value, {
      from: range.value[0], to: range.value[1]
    })
    roomEvents.value = toEvents(data?.data?.items || [])
  } catch (e) { ElMessage.error('加载教室排课失败') }
}
const loadByTeacher = async () => {
  if (!teacherId.value) return
  try {
    const { data } = await scheduleService.listByTeacher(teacherId.value, {
      from: range.value[0], to: range.value[1]
    })
    teacherEvents.value = toEvents(data?.data?.items || [])
  } catch (e) { ElMessage.error('加载老师排课失败') }
}
const loadByStudent = async () => {
  if (!studentId.value) return
  try {
    const { data } = await scheduleService.listByStudent(studentId.value, {
      from: range.value[0], to: range.value[1]
    })
    studentEvents.value = toEvents(data?.data?.items || [])
  } catch (e) { ElMessage.error('加载学生排课失败') }
}
const loadOverview = async () => {
  try {
    const { data } = await scheduleService.overview({
      from: range.value[0], to: range.value[1]
    })
    overviewDays.value = data?.data?.days || []
  } catch (e) { ElMessage.error('加载汇总失败') }
}

const reloadCurrentTab = () => {
  if (activeTab.value === 'course')   return loadByCourse()
  if (activeTab.value === 'room')     return loadByRoom()
  if (activeTab.value === 'teacher')  return loadByTeacher()
  if (activeTab.value === 'student')  return loadByStudent()
  if (activeTab.value === 'overview') return loadOverview()
}

const onTabChange = (name) => {
  // 切到 tab 时若已有实体 id, 自动加载
  setTimeout(reloadCurrentTab, 50)
}

const onGenerate = async () => {
  if (!courseId.value) {
    ElMessage.warning('请先选择课程')
    return
  }
  try {
    const preview = await scheduleService.previewLessons({
      courseId: courseId.value, from: range.value[0], to: range.value[1]
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
      courseId: courseId.value, from: range.value[0], to: range.value[1], replace: false
    })
    ElMessage.success('已生成')
    loadByCourse()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '生成失败')
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

// 监听 range 变化
watch(range, () => reloadCurrentTab())
</script>

<style scoped>
.schedule-page { padding: 16px; }
.page-title { margin: 0 0 16px 0; font-size: 20px; }
.schedule-tabs :deep(.el-tabs__content) { padding-top: 12px; }
</style>
