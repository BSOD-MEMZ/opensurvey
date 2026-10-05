<template>
  <span class="qtype-icon" v-html="markup"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 题型图标（内联 SVG）
 *
 * 为什么不用图标字体：原图标的 iconfont 里根本没有矩阵/排序/滑块等字形的定义，
 * 而且字体走远程 CDN（离线部署直接没图标）。内联 SVG 与主题同色、可离线、可随时加题型。
 */
const props = defineProps<{
  type: string
}>()

const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'

const ICONS: Record<string, string> = {
  text: `
    <rect x="3.5" y="7" width="17" height="10" rx="3" ${S}/>
    <path d="M7.5 12h6" ${S}/>`,

  textarea: `
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" ${S}/>
    <path d="M7 9h10M7 12.5h10M7 16h5.5" ${S}/>`,

  date: `
    <rect x="3.5" y="5.5" width="17" height="14" rx="3" ${S}/>
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" ${S}/>
    <circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none"/>`,

  time: `
    <circle cx="12" cy="12" r="8.2" ${S}/>
    <path d="M12 7.6V12l3.2 2" ${S}/>`,

  select: `
    <rect x="3.5" y="7" width="17" height="10" rx="3" ${S}/>
    <path d="M7.5 12h5.5M15.6 10.4 17.4 12l-1.8 1.6" ${S}/>`,

  upload: `
    <path d="M12 16.5V6.8" ${S}/>
    <path d="M8.6 10 12 6.6 15.4 10" ${S}/>
    <path d="M4.5 15v2.6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" ${S}/>`,

  'multi-fill': `
    <path d="M4 7h4.5M10.5 7h9.5M4 12h6.5M12.5 12h7.5M4 17h4M10 17h10" ${S}/>`,

  radio: `
    <circle cx="6.5" cy="8" r="2.6" ${S}/>
    <path d="M12.5 8h7.5" ${S}/>
    <circle cx="6.5" cy="16" r="2.6" ${S}/>
    <circle cx="6.5" cy="16" r="1" fill="currentColor" stroke="none"/>
    <path d="M12.5 16h7.5" ${S}/>`,

  checkbox: `
    <rect x="4" y="5.6" width="5" height="5" rx="1.6" ${S}/>
    <path d="M5.4 8.2 6.6 9.4 8 7.2" ${S}/>
    <path d="M12.5 8.1h7.5" ${S}/>
    <rect x="4" y="13.4" width="5" height="5" rx="1.6" ${S}/>
    <path d="M12.5 15.9h7.5" ${S}/>`,

  'binary-choice': `
    <circle cx="6.6" cy="8.4" r="2.5" ${S}/>
    <path d="M5.5 8.4 6.3 9.2 7.8 7.5" ${S}/>
    <path d="M12.6 8.4h7.4" ${S}/>
    <circle cx="6.6" cy="15.6" r="2.5" ${S}/>
    <path d="M5.6 14.6 7.6 16.6M7.6 14.6 5.6 16.6" ${S}/>
    <path d="M12.6 15.6h7.4" ${S}/>`,

  'radio-star': `
    <path d="M12 4.6 14 9.4l5.2.4-4 3.4 1.2 5.1L12 15.6 7.6 18.3l1.2-5.1-4-3.4 5.2-.4z" ${S}/>`,

  'radio-nps': `
    <path d="M4 12h16" ${S}/>
    <circle cx="6.4" cy="12" r="1.5" ${S}/>
    <circle cx="12" cy="12" r="1.5" ${S}/>
    <circle cx="17.6" cy="12" r="1.5" ${S}/>
    <path d="M4 8.6v6.8M20 8.6v6.8" ${S}/>`,

  vote: `
    <path d="M4.5 19.5h15" ${S}/>
    <rect x="5.5" y="12" width="3.4" height="5.4" rx="1" ${S}/>
    <rect x="10.3" y="7.5" width="3.4" height="9.9" rx="1" ${S}/>
    <rect x="15.1" y="10" width="3.4" height="7.4" rx="1" ${S}/>`,

  'image-radio': `
    <rect x="3.5" y="5" width="17" height="14" rx="3" ${S}/>
    <circle cx="8.6" cy="10.2" r="1.7" ${S}/>
    <path d="M4.5 16.4 9.6 12l3.2 2.7 3-2.4 3.7 3.1" ${S}/>`,

  'image-checkbox': `
    <rect x="3.5" y="5" width="17" height="14" rx="3" ${S}/>
    <path d="M7.6 12.2 10 14.6 15.4 9" ${S}/>`,

  proportion: `
    <circle cx="12" cy="12" r="8.2" ${S}/>
    <path d="M12 3.8V12l7.1 4.1" ${S}/>`,

  cascader: `
    <rect x="3.5" y="4.8" width="6.6" height="6.6" rx="1.6" ${S}/>
    <rect x="13.9" y="12.6" width="6.6" height="6.6" rx="1.6" ${S}/>
    <path d="M10.1 8.1h4.2a2 2 0 0 1 2 2v2.5" ${S}/>`,

  'matrix-radio': `
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" ${S}/>
    <path d="M3.5 9.6h17M3.5 14.7h17M9.2 4.5v15M14.8 4.5v15" ${S}/>
    <circle cx="12" cy="12.1" r="1.3" fill="currentColor" stroke="none"/>`,

  'matrix-scale': `
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" ${S}/>
    <path d="M3.5 9.6h17M3.5 14.7h17M9.2 4.5v15M14.8 4.5v15" ${S}/>`,

  'matrix-checkbox': `
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" ${S}/>
    <path d="M3.5 12h17M12 4.5v15" ${S}/>
    <path d="M5.6 7.4 6.9 8.7 9 6.3" ${S}/>`,

  'matrix-input': `
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" ${S}/>
    <path d="M3.5 12h17M12 4.5v15" ${S}/>
    <path d="M6 9.7h3M14.5 9.7h3M6 16.7h3M14.5 16.7h3" ${S}/>`,

  sort: `
    <path d="M4.5 7.5h13" ${S}/>
    <path d="M4.5 12h9.5" ${S}/>
    <path d="M4.5 16.5h6.5" ${S}/>
    <path d="M18.6 13.4v5.4M16.8 17.2l1.8 1.8 1.8-1.8" ${S}/>`,

  slider: `
    <path d="M4 12h16" ${S}/>
    <circle cx="14.6" cy="12" r="2.6" fill="#fff" ${S}/>`,

  section: `
    <path d="M4.5 6.8h15M4.5 11h15M4.5 15.2h9.5" ${S}/>`,

  calculation: `
    <rect x="5" y="3.8" width="14" height="16.4" rx="3" ${S}/>
    <path d="M8.2 8.4h7.6" ${S}/>
    <circle cx="9.2" cy="13" r="1" fill="currentColor" stroke="none"/>
    <circle cx="14.8" cy="13" r="1" fill="currentColor" stroke="none"/>
    <circle cx="9.2" cy="17" r="1" fill="currentColor" stroke="none"/>
    <circle cx="14.8" cy="17" r="1" fill="currentColor" stroke="none"/>`,

  'selectMoreModule': `
    <rect x="3.5" y="5" width="17" height="14" rx="3" ${S}/>
    <path d="M7 9.5h10M7 13h10" ${S}/>`
}

const markup = computed(
  () =>
    `<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">${
      ICONS[props.type] || ICONS.text
    }</svg>`
)
</script>

<style lang="scss" scoped>
.qtype-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  line-height: 1;
  color: $font-color-title;
}
</style>
