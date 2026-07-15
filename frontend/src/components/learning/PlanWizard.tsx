import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Send, X, ChevronRight, Check, RefreshCw,
  Bot, User, Loader2, Target, Calendar, Clock, BookOpen, Award, AlertCircle, Pencil
} from 'lucide-react'
import { useLearningPlan } from '../../contexts/LearningPlanContext'
import { cleanText } from '../../utils/textCleaner'

interface PlanWizardProps {
  onClose?: () => void
}

const PlanWizard = ({ onClose }: PlanWizardProps) => {
  const {
    wizardStep, wizardMessages, collectedInfo, outline, isThinking, wizardError,
    startWizard, sendWizardMessage, generateOutline, confirmOutline, regenerateOutline, cancelWizard
  } = useLearningPlan()

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wizardMessages, isThinking])

  // 初始启动
  useEffect(() => {
    if (wizardStep === 'idle') {
      startWizard()
    }
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return
    const msg = inputValue.trim()
    setInputValue('')
    await sendWizardMessage(msg)
  }

  const handleQuickAnswer = async (answer: string) => {
    if (isThinking) return
    setInputValue('')
    await sendWizardMessage(answer)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ========== 对话阶段 ==========
  if (wizardStep === 'interview' || (wizardStep === 'outline' && !outline)) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] px-6 py-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI学习规划师</h2>
                <p className="text-xs text-white/80">告诉我你的情况，为你定制专属学习方案</p>
              </div>
            </div>
            <button
              onClick={() => { cancelWizard(); onClose?.() }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 信息收集进度 */}
          <div className="px-6 py-3 bg-[#993222]/5 border-b border-[#993222]/10">
            <div className="flex items-center gap-4 text-xs">
              {[
                { key: 'learningGoal', label: '学习目标', icon: Target },
                { key: 'currentLevel', label: '当前基础', icon: BookOpen },
                { key: 'timeAvailable', label: '时间安排', icon: Clock },
                { key: 'learningStyle', label: '学习偏好', icon: Award },
              ].map((item, i) => {
                const Icon = item.icon
                const collected = !!(collectedInfo as any)[item.key]
                return (
                  <div key={item.key} className={`flex items-center gap-1 ${collected ? 'text-green-600' : 'text-[#332a23]/40'}`}>
                    {collected ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                    {i < 3 && <span className="text-[#332a23]/30 ml-2">|</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/70">
            {wizardMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'ai' ? 'bg-[#993222]/10' : 'bg-amber-100'
                }`}>
                  {msg.role === 'ai' ? <Bot className="w-4 h-4 text-[#993222]" /> : <User className="w-4 h-4 text-amber-700" />}
                </div>
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'ai'
                      ? 'bg-white border border-[#332a23]/10 text-[#332a23]/90 rounded-tl-sm'
                      : 'bg-[#993222] text-white rounded-tr-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanText(msg.content)}</p>
                  </div>
                  {/* 快捷回答选项 - 仅作为启发，用户始终可以自由输入 */}
                  {msg.role === 'ai' && msg.suggestedAnswers && msg.suggestedAnswers.length > 0 && wizardStep === 'interview' && (
                    <div className="mt-2">
                      <div className="text-xs text-[#332a23]/40 mb-1.5 flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        快捷选项（仅供参考，你可以自由输入）
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedAnswers.map((ans, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickAnswer(ans)}
                            disabled={isThinking}
                            className="px-3 py-1.5 text-xs bg-white border border-[#993222]/30 text-[#993222] rounded-full hover:bg-[#993222]/5 hover:border-[#993222]/50 transition-colors disabled:opacity-50"
                          >
                            {ans}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* AI思考中 */}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#993222]/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#993222]" />
                </div>
                <div className="px-4 py-3 bg-white border border-[#332a23]/10 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 text-[#993222] animate-spin" />
                    <span className="text-sm text-[#332a23]/50">AI思考中...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 信息收集完成，显示生成总纲按钮 */}
            {wizardStep === 'outline' && !outline && !isThinking && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={generateOutline}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  生成我的学习总纲
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {wizardError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {wizardError}
                <button onClick={() => { handleSend() }} className="ml-auto underline text-xs">重试</button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-[#332a23]/10 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={wizardStep === 'interview' ? "输入你的回答（可以自由描述你的情况）..." : "信息收集完成，请点击上方按钮生成学习总纲"}
                disabled={isThinking || wizardStep === 'outline'}
                className="flex-1 px-4 py-2.5 border border-[#332a23]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#993222] focus:border-transparent disabled:bg-white/70 disabled:text-[#332a23]/40"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking || wizardStep === 'outline'}
                className="px-4 py-2.5 bg-[#993222] text-white rounded-xl hover:bg-[#993222] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== 总纲确认阶段 ==========
  if (wizardStep === 'outline' && outline) {
    const phaseColors = [
      'from-[#993222] to-cyan-500',
      'from-amber-500 to-orange-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-amber-500',
      'from-red-500 to-rose-500',
      'from-[#993222] to-teal-500',
    ]

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  你的专属学习方案
                </h2>
                <p className="text-sm text-white/80 mt-1">请确认以下学习总纲，满意后开始学习</p>
              </div>
              <button
                onClick={() => { cancelWizard(); onClose?.() }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 总纲内容 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 方案概览 */}
            <div className="bg-gradient-to-br from-[#993222]/5 to-amber-50 rounded-xl p-5 border border-[#993222]/10">
              <h3 className="font-bold text-xl text-[#332a23] mb-2">{outline.title}</h3>
              <p className="text-[#7a6b5e] text-sm leading-relaxed mb-4">{outline.overview}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#993222]">{outline.totalWeeks}</div>
                  <div className="text-xs text-[#332a23]/50">总周数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#993222]">{outline.estimatedHours}h</div>
                  <div className="text-xs text-[#332a23]/50">预估总时长</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">{outline.targetLevel}</div>
                  <div className="text-xs text-[#332a23]/50">目标水平</div>
                </div>
              </div>
            </div>

            {/* 前置知识 */}
            {outline.prerequisites && outline.prerequisites.length > 0 && outline.prerequisites[0] !== '无' && (
              <div>
                <h4 className="font-semibold text-[#332a23] mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  前置知识要求
                </h4>
                <div className="flex flex-wrap gap-2">
                  {outline.prerequisites.map((p, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full border border-orange-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 阶段划分 */}
            <div>
              <h4 className="font-semibold text-[#332a23] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#993222]" />
                学习阶段
              </h4>
              <div className="space-y-3">
                {outline.phases.map((phase, i) => (
                  <div key={phase.id} className="border border-[#332a23]/10 rounded-xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${phaseColors[i % phaseColors.length]} px-4 py-3 text-white`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">阶段{phase.order}：{phase.title}</div>
                          <div className="text-xs opacity-90">第{phase.startWeek}-{phase.endWeek}周 · {phase.durationWeeks}周</div>
                        </div>
                        {phase.deliverable && (
                          <div className="text-xs bg-white/20 px-2 py-1 rounded-lg">
                            🎯 {phase.deliverable}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-[#7a6b5e] mb-3">{phase.description}</p>
                      <div className="mb-3">
                        <div className="text-xs font-medium text-[#332a23]/50 mb-1.5">阶段目标</div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.goals.map((g, gi) => (
                            <span key={gi} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">✓ {g}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#332a23]/50 mb-1.5">核心知识点</div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.coreKnowledge.slice(0, 8).map((kp, ki) => (
                            <span key={ki} className="text-xs px-2 py-0.5 bg-white/80 text-[#332a23]/80 rounded">{kp}</span>
                          ))}
                          {phase.coreKnowledge.length > 8 && (
                            <span className="text-xs px-2 py-0.5 bg-white/70 text-[#332a23]/40 rounded">+{phase.coreKnowledge.length - 8}个</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 里程碑 */}
            {outline.milestones && outline.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold text-[#332a23] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  关键里程碑
                </h4>
                <div className="space-y-2">
                  {outline.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {m.week}
                      </div>
                      <div>
                        <div className="font-medium text-[#332a23] text-sm">{m.title}</div>
                        <div className="text-xs text-[#7a6b5e]">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 学习建议 */}
            {outline.learningTips && outline.learningTips.length > 0 && (
              <div className="bg-[#993222]/5 rounded-xl p-4 border border-[#993222]/30">
                <h4 className="font-semibold text-[#993222] mb-2 text-sm">💡 学习建议</h4>
                <ul className="space-y-1">
                  {outline.learningTips.map((tip, i) => (
                    <li key={i} className="text-sm text-[#993222] flex items-start gap-2">
                      <span className="text-[#993222]/80">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="p-4 border-t border-[#332a23]/10 bg-white/70 flex gap-3">
            <button
              onClick={cancelWizard}
              className="px-5 py-2.5 border border-[#332a23]/15 text-[#332a23]/80 font-medium rounded-xl hover:bg-white/80 transition-colors"
            >
              取消
            </button>
            <button
              onClick={regenerateOutline}
              disabled={isThinking}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#993222]/30 text-[#993222] font-medium rounded-xl hover:bg-[#993222]/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isThinking ? 'animate-spin' : ''}`} />
              重新生成
            </button>
            <button
              onClick={confirmOutline}
              disabled={isThinking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isThinking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成第一周计划...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  确认方案，开始学习
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default PlanWizard
