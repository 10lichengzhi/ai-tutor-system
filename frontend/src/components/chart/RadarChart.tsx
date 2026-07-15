import ReactECharts from 'echarts-for-react'

interface RadarChartProps {
  indicators?: { name: string; max: number }[]
  values?: number[]
  height?: number
}

const defaultIndicators = [
  { name: '理解能力', max: 100 },
  { name: '计算能力', max: 100 },
  { name: '逻辑推理', max: 100 },
  { name: '应用能力', max: 100 },
  { name: '创新思维', max: 100 },
  { name: '分析能力', max: 100 },
]

const defaultValues = [85, 70, 78, 65, 60, 75]

const RadarChart = ({
  indicators = defaultIndicators,
  values = defaultValues,
  height = 320,
}: RadarChartProps) => {
  const option = {
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#6b7280',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: { color: '#e5e7eb' },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(59, 130, 246, 0.02)', 'rgba(59, 130, 246, 0.05)'],
        },
      },
      axisLine: {
        lineStyle: { color: '#e5e7eb' },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '能力评估',
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5, y: 0.5, r: 0.5,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.6)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.2)' },
                ],
              },
            },
            lineStyle: {
              color: '#3b82f6',
              width: 2,
            },
            itemStyle: {
              color: '#3b82f6',
            },
          },
        ],
      },
    ],
  }

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'svg' }} />
}

export default RadarChart
