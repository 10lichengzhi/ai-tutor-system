interface ProgressRingProps {
  /** 进度百分比 0-100 */
  progress: number
  /** 圆环大小 */
  size?: number
  /** 圆环线条宽度 */
  strokeWidth?: number
  /** 进度条颜色 */
  color?: string
  /** 轨道颜色 */
  trackColor?: string
  /** 中心显示的内容 */
  children?: React.ReactNode
  /** 是否显示动画 */
  animated?: boolean
}

const ProgressRing = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#2563eb',
  trackColor = '#e5e7eb',
  children,
  animated = true,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={animated ? 'transform -rotate-90' : ''}>
        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度条 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={animated ? 'transition-all duration-700 ease-out' : ''}
        />
      </svg>
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export default ProgressRing
