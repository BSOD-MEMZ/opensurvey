<template>
  <div
    ref="rootEl"
    class="sekai-bg"
    :data-budget="budget"
    :data-scrolling="scrolling ? 'true' : 'false'"
    aria-hidden="true"
  >
    <div
      v-for="spec in LAYER_SPEC"
      :key="spec.layer"
      class="sekai-bg__layer"
      :class="`sekai-bg__layer${spec.layer}`"
    >
      <span
        v-for="shape in byLayer[spec.layer]"
        :key="shape.id"
        class="sekai-bg__float"
        :class="`sekai-bg__float${spec.layer}`"
        :style="{
          left: shape.left.toFixed(2) + '%',
          top: shape.top.toFixed(2) + '%',
          width: shape.size.toFixed(2) + 'px',
          height: shape.size.toFixed(2) + 'px'
        }"
      >
        <!-- 三角形：不规则三角 + 非等比缩放 + 斜切 + 旋转 -->
        <svg
          v-if="shape.type === 'triangle'"
          class="sekai-bg__shape sekai-bg__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          :style="{ color: shape.color, opacity: shape.opacity.toFixed(4) }"
        >
          <g :transform="triangleTransform(shape)">
            <polygon
              :points="TRIANGLE_POINTS"
              :fill="shape.filled ? 'currentColor' : 'none'"
              :stroke="shape.filled ? 'none' : 'currentColor'"
              stroke-width="1.4"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
          </g>
        </svg>
        <!-- 圆形：很小的实心点 -->
        <span
          v-else
          class="sekai-bg__shape sekai-bg__circle"
          :style="{ color: shape.color, opacity: shape.opacity.toFixed(4) }"
        ></span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { LAYER_SPEC, PARALLAX_RATES, TRIANGLE_POINTS, createShapes } from './shapes'

const props = defineProps({
  /** 'auto' = 按设备能力自动决定是否动画；'off' = 只保留渐变与点阵，不渲染漂浮形状 */
  mode: { type: String, default: 'auto' },
  /** 传同一个 seed 可得到完全相同的布局（截图比对用） */
  seed: { type: [Number, String], default: null }
})

const rootEl = ref(null)
const shapes = shallowRef([])
const budget = ref('on')
const scrolling = ref(false)
const enabled = ref(false)

const byLayer = computed(() => {
  const map = { 1: [], 2: [], 3: [] }
  for (const shape of shapes.value) map[shape.layer].push(shape)
  return map
})

const triangleTransform = (shape) =>
  `translate(50 50) scale(${shape.sx.toFixed(4)} ${shape.sy.toFixed(4)}) ` +
  `skewX(${shape.skew.toFixed(2)}) rotate(${shape.rotate.toFixed(2)}) translate(-50 -50)`

let ticking = false
let scrollIdleTimer = null

/** 取当前有效滚动距离：window 滚动与容器内滚动都支持 */
function readScrollY(target) {
  if (
    !target ||
    target === document ||
    target === document.documentElement ||
    target === window
  ) {
    return window.scrollY || document.documentElement.scrollTop || 0
  }
  return target.scrollTop || 0
}

function updateParallax(y) {
  const el = rootEl.value
  if (!el) return
  el.style.setProperty('--bg-layer-1-y', `${(y * PARALLAX_RATES[1]).toFixed(2)}px`)
  el.style.setProperty('--bg-layer-2-y', `${(y * PARALLAX_RATES[2]).toFixed(2)}px`)
  el.style.setProperty('--bg-layer-3-y', `${(y * PARALLAX_RATES[3]).toFixed(2)}px`)
  el.style.setProperty('--bg-base-y', `${(y * PARALLAX_RATES.base).toFixed(2)}px`)
}

function onScroll(event) {
  // 滚动期间暂停漂浮动画：和原站一致，主要是省电 / 避免抖动
  scrolling.value = true
  clearTimeout(scrollIdleTimer)
  scrollIdleTimer = setTimeout(() => {
    scrolling.value = false
  }, 160)

  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    updateParallax(readScrollY(event.target))
    ticking = false
  })
}

