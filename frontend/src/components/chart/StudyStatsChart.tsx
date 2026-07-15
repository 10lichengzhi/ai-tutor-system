import ReactECharts from 'echarts-for-react'

interface StudyStatsChartProps {
  data?: { date: string; duration: number; questions: number }[]
  height?: number
}

const generateLast7Days = () => {
  const data = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      duration: Math.floor(Math.random() * 120) + 30,
      questions: Math.floor(Math.random() * 30) + 5,
    })
  }
  return data
}

const StudyStatsChart = ({ data = generateLast7Days(), height = 300 }: StudyStatsChartProps) => {
  const option = {
    title: {
      text: '近7天学习统计',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#374151',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['学习时长(分钟)', '做题数量'],
      bottom: 0,
      textStyle: { color: '#6b7280', fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: '分钟',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '题',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '学习时长(分钟)',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.duration),
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '做题数量',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.questions),
        itemStyle: {
          color: 'rgba(16, 185, 129, 0.6)',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 20,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'svg' }} />
}

export default StudyStatsChart
