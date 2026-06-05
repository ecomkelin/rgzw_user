<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="640px"
    :before-close="onClose"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-descriptions
      :column="column"
      :border="border"
      direction="vertical"
      class="detail-dialog__desc"
    >
      <el-descriptions-item
        v-for="row in rows"
        :key="row.label"
        :label="row.label"
      >
        <component
          :is="row.render ? 'span' : 'span'"
          :class="row.render ? 'detail-dialog__rendered' : null"
          v-html="row.render ? row.render(row.data) : formatValue(row.data[row.field])"
        />
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="onClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 通用详情查看对话框（替代散落的 ElMessageBox.alert + dangerouslyUseHTMLString）
 *
 * 用法：
 *   <DetailDialog
 *     v-model="detailVisible"
 *     title="用户详情"
 *     :data="currentRow"
 *     :rows="userDetailRows"
 *   />
 *
 * 其中 userDetailRows 形如：
 *   [
 *     { label: '姓名', field: 'name' },
 *     { label: '角色', field: 'roleTemp', render: r => formatUserRole(r.roleTemp) },
 *     { label: '所属组织', field: 'Org.name' }
 *   ]
 *
 * - `field` 支持点号路径（如 'Org.name'），自动取值
 * - `render(row)` 走 v-html（注意 XSS：永远不要把 row 中用户输入的原始字符串
 *   直接 render，必须用 formatter / 转义函数包一下）
 * - `label` 必须是中文标签，不要把字段名作为 label
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '详情' },
  data: { type: Object, default: () => ({}) },
  rows: { type: Array, required: true },
  column: { type: Number, default: 2 },
  border: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

// 把 'Org.name' 这种点号路径安全解析为 row[key1][key2]
const getByPath = (obj, path) => {
  if (!obj || !path) return undefined
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

// 当行没有 render 时，回退到用 field 路径取值；空值展示 '-'；非字符串原样 stringify
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const rows = computed(() => props.rows.map(r => ({
  ...r,
  data: props.data
})))

const onClose = () => emit('update:modelValue', false)
</script>

<style scoped>
.detail-dialog__desc {
  padding: 4px 0;
}
.detail-dialog__rendered :deep(*) {
  /* 确保渲染出的 HTML 与 Element Plus 风格一致 */
  line-height: 1.6;
}
</style>
