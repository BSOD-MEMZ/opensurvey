<template>
  <div class="screen-page">
    <!-- 背景层：径向光晕 + 网格 + 扫描线 -->
    <div class="bg">
      <div class="bg__glow bg__glow--1"></div>
      <div class="bg__glow bg__glow--2"></div>
      <div class="bg__glow bg__glow--3"></div>
      <div class="bg__grid"></div>
      <div class="bg__scan"></div>
    </div>

    <div class="screen-body">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar__side">
          <span class="live-dot" :class="{ 'is-off': !online }"></span>
          <span class="live-text">{{ online ? '数据实时同步中' : '连接中断' }}</span>
        </div>
        <div class="topbar__center">
          <h1 class="title">{{ title }}</h1>
          <p class="subtitle">数 据 监 控 大 屏</p>
        </div>
        <div class="topbar__side topbar__side--right">
          <span class="clock">{{ clock }}</span>
          <el-button class="exit-btn" link @click="exit">退出</el-button>
        </div>
      </header>

      <!-- 主体：左 / 中 / 右 三栏 -->
      <main class="grid">
        <!-- 左栏 -->
        <section class="col col--left">
          <div class="panel panel--kpi">
            <div class="panel__head"><i class="bar"></i>回收概览</div>
            <div class="kpi-list">
              <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
                <div class="kpi__label">{{ kpi.label }}</div>
                <div class="kpi__value">
                  <span class="num">{{ kpi.display }}</span>
                  <span class="unit">{{ kpi.unit }}</span>
                </div>
                <div class="kpi__bar">
                  <span :style="{ width: kpi.percent + '%' }"></span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel panel--grow">
            <div class="panel__head"><i class="bar"></i>各题分布</div>
            <div class="question-list">
              <div
                v-for="q in questions"
                :key="q.field"
                class="question"
                :class="{ 'is-active': activeField === q.field }"
                @click="focusQuestion(q)"
              >
                <div class="question__title">{{ cleanTitle(q.title) }}</div>
                <div class="question__rows">
                  <div v-for="opt in q.aggregation.slice(0, 4)" :key="opt.id" class="qrow">
                    <span class="qrow__name">{{ cleanTitle(opt.text) }}</span>
                    <span class="qrow__track">
                      <span
                        class="qrow__fill"
                        :style="{ width: percentOf(opt.count, q.aggregation[0]?.count || 1) + '%' }"
                      ></span>
                    </span>
                    <span class="qrow__num">{{ opt.count }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!questions.length" class="empty">暂无数据</div>
            </div>
          </div>
        </section>

        <!-- 中栏 -->
        <section class="col col--center">
          <div class="panel panel--chart">
            <div class="panel__head">
              <i class="bar"></i>近 24 小时回收趋势
              <span class="panel__extra">峰值 {{ peakHour.count }} 份 @ {{ peakHour.hour }}</span>
            </div>
            <div ref="trendRef" class="chart chart--trend"></div>
          </div>

          <div class="panel panel--chart">
            <div class="panel__head">
              <i class="bar"></i>{{ focused ? cleanTitle(focused.title) : '题目分布' }}
              <span class="panel__extra">{{ focused ? `共 ${focused.total} 次作答` : '点击左侧题目切换' }}</span>
            </div>
            <div ref="pieRef" class="chart chart--pie"></div>
          </div>
        </section>

        <!-- 右栏 -->
        <section class="col col--right">
          <div class="panel panel--fixed">
            <div class="panel__head"><i class="bar"></i>渠道来源</div>
            <div ref="channelRef" class="chart chart--channel"></div>
          </div>

          <div class="panel panel--grow">
            <div class="panel__head">
              <i class="bar"></i>最新答卷
              <span class="panel__extra">共 {{ overview.total }} 份</span>
            </div>
            <div class="feed">
              <transition-group name="feed">
                <div v-for="item in latest" :key="item.id" class="feed__item">
                  <div class="feed__time">{{ hhmm(item.createdAt) }}</div>
                  <div class="feed__body">
                    <div v-for="p in item.preview.slice(0, 2)" :key="p.field" class="feed__line">
                      <span class="feed__q">{{ cleanTitle(p.title) }}</span>
                      <span class="feed__a">{{ cleanTitle(p.text) }}</span>
                    </div>
                  </div>
                  <div v-if="item.flags.length" class="feed__flag">可疑</div>
                </div>
                <div v-if="!latest.length" key="empty" class="empty">等待第一份答卷…</div>
              </transition-group>
            </div>
          </div>
        </section>
      </main>

      <footer class="statusbar">
        <span>每 {{ refreshSeconds }} 秒自动刷新</span>
        <span class="statusbar__sep"></span>
        <span>最后更新 {{ lastUpdate }}</span>
        <span class="statusbar__spacer"></span>
        <span>{{ generatedAtText }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSurveyById } from '@/management/api/survey'
import { getScreenData } from '@/management/api/analysis'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const surveyId = route.params.id

const REFRESH_SECONDS = 10
const refreshSeconds = REFRESH_SECONDS

/* ---------- 状态 ---------- */
const title = ref('')
const online = ref(true)
const clock = ref('')
const lastUpdate = ref('—')
const generatedAtText = ref('')
const overview = ref({
  total: 0,
  todayTotal: 0,
  avgDuration: 0,
  lastSubmitAt: null
})
const hourly = ref([])
const channels = ref([])
const questions = ref([])
const latest = ref([])
const activeField = ref('')

/* ---------- 数字滚动 ---------- */
const animated = ref({ total: 0, todayTotal: 0, avgDuration: 0, peak: 0 })
function rollTo(key, target) {
  const from = animated.value[key] || 0
  const diff = target - from
  if (!diff) {
    return
  }
  const start = performance.now()
  const duration = 700
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration)
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3)
    animated.value = {
      ...animated.value,
      [key]: Math.round(from + diff * eased)
    }
    if (t < 1) {
      requestAnimationFrame(step)
    }
  }
  requestAnimationFrame(step)
}

