<template>
  <div v-if="!days.length" class="empty-tip">
    暂无汇总数据, 请选一个时间范围后点刷新
  </div>
  <div v-else class="overview-list">
    <div v-for="d in days" :key="d.date" class="day-block">
      <h3 class="day-title">{{ d.date }} <span class="day-week">({{ weekOf(d.date) }})</span></h3>
      <table class="overview-table">
        <thead>
          <tr>
            <th width="100">时间</th>
            <th width="200">课程 / 老师</th>
            <th width="120">教室</th>
            <th>上课学生数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(slot, si) in d.slots" :key="si">
            <td class="time-cell">{{ slot.startTime }} ~ {{ slot.endTime }}</td>
            <td>
              <div v-for="(it, ii) in slot.items" :key="ii" class="item-row">
                <span class="course-name">{{ it.courseName }}</span>
                <span class="teacher-name">{{ it.teacherName }}</span>
              </div>
            </td>
            <td>
              <div v-for="(it, ii) in slot.items" :key="ii" class="item-row">
                {{ it.roomName }}
              </div>
            </td>
            <td>
              <div v-for="(it, ii) in slot.items" :key="ii" class="item-row">
                <el-tag size="small">{{ it.studentCount }} 人</el-tag>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({ days: { type: Array, default: () => [] } })

const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekOf = (s) => weekMap[new Date(s).getDay()]
</script>

<style scoped>
.empty-tip { padding: 40px; text-align: center; color: #909399; }
.day-block { margin-bottom: 20px; }
.day-title  { font-size: 16px; margin: 8px 0; }
.day-week   { color: #909399; font-size: 12px; margin-left: 6px; }
.overview-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.overview-table th, .overview-table td {
  border: 1px solid #ebeef5; padding: 8px; text-align: left; vertical-align: top;
}
.overview-table th { background: #f5f7fa; color: #606266; font-weight: 500; }
.time-cell { white-space: nowrap; color: #409eff; font-weight: 500; }
.item-row { padding: 2px 0; }
.course-name { margin-right: 8px; }
.teacher-name { color: #909399; font-size: 12px; }
</style>
