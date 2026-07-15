import ReactECharts from 'echarts-for-react'

interface ProgressChartProps {
  data?: { name: string; value: number }[]
  height?: number
  title?: string
}

const defaultData = [
  { name: '数学', value: 75 },
  { name: '物理', value: 60 },
  { name: '化学', value: 85 },
  { name: '英语', value: 70 },
  { name: '语文', value: 90 },
]

const ProgressChart = ({
  data = defaultData,
  height = 300,
  title = '学科掌握度',
}: ProgressChartProps) => {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#374151',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c}%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: {
        lineStyle: { color: '#e5e7eb' },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: { color: '#f3f4f6', type: 'dashed' },
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5] },
                { offset: 1, color: ['#93c5fd', '#6ee7b7', '#fcd34d', '#c4b5fd', '#fca5a5'][i % 5] },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
        })),
        barWidth: 36,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'svg' }} />
}

export default ProgressChart
