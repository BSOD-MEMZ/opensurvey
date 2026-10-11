<template>
  <div class="separate-item">
    <div class="separate-item-title">
      <el-popover
        placement="top"
        width="400"
        trigger="hover"
        :disabled="!titlePoppverShow"
        :content="cleanRichText(StatisticsData.title)"
      >
        <template #reference>
          <p ref="titleRef" class="text" v-html="cleanRichText(StatisticsData.title)"></p>
        </template>
      </el-popover>
      <p v-if="questionTypeDesc" class="type">{{ questionTypeDesc }}</p>
    </div>
    <div class="separate-item-content">
      <div class="chart-wrapper">
        <div v-if="chartTypeList.length > 1" class="chart-type-list">
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button v-for="item in chartTypeList" :key="item" :value="item">
              {{ CHART_LABELS[item] || item }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <WordCloud v-if="chartType === 'wordCloud'" :data="chartData" />
        <div v-show="chartType !== 'wordCloud'" ref="chartRef" class="chart"></div>
      </div>
      <div class="table-wrapper">
        <data-table :table-data :table-min-height />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs, computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { cloneDeep as _cloneDeep } from 'lodash-es'
import {
  separateItemListHead,
  summaryType,
  summaryItemConfig
} from '@/management/config/analysisConfig'
import useCharts from '@/management/hooks/useCharts'
import useStatisticsItemChart from '@/management/hooks/useStatisticsItemChart'
import { cleanRichText } from '@/common/xss'
import { menuItems } from '@/management/config/questionMenuConfig'
import DataTable from './DataTable.vue'
import WordCloud from './WordCloud.vue'
import useResizeObserver from '@/management/hooks/useResizeObserver'

// 图表类型的中文名（原来靠 iconfont 的 icon-pie / icon-bar，词云没有对应字形）
const CHART_LABELS = {
  pie: '饼图',
  bar: '柱状图',
  gauge: '仪表盘',
  wordCloud: '词云'
}

const props = defineProps({
  StatisticsData: {
    type: Object,
    required: true
  }
})

const questionType = computed(() => {
  return props?.StatisticsData?.type
})

const questionTypeDesc = computed(() => {
  return menuItems?.[questionType.value]?.title || ''
})

// 表格数据
const separateItemListBody = computed(() => {
  try {
    const aggregation = _cloneDeep(props?.StatisticsData?.data?.aggregation)
    const submitionCount = props?.StatisticsData?.data?.submitionCount
    const summaryList = summaryItemConfig[questionType.value]
    // 增加聚合信息
    if (summaryList?.length) {
      summaryList.forEach((item, index) => {
        const { type, text, field, max, min } = item
        if (text && field && type === summaryType.between) {
          aggregation.push({
            id: `summary_${index}`,
            text,
            count: aggregation.reduce((n, item) => {
              if (item[field] >= min && item[field] <= max) {
                return n + item.count
              }
              return n
            }, 0)
          })
        }
      })
    }

    return (
      aggregation?.map((item) => {
        const { id, count, text } = item
        const percent = submitionCount ? `${((count / submitionCount) * 100).toFixed(1)}%` : '0%'
        return {
          id,
          count,
          text,
          percent
        }
      }) || []
    )
  } catch (e) {
    console.log(e)
    return []
  }
})

const separateItemState = reactive({
  tableData: {
    total: 0,
    listHead: separateItemListHead,
    listBody: separateItemListBody
  },
  tableMinHeight: '0px'
})

const { tableData, tableMinHeight } = toRefs(separateItemState)

const titlePoppverShow = ref(false)
const titleRef = ref(null)

const titleResize = () => {
  if (titleRef.value?.scrollWidth > titleRef.value?.offsetWidth) {
    titlePoppverShow.value = true
  } else {
    titlePoppverShow.value = false
  }
}

const { chartRef, chartTypeList, chartType, chartData } = useStatisticsItemChart({
  questionType,
  data: props?.StatisticsData?.data
})

onMounted(() => {
  // 需要获取图表dom，所以得在mounted中执行。
  // 词云不是 echarts 图表，初始化时先挑一个 echarts 类型占位（真的用到时再 changeType）
  const initType =
    chartType.value === 'wordCloud'
      ? chartTypeList.value.find((item) => item !== 'wordCloud') || 'bar'
      : chartType.value
  const { changeType, resize: chartResize } = useCharts(
    chartRef.value,
    initType,
    chartData.value
  )

  const { destroy } = useResizeObserver(chartRef.value, () => {
    chartResize()
    titleResize()
  })

  // 图型切换（词云不走 echarts，跳过）
  watch(chartType, () => {
    if (chartType.value === 'wordCloud') return
    changeType(chartType.value, chartData.value)
    chartResize()
  })

  // 销毁resizeObserver
  onUnmounted(destroy)
})
</script>

<style lang="scss" scoped>
.separate-item {
  padding: 22px 26px 26px;
  margin-bottom: 18px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(10px);
  border-radius: var(--sk-r-lg, 18px);
  box-shadow: 0 6px 22px rgba(68, 68, 102, 0.09);

  &:nth-last-of-type(1) {
    margin-bottom: 0;
  }

  &-title {
    font-size: 16px;
    color: var(--sk-ink, #444466);
    font-weight: 700;
    margin-bottom: 18px;
    display: flex;
    align-items: center;

    .text {
      max-width: 50%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .type {
      font-size: 12px;
      margin-left: 8px;
      color: var(--sk-teal-ink, #1f8a7d);
      background-color: #e4fcf8;
      border-radius: 999px;
      padding: 2px 10px;
      font-weight: 600;
    }
  }

  &-content {
    display: flex;
    justify-content: space-between;
    gap: 24px;

    .chart-wrapper {
      position: relative;
      flex: auto;
      width: 50%;
      min-width: 300px;
      height: 320px;
      max-width: 1000px;
      background: #fff;
      border-radius: var(--sk-r, 12px);
      box-shadow: 0 2px 8px rgba(68, 68, 102, 0.06);
      padding: 42px 18px 18px;

      .chart-type-list {
        position: absolute;
        left: 12px;
        top: 11px;
        z-index: 2;

        :deep(.el-radio-button__inner) {
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
        }
      }

      .chart {
        width: 100%;
        height: 100%;
      }
    }

    .table-wrapper {
      flex: auto;
      width: 50%;
      min-width: 300px;
      max-width: 1000px;
    }
  }

  @media screen and (min-width: 1660px) {
    &-content {
      gap: 40px;

      .chart-wrapper {
        height: 400px;
      }
    }
  }
}
</style>
