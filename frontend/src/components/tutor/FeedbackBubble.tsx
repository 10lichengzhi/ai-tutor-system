import { useState, useEffect } from 'react'
import { Bot, GraduationCap, CheckCircle, HelpCircle, AlertCircle, XCircle, Pencil, PartyPopper, User } from 'lucide-react'
import type { LearningFeedback, FeedbackType } from '../../types'

// ============================================
// 反馈类型配置
// ============================================

export interface FeedbackTypeConfig {
  icon: typeof CheckCircle
  label: string
  emoji: string
  /** 学生气泡颜色 */
  bgColor: string
  borderColor: string
  textColor: string
  /** AI回应边框色 */
  aiAccent: string
  /** 渐变背景（按钮用） */
  gradient: string
  /** 浅背景色 */
  lightBg: string
}

export const feedbackTypeConfig: Record<FeedbackType, FeedbackTypeConfig> = {
  understood: {
    icon: CheckCircle,
    label: '听懂了',
    emoji: '✅',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-400',
    textColor: 'text-green-700',
    aiAccent: 'border-l-green-400',
    gradient: 'from-green-400 to-emerald-500',
    lightBg: 'bg-green-50',
  },
  confused: {
    icon: HelpCircle,
    label: '有点困惑',
    emoji: '🤔',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-700',
    aiAccent: 'border-l-orange-400',
    gradient: 'from-orange-400 to-amber-500',
    lightBg: 'bg-orange-50',
  },
  stuck: {
    icon: XCircle,
    label: '卡住了',
    emoji: '😰',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-400',
    textColor: 'text-red-700',
    aiAccent: 'border-l-red-400',
    gradient: 'from-red-400 to-rose-500',
    lightBg: 'bg-red-50',
  },
  question: {
    icon: AlertCircle,
    label: '有问题',
    emoji: '❓',
    bgColor: 'bg-primary-600',
    borderColor: 'border-primary-400',
    textColor: 'text-primary-800',
    aiAccent: 'border-l-primary-400',
    gradient: 'from-primary-400 to-sky-500',
    lightBg: 'bg-primary-50',
  },
  note: {
    icon: Pencil,
    label: '做笔记',
    emoji: '📝',
    bgColor: 'bg-teal-500',
    borderColor: 'border-teal-400',
    textColor: 'text-teal-700',
    aiAccent: 'border-l-teal-400',
    gradient: 'from-teal-400 to-cyan-500',
    lightBg: 'bg-teal-50',
  },
  harvest: {
    icon: PartyPopper,
    label: '有收获',
    emoji: '🎉',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
    aiAccent: 'border-l-amber-400',
    gradient: 'from-amber-400 to-yellow-500',
    lightBg: 'bg-amber-50',
  },
}

// ============================================
// Props 定义
// ============================================

interface FeedbackBubbleProps {
  /** 反馈数据 */
  feedback: LearningFeedback
  /** 是否显示AI回应的打字动画 */
  typing?: boolean
  /** 是否显示在对话流中（紧凑模式） */
  compact?: boolean
  /** 解决问题回调 */
  onResolve?: (id: string) => void
}

// ============================================
// 学生反馈气泡（左对齐）
// ============================================

interface StudentFeedbackBubbleProps {
  feedback: LearningFeedback
  compact?: boolean
}

export const StudentFeedbackBubble = ({ feedback, compact }: StudentFeedbackBubbleProps) => {
  const config = feedbackTypeConfig[feedback.type]
  const Icon = config.icon

  return (
    <div className="flex gap-3 animate-fadeIn">
      {/* 类型图标头像 */}
      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 max-w-[80%]">
        {/* 名称和类型标签 */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-gray-800">我</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.lightBg} ${config.textColor} border ${config.borderColor}`}>
            {config.emoji} {config.label}
          </span>
        </div>

        {/* 反馈内容 */}
        <div className={`${config.lightBg} border ${config.borderColor} px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm`}>
          {feedback.content ? (
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{feedback.content}</p>
          ) : (
            <p className={`text-sm ${config.textColor} font-medium italic`}>{config.emoji} {config.label}</p>
          )}
          {feedback.knowledgeName && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs bg-bg-secondary/60 px-2 py-0.5 rounded-full text-text-primary">
                📚 {feedback.knowledgeName}
              </span>
            </div>
          )}
        </div>

        {!compact && (
          <span className="text-xs text-text-secondary mt-1 ml-1 block">{feedback.createdAt}</span>
        )}
      </div>
    </div>
  )
}

// ============================================
// AI回应气泡（右对齐，带打字动画）
// ============================================

interface AIResponseBubbleProps {
  content: string
  typing?: boolean
  accent: string
  timestamp?: string
  compact?: boolean
  suggestions?: string[]
}

export const AIResponseBubble = ({ content, typing, accent, timestamp, compact, suggestions }: AIResponseBubbleProps) => {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  // 打字机效果
  useEffect(() => {
    if (!typing || !content) {
      setDisplayedText(content)
      return
    }

    setDisplayedText('')
    let index = 0
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 25) // 快速打字

    return () => clearInterval(timer)
  }, [content, typing])

  // 光标闪烁
  useEffect(() => {
    if (!typing) {
      setShowCursor(false)
      return
    }
    const timer = setInterval(() => setShowCursor((s) => !s), 500)
    return () => clearInterval(timer)
  }, [typing])

  const isTypingDone = displayedText.length >= content.length

  return (
    <div className="flex justify-end gap-3 animate-fadeIn">
      <div className={`max-w-[80%] flex flex-col items-end ${compact ? 'max-w-full' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-gray-800">智师</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200">
            AI 即时回应
          </span>
        </div>

        <div className={`bg-bg-secondary border-l-4 ${accent} border border-border-theme px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm`}>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {typing && !isTypingDone && showCursor && (
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
            )}
          </p>

          {/* 建议列表（打字完成后显示） */}
          {isTypingDone && suggestions && suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-theme space-y-1.5">
              <p className="text-xs font-semibold text-text-secondary mb-1">💡 小建议：</p>
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-text-primary">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!compact && timestamp && (
          <span className="text-xs text-text-secondary mt-1 mr-2">{timestamp}</span>
        )}
      </div>

      {/* AI头像 */}
      <div className="flex-shrink-0 relative">
        <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-primary-500 rounded-full flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
          <GraduationCap className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// 主组件 - FeedbackBubble
// ============================================

const FeedbackBubble = ({ feedback, typing, compact, onResolve }: FeedbackBubbleProps) => {
  const config = feedbackTypeConfig[feedback.type]

  return (
    <div className="space-y-4">
      {/* 学生反馈 */}
      <StudentFeedbackBubble feedback={feedback} compact={compact} />

      {/* AI回应 */}
      {feedback.aiResponse && (
        <AIResponseBubble
          content={feedback.aiResponse}
          typing={typing}
          accent={config.aiAccent}
          timestamp={feedback.createdAt}
          compact={compact}
        />
      )}

      {/* 未解决问题的操作按钮 */}
      {!feedback.resolved && !compact && feedback.type === 'question' && onResolve && (
        <div className="flex justify-end">
          <button
            onClick={() => onResolve(feedback.id)}
            className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            标记为已解决
          </button>
        </div>
      )}
    </div>
  )
}

export default FeedbackBubble
