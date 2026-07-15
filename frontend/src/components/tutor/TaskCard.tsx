import { useState } from 'react'
import {
  BookOpen,
  Pencil,
  RefreshCw,
  HelpCircle,
  PlayCircle,
  FileText,
  CheckCircle2,
  Clock,
  Star,
  Play,
} from 'lucide-react'
import type { TutorTask, TutorTaskType, StudyTaskStatus } from '../../types'
import ProgressRing from './ProgressRing'

interface TaskCardProps {
  task: TutorTask
  onStart?: (task: TutorTask) => void
  onComplete?: (task: TutorTask) => void
  compact?: boolean
}

/** 任务类型图标映射 */
const taskIconMap: Record<TutorTaskType, React.ComponentType<{ className?: string }>> = {
  study: BookOpen,
  practice: Pencil,
  review: RefreshCw,
  quiz: HelpCircle,
  video: PlayCircle,
  reading: FileText,
}

/** 任务类型标签颜色 */
const taskTypeLabel: Record<TutorTaskType, string> = {
  study: '学习',
  practice: '练习',
  review: '复习',
  quiz: '测验',
  video: '视频',
  reading: '阅读',
}

/** 任务类型颜色 */
const taskTypeColor: Record<TutorTaskType, { bg: string; text: string; ring: string }> = {
  study: { bg: 'bg-primary-50', text: 'text-primary-600', ring: '#2563eb' },
  practice: { bg: 'bg-secondary-50', text: 'text-secondary-600', ring: '#059669' },
  review: { bg: 'bg-amber-50', text: 'text-amber-600', ring: '#d97706' },
  quiz: { bg: 'bg-teal-50', text: 'text-teal-600', ring: '#0d9488' },
  video: { bg: 'bg-rose-50', text: 'text-rose-600', ring: '#e11d48' },
  reading: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: '#0891b2' },
}

/** 状态样式 */
const statusStyle: Record<StudyTaskStatus, { label: string; className: string }> = {
  pending: { label: '待开始', className: 'text-gray-500 bg-gray-100' },
  in_progress: { label: '进行中', className: 'text-primary-700 bg-primary-100 animate-pulse' },
  completed: { label: '已完成', className: 'text-secondary-700 bg-secondary-100' },
  skipped: { label: '已跳过', className: 'text-gray-400 bg-gray-50' },
}

const TaskCard = ({ task, onStart, onComplete, compact = false }: TaskCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false)
  const Icon = taskIconMap[task.type]
  const color = taskTypeColor[task.type]
  const status = statusStyle[task.status]

  const handleStart = () => {
    if (task.status === 'pending' && onStart) {
      onStart(task)
    }
  }

  const handleComplete = () => {
    if (task.status === 'in_progress' && onComplete) {
      setIsCompleting(true)
      setTimeout(() => {
        onComplete(task)
        setIsCompleting(false)
      }, 600)
    }
  }

  // 紧凑模式（用于右侧今日任务列表）
  if (compact) {
    const isActive = task.status === 'in_progress'
    const isDone = task.status === 'completed'

    return (
      <div
        className={`
          relative p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer group
          ${isActive ? 'border-primary-300 bg-primary-50/50 shadow-md' : ''}
          ${isDone ? 'border-secondary-200 bg-secondary-50/30' : ''}
          ${task.status === 'pending' ? 'border-gray-200 bg-white hover:border-primary-200 hover:shadow-sm' : ''}
        `}
        onClick={task.status === 'pending' ? handleStart : undefined}
      >
        {/* 完成动画打勾 */}
        {isDone && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* 图标/进度环 */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center ${isActive ? 'ring-2 ring-primary-300 ring-offset-1' : ''}`}>
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-secondary-600" />
            ) : isActive ? (
              <ProgressRing progress={task.progress} size={36} strokeWidth={3} color={color.ring}>
                <Play className="w-3 h-3 text-primary-600" />
              </ProgressRing>
            ) : (
              <Icon className={`w-5 h-5 ${color.text}`} />
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${color.bg} ${color.text}`}>
                {taskTypeLabel[task.type]}
              </span>
              {task.difficulty && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < task.difficulty! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <h4 className={`text-sm font-semibold truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h4>
            {task.knowledgePointName && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{task.knowledgePointName}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {task.estimatedDuration}分钟
              </span>
              {task.rewardXP && (
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <Star className="w-3 h-3 fill-amber-400" />
                  +{task.rewardXP}XP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 进行中进度条 */}
        {isActive && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-primary-600 font-medium">{status.label}</span>
              <span className="text-primary-600">{task.progress}%</span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              className="mt-2 w-full py-1.5 bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isCompleting ? '提交中...' : '完成任务'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // 大卡片模式（用于对话中的任务卡片）
  return (
    <div className={`
      rounded-2xl border-2 overflow-hidden transition-all duration-300
      ${task.status === 'in_progress'
        ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white shadow-lg'
        : task.status === 'completed'
          ? 'border-secondary-200 bg-gradient-to-br from-secondary-50 to-white'
          : 'border-gray-200 bg-white hover:shadow-md'
      }
    `}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div className={`p-3 rounded-xl ${color.bg}`}>
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-7 h-7 text-secondary-600" />
            ) : (
              <Icon className={`w-7 h-7 ${color.text}`} />
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                {taskTypeLabel[task.type]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-4 h-4" />
                预计 {task.estimatedDuration} 分钟
              </span>
              {task.difficulty && (
                <span className="flex items-center gap-1 text-gray-500">
                  难度：
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < task.difficulty! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </span>
              )}
              {task.rewardXP && (
                <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  +{task.rewardXP} 经验值
                </span>
              )}
            </div>

            {/* 进度条 */}
            {(task.status === 'in_progress' || task.progress > 0) && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">任务进度</span>
                  <span className="font-semibold text-primary-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-4 flex gap-3">
          {task.status === 'pending' && (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Play className="w-4 h-4" />
              开始学习
            </button>
          )}
          {task.status === 'in_progress' && (
            <>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleting ? '提交中...' : '完成任务'}
              </button>
            </>
          )}
          {task.status === 'completed' && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary-50 text-secondary-700 font-medium rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              太棒了！任务已完成
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard
