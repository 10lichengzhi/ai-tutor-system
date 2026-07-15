import { useState } from 'react'
import { Bot, GraduationCap, User, Heart, Sparkles, CheckCircle2 } from 'lucide-react'
import type { TutorChatMessage as TutorMessageType, FeedbackType } from '../../types'
import DiagnosisCard from './DiagnosisCard'
import TaskCard from './TaskCard'
import GuidanceQuestion from './GuidanceQuestion'
import DailyReport from './DailyReport'
import { feedbackTypeConfig } from './FeedbackBubble'

interface TutorMessageProps {
  message: TutorMessageType
  onStartTask?: (taskId: string) => void
  onCompleteTask?: (taskId: string) => void
  onGuidanceSubmit?: (answer: string | string[]) => void
}

/** 消息类型对应的样式标签 */
const messageTypeLabel: Record<string, { label: string; color: string }> = {
  diagnosis: { label: '学情诊断', color: 'bg-primary-100 text-primary-800' },
  task: { label: '任务布置', color: 'bg-teal-100 text-teal-700' },
  guidance: { label: '引导提问', color: 'bg-amber-100 text-amber-700' },
  encouragement: { label: '鼓励反馈', color: 'bg-rose-100 text-rose-700' },
  report: { label: '学习报告', color: 'bg-secondary-100 text-secondary-700' },
  feedback: { label: '学习反馈', color: 'bg-primary-100 text-primary-700' },
  text: { label: '', color: '' },
}

const TutorMessage = ({ message, onStartTask, onCompleteTask, onGuidanceSubmit }: TutorMessageProps) => {
  const [liked, setLiked] = useState(false)
  const isUser = message.role === 'user'
  const typeConfig = messageTypeLabel[message.type] || messageTypeLabel.text

  // 获取反馈类型配置（如果是反馈消息）
  const feedbackStyle = message.type === 'feedback' && message.metadata?.feedbackType
    ? feedbackTypeConfig[message.metadata.feedbackType as FeedbackType]
    : null

  // 用户消息
  if (isUser) {
    // 反馈类型的用户消息使用对应颜色
    if (feedbackStyle) {
      const Icon = feedbackStyle.icon
      return (
        <div className="flex gap-3 animate-fadeIn">
          <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${feedbackStyle.gradient} rounded-full flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 max-w-[80%]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-gray-800">我</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${feedbackStyle.lightBg} ${feedbackStyle.textColor} border ${feedbackStyle.borderColor}`}>
                {feedbackStyle.emoji} {feedbackStyle.label}
              </span>
            </div>
            <div className={`${feedbackStyle.lightBg} border ${feedbackStyle.borderColor} px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm`}>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {message.content || `${feedbackStyle.emoji} ${feedbackStyle.label}`}
              </p>
            </div>
            <span className="text-xs text-text-secondary mt-1 ml-1 block">{message.timestamp}</span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex justify-end gap-3 animate-fadeIn">
        <div className="max-w-[75%] flex flex-col items-end">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-text-secondary mt-1 mr-2">{message.timestamp}</span>
        </div>
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    )
  }

  // AI教师消息
  return (
    <div className="flex gap-3 animate-fadeIn">
      {/* AI头像 - 带毕业帽的Bot */}
      <div className="flex-shrink-0 relative">
        <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-primary-500 rounded-full flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
          <GraduationCap className="w-3 h-3 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%]">
        {/* 教师名称和消息类型 */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-gray-800">智师</span>
          {typeConfig.label && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          )}
        </div>

        {/* 消息内容气泡 */}
        <div className="space-y-3">
          {/* 文本内容 */}
          {message.content && (
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm ${
              message.type === 'feedback' && feedbackStyle
                ? `bg-bg-secondary border-l-4 ${feedbackStyle.aiAccent} border border-border-theme`
                : 'bg-bg-secondary border border-border-theme'
            }`}>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          )}

          {/* 诊断卡片 */}
          {message.type === 'diagnosis' && message.diagnosis && (
            <DiagnosisCard diagnosis={message.diagnosis} compact />
          )}

          {/* 任务卡片 */}
          {message.type === 'task' && message.task && (
            <TaskCard
              task={message.task}
              onStart={(t) => onStartTask?.(t.id)}
              onComplete={(t) => onCompleteTask?.(t.id)}
            />
          )}

          {/* 引导问题 */}
          {message.type === 'guidance' && message.guidance && (
            <GuidanceQuestion
              guidance={message.guidance}
              onSubmit={(answer) => onGuidanceSubmit?.(answer)}
            />
          )}

          {/* 鼓励消息特殊样式 */}
          {message.type === 'encouragement' && (
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm text-rose-800 leading-relaxed">{message.content}</p>
              </div>
            </div>
          )}

          {/* 学习报告 */}
          {message.type === 'report' && message.report && (
            <DailyReport report={message.report} compact />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <span className="text-xs text-text-secondary">{message.timestamp}</span>
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked ? 'text-rose-500' : 'text-text-secondary hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500' : ''}`} />
            {liked ? '有帮助' : '有帮助'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TutorMessage
