import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Flame,
  Zap,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  XCircle,
  Pencil,
  PartyPopper,
  TrendingUp,
} from 'lucide-react'
import type {
  FeedbackType,
  LearningFeedback,
  FeedbackStats,
} from '../../types'
import { feedbackTypeConfig, AIResponseBubble } from './FeedbackBubble'

// ============================================
// 快捷反馈按钮配置
// ============================================

const quickFeedbackTypes: Array<{
  type: FeedbackType
  icon: typeof CheckCircle
  label: string
  emoji: string
  gradient: string
  hoverShadow: string
}> = [
  { type: 'understood', icon: CheckCircle, label: '听懂了', emoji: '✅', gradient: 'from-green-400 to-emerald-500', hoverShadow: 'hover:shadow-green-200' },
  { type: 'confused', icon: HelpCircle, label: '有点困惑', emoji: '🤔', gradient: 'from-orange-400 to-amber-500', hoverShadow: 'hover:shadow-orange-200' },
  { type: 'stuck', icon: XCircle, label: '卡住了', emoji: '😰', gradient: 'from-red-400 to-rose-500', hoverShadow: 'hover:shadow-red-200' },
  { type: 'question', icon: AlertCircle, label: '有问题', emoji: '❓', gradient: 'from-primary-400 to-sky-500', hoverShadow: 'hover:shadow-primary-700/20' },
  { type: 'note', icon: Pencil, label: '做笔记', emoji: '📝', gradient: 'from-teal-400 to-cyan-500', hoverShadow: 'hover:shadow-teal-200' },
  { type: 'harvest', icon: PartyPopper, label: '有收获', emoji: '🎉', gradient: 'from-amber-400 to-yellow-500', hoverShadow: 'hover:shadow-amber-200' },
]

// ============================================
// Props
// ============================================

interface FeedbackWorkspaceProps {
  /** 会话ID，用于关联反馈到当前对话 */
  sessionId?: string
  /** 当前知识点ID */
  knowledgeId?: string
  /** 反馈提交回调（可用于将反馈加入对话流） */
  onFeedbackSubmit?: (feedback: LearningFeedback, aiContent: string) => void
}

// ============================================
// 悬浮反馈按钮
// ============================================

