<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="课次详情"
    direction="rtl"
    size="420px"
  >
    <div v-if="lesson" class="lesson-detail">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="课程序号">第 {{ lesson.sequenceNumber }} 节</el-descriptions-item>
        <el-descriptions-item label="课程">{{ lesson.Course?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="老师">{{ lesson.teacher?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="教室">{{ lesson.classroom?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">
          {{ formatTime(lesson.plannedDate) }} ~ {{ formatTime(lesson.plannedEndDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ lesson.status }}</el-descriptions-item>
        <el-descriptions-item v-if="lesson.description" label="说明">{{ lesson.description }}</el-descriptions-item>
      </el-descriptions>

      <el-button
        v-if="lesson.status === 'scheduled'"
        type="danger"
        plain
        style="margin-top: 16px;"
        @click="onCancel"
      >
        取消本节
      </el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { scheduleService } from '@/api/schedule'

const props = defineProps({
  visible: { type: Boolean, default: false },
  lesson:  { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const formatTime = (d) => {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const onCancel = async () => {
  try {
    await ElMessageBox.confirm('确认取消本节? 取消后状态变为 cancelled', '警告', { type: 'warning' })
    await scheduleService.cancelLesson(props.lesson._id)
    ElMessage.success('已取消')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('取消失败')
  }
}
</script>

<style scoped>
.lesson-detail { padding: 0 16px; }
</style>