const kpis = computed(() => {
  const total = overview.value.total || 0
  const today = overview.value.todayTotal || 0
  return [
    {
      label: '回收总量',
      display: animated.value.total,
      unit: '份',
      percent: Math.min(100, Math.max(6, total ? 100 : 0))
    },
    {
      label: '今日新增',
      display: animated.value.todayTotal,
      unit: '份',
      percent: total ? Math.max(6, Math.round((today / total) * 100)) : 0
    },
    {
      label: '平均用时',
      display: animated.value.avgDuration,
      unit: '秒',
      percent: Math.min(100, animated.value.avgDuration / 3)
    },
    {
      label: '峰值 / 小时',
      display: animated.value.peak,
      unit: '份',
      percent: Math.min(
        100,
        peakHour.value.count ? Math.max(6, peakHour.value.count * 8) : 0
      )
    }
  ]
})

const peakHour = computed(() => {
  let best = { hour: '—', count: 0 }
  for (const item of hourly.value) {
    if (item.count > best.count) {
      best = item
    }
  }
  return best
})

const focused = computed(
  () => questions.value.find((q) => q.field === activeField.value) || questions.value[0]
)

/* ---------- 工具 ---------- */
function cleanTitle(text) {
  if (!text) {
    return ''
  }
  return String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .slice(0, 40)
}

function hhmm(value) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function percentOf(value, max) {
  if (!max) {
    return 0
  }
  return Math.max(3, Math.round((value / max) * 100))
}

function updateClock() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  clock.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${week} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* ---------- 图表 ---------- */
const trendRef = ref(null)
const pieRef = ref(null)
const channelRef = ref(null)
const charts = shallowRef({})

const NEON = ['#22d3ee', '#2dd4bf', '#a78bfa', '#f472b6', '#fbbf24', '#60a5fa']

function initCharts() {
  charts.value = {
    trend: echarts.init(trendRef.value),
    pie: echarts.init(pieRef.value),
    channel: echarts.init(channelRef.value)
  }
}

/** 渐变：由亮到透明，用于折线面积 */
function areaGradient(color) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: color + '99' },
    { offset: 1, color: color + '00' }
  ])
}