function detectBudget() {
  if (typeof window === 'undefined') return 'off'
  if (props.mode === 'off') return 'off'
  // 用户的系统级「减少动态效果」优先级最高
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'off'
  // 明显低配的设备不带这么多动效
  if ((navigator.hardwareConcurrency || 4) <= 2) return 'off'
  return 'on'
}

let mediaQuery = null

function applyBudget() {
  const next = detectBudget()
  budget.value = next
  if (next === 'on') {
    if (!enabled.value) {
      shapes.value = createShapes(props.seed == null ? undefined : props.seed)
      document.addEventListener('scroll', onScroll, { capture: true, passive: true })
      enabled.value = true
    }
  } else {
    teardown()
    shapes.value = []
  }
}

function teardown() {
  if (!enabled.value) return
  document.removeEventListener('scroll', onScroll, { capture: true })
  clearTimeout(scrollIdleTimer)
  enabled.value = false
}

onMounted(() => {
  applyBudget()
  // 系统动态效果开关变化时实时跟随
  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener?.('change', applyBudget)
  }
})

onBeforeUnmount(() => {
  teardown()
  mediaQuery?.removeEventListener?.('change', applyBudget)
})

defineExpose({ budget })
</script>

<style lang="scss">
/* ============================================================================
   pjsk.moe（Moesekai）同款背景 —— 规格 1:1 复刻自 https://pjsk.moe/zh-cn/
   渐变角度/光斑位置、点阵网格、三层视差系数、漂浮动画曲线均取自原站实测值。
   ========================================================================== */
