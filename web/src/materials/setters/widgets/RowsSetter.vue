<template>
  <div class="rows-setter">
    <el-input
      v-model="text"
      type="textarea"
      :rows="6"
      resize="vertical"
      :placeholder="formConfig.placeholder || '每行一个项目，可批量粘贴'"
      @blur="handleBlur"
    />
    <p class="rows-tip">共 {{ rowCount }} 行 · 每行一个项目，回车换行</p>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'
import { hashGen } from '@/materials/questions/common/utils/getOptionHash'

interface Props {
  formConfig: any
}

interface Emit {
  (ev: typeof FORM_CHANGE_EVENT_KEY, arg: { key: string; value: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const toLines = (rows: any) => {
  if (!Array.isArray(rows)) {
    return []
  }
  return rows.map((item) => (item && typeof item === 'object' ? String(item.text ?? '') : String(item ?? '')))
}

const text = ref(toLines(props.formConfig.value).join('\n'))

const rowCount = computed(() => text.value.split('\n').filter((line) => line.trim()).length)

const handleBlur = () => {
  const lines = text.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const previous = Array.isArray(props.formConfig.value) ? props.formConfig.value : []

  const next = lines.map((line, index) => {
    const old = previous[index]
    // 同一位置内容未变则复用原 hash，避免已有答案对不上
    if (old && old.text === line && old.hash) {
      return { text: line, hash: old.hash }
    }
    return { text: line, hash: hashGen.getHash() }
  })

  const changed =
    next.length !== previous.length || next.some((item, index) => previous[index]?.text !== item.text)

  if (changed) {
    emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key, value: next })
  }
}

watch(
  () => props.formConfig.value,
  (value) => {
    const current = toLines(value).join('\n')
    if (current !== text.value) {
      text.value = current
    }
  }
)
</script>
<style lang="scss" scoped>
.rows-setter {
  .rows-tip {
    margin: 6px 0 0;
    font-size: 12px;
    color: #92949d;
    line-height: 1.5;
  }
}
</style>
