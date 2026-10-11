/**
 * @Description: 柱状图配置（pjsk 皮肤：圆角柱 + 柔和渐变 + 数值标签）
 * @CreateDate: 2024-04-30
 */
export default (data) => {
  const list = Array.isArray(data) ? data : []
  const names = list.map((item) => item?.name ?? '')
  // 选项多、或者选项名字长的时候，横着放更好读
  const horizontal = list.length > 7 || names.some((name) => String(name).length > 6)

  const barColor = {
    type: 'linear',
    x: 0,
    y: 0,
    x2: horizontal ? 1 : 0,
    y2: horizontal ? 0 : 1,
    colorStops: [
      { offset: 0, color: '#7fe8da' },
      { offset: 1, color: '#2fa596' }
    ]
  }

  const categoryAxis = {
    type: 'category',
    data: names,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#e6e9f2' } },
    axisLabel: {
      interval: 0,
      color: '#5d5d80',
      formatter(value) {
        return value?.length > 12 ? `${value.slice(0, 12)}…` : value
      }
    }
  }

  const valueAxis = {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#8a8aa8' },
    splitLine: { lineStyle: { type: 'dashed', color: '#f0f2f8' } }
  }

  return {
    color: ['#2fa596'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>{a}: {c}'
    },
    grid: {
      left: '3%',
      right: '6%',
      top: 24,
      bottom: 4,
      containLabel: true
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    series: [
      {
        showAllSymbol: true,
        name: '提交人数',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: {
          color: barColor,
          borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]
        },
        label: {
          show: true,
          position: horizontal ? 'right' : 'top',
          color: '#2fa596',
          fontWeight: 700
        },
        data: list
      }
    ]
  }
}
