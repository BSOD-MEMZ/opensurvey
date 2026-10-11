<template>
  <div class="word-cloud">
    <div v-if="!words.length" class="word-cloud__empty">暂无可用词语</div>
    <div v-else class="word-cloud__canvas">
      <span
        v-for="(word, index) in words"
        :key="word.name + index"
        class="word-cloud__word"
        :title="`${word.name} · 出现 ${word.value} 次`"
        :style="{
          fontSize: word.size + 'px',
          color: word.color,
          transform: word.tilt ? `rotate(${word.tilt}deg)` : 'none'
        }"
      >
        {{ word.name }}
      </span>
    </div>
    <p v-if="words.length" class="word-cloud__tip">
      按词频排序，共 {{ words.length }} 个高频词（鼠标悬停看出现次数）
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface WordItem {
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{
    data?: WordItem[]
  }>(),
  { data: () => [] }
)

// pjsk 味的粉/青/紫/黄/蓝轮转
const PALETTE = ['#2fa596', '#ff5599', '#6d6cf0', '#e8a33d', '#3fa9f5', '#c86bdd', '#3fb98f']
const TILTS = [0, 0, 0, -6, 6, 0, 0, -10, 10, 0]

const words = computed(() => {
  const list = (props.data || []).filter((item) => item && item.name)
  if (!list.length) return []
  const max = list[0].value || 1
  const min = list[list.length - 1].value || 1
  return list.map((item, index) => {
    // 用平方根压一压，避免第一名特别大、后面全是小字
    const ratio = max === min ? 1 : (Math.sqrt(item.value) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
    return {
      ...item,
      size: Math.round(15 + ratio * 23),
      color: PALETTE[index % PALETTE.length],
      tilt: TILTS[index % TILTS.length]
    }
  })
})
</script>

<style lang="scss" scoped>
.word-cloud {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__canvas {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    align-items: center;
    justify-content: center;
    gap: 10px 18px;
    overflow: auto;
    padding: 8px 4px;
  }

  &__word {
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.02em;
    cursor: default;
    transition: transform 0.16s ease, filter 0.16s ease;

    &:hover {
      filter: brightness(0.88);
      transform: scale(1.08) !important;
    }
  }

  &__empty,
  &__tip {
    text-align: center;
    font-size: 12px;
    color: #8a8aa8;
  }

  &__empty {
    margin: auto;
  }

  &__tip {
    flex: none;
    padding-top: 6px;
  }
}
</style>
