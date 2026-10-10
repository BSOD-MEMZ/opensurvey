<template>
  <button
    type="button"
    class="sk-back"
    :class="[`sk-back--${size}`, { 'sk-back--plain': plain }]"
    :title="title"
    :aria-label="title"
    @click="emit('click', $event)"
  >
    <span class="sk-back__icon" aria-hidden="true"></span>
  </button>
</template>

<script setup lang="ts">
/**
 * pjsk 风格圆形返回按钮。
 * 原型取自 CppSekai 下载页（D:\Dev\xxt85web\support\CppSekai\download.html）的 .back-home：
 * 白色圆片 + 柔和光晕，按下时整颗变青绿、图标跟着 currentColor 走。
 * 图标是站长给的 assets/back.png（这里放在 /imgs/icons/back-arrow.png），用 mask 上色。
 *
 * 只负责"长什么样 + 点一下"；跳到哪儿由父组件决定（@click）。
 */
interface Props {
  /** sm 34px / md 44px / lg 58px */
  size?: 'sm' | 'md' | 'lg'
  title?: string
  /** 嵌在纯白工具条里时用，去掉外发光只留细描边 */
  plain?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  title: '返回',
  plain: false
})

const emit = defineEmits<{ (ev: 'click', e: MouseEvent): void }>()
</script>

<style lang="scss" scoped>
.sk-back {
  --sk-back-size: 44px;
  --sk-back-icon: 22px;
  --sk-back-bg: #fff;
  --sk-back-fg: var(--sk-ink, #444466);
  --sk-back-accent: var(--sk-teal, #77eedd);

  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--sk-back-size);
  height: var(--sk-back-size);
  padding: 0;
  border: 1px solid rgba(68, 68, 102, 0.12);
  border-radius: 50%;
  background: var(--sk-back-bg);
  color: var(--sk-back-fg);
  box-shadow: 0 0 14px rgba(68, 68, 102, 0.3);
  cursor: pointer;
  transition: background 0.16s cubic-bezier(0.33, 0, 0.2, 1),
    color 0.16s cubic-bezier(0.33, 0, 0.2, 1),
    box-shadow 0.16s cubic-bezier(0.33, 0, 0.2, 1), transform 0.16s cubic-bezier(0.33, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 18px rgba(68, 68, 102, 0.36);
  }

  &:active {
    transform: none;
    background: var(--sk-back-accent);
    color: var(--sk-back-fg);
    box-shadow: 0 0 8px rgba(68, 68, 102, 0.5);
  }
}

.sk-back__icon {
  display: block;
  width: var(--sk-back-icon);
  height: var(--sk-back-icon);
  background-color: currentColor;
  -webkit-mask-image: url('/imgs/icons/back-arrow.png');
  mask-image: url('/imgs/icons/back-arrow.png');
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.sk-back--sm {
  --sk-back-size: 34px;
  --sk-back-icon: 16px;
}

.sk-back--lg {
  --sk-back-size: 58px;
  --sk-back-icon: 29px;
}

.sk-back--plain {
  border-color: rgba(68, 68, 102, 0.1);
  box-shadow: none;

  &:hover {
    box-shadow: 0 2px 10px rgba(68, 68, 102, 0.16);
  }
}
</style>
