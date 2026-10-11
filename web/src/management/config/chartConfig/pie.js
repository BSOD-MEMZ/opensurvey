// pjsk 柔和配色（与管理端主题一致）
const color = [
  '#2fa596',
  '#4fd6c4',
  '#ffd166',
  '#9ad0f5',
  '#a78bfa',
  '#ff7a8a',
  '#ffb868',
  '#7ddc9a',
  '#a8ead9',
  '#bcd9ff'
]
/*
 * @Description: 饼图配置
 * @CreateDate: 2024-04-30
 */
export default (data) => {
  return {
    color,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 12,
      top: 12,
      tooltip: {
        show: true
      },
      formatter(name) {
        return name.length > 17 ? name.substr(0, 17) + '...' : name
      }
    },
    series: [
      {
        name: '提交人数',
        type: 'pie',
        radius: ['52%', '82%'],
        center: ['40%', '52%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          color: '#5d5d80',
          formatter({ data, percent }) {
            const name = data?.name || ''
            const short = name.length > 12 ? name.substr(0, 12) + '...' : name
            return `${short}  ${percent}%`
          }
        },
        labelLine: {
          length: 10,
          length2: 10,
          lineStyle: { color: '#cfd6e6' }
        },
        data
      }
    ]
  }
}