function renderTrend() {
  const chart = charts.value.trend
  if (!chart) {
    return
  }
  const hours = hourly.value.map((h) => h.hour)
  const counts = hourly.value.map((h) => h.count)
  chart.setOption(
    {
      grid: { left: 42, right: 20, top: 24, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(8,16,36,.92)',
        borderColor: '#22d3ee66',
        textStyle: { color: '#d7e6ff', fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: hours,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#1e3a5f' } },
        axisLabel: { color: '#6f8db4', fontSize: 11, interval: 3 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '份',
        nameTextStyle: { color: '#6f8db4', fontSize: 11 },
        axisLabel: { color: '#6f8db4', fontSize: 11 },
        splitLine: { lineStyle: { color: '#12294a', type: 'dashed' } }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: counts,
          lineStyle: {
            width: 2.5,
            color: '#22d3ee',
            shadowColor: '#22d3ee',
            shadowBlur: 14
          },
          areaStyle: { color: areaGradient('#22d3ee') },
          emphasis: {
            itemStyle: { color: '#67e8f9', borderColor: '#22d3ee', borderWidth: 2 }
          }
        }
      ]
    },
    true
  )
}

function renderPie() {
  const chart = charts.value.pie
  if (!chart) {
    return
  }
  const q = focused.value
  const data = (q?.aggregation || []).filter((a) => a.count > 0).slice(0, 8)
  chart.setOption(
    {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(8,16,36,.92)',
        borderColor: '#2dd4bf66',
        textStyle: { color: '#d7e6ff', fontSize: 12 }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 8,
        top: 'center',
        textStyle: { color: '#9fb6d4', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
        pageTextStyle: { color: '#6f8db4' },
        formatter: (name) => (name.length > 12 ? name.slice(0, 12) + '…' : name)
      },
      color: NEON,
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['34%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: '#08122a',
            borderWidth: 2
          },
          label: {
            color: '#cfe3ff',
            fontSize: 12,
            formatter: '{d}%'
          },
          labelLine: { lineStyle: { color: '#2b4a72' } },
          data: data.map((a) => ({
            name: cleanTitle(a.text),
            value: a.count
          }))
        }
      ]
    },
    true
  )
}

function renderChannel() {
  const chart = charts.value.channel
  if (!chart) {
    return
  }
  const list = channels.value.slice(0, 6)
  const names = list.map((c) =>
    c.channelId === '__none__' ? '默认渠道' : String(c.channelId).slice(0, 10)
  )
  chart.setOption(
    {
      grid: { left: 8, right: 34, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(8,16,36,.92)',
        borderColor: '#a78bfa66',
        textStyle: { color: '#d7e6ff', fontSize: 12 }
      },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: names,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9fb6d4', fontSize: 11 }
      },
      series: [
        {
          type: 'bar',
          data: list.map((c, i) => ({
            value: c.count,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: NEON[i % NEON.length] + '55' },
                { offset: 1, color: NEON[i % NEON.length] }
              ])
            }
          })),
          barWidth: 12,
          label: {
            show: true,
            position: 'right',
            color: '#cfe3ff',
            fontSize: 11
          }
        }
      ]
    },
    true
  )
}

function focusQuestion(q) {
  activeField.value = q.field
  renderPie()
}

/* ---------- 取数 ---------- */
async function load() {
  try {
    const res = await getScreenData({ surveyId })
    if (res?.code !== 200) {
      online.value = false
      return
    }
    online.value = true
    const d = res.data
    overview.value = d.overview || overview.value
    hourly.value = d.hourly || []
    channels.value = d.channels || []
    questions.value = d.questions || []
    latest.value = d.latest || []
    if (!activeField.value && questions.value.length) {
      activeField.value = questions.value[0].field
    }
    rollTo('total', overview.value.total || 0)
    rollTo('todayTotal', overview.value.todayTotal || 0)
    rollTo('avgDuration', overview.value.avgDuration || 0)
    rollTo('peak', peakHour.value.count)
    lastUpdate.value = hhmm(new Date())
    generatedAtText.value = d.generatedAt
      ? '数据快照 ' + hhmm(d.generatedAt)
      : ''
    renderTrend()
    renderPie()
    renderChannel()
  } catch (e) {
    online.value = false
  }
}

