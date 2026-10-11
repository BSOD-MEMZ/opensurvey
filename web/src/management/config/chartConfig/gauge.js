/**
 * @Description: gauge(仪表盘)
 * @CreateDate: 2024-04-30
 */
export default (data) => {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: -100,
        max: 100,
        radius: '130%',
        center: ['50%', '80%'],
        splitNumber: 4,
        z: 2,
        axisLabel: {
          show: false,
          distance: 0,
          color: '#8a8aa8',
          fontSize: 12,
          fontFamily: 'DaQi-Font'
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 40,
            color: [[1, '#eafcf9']]
          }
        }
      },
      {
        type: 'gauge',
        startAngle: 174,
        endAngle: 5,
        min: -100,
        max: 100,
        radius: '130%',
        splitNumber: 4,
        center: ['50%', '80%'],
        z: 3,
        axisLabel: {
          distance: -5,
          color: '#5d5d80',
          rotate: 'tangential',
          fontSize: 12,
          fontFamily: 'DaQi-Font'
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 40,
            color: [[1, '#eafcf9']]
          }
        }
      },
      {
        type: 'gauge',
        startAngle: 178,
        endAngle: 0,
        min: -100,
        max: 100,
        radius: '109%',
        z: 4,
        center: ['50%', '80%'],
        splitNumber: 4,
        itemStyle: {
          color: '#5fd8c6'
        },
        progress: {
          show: true,
          roundCap: true,
          width: 15,
          itemStyle: {
            color: '#2fa596',
            shadowBlur: 10,
            shadowColor: '#2fa596'
          }
        },
        pointer: {
          icon: 'triangle',
          length: '10%',
          width: 8,
          offsetCenter: [0, '-80%'],
          itemStyle: {
            color: '#2fa596'
          }
        },
        axisLine: {
          lineStyle: {
            width: 15,
            color: [[1, '#d9f6f1']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        title: {
          offsetCenter: [0, '-15%'],
          fontSize: 18,
          color: '#5d5d80'
        },
        detail: {
          fontSize: 46,
          lineHeight: 40,
          height: 40,
          offsetCenter: [0, '-45%'],
          valueAnimation: true,
          color: '#2fa596',
          formatter: function (value) {
            if (value) {
              return value + '%'
            } else if (value === 0) {
              return value
            } else {
              return '--'
            }
          }
        },
        data: [
          {
            value: data,
            name: 'NPS'
          }
        ]
      }
    ]
  }
}
