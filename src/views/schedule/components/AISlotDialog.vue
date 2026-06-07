<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="`AI 解析不可用时段 - ${targetLabel}`"
    width="560px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="mode">
      <el-tab-pane label="粘贴自然语言" name="ai">
        <el-input
          v-model="text"
          type="textarea"
          :rows="4"
          placeholder="例如: 周一三五晚上 7-9 点不行, 7 月 1 号到 15 号全天不行"
        />
        <el-button
          type="primary"
          :loading="parsing"
          @click="onParse"
          style="margin-top: 8px;"
        >
          解析
        </el-button>
        <el-alert
          v-if="parseError"
          :title="parseError"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 8px;"
        />
      </el-tab-pane>

      <el-tab-pane label="手动选时段" name="manual">
        <el-button @click="addSlot" size="small">+ 添加一条</el-button>
        <div v-for="(s, i) in manualSlots" :key="i" class="manual-slot">
          <el-select v-model="s.type" style="width: 100px;" @change="resetManual(s)">
            <el-option label="按周几" value="dow" />
            <el-option label="按日期" value="date" />
            <el-option label="日期段"  value="range" />
          </el-select>
          <el-select v-if="s.type==='dow'" v-model="s.dayOfWeek" style="width: 100px; margin-left: 4px;">
            <el-option v-for="(w,wi) in weekOptions" :key="wi" :label="w" :value="wi" />
          </el-select>
          <el-date-picker v-else-if="s.type==='date'" v-model="s.date" type="date" value-format="YYYY-MM-DD" style="width: 140px; margin-left: 4px;" />
          <template v-else>
            <el-date-picker v-model="s.dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" style="width: 240px; margin-left: 4px;" />
          </template>
          <el-time-picker v-model="s.startTime" format="HH:mm" value-format="HH:mm" placeholder="开始" style="width: 110px; margin-left: 4px;" />
          <el-time-picker v-model="s.endTime"   format="HH:mm" value-format="HH:mm" placeholder="结束" style="width: 110px; margin-left: 4px;" />
          <el-input v-model="s.reason" placeholder="原因(可选)" style="width: 140px; margin-left: 4px;" />
          <el-button @click="manualSlots.splice(i,1)" type="danger" plain size="small" style="margin-left: 4px;">×</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div v-if="parsedSlots.length" class="parsed-preview">
      <h4>解析结果 (共 {{ parsedSlots.length }} 条):</h4>
      <div v-for="(p, i) in parsedSlots" :key="i" class="parsed-row">
        <el-tag size="small">{{ formatSlot(p) }}</el-tag>
        <span v-if="p.reason" class="reason">{{ p.reason }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="!parsedSlots.length" :loading="saving" @click="onConfirm">
        确认写入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { scheduleService } from '@/api/schedule'

const props = defineProps({
  visible:  { type: Boolean, default: false },
  target:   { type: String, required: true },  // 'student' / 'room' / 'teacher'
  targetId: { type: String, required: true }
})
const emit = defineEmits(['update:visible', 'saved'])

const targetLabel = computed(() => ({ student: '学生', teacher: '老师', room: '教室' }[props.target] || props.target))

const weekOptions = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const mode        = ref('ai')
const text        = ref('')
const parsing     = ref(false)
const parseError  = ref('')
const parsedSlots = ref([])    // TimeBlock[]
const manualSlots = ref([])   // 半成品
const saving      = ref(false)

const addSlot = () => {
  manualSlots.value.push({
    type: 'dow', dayOfWeek: 1, date: '', dateRange: [],
    startTime: '19:00', endTime: '21:00', reason: ''
  })
}
const resetManual = (s) => { s.date = ''; s.dateRange = []; s.dayOfWeek = 1 }

watch(manualSlots, (list) => {
  // 实时把 manualSlots 转成 parsedSlots
  const out = [];
  for (const s of list) {
    const item = { startTime: s.startTime, endTime: s.endTime, reason: s.reason || '' };
    if (s.type === 'dow') item.dayOfWeek = s.dayOfWeek;
    else if (s.type === 'date') item.date = s.date;
    else if (s.type === 'range' && s.dateRange && s.dateRange.length === 2) {
      item.dateRange = { from: s.dateRange[0], to: s.dateRange[1] };
    }
    if (item.startTime && item.endTime) out.push(item);
  }
  parsedSlots.value = out;
}, { deep: true })

const onParse = async () => {
  if (!text.value.trim()) { ElMessage.warning('请输入文本'); return }
  parsing.value = true
  parseError.value = ''
  try {
    const { data } = await scheduleService.parseSlots({
      text: text.value, context: props.target
    })
    const slots = data?.data?.slots || []
    const err = data?.data?.error
    if (err) {
      parseError.value = ({
        'llm_not_configured': '未配置 LLM_API_KEY, 请先在 .env 配 LLM_API_KEY (默认走 DeepSeek), 请用手动选时段',
        'llm_unavailable':    'AI 服务暂不可用, 请用手动选时段',
        'llm_empty_response': 'AI 返回为空, 请用手动选时段',
        'llm_invalid_json':   'AI 返回格式异常, 请用手动选时段'
      })[err] || `AI 错误: ${err}`
    }
    parsedSlots.value = slots
    if (!slots.length && !err) parseError.value = '未解析出任何时段, 请调整描述或用手动选时段'
  } catch (e) {
    parseError.value = '解析失败, 请用手动选时段'
  } finally {
    parsing.value = false
  }
}

const onConfirm = async () => {
  saving.value = true
  try {
    await scheduleService.confirmSlots({
      target: props.target, targetId: props.targetId,
      slots: parsedSlots.value, mode: 'append'
    })
    ElMessage.success('已写入')
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '写入失败')
  } finally {
    saving.value = false
  }
}

const formatSlot = (p) => {
  if (p.dayOfWeek !== undefined) return `周${['日','一','二','三','四','五','六'][p.dayOfWeek]} ${p.startTime}-${p.endTime}`
  if (p.date) return `${p.date} ${p.startTime}-${p.endTime}`
  if (p.dateRange) return `${p.dateRange.from} ~ ${p.dateRange.to} ${p.startTime}-${p.endTime}`
  return JSON.stringify(p)
}
</script>

<style scoped>
.manual-slot { display: flex; align-items: center; margin-top: 8px; flex-wrap: wrap; gap: 4px; }
.parsed-preview { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
.parsed-preview h4 { margin: 0 0 8px 0; font-size: 13px; }
.parsed-row { padding: 4px 0; }
.reason { margin-left: 8px; color: #909399; font-size: 12px; }
</style>