const FeedbackWorkspace = ({ sessionId, knowledgeId, onFeedbackSubmit }: FeedbackWorkspaceProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<{ content: string; accent: string; suggestions?: string[] } | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [showXP, setShowXP] = useState<number | null>(null)
  const [recentFeedbacks, setRecentFeedbacks] = useState<LearningFeedback[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 加载今日统计（本地存储）
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const stored = localStorage.getItem(`feedback_stats_${today}`)
      if (stored) {
        setStats(JSON.parse(stored))
      } else {
        setStats({
          totalCount: 0,
          byType: { understood: 0, confused: 0, stuck: 0, question: 0, note: 0, harvest: 0 },
          unresolvedCount: 0,
          earnedXP: 0,
          streakDays: 1,
        })
      }
    } catch {
      setStats({
        totalCount: 0,
        byType: { understood: 0, confused: 0, stuck: 0, question: 0, note: 0, harvest: 0 },
        unresolvedCount: 0,
        earnedXP: 0,
        streakDays: 1,
      })
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // 不关闭，因为按钮在外部，通过按钮控制
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // 选择反馈类型后自动聚焦输入框
  useEffect(() => {
    if (selectedType && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedType, isOpen])

  // 切换面板
  const togglePanel = () => {
    setIsOpen(!isOpen)
    if (isOpen) {
      // 关闭时重置状态
      setTimeout(() => {
        setSelectedType(null)
        setInputValue('')
        setCurrentResponse(null)
        setIsTyping(false)
      }, 300)
    }
  }

  // 选择反馈类型
  const handleSelectType = (type: FeedbackType) => {
    setSelectedType(type)
    setCurrentResponse(null)
  }

  // 提交反馈（本地处理）
  const handleSubmit = async () => {
    if (!selectedType || isSubmitting) return

    setIsSubmitting(true)
    const config = feedbackTypeConfig[selectedType]
    const xpEarned = selectedType === 'understood' ? 10 : selectedType === 'harvest' ? 15 : 5
    const isResolved = selectedType !== 'stuck' && selectedType !== 'question'

    try {
      // 创建反馈记录
      const feedback: LearningFeedback = {
        id: `fb_${Date.now()}`,
        type: selectedType,
        content: inputValue.trim() || feedbackTypeConfig[selectedType].label,
        sessionId,
        knowledgeId,
        status: isResolved ? 'resolved' : 'pending',
        createdAt: new Date().toISOString(),
        resolved: isResolved,
      }

      // 本地AI回应预设
      const aiResponses: Record<FeedbackType, { content: string; suggestions?: string[] }> = {
        understood: { content: '太棒了！🎉 你已经理解了这个知识点，继续保持这种学习状态！要不要挑战一道练习题巩固一下？', suggestions: ['做练习题', '继续下一个知识点'] },
        confused: { content: '没关系，困惑是学习的开始 🤔。让我们换个角度来理解——你能告诉我具体是哪个部分让你感到困惑吗？', suggestions: ['换种方式讲解', '举个例子', '拆解步骤'] },
        stuck: { content: '别着急，卡住了很正常！😌 我们先回顾一下之前学过的内容，一步步来。你觉得是哪一步走不下去了？', suggestions: ['回顾前置知识', '拆分成小问题', '看提示'] },
        question: { content: '好问题！❓ 提出问题比解决问题更重要。让我们一起探讨这个问题——你先说说你的想法？' },
        note: { content: '好记性不如烂笔头 📝！做笔记是非常好的学习习惯，这些笔记会成为你复习时的宝贵资料。' },
        harvest: { content: '为你感到高兴！🎉 学到新知识的感觉是不是很棒？记得及时复习哦，根据艾宾浩斯曲线，今天复习一遍记忆更牢固！', suggestions: ['记录到错题本', '生成练习题', '继续学习'] },
      }

      const result = {
        feedback,
        xpEarned,
        response: aiResponses[selectedType],
      }

      // 更新统计
      const newStats = stats ? {
        ...stats,
        totalCount: stats.totalCount + 1,
        byType: {
          ...stats.byType,
          [selectedType]: stats.byType[selectedType] + 1,
        },
        earnedXP: stats.earnedXP + xpEarned,
        unresolvedCount: isResolved ? stats.unresolvedCount : stats.unresolvedCount + 1,
      } : {
        totalCount: 1,
        byType: { understood: 0, confused: 0, stuck: 0, question: 0, note: 0, harvest: 0, [selectedType]: 1 } as Record<FeedbackType, number>,
        unresolvedCount: isResolved ? 0 : 1,
        earnedXP: xpEarned,
        streakDays: 1,
      }
      setStats(newStats)

      // 保存到localStorage
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`feedback_stats_${today}`, JSON.stringify(newStats))

      // 添加到最近反馈
      setRecentFeedbacks((prev) => [result.feedback, ...prev].slice(0, 3))

      // 显示XP奖励动画
      setShowXP(result.xpEarned)
      setTimeout(() => setShowXP(null), 2000)

      // 显示AI打字回应
      setIsTyping(true)
      setCurrentResponse({
        content: result.response.content,
        accent: config.aiAccent,
        suggestions: result.response.suggestions,
      })

      // 通知父组件（加入对话流）
      onFeedbackSubmit?.(result.feedback, result.response.content)

      // 打字动画完成后
      const typingDuration = Math.min(result.response.content.length * 25, 1500)
      setTimeout(() => {
        setIsTyping(false)
      }, typingDuration + 300)
    } catch (error) {
      console.error('提交反馈失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 快速提交（无内容直接提交）
  const handleQuickSubmit = (type: FeedbackType) => {
    setSelectedType(type)
    setInputValue('')
    // 延迟一点提交以显示选择效果
    setTimeout(() => {
      handleSubmit()
    }, 100)
  }

  // 重置继续反馈
  const handleContinue = () => {
    setSelectedType(null)
    setInputValue('')
    setCurrentResponse(null)
    setIsTyping(false)
  }

  return (
    <>
      {/* XP 奖励飘字动画 */}
      {showXP !== null && (
        <div className="fixed bottom-28 right-6 z-[60] animate-bounce">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm">
            <Zap className="w-4 h-4" />
            +{showXP} XP
          </div>
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={togglePanel}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
            : 'bg-gradient-to-br from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* 脉冲动画 */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 animate-ping opacity-30" />
            {/* 小红点提醒 */}
            {stats && stats.unresolvedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {stats.unresolvedCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* 反馈面板 */}
      <div
        ref={panelRef}
        className={`fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-w-md transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-bg-secondary rounded-2xl shadow-2xl border border-border-theme overflow-hidden">
          {/* 面板头部 */}
          <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-bg-secondary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">快捷反馈</h3>
                  <p className="text-[11px] opacity-80">随时告诉我你的学习状态</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {stats && (
                  <div className="flex items-center gap-1 bg-bg-secondary/20 px-2 py-1 rounded-full">
                    <Flame className="w-3 h-3 text-orange-200" />
                    <span>{stats.streakDays}天</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 面板内容区 */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* 阶段1：选择反馈类型 */}
            {!selectedType && !currentResponse && (
              <div>
                <p className="text-xs text-text-secondary mb-3 text-center">
                  👆 点击最符合你现在状态的按钮
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickFeedbackTypes.map((fb) => {
                    const Icon = fb.icon
                    return (
                      <button
                        key={fb.type}
                        onClick={() => handleSelectType(fb.type)}
                        onDoubleClick={() => handleQuickSubmit(fb.type)}
                        className={`
                          relative group flex flex-col items-center gap-1.5 p-3 rounded-xl
                          bg-gradient-to-br ${fb.gradient} text-white
                          hover:scale-105 hover:shadow-lg ${fb.hoverShadow}
                          transition-all duration-200 active:scale-95
                        `}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-semibold">{fb.label}</span>
                        <span className="text-lg absolute top-1 right-2 opacity-40 group-hover:opacity-70 transition-opacity">
                          {fb.emoji}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-text-secondary mt-3 text-center">
                  💡 双击按钮可快速提交（无需输入内容）
                </p>
              </div>
            )}

            {/* 阶段2：输入具体内容 */}
            {selectedType && !currentResponse && (
              <div>
                {/* 已选类型标签 */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-text-secondary hover:text-gray-600 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${feedbackTypeConfig[selectedType].gradient} text-white text-sm font-medium`}>
                    {(() => {
                      const Icon = feedbackTypeConfig[selectedType].icon
                      return <Icon className="w-4 h-4" />
                    })()}
                    {feedbackTypeConfig[selectedType].emoji} {feedbackTypeConfig[selectedType].label}
                  </div>
                </div>

                {/* 输入框 */}
                <div className="relative mb-3">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder={
                      selectedType === 'question'
                        ? '说说你的问题吧，我会第一时间解答...'
                        : selectedType === 'stuck'
                          ? '哪里卡住了？描述一下具体情况...'
                          : selectedType === 'note'
                            ? '记录下你想记住的内容...'
                            : selectedType === 'confused'
                              ? '哪个部分让你感到困惑？（可选）'
                              : '想说点什么？（可选）'
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-border-theme rounded-xl resize-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-bg-primary focus:bg-bg-secondary"
                  />
                </div>

                {/* 提交按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`
                    w-full py-3 rounded-xl font-semibold text-white text-sm
                    bg-gradient-to-r ${feedbackTypeConfig[selectedType].gradient}
                    hover:shadow-lg transition-all duration-200
                    disabled:opacity-70 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      正在提交...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {inputValue.trim() ? '提交反馈' : '快速提交'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 阶段3：AI回应 */}
            {currentResponse && (
              <div>
                <AIResponseBubble
                  content={currentResponse.content}
                  typing={isTyping}
                  accent={currentResponse.accent}
                  compact
                  suggestions={!isTyping ? currentResponse.suggestions : undefined}
                />

                {/* 继续反馈按钮 */}
                {!isTyping && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={handleContinue}
                      className="w-full py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      继续反馈
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部统计栏 */}
          <div className="px-4 py-3 bg-bg-primary border-t border-border-theme">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stats?.totalCount ?? 0}
                  </div>
                  <div className="text-[10px] text-text-secondary">今日反馈</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {stats?.earnedXP ?? 0}
                  </div>
                  <div className="text-[10px] text-text-secondary">获得XP</div>
                </div>
                {stats && stats.unresolvedCount > 0 && (
                  <>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {stats.unresolvedCount}
                      </div>
                      <div className="text-[10px] text-text-secondary">待解决</div>
                    </div>
                  </>
                )}
              </div>

              {/* 今日反馈类型分布（小图标） */}
              {stats && stats.totalCount > 0 && (
                <div className="flex items-center gap-1">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    if (count === 0) return null
                    const config = feedbackTypeConfig[type as FeedbackType]
                    const Icon = config.icon
                    return (
                      <div
                        key={type}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
                        title={`${config.label}: ${count}次`}
                      >
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FeedbackWorkspace
