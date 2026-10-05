<template>
  <div class="calc-fields-setter">
    <p v-if="!candidates.length" class="empty">当前没有可参与计算的题目</p>

    <template v-else>
      <div v-for="(item, index) in candidates" :key="item.field" class="field-row">
        <el-checkbox :model-value="isChecked(item.field)" @change="toggle(item)">
          <span class="field-title">{{ item.index }}. {{ item.label }}</span>
        </el-checkbox>
        <span v-if="varName(item.field)" class="var-name">{{ varName(item.field) }}</span>
      </div>
    </template>

    <p class="tip">
      勾选要参与计算的题目，它们会按顺序对应公式里的 Q1、Q2…；非数字答案按 0 参与计算。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { get as _get } from 'lodash-es'

import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'
import { useEditStore } from '@/management/stores/edit'

interface Props {
  formConfig: any
}

interface Emit {
  (ev: typeof FORM_CHANGE_EVENT_KEY, arg: { key: string; value: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const editStore = useEditStore()

// 这些题型不产生可参与计算的数值
const EXCLUDED = ['section', 'upload', 'image-radio', 'image-checkbox', 'multi-fill']

const currentField = computed(() => _get(editStore, 'moduleConfig.field'))

const candidates = computed(() => {
  const list = (editStore.questionDataList || []) as Array<any>
  let index = 0
  return list
    .filter((item) => item && item.field && item.field !== currentField.value)
    .filter((item) => !EXCLUDED.includes(item.type))
    .map((item) => {
      index += 1
      return {
        field: item.field,
        label: String(item.title || item.field).replace(/<[^>]+>/g, '').slice(0, 30) || item.field,
        index
      }
    })
})

const selected = computed(() => {
  const value = props.formConfig?.value
  return Array.isArray(value) ? value : []
})

const isChecked = (field: string) => selected.value.some((item: any) => item.field === field)

const varName = (field: string) => {
  const index = selected.value.findIndex((item: any) => item.field === field)
  return index >= 0 ? `Q${index + 1}` : ''
}

const toggle = (item: { field: string; label: string }) => {
  const next = isChecked(item.field)
    ? selected.value.filter((row: any) => row.field !== item.field)
    : [...selected.value, { field: item.field, label: item.label }]

  emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key || 'calcFields', value: next })
}
</script>

<style lang="scss" scoped>
.calc-fields-setter {
  .field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;

    .field-title {
      font-size: 13px;
      color: #444466;
    }

    .var-name {
      flex: 0 0 auto;
      padding: 0 8px;
      font-size: 12px;
      line-height: 20px;
      color: #1f8a7d;
      background: #eafcf9;
      border-radius: 10px;
    }
  }

  .tip {
    margin: 10px 0 0;
    font-size: 12px;
    color: #92949d;
    line-height: 1.6;
  }

  .empty {
    margin: 0;
    font-size: 13px;
    color: #92949d;
  }
}
</style>
