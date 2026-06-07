<template>
  <div class="filter-bar">
    <template v-if="entity !== 'overview'">
      <el-select
        :model-value="entityId"
        @update:model-value="$emit('update:entityId', $event)"
        :placeholder="placeholder"
        filterable
        style="width: 220px;"
        @change="onEntityChange"
      >
        <el-option
          v-for="o in options"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </template>

    <el-date-picker
      :model-value="range"
      @update:model-value="$emit('update:range', $event)"
      type="datetimerange"
      range-separator="至"
      start-placeholder="开始"
      end-placeholder="结束"
      :shortcuts="dateShortcuts"
      style="margin-left: 12px;"
    />

    <el-button type="primary" @click="$emit('reload')" style="margin-left: 12px;">
      <el-icon><Refresh /></el-icon> 刷新
    </el-button>

    <el-button v-if="showGenerate" type="success" @click="$emit('generate')" style="margin-left: 12px;">
      <el-icon><MagicStick /></el-icon> 预览并生成
    </el-button>

    <el-button v-if="showAi" type="warning" plain @click="$emit('aiParse')" style="margin-left: 12px;">
      <el-icon><ChatDotRound /></el-icon> AI 解析不可用时段
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { courseService } from '@/api/course'
import { roomService }   from '@/api/room'
import { userService }   from '@/api/user'
import { studentService } from '@/api/student'

const props = defineProps({
  entity:   { type: String, required: true },
  entityId: { type: String, default: '' },
  range:    { type: Array,  required: true },
  showGenerate: { type: Boolean, default: false },
  showAi:      { type: Boolean, default: false }
})
const emit = defineEmits(['update:entityId', 'update:range', 'reload', 'generate', 'aiParse'])

const placeholder = computed(() => {
  return { course: '选择课程', room: '选择教室', teacher: '选择老师', student: '选择学生' }[props.entity] || '选择'
})

const options = ref([])
const loadOptions = async () => {
  if (props.entity === 'overview') return
  try {
    if (props.entity === 'course') {
      const r = await courseService.getCourses({ filter: { isActive: true }, options: { limit: 500 } })
      options.value = (r.data?.data?.items || []).map(c => ({ value: c._id, label: c.name }))
    } else if (props.entity === 'room') {
      const r = await roomService.getRooms({ filter: { isActive: true }, options: { limit: 500 } })
      options.value = (r.data?.data?.items || []).map(c => ({ value: c._id, label: c.name }))
    } else if (props.entity === 'teacher') {
      // manager 在本系统里也能上课, 所以老师下拉要包含 manager + teacher
      const r = await userService.getUsers({ filter: { isActive: true, roleTemp: { $in: ['teacher', 'manager'] } }, options: { limit: 500 } })
      options.value = (r.data?.data?.items || []).map(u => ({ value: u._id, label: u.nickname }))
    } else if (props.entity === 'student') {
      const r = await studentService.getStudents({ filter: { isActive: true }, options: { limit: 500 } })
      options.value = (r.data?.data?.items || []).map(s => ({ value: s._id, label: s.name }))
    }
  } catch (e) {
    options.value = []
  }
}

const onEntityChange = (val) => {
  emit('update:entityId', val)
  emit('reload')
}

const dateShortcuts = [
  {
    text: '本周',
    value: () => {
      const start = new Date(); const end = new Date()
      const day = start.getDay() || 7
      start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - day + 1)
      end.setHours(23, 59, 59, 999); end.setDate(end.getDate() + (7 - day))
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const start = new Date(); const end = new Date()
      start.setDate(1); start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1); end.setDate(0); end.setHours(23, 59, 59, 999)
      return [start, end]
    }
  }
]

onMounted(loadOptions)
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}
</style>
