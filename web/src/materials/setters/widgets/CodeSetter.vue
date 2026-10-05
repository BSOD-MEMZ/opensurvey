<template>
  <div class="code-setter">
    <el-input
      class="code-input"
      v-model="inputValue"
      type="textarea"
      :rows="rows"
      :placeholder="placeholder"
      spellcheck="false"
      resize="vertical"
    />
    <div v-if="hint" class="code-hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'

interface IProps {
  formConfig: any
}

const props = defineProps<IProps>()
const emit = defineEmits([FORM_CHANGE_EVENT_KEY])

const inputValue = ref(props.formConfig.value || '')

const rows = computed(() => props.formConfig.rows || 10)
const placeholder = computed(() => props.formConfig.placeholder || '')
const hint = computed(() => props.formConfig.hint || '')

watch(inputValue, (newValue) => {
  emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key, value: newValue })
})

watch(
  () => props.formConfig.value,
  (newValue) => {
    if (newValue !== inputValue.value) inputValue.value = newValue || ''
  }
)
</script>

<style lang="scss" scoped>
.code-setter {
  width: 100%;
}

.code-input {
  :deep(textarea) {
    font-family: 'Cascadia Code', Consolas, 'SF Mono', Menlo, Monaco, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #2f3a5c;
    background: #fbfcfe;
  }
}

.code-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #8a8aa8;
}
</style>
