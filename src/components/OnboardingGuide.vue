<template>
  <!--
    通用 Onboarding 引导宿主组件
    业务侧只需：
      1) import { useTour } from '@/composables/useTour'
      2) const tour = useTour('dashboard')
      3) onMounted(() => { tour.register(steps); if (!tour.hasSeen()) tour.start() })
      4) <OnboardingGuide tour-key="dashboard" :steps="mySteps" />
  -->
  <el-tour
    v-if="steps.length"
    :model-value="isActive"
    @update:model-value="handleVisibleChange"
    @finish="handleFinish"
    @change="handleChange"
    :close-on-press-escape="true"
    :mask="true"
    placement="top"
  >
    <el-tour-step
      v-for="(step, idx) in steps"
      :key="idx"
      :target="step.target"
      :title="step.title"
      :description="step.description"
      :placement="step.placement || 'top'"
    />
  </el-tour>
</template>

<script setup>
import { computed, onBeforeMount, onMounted } from 'vue'
import { useTour, hasSeenTour, startTour, activeKey } from '../composables/useTour'

const props = defineProps({
  /**
   * 引导 key，对应 useTour(key) 的 key
   */
  tourKey: {
    type: String,
    required: true
  },
  /**
   * 是否首次访问自动启动
   */
  autoStart: {
    type: Boolean,
    default: true
  },
  /**
   * 引导步骤列表
   * [{ target, title, description, placement? }]
   */
  steps: {
    type: Array,
    required: true
  }
})

const tour = useTour(props.tourKey)

onBeforeMount(() => {
  // 注册到全局 registry
  tour.register(props.steps)
})

onMounted(() => {
  if (props.autoStart && !hasSeenTour(props.tourKey)) {
    startTour(props.tourKey)
  }
})

/** 当前引导是否处于活动状态（true 当且仅当活动 key 等于本组件的 key） */
const isActive = computed(() => activeKey.value === props.tourKey)

/** el-tour 的 v-model 回调，false 表示用户关闭了引导 */
const handleVisibleChange = (val) => {
  if (!val) tour.end()
}

const handleFinish = () => {
  // 用户点 "完成"
  tour.end()
}

const handleChange = (index) => {
  // 同步到 composable（让外部 useTour 知道当前步）
  if (typeof index === 'number') {
    // useTour 内部通过 currentStep 单向数据流即可，不直接提供 setter
    // 这里仅用于"查看进度"等扩展场景
  }
}
</script>
