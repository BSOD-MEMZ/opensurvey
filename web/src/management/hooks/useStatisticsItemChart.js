import { ref, watchEffect } from 'vue'
import { cleanRichText } from '@/common/xss'
import { questionChartsConfig } from '../config/analysisConfig'

// 饼图数据处理
const pie = (data) => {
  const aggregation = data?.aggregation
  return (
    aggregation?.map?.((item) => {
      const { id, count, text } = item
      return {
        id,
        value: count,
        name: cleanRichText(text)
      }
    }) || []
  )
}
// 柱状图数据处理
const bar = (data) => {
  const aggregation = data?.aggregation
  return (
    aggregation?.map?.((item) => {
      const { id, count, text } = item
      return {
        id,
        value: count,
        name: cleanRichText(text)
      }
    }) || []
  )
}
// 仪表盘数据处理
const gauge = (data) => {
  return parseFloat(data?.summary?.nps) || 0
}

/* ------------------------------ 词云 ------------------------------ */
// 中文分词优先用浏览器内置的 Intl.Segmenter（Edge/Chrome 都自带词典），
// 拿不到时退回按标点/空白切分。
const STOP_WORDS = new Set([
  '的', '了', '是', '我', '你', '他', '她', '它', '们', '在', '有', '和', '与', '及', '就', '不',
  '也', '很', '都', '还', '又', '要', '会', '能', '可以', '这', '那', '这个', '那个', '一个',
  '什么', '怎么', '为什么', '因为', '所以', '但是', '如果', '还是', '没有', '就是', '比较',
  '觉得', '感觉', '一下', '一些', '我们', '你们', '他们', '以及', '而且', '然后', '非常',
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'in', 'on', 'for', 'it'
])

const splitWords = (text) => {
  const value = String(text || '').trim()
  if (!value) return []
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('zh-Hans', { granularity: 'word' })
      return Array.from(seg.segment(value))
        .filter((item) => item.isWordLike)
        .map((item) => item.segment)
    }
  } catch (e) {
    /* 落到下面的正则切分 */
  }
  return value.split(/[\s,，、。.；;:：!！?？()（）[\]【】"'“”‘’<>《》\-—_/\\|~`@#$%^&*+=]+/).filter(Boolean)
}

const wordCloud = (data) => {
  const aggregation = data?.aggregation || []
  const counter = new Map()
  const add = (word, weight) => {
    const key = String(word || '').trim()
    if (!key || STOP_WORDS.has(key.toLowerCase())) return
    counter.set(key, (counter.get(key) || 0) + weight)
  }
  for (const row of aggregation) {
    const weight = Number(row?.count) || 0
    if (!weight) continue
    const raw = String(row?.text || '').trim()
    if (!raw) continue
    // 短答案（像"想放假""元气满满"）整条当一个词，拆开反而读不懂；
    // 长答案才分词，把一句话拆成高频词。
    const isShortAnswer = raw.length <= 8 && !/[，。,.；;！!？?、\s]/.test(raw)
    if (isShortAnswer) {
      add(raw, weight)
      continue
    }
    for (const word of splitWords(raw)) {
      if (word.length < 2) continue
      add(word, weight)
    }
  }
  return Array.from(counter.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 40)
}

const dataFormateConfig = {
  pie,
  bar,
  gauge,
  wordCloud
}

/**
 * @description: 分题统计图表hook
 * @param {*} chartType
 * @param {*} data
 * @return {*} chartRef 图表实例 chartTypeList 图表类型列表 chartType 图表类型 chartData 图表数据
 */
export default ({ questionType, data }) => {
  const chartRef = ref(null)
  const chartTypeList = ref([])
  const chartType = ref('')
  const chartData = ref({})

  watchEffect(() => {
    if (questionType.value) {
      // 根据题型获取图表类型列表
      chartTypeList.value = questionChartsConfig[questionType.value] || questionChartsConfig.default
      if (!chartType.value) {
        // 默认选中第一项
        chartType.value = chartTypeList.value?.[0]
      }
      if (chartType.value) {
        // 根据图表类型获取图表数据
        chartData.value = dataFormateConfig[chartType.value](data)
      }
    }
  })

  return {
    chartRef,
    chartTypeList,
    chartType,
    chartData
  }
}
