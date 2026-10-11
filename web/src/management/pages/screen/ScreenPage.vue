<template>
  <div ref="pageRef" class="screen-page">
    <!-- 背景：顶部单束冷光 + 极淡网格 + 边缘压暗。不放彩色光斑、不做扫描线 -->
    <div class="bg">
      <div class="bg__aurora"></div>
      <div class="bg__grid"></div>
      <div class="bg__vignette"></div>
    </div>

    <div class="screen-body">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar__left">
          <span class="stat-dot" :class="{ 'is-off': !online }"></span>
          <span class="stat-text">{{ online ? '实时同步' : '连接中断' }}</span>
          <span class="stat-sep"></span>
          <span class="stat-text stat-text--dim">最后更新 {{ lastUpdate }}</span>
        </div>

        <div class="topbar__center">
          <div class="title-row">
            <span class="title-rule"></span>
            <h1 class="title">{{ title }}</h1>
            <span class="title-rule title-rule--flip"></span>
          </div>
          <p class="subtitle">问卷数据监控</p>
        </div>

        <div class="topbar__right">
          <div class="clock">
            <span class="clock__time">{{ clockTime }}</span>
            <span class="clock__date">{{ clockDate }}</span>
          </div>
          <span class="stat-sep"></span>
          <el-button class="exit-btn" link @click="exit">退出</el-button>
        </div>
      </header>

      <!-- 主体：左 / 中 / 右 三栏 -->
      <main class="grid">
        <!-- 左栏：核心指标 + 各题排行 -->
        <section class="col col--left">
          <div class="panel panel--kpi">
            <div class="panel__head"><i class="panel__bar"></i>回收概览</div>
            <div class="kpi-grid">
              <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
                <div class="kpi__label">{{ kpi.label }}</div>
                <div class="kpi__value">
                  <span class="kpi__num">{{ kpi.display }}</span>
                  <span class="kpi__unit">{{ kpi.unit }}</span>
                </div>
                <div class="kpi__meter">
                  <i :style="{ width: kpi.percent + '%' }"></i>
                </div>
                <div class="kpi__hint">{{ kpi.hint }}</div>
              </div>
            </div>
          </div>

          <div class="panel panel--grow">
            <div class="panel__head">
              <i class="panel__bar"></i>各题分布
              <span class="panel__extra">点击切换右侧环图</span>
            </div>
            <div class="rank-list">
              <div
                v-for="(q, qi) in questions"
                :key="q.field"
                class="rank"
                :class="{ 'is-active': activeField === q.field }"
                @click="focusQuestion(q)"
              >
                <div class="rank__head">
                  <span class="rank__idx">{{ String(qi + 1).padStart(2, '0') }}</span>
                  <span class="rank__title">{{ cleanTitle(q.title) }}</span>
                  <span class="rank__total">{{ q.total }}</span>
                </div>
                <div class="rank__rows">
                  <div v-for="opt in q.aggregation.slice(0, 3)" :key="opt.id" class="rrow">
                    <span class="rrow__name">{{ cleanTitle(opt.text) }}</span>
                    <span class="rrow__track">
                      <i :style="{ width: percentOf(opt.count, q.aggregation[0]?.count || 1) + '%' }"></i>
                    </span>
                    <span class="rrow__val">{{ opt.count }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!questions.length" class="empty">暂无数据</div>
            </div>
          </div>
        </section>

        <!-- 中栏：趋势 + 环形 -->
        <section class="col col--center">
          <div class="panel panel--chart panel--main">
            <div class="panel__head">
              <i class="panel__bar"></i>近 24 小时回收趋势
              <span class="panel__extra">
                峰值 {{ peakHour.count }} 份 · {{ peakHour.hour }} · 今日 {{ overview.todayTotal }} 份
              </span>
            </div>
            <div ref="trendRef" class="chart"></div>
          </div>

          <div class="panel panel--chart">
            <div class="panel__head">
              <i class="panel__bar"></i>{{ focused ? cleanTitle(focused.title) : '题目分布' }}
              <span class="panel__extra">{{ focused ? `共 ${focused.total} 次作答` : '点击左侧题目切换' }}</span>
            </div>
            <div ref="pieRef" class="chart"></div>
          </div>
        </section>

        <!-- 右栏：渠道 + 最新答卷 -->
        <section class="col col--right">
          <div class="panel panel--fixed">
            <div class="panel__head">
              <i class="panel__bar"></i>渠道来源
              <span class="panel__extra">共 {{ channelTotal }} 份</span>
            </div>
            <div ref="channelRef" class="chart"></div>
          </div>

          <div class="panel panel--grow">
            <div class="panel__head">
              <i class="panel__bar"></i>最新答卷
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
                  <span v-if="item.flags.length" class="feed__flag">疑似异常</span>
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
        <span>数据快照 {{ generatedAtText || '—' }}</span>
        <span class="statusbar__spacer"></span>
        <span class="statusbar__brand">OpenSurvey 数据监控</span>
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
  LegendComponent,
  MarkPointComponent,
  GraphicComponent,
  TitleComponent
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
  MarkPointComponent,
  GraphicComponent,
  TitleComponent,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()
const surveyId = route.params.id

const REFRESH_SECONDS = 10
const refreshSeconds = REFRESH_SECONDS

/* ---------- 设计令牌（图表里也用同一套，避免和 CSS 走偏） ---------- */
const C = {
  brand: '#2a8cff', // 主色：亮蓝
  brandHi: '#4fd2ff', // 辅助：青蓝
  brandDim: '#1f6fd0',
  accent: '#ffb020', // 点缀：琥珀（只给峰值/告警）
  danger: '#ff6b6b',
  ink: '#e8f2ff',
  ink2: '#9ab4d4',
  ink3: '#6b88ab',
  line: 'rgba(42,140,255,0.20)',
  split: 'rgba(42,140,255,0.10)'
}
// 同色相深浅，不用彩虹（紫/粉在这里会显廉价）
const SERIES = ['#2a8cff', '#4fd2ff', '#1f6fd0', '#7fe0ff', '#1b4f95', '#a8d8ff']
const TOOLTIP = {
  backgroundColor: 'rgba(6,20,38,0.94)',
  borderColor: 'rgba(42,140,255,0.35)',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: '#e8f2ff', fontSize: 13 }
}