.sekai-bg {
  /* 三个点缀色，默认就是原站的 miku 青 / comp 粉 / mid 黄 */
  --sk-bg-miku: 51, 204, 187;
  --sk-bg-comp: 255, 117, 168;
  --sk-bg-mid: 255, 235, 151;

  --bg-layer-1-y: 0px;
  --bg-layer-2-y: 0px;
  --bg-layer-3-y: 0px;
  --bg-base-y: 0px;

  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
  pointer-events: none;
  /* 负层级：永远在所有内容下面，不需要动现有布局的 z-index */
  z-index: -1;
  contain: paint size layout style;

  /* 主渐变：115° 三段 + 三个光斑 */
  background:
    linear-gradient(
      115deg,
      var(--theme-bg-light-start, #b6fffca6) 0%,
      var(--theme-bg-light-middle, #dceeff99) 45%,
      var(--theme-bg-light-end, #fee2f5a6) 100%
    ),
    radial-gradient(circle at 24% 15%, rgba(var(--sk-bg-miku), 0.25), transparent 22%),
    radial-gradient(circle at 82% 20%, rgba(var(--sk-bg-comp), 0.18), transparent 25%),
    radial-gradient(circle at 62% 80%, rgba(var(--sk-bg-mid), 0.2), transparent 28%);

  /* 细点阵，随页面滚动做最慢的一层视差 */
  &::before {
    content: '';
    position: absolute;
    inset: -30%;
    background-image: radial-gradient(rgba(var(--sk-bg-miku), 0.1) 1.5px, transparent 1.5px);
    background-size: 50px 50px;
    opacity: 0.72;
    transform: translate3d(0, var(--bg-base-y), 0);
    will-change: transform;
  }

  /* 大小不一的彩色圆点，三层网格错位叠出层次 */
  &::after {
    content: '';
    position: absolute;
    inset: -35%;
    background-image:
      radial-gradient(circle, rgba(var(--sk-bg-comp), 0.38) 0 3px, transparent 3.6px),
      radial-gradient(circle, rgba(var(--sk-bg-miku), 0.38) 0 3px, transparent 3.6px),
      radial-gradient(circle, #ffffff8c 0 2px, transparent 2.8px);
    background-position:
      15% 12%,
      82% 33%,
      45% 22%;
    background-size:
      380px 380px,
      460px 460px,
      290px 290px;
    opacity: 0.65;
    transform: translate3d(0, var(--bg-layer-3-y), 0);
    will-change: transform;
  }
}

/* 三个视差层：上下各留出一截，滚动时不会露出边缘 */
.sekai-bg__layer {
  position: absolute;
  inset: -40% 0 -60%;
  z-index: 0;
  pointer-events: none;
  will-change: transform;
}

.sekai-bg__layer1 {
  transform: translate3d(0, var(--bg-layer-1-y), 0);
}
.sekai-bg__layer2 {
  transform: translate3d(0, var(--bg-layer-2-y), 0);
}
.sekai-bg__layer3 {
  transform: translate3d(0, var(--bg-layer-3-y), 0);
}

.sekai-bg__float {
  display: block;
  position: absolute;
}

.sekai-bg__shape {
  display: block;
  position: absolute;
  inset: 0;
  transform-origin: 50%;
}

.sekai-bg__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.sekai-bg__circle {
  background: currentColor;
  border-radius: 999px;
}

/* 三组漂浮动画：周期与位移各不相同，避免看出规律 */
@keyframes sekai-bg-float-1 {
  0% {
    transform: translate(0, 0) rotate(0) scale(1);
  }
  50% {
    transform: translate(8px, -30px) rotate(6deg) scale(1.04);
  }
  100% {
    transform: translate(-8px, 30px) rotate(-6deg) scale(0.97);
  }
}

@keyframes sekai-bg-float-2 {
  0% {
    transform: translate(0, 0) rotate(0) scale(1);
  }
  50% {
    transform: translate(-7px, 22px) rotate(-5deg) scale(1.05);
  }
  100% {
    transform: translate(7px, -22px) rotate(5deg) scale(0.96);
  }
}

@keyframes sekai-bg-float-3 {
  0% {
    transform: translate(0, 0) rotate(0) scale(1);
  }
  50% {
    transform: translate(5px, -16px) rotate(4deg) scale(1.06);
  }
  100% {
    transform: translate(-5px, 16px) rotate(-4deg) scale(0.95);
  }
}

.sekai-bg__float1 {
  animation: sekai-bg-float-1 11s ease-in-out infinite alternate;
}
.sekai-bg__float2 {
  animation: sekai-bg-float-2 14s ease-in-out infinite alternate;
}
.sekai-bg__float3 {
  animation: sekai-bg-float-3 18s ease-in-out infinite alternate;
}

/* 滚动中暂停漂浮，减少重绘 */
.sekai-bg[data-scrolling='true'] {
  .sekai-bg__float1,
  .sekai-bg__float2,
  .sekai-bg__float3 {
    animation-play-state: paused;
  }
}

/* 降级：去掉彩色圆点与漂浮形状，点阵也压淡，只留渐变 */
.sekai-bg[data-budget='off'] {
  background:
    linear-gradient(
      115deg,
      var(--theme-bg-light-start, #b6fffc80) 0%,
      var(--theme-bg-light-middle, #dceeff75) 48%,
      var(--theme-bg-light-end, #fee2f580) 100%
    ),
    radial-gradient(circle at 20% 12%, rgba(var(--sk-bg-miku), 0.14), transparent 26%),
    radial-gradient(circle at 86% 20%, rgba(var(--sk-bg-comp), 0.1), transparent 28%),
    radial-gradient(circle at 58% 86%, rgba(var(--sk-bg-mid), 0.12), transparent 30%);

  &::before {
    opacity: 0.26;
    will-change: auto;
    transform: none;
  }

  &::after {
    opacity: 0;
    will-change: auto;
    transform: none;
  }

  .sekai-bg__layer {
    display: none;
  }
}

/* 小屏逐级减少形状数量（和原站断点一致） */
@media (max-width: 1024px) {
  .sekai-bg__layer1 .sekai-bg__float:nth-child(n + 10),
  .sekai-bg__layer2 .sekai-bg__float:nth-child(n + 9),
  .sekai-bg__layer3 .sekai-bg__float:nth-child(n + 6) {
    display: none;
  }
}

@media (max-width: 640px) {
  .sekai-bg__layer1 .sekai-bg__float:nth-child(n + 6),
  .sekai-bg__layer2 .sekai-bg__float:nth-child(n + 5),
  .sekai-bg__layer3 .sekai-bg__float:nth-child(n + 3) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sekai-bg__float1,
  .sekai-bg__float2,
  .sekai-bg__float3 {
    animation: none;
  }

  .sekai-bg__layer,
  .sekai-bg::before,
  .sekai-bg::after {
    transition: none;
  }
}
</style>