async function loadTitle() {
  try {
    const res = await getSurveyById(surveyId)
    title.value = res?.data?.surveyMetaRes?.title || res?.data?.title || '数据大屏'
  } catch {
    title.value = '数据大屏'
  }
}

function exit() {
  router.push({ name: 'analysisPage', params: { id: surveyId } })
}

let refreshTimer = null
let clockTimer = null
function onResize() {
  Object.values(charts.value).forEach((c) => c?.resize?.())
}

onMounted(async () => {
  await loadTitle()
  initCharts()
  await load()
  updateClock()
  refreshTimer = setInterval(load, REFRESH_SECONDS * 1000)
  clockTimer = setInterval(updateClock, 1000)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  clearInterval(refreshTimer)
  clearInterval(clockTimer)
  window.removeEventListener('resize', onResize)
  Object.values(charts.value).forEach((c) => c?.dispose?.())
})
</script>

<style lang="scss" scoped>
$ink: #d7e6ff;
$dim: #7f9ac0;
$line: #16305a;

.screen-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #04081a;
  color: $ink;
  font-family: var(--el-font-family);
}

/* ---------- 背景 ---------- */
.bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.5;

    &--1 {
      width: 620px;
      height: 620px;
      left: -160px;
      top: -200px;
      background: radial-gradient(circle, #0ea5e9, transparent 70%);
    }

    &--2 {
      width: 560px;
      height: 560px;
      right: -140px;
      top: 8%;
      background: radial-gradient(circle, #6366f1, transparent 70%);
    }

    &--3 {
      width: 700px;
      height: 700px;
      left: 32%;
      bottom: -320px;
      background: radial-gradient(circle, #0d9488, transparent 70%);
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(#1e3a5f33 1px, transparent 1px),
      linear-gradient(90deg, #1e3a5f33 1px, transparent 1px);
    background-size: 46px 46px;
    mask-image: radial-gradient(circle at 50% 45%, #000 20%, transparent 78%);
  }

  &__scan {
    position: absolute;
    left: 0;
    right: 0;
    height: 180px;
    background: linear-gradient(180deg, transparent, #22d3ee14, transparent);
    animation: scan 9s linear infinite;
  }
}

@keyframes scan {
  0% {
    top: -180px;
  }
  100% {
    top: 100%;
  }
}

.screen-body {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 20px 10px;
  box-sizing: border-box;
}

/* ---------- 顶栏 ---------- */
.topbar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid $line;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -1px;
    width: 220px;
    height: 2px;
    transform: translateX(-50%);
    background: linear-gradient(90deg, transparent, #22d3ee, transparent);
  }

  &__side {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: $dim;

    &--right {
      justify-content: flex-end;
    }
  }

  &__center {
    flex: none;
    text-align: center;
  }

  .title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #7dd3fc, #5eead4, #a78bfa);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    letter-spacing: 8px;
    color: #4f6f9c;
  }

  .clock {
    font-size: 14px;
    color: #9fd8ea;
    font-variant-numeric: tabular-nums;
  }

  .exit-btn {
    color: #6f8db4;
    font-size: 13px;

    &:hover {
      color: #67e8f9;
    }
  }
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: pulse 1.6s ease-in-out infinite;

  &.is-off {
    background: #ef4444;
    box-shadow: 0 0 10px #ef4444;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* ---------- 布局 ---------- */
.grid {
  flex: auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px 1fr 340px;
  /* 关键：显式给行高上限，否则三栏会被内容撑高、溢出视口 */
  grid-template-rows: minmax(0, 1fr);
  gap: 14px;
  padding-top: 14px;
}

.col {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  position: relative;
  background: linear-gradient(180deg, #0b1730ee, #07112999);
  border: 1px solid $line;
  border-radius: 10px;
  padding: 12px 14px 14px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px #0ea5e912;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border: 2px solid #22d3ee;
    opacity: 0.7;
  }

  &::before {
    left: -1px;
    top: -1px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 10px;
  }

  &::after {
    right: -1px;
    bottom: -1px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 10px;
  }

  &--grow {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  &--chart {
    flex: 1 1 0;
    min-height: 0;
  }

  /* 渠道分布数据少时不需要占满，给固定高度 */
  &--fixed {
    flex: 0 0 auto;
    height: 230px;
  }

  &--kpi {
    flex: 0 0 auto;
  }

  &__head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #bfe1ff;
    padding-bottom: 8px;
    margin-bottom: 6px;
    border-bottom: 1px dashed #17325c;

    .bar {
      width: 3px;
      height: 14px;
      background: linear-gradient(180deg, #67e8f9, #0891b2);
      box-shadow: 0 0 8px #22d3ee;
      border-radius: 2px;
    }
  }

  &__extra {
    margin-left: auto;
    font-size: 12px;
    font-weight: 400;
    color: $dim;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 46%;
  }
}

/* ---------- KPI ---------- */
.kpi-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi {
  &__label {
    font-size: 12px;
    color: $dim;
    margin-bottom: 4px;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .num {
    font-size: 30px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #7ef0e0;
    text-shadow: 0 0 18px #22d3ee77;
    line-height: 1.1;
  }

  .unit {
    font-size: 12px;
    color: $dim;
  }

  &__bar {
    margin-top: 6px;
    height: 3px;
    background: #102445;
    border-radius: 2px;
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #0891b2, #5eead4);
      box-shadow: 0 0 8px #22d3ee88;
      transition: width 0.7s ease;
    }
  }
}

/* ---------- 各题分布 ---------- */
.question-list {
  flex: auto;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #1e3a5f;
    border-radius: 2px;
  }
}

.question {
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: #0f2444;
  }

  &.is-active {
    background: #0e2a4d;
    border-color: #22d3ee55;
  }

  &__title {
    font-size: 12px;
    color: #a8c6e8;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.qrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;

  &__name {
    flex: none;
    width: 74px;
    color: $dim;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__track {
    flex: auto;
    height: 6px;
    background: #102445;
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #0d9488, #5eead4);
    transition: width 0.6s ease;
  }

  &__num {
    flex: none;
    width: 30px;
    text-align: right;
    color: #7ef0e0;
    font-variant-numeric: tabular-nums;
  }
}

/* ---------- 图表 ---------- */
.chart {
  flex: auto;
  min-height: 0;
  width: 100%;

  &--trend {
    height: 100%;
  }

  &--pie {
    height: 100%;
  }

  &--channel {
    height: 100%;
  }
}

/* ---------- 最新答卷 ---------- */
.feed {
  flex: auto;
  overflow: hidden;
  position: relative;

  &__item {
    display: flex;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 6px;
    background: #0c1c37;
    margin-bottom: 6px;
    border-left: 2px solid #22d3ee88;
  }

  &__time {
    flex: none;
    font-size: 11px;
    color: #5eead4;
    font-variant-numeric: tabular-nums;
    padding-top: 1px;
  }

  &__body {
    flex: auto;
    min-width: 0;
  }

  &__line {
    display: flex;
    gap: 6px;
    font-size: 11px;
    line-height: 16px;
  }

  &__q {
    flex: none;
    max-width: 78px;
    color: $dim;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__a {
    color: #cfe3ff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__flag {
    flex: none;
    align-self: center;
    font-size: 10px;
    color: #fbbf24;
    border: 1px solid #fbbf2466;
    border-radius: 3px;
    padding: 0 4px;
  }
}

.feed-enter-active {
  transition: all 0.5s ease;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.empty {
  color: #3f5c85;
  font-size: 12px;
  text-align: center;
  padding: 24px 0;
}

/* ---------- 状态栏 ---------- */
.statusbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  font-size: 11px;
  color: #40608c;

  &__sep {
    width: 1px;
    height: 10px;
    background: #24446f;
  }

  &__spacer {
    flex: auto;
  }
}
</style>