/* ---------- 状态 ---------- */
const title = ref('')
const online = ref(true)
const clockTime = ref('')
const clockDate = ref('')
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
  const peak = peakHour.value.count || 0
  const share = total ? Math.round((today / total) * 100) : 0
  return [
    {
      label: '回收总量',
      display: formatNum(animated.value.total),
      unit: '份',
      percent: total ? 100 : 0,
      hint: total ? '累计有效答卷' : '暂无数据'
    },
    {
      label: '今日新增',
      display: formatNum(animated.value.todayTotal),
      unit: '份',
      percent: total ? Math.max(4, share) : 0,
      hint: total ? `占总量 ${share}%` : '今日暂无新增'
    },
    {
      label: '平均用时',
      display: formatNum(animated.value.avgDuration),
      unit: '秒',
      percent: Math.min(100, animated.value.avgDuration / 3),
      hint: '按最近 500 份统计'
    },
    {
      label: '峰值 / 小时',
      display: formatNum(animated.value.peak),
      unit: '份',
      percent: peak ? Math.min(100, Math.max(6, peak * 8)) : 0,
      hint: peak ? `出现在 ${peakHour.value.hour}` : '近 24 小时无数据'
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

const channelTotal = computed(() => channels.value.reduce((sum, c) => sum + (c.count || 0), 0))

/* ---------- 工具 ---------- */
function formatNum(value) {
  const n = Number(value) || 0
  return n.toLocaleString('zh-CN')
}

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
  clockTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  clockDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${week}`
}

/* ---------- 图表 ---------- */
const pageRef = ref(null)
const trendRef = ref(null)
const pieRef = ref(null)
const channelRef = ref(null)
const charts = shallowRef({})

function initCharts() {
  charts.value = {
    trend: echarts.init(trendRef.value),
    pie: echarts.init(pieRef.value),
    channel: echarts.init(channelRef.value)
  }
}

function renderTrend() {
  const chart = charts.value.trend
  if (!chart) {
    return
  }
  const hours = hourly.value.map((h) => h.hour)
  const counts = hourly.value.map((h) => h.count)
  const peak = peakHour.value
  const empty = !counts.some((c) => c > 0)
  chart.setOption(
    {
      // 只留轴线，不上满屏网格
      grid: { left: 46, right: 26, top: 34, bottom: 28 },
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(42,140,255,0.10)' } },
        formatter: (params) => `${params[0].axisValue}<br/>回收 ${params[0].data.value} 份`
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: 'rgba(42,140,255,0.35)' } },
        axisLabel: { color: C.ink3, fontSize: 12, interval: 1 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        // 分桶计数用「刻度上限至少 2」，否则全是 1 的时候柱子顶到天花板
        max: (v) => Math.max(2, Math.ceil((v.max || 1) * 1.35)),
        name: '份',
        nameGap: 16,
        nameTextStyle: { color: C.ink3, fontSize: 12, padding: [0, 0, 0, -26] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.ink3, fontSize: 12 },
        splitLine: { lineStyle: { color: C.split, type: 'dashed' } }
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 14,
          // 空小时也留一条浅底纹，24 小时的骨架一眼能读出来
          showBackground: true,
          backgroundStyle: { color: 'rgba(42,140,255,0.06)', borderRadius: [3, 3, 0, 0] },
          data: counts.map((c) => ({
            value: c,
            itemStyle: {
              borderRadius: [3, 3, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: C.brandHi },
                { offset: 1, color: 'rgba(42,140,255,0.35)' }
              ])
            }
          })),
          emphasis: {
            itemStyle: { color: C.brandHi }
          },
          // 峰值是真正有信息量的点，用琥珀标出来（唯一使用点缀色的地方）
          markPoint: empty
            ? undefined
            : {
                symbol: 'circle',
                symbolSize: 8,
                data: [{ name: '峰值', coord: [peak.hour, peak.count] }],
                itemStyle: { color: C.accent, borderColor: '#061428', borderWidth: 2 },
                label: {
                  show: true,
                  position: 'top',
                  distance: 9,
                  color: C.accent,
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: `峰值 ${peak.count} 份`
                }
              }
        }
      ],
      graphic: empty
        ? [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: { text: '近 24 小时暂无回收数据', fill: C.ink3, fontSize: 14 }
            }
          ]
        : []
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
        ...TOOLTIP,
        trigger: 'item',
        formatter: '{b}<br/>{c} 次 · 占 {d}%'
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 12,
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { color: C.ink2, fontSize: 13 },
        pageIconColor: C.brand,
        pageIconInactiveColor: C.ink3,
        pageTextStyle: { color: C.ink3, fontSize: 12 },
        formatter: (name) => (name.length > 14 ? name.slice(0, 14) + '…' : name)
      },
      color: SERIES,
      // 圆心放总量，比空着更有信息量
      title: {
        text: formatNum(q?.total || 0),
        subtext: '次作答',
        left: '31%',
        top: '40%',
        textAlign: 'center',
        textStyle: { color: C.ink, fontSize: 30, fontWeight: 700 },
        subtextStyle: { color: C.ink3, fontSize: 12 }
      },
      series: [
        {
          type: 'pie',
          // 内径 62%，标签外置（大屏规范）
          radius: ['56%', '78%'],
          center: ['34%', '52%'],
          avoidLabelOverlap: true,
          padAngle: 1.5,
          itemStyle: {
            borderColor: '#061428',
            borderWidth: 2,
            borderRadius: 3
          },
          label: {
            color: C.ink2,
            fontSize: 12,
            formatter: '{d}%'
          },
          labelLine: { length: 8, length2: 8, lineStyle: { color: 'rgba(42,140,255,0.35)' } },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { color: C.ink, fontSize: 13, fontWeight: 600 },
            itemStyle: { shadowBlur: 18, shadowColor: 'rgba(42,140,255,0.5)' }
          },
          data: data.map((a) => ({ name: cleanTitle(a.text), value: a.count }))
        }
      ],
      graphic: data.length
        ? []
        : [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: { text: '该题暂无作答数据', fill: C.ink3, fontSize: 14 }
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
    c.channelId === '__none__' ? '默认渠道' : String(c.channelId).slice(0, 12)
  )
  const max = list[0]?.count || 1
  chart.setOption(
    {
      grid: { left: 4, right: 48, top: 10, bottom: 6, containLabel: true },
      tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(42,140,255,0.10)' } },
        formatter: (params) => `${params[0].name}<br/>${params[0].data.value} 份`
      },
      xAxis: { type: 'value', show: false, max: max * 1.06 },
      yAxis: {
        type: 'category',
        data: names,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: C.ink2, fontSize: 12 }
      },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          barMaxWidth: 16,
          // 名次越靠前越亮，同色相深浅表达大小，不用彩虹
          data: list.map((c, i) => ({
            value: c.count,
            itemStyle: {
              borderRadius: [0, 5, 5, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: SERIES[i % 2] + '55' },
                { offset: 1, color: SERIES[i % 2] }
              ])
            }
          })),
          label: {
            show: true,
            position: 'right',
            color: C.ink,
            fontSize: 12,
            fontWeight: 600,
            formatter: '{c}'
          }
        }
      ],
      graphic: list.length
        ? []
        : [
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: { text: '暂无渠道数据', fill: C.ink3, fontSize: 13 }
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
    generatedAtText.value = d.generatedAt ? hhmm(d.generatedAt) : ''
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

const BASE_W = 1920
const BASE_H = 1080
/**
 * 大屏部署的常规做法：以 1920×1080 为基准画布，屏幕更大时整体等比放大。
 * 这样 4K / 拼接屏上元素比例和 1080p 完全一致，不会出现"字太小、留白太多"。
 * 比 1920 小的屏幕不做缩小（缩了字会看不清），交给 CSS 的自适应规则。
 */
function applyScale() {
  const el = pageRef.value
  if (!el) {
    return
  }
  const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
  if (scale > 1.02) {
    el.style.width = `${BASE_W}px`
    el.style.height = `${BASE_H}px`
    el.style.transform = `scale(${scale})`
  } else {
    el.style.width = ''
    el.style.height = ''
    el.style.transform = ''
  }
}

function onResize() {
  applyScale()
  Object.values(charts.value).forEach((c) => c?.resize?.())
}

onMounted(async () => {
  applyScale()
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
// =============================================================================
// 数据大屏 · 深蓝科技风（政务/企业数据驾驶舱）
//   配色只用 4 类：深蓝底 / 亮蓝主 / 青蓝辅 / 琥珀点缀。不出现紫、粉、青绿。
//   装饰克制：无彩色光斑、无扫描线、无四角括号、标题不做渐变文字。
//   字号按「远距离观看」定：正文 ≥13px，KPI 数字 40px，主标题 36px。
// =============================================================================
$bg-0: #040d1a;
$bg-1: #061a2f;
$panel: rgba(20, 52, 92, 0.34);
$panel-2: rgba(10, 28, 52, 0.5);
$line: rgba(42, 140, 255, 0.2);
$line-soft: rgba(42, 140, 255, 0.12);
$brand: #2a8cff;
$brand-hi: #4fd2ff;
$accent: #ffb020;
$ink: #e8f2ff;
$ink-2: #9ab4d4;
$ink-3: #6b88ab;

.screen-page {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: $bg-0;
  color: $ink;
  font-family: var(--el-font-family);
  font-variant-numeric: tabular-nums;
  /* 大屏时由 JS 改成 1920x1080 画布 + scale()，原点留在左上角 */
  transform-origin: 0 0;
}

/* ---------- 背景 ---------- */
.bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  /* 顶部一束冷光，把视觉重心交给标题和主图 */
  &__aurora {
    position: absolute;
    inset: -30% 0 auto 0;
    height: 90%;
    background: radial-gradient(
      58% 60% at 50% 0%,
      rgba(42, 140, 255, 0.22),
      rgba(42, 140, 255, 0.06) 45%,
      transparent 72%
    );
  }

  /* 网格只作底纹，压到几乎看不见 */
  &__grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(42, 140, 255, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(42, 140, 255, 0.055) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(120% 80% at 50% 42%, #000 30%, transparent 88%);
  }

  /* 边缘压暗，让中间的图表更跳 */
  &__vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(130% 100% at 50% 45%, transparent 52%, rgba(2, 8, 18, 0.72) 100%),
      linear-gradient(180deg, $bg-1, $bg-0 42%);
  }
}

.screen-body {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px 20px 8px;
  box-sizing: border-box;
}

/* ---------- 顶栏 ---------- */
.topbar {
  flex: none;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  /* 唯一的横贯装饰：一条极淡的分隔线 */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(42, 140, 255, 0.35) 22%,
      rgba(42, 140, 255, 0.35) 78%,
      transparent
    );
  }

  &__left,
  &__right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: $ink-2;
    min-width: 0;
  }

  &__right {
    justify-content: flex-end;
  }

  &__center {
    flex: none;
    text-align: center;
  }
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

/* 主标题左右对称细线：简洁、有仪式感，不靠渐变文字 */
.title-rule {
  width: 72px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(42, 140, 255, 0.85));
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: -2px;
    width: 5px;
    height: 5px;
    background: $brand;
    transform: rotate(45deg);
  }

  &--flip {
    transform: scaleX(-1);
  }
}

.title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 3px;
  line-height: 1.1;
  color: $ink;
  text-shadow: 0 2px 18px rgba(42, 140, 255, 0.35);
}

.subtitle {
  margin: 5px 0 0;
  font-size: 12px;
  letter-spacing: 7px;
  color: $ink-3;
  text-indent: 7px;
}

.stat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #35d07f;
  box-shadow: 0 0 0 3px rgba(53, 208, 127, 0.18);
  animation: breathe 2.4s ease-in-out infinite;

  &.is-off {
    background: #ff6b6b;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.18);
    animation: none;
  }
}

@keyframes breathe {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 3px rgba(53, 208, 127, 0.18);
  }
  50% {
    opacity: 0.72;
    box-shadow: 0 0 0 5px rgba(53, 208, 127, 0.08);
  }
}

.stat-text {
  font-size: 13px;
  color: $ink-2;

  &--dim {
    color: $ink-3;
  }
}

.stat-sep {
  width: 1px;
  height: 12px;
  background: rgba(42, 140, 255, 0.28);
}

.clock {
  display: flex;
  align-items: baseline;
  gap: 12px;

  &__time {
    font-size: 22px;
    font-weight: 700;
    color: $brand-hi;
    letter-spacing: 1px;
    text-shadow: 0 0 14px rgba(79, 210, 255, 0.35);
  }

  &__date {
    font-size: 13px;
    color: $ink-3;
  }
}

.exit-btn {
  color: $ink-3;
  font-size: 13px;

  &:hover {
    color: $brand-hi;
  }
}

/* ---------- 布局 ---------- */
.grid {
  flex: auto;
  min-height: 0;
  display: grid;
  /* 1920 下 左右各 400，中间吃掉剩余（约 1080） */
  grid-template-columns: 400px minmax(0, 1fr) 400px;
  grid-template-rows: minmax(0, 1fr);
  gap: 14px;
  padding-top: 14px;
}

.col {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 窄/矮屏时宁可让面板内部滚动，也不要溢出去压到页脚 */
  overflow: hidden;
}

/* ---------- 面板 ---------- */
.panel {
  position: relative;
  background: linear-gradient(180deg, $panel, $panel-2);
  border: 1px solid $line;
  border-radius: 6px;
  padding: 12px 16px 14px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* 只在顶部一道高光 + 极弱外阴影，不做霓虹发光的四角括号 */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 14px rgba(0, 0, 0, 0.3);

  &--grow {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  &--chart {
    flex: 1 1 0;
    min-height: 0;
  }

  /* 中栏主图给更大权重，趋势是主角 */
  &--main {
    flex: 1.25 1 0;
  }

  &--fixed {
    flex: 0 0 auto;
    /* 渠道通常只有几条，不用占满一屏 */
    height: 186px;
  }

  /* KPI 卡片保持自然高度：允许被压缩的话内容会溢出、被下一个面板盖住 */
  &--kpi {
    flex: none;
  }

  &__head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 15px;
    font-weight: 600;
    color: #cfe4ff;
    padding-bottom: 9px;
    margin-bottom: 8px;
    border-bottom: 1px solid $line-soft;
    letter-spacing: 0.5px;
  }

  /* 标题左侧短竖条：结构暗示，替代原来的四角括号 */
  &__bar {
    flex: none;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, $brand-hi, $brand);
    box-shadow: 0 0 8px rgba(42, 140, 255, 0.5);
  }

  &__extra {
    margin-left: auto;
    font-size: 12px;
    font-weight: 400;
    color: $ink-3;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 60%;
  }
}

/* ---------- KPI（2×2 卡片，比竖排更像驾驶舱） ---------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.kpi {
  position: relative;
  padding: 12px 14px 11px;
  border-radius: 5px;
  background: rgba(42, 140, 255, 0.07);
  border: 1px solid rgba(42, 140, 255, 0.16);

  &__label {
    font-size: 13px;
    color: $ink-2;
    letter-spacing: 0.5px;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 5px;
    margin-top: 6px;
  }

  &__num {
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    color: $ink;
    text-shadow: 0 2px 14px rgba(42, 140, 255, 0.35);
  }

  &__unit {
    font-size: 12px;
    color: $ink-3;
  }

  &__meter {
    margin-top: 9px;
    height: 3px;
    border-radius: 2px;
    background: rgba(42, 140, 255, 0.14);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, rgba(42, 140, 255, 0.5), $brand-hi);
      transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }
  }

  &__hint {
    margin-top: 7px;
    font-size: 12px;
    color: $ink-3;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

/* ---------- 各题分布（排行榜式） ---------- */
.rank-list {
  flex: auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(42, 140, 255, 0.28);
    border-radius: 2px;
  }
}

.rank {
  padding: 9px 10px 10px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
  margin-bottom: 6px;

  &:hover {
    background: rgba(42, 140, 255, 0.07);
  }

  &.is-active {
    background: rgba(42, 140, 255, 0.12);
    border-color: rgba(42, 140, 255, 0.4);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 7px;
  }

  &__idx {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: $brand;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }

  &__title {
    flex: auto;
    min-width: 0;
    font-size: 13px;
    color: #b7cde9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__total {
    flex: none;
    font-size: 12px;
    font-weight: 600;
    color: $brand-hi;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.rrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;

  &__name {
    flex: none;
    width: 88px;
    color: $ink-3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__track {
    flex: auto;
    height: 5px;
    border-radius: 3px;
    background: rgba(42, 140, 255, 0.12);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, rgba(42, 140, 255, 0.55), $brand-hi);
      transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }
  }

  &__val {
    flex: none;
    width: 34px;
    text-align: right;
    color: #cfe4ff;
    font-variant-numeric: tabular-nums;
  }
}

.empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: $ink-3;
}

/* ---------- 图表 ---------- */
.chart {
  flex: auto;
  min-height: 0;
  width: 100%;
  height: 100%;
}

/* ---------- 最新答卷 ---------- */
.feed {
  flex: auto;
  min-height: 0;
  overflow: hidden;

  &__item {
    display: flex;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 5px;
    background: rgba(42, 140, 255, 0.06);
    border-left: 2px solid rgba(42, 140, 255, 0.55);
    margin-bottom: 6px;
  }

  &__time {
    flex: none;
    font-size: 12px;
    color: $brand-hi;
    font-variant-numeric: tabular-nums;
    padding-top: 1px;
  }

  &__body {
    flex: auto;
    min-width: 0;
  }

  &__line {
    display: flex;
    gap: 8px;
    font-size: 12px;
    line-height: 18px;
  }

  &__q {
    flex: none;
    max-width: 88px;
    color: $ink-3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__a {
    flex: auto;
    min-width: 0;
    color: #cfe4ff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__flag {
    flex: none;
    align-self: flex-start;
    padding: 1px 7px;
    border-radius: 3px;
    font-size: 11px;
    color: $accent;
    background: rgba(255, 176, 32, 0.14);
    border: 1px solid rgba(255, 176, 32, 0.35);
  }
}

/* 新答卷进来时淡入一下就够了，不做满屏动效 */
.feed-enter-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

/* ---------- 状态条 ---------- */
.statusbar {
  flex: none;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: $ink-3;

  &__sep {
    width: 1px;
    height: 10px;
    background: rgba(42, 140, 255, 0.22);
  }

  &__spacer {
    flex: auto;
  }

  &__brand {
    color: rgba(42, 140, 255, 0.75);
    letter-spacing: 1px;
  }
}

/* ---------- 适配 ---------- */
/* 4K / 超宽：左右栏和字号一起放大 */
@media (min-width: 2400px) {
  .grid {
    grid-template-columns: 460px minmax(0, 1fr) 460px;
  }

  .title {
    font-size: 42px;
  }

  .kpi__num {
    font-size: 38px;
  }

  .panel__head {
    font-size: 16px;
  }
}

/* 笔记本外接屏（1440~1600）：收窄两翼，保证中间主图宽度 */
@media (max-width: 1680px) {
  .grid {
    grid-template-columns: 344px minmax(0, 1fr) 344px;
  }

  .title {
    font-size: 32px;
  }

  .title-rule {
    width: 54px;
  }
}

@media (max-width: 1440px) {
  .grid {
    grid-template-columns: 310px minmax(0, 1fr) 310px;
    gap: 12px;
  }

  .col {
    gap: 12px;
  }

  .title {
    font-size: 28px;
  }

  .kpi__num {
    font-size: 28px;
  }

  .panel--fixed {
    height: 160px;
  }
}

/* 矮屏（投影/笔记本 768 高）：整体收紧，仍然保证正文 ≥12px */
@media (max-height: 900px) {
  .topbar {
    height: 66px;
  }

  .title {
    font-size: 30px;
  }

  .grid {
    padding-top: 12px;
    gap: 12px;
  }

  .col {
    gap: 12px;
  }

  .panel {
    padding: 10px 14px 11px;
  }

  .panel__head {
    font-size: 14px;
    padding-bottom: 7px;
    margin-bottom: 6px;
  }

  .kpi {
    padding: 9px 12px 9px;
  }

  .kpi__label {
    font-size: 12px;
  }

  .kpi__num {
    font-size: 26px;
  }

  .kpi__hint {
    margin-top: 5px;
    font-size: 11px;
  }

  .kpi__meter {
    margin-top: 7px;
  }
}
</style>
