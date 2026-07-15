import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookX, Clock, RefreshCw, Sparkles, CheckCircle,
  Filter, Bot, Target, TrendingUp, AlertTriangle, X, Zap,
  Plus, Loader2, Brain, ChevronRight, Trash2, BookOpen
} from 'lucide-react'
import { useWrongAnswers } from '../contexts/WrongAnswersContext'
import type { WrongAnswer } from '../types/learning'
import { cleanText } from '../utils/textCleaner'

const WrongBook = () => {
  const navigate = useNavigate()
  const {
    wrongAnswers,
    isAnalyzing,
    addWrongAnswer,
    deleteWrongAnswer,
    markAsMastered,
    recordReview,
    analyzeWithAI,
    analyzeAllWithAI,
    batchAnalyzeWeakPoints,
    getTodayReviewList,
    getWeakPoints
  } = useWrongAnswers()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'today'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [weakPointsAnalysis, setWeakPointsAnalysis] = useState<string>('')
  const [analyzingWeakPoints, setAnalyzingWeakPoints] = useState(false)

  // 添加错题表单状态
  const [newWrong, setNewWrong] = useState({
    question: '',
    userAnswer: '',
    correctAnswer: '',
    knowledgePoint: '',
    subject: '通用'
  })

  // 筛选错题
  const getFilteredQuestions = () => {
    const today = new Date().toISOString().split('T')[0]
    switch (filter) {
      case 'pending':
        return wrongAnswers.filter(q => q.status === 'pending')
      case 'reviewing':
        return wrongAnswers.filter(q => q.status === 'reviewing')
      case 'today':
        return wrongAnswers.filter(q => q.status !== 'mastered' && q.nextReviewDate <= today)
      default:
        return wrongAnswers.filter(q => q.status !== 'mastered')
    }
  }

  const filteredQuestions = getFilteredQuestions()
  const todayList = getTodayReviewList()
  const weakPoints = getWeakPoints()
  const masteredCount = wrongAnswers.filter(q => q.status === 'mastered').length
  const selectedQuestion = wrongAnswers.find(q => q.id === selectedId)

  const getSubjectColorClasses = (subject: string) => {
    const colorMap: Record<string, { bg: string; text: string; light: string; border: string }> = {
      '前端开发': { bg: 'bg-[#993222]', text: 'text-[#993222]', light: 'bg-[#993222]/5', border: 'border-l-[#993222]' },
      '后端开发': { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-l-green-500' },
      '嵌入式': { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-l-orange-500' },
      '数学': { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-l-purple-500' },
      '通用': { bg: 'bg-[#993222]', text: 'text-[#993222]', light: 'bg-[#993222]/5', border: 'border-l-[#993222]' },
    }
    return colorMap[subject] || colorMap['通用']
  }

  // AI讲解错题
  const reviewWithAI = (question: WrongAnswer) => {
    navigate('/tutor', {
      state: {
        prompt: `请给我详细讲解这道错题，用苏格拉底式提问引导我理解：\n\n题目：${question.question}\n我的答案：${question.userAnswer}\n正确答案：${question.correctAnswer || '未提供'}\n知识点：${question.knowledgePoint || '未知'}`
      }
    })
  }

  // AI分析单题
  const handleAnalyze = async (id: string) => {
    try {
      await analyzeWithAI(id)
    } catch (e) {
      alert('AI分析失败，请稍后重试')
    }
  }

  // AI批量分析薄弱点
  const handleAnalyzeWeakPoints = async () => {
    setAnalyzingWeakPoints(true)
    try {
      const result = await batchAnalyzeWeakPoints()
      setWeakPointsAnalysis(result)
    } catch (e) {
      alert('分析失败，请稍后重试')
    } finally {
      setAnalyzingWeakPoints(false)
    }
  }

  // 添加错题
  const handleAddWrong = () => {
    if (!newWrong.question.trim() || !newWrong.userAnswer.trim()) {
      alert('请填写题目和你的答案')
      return
    }
    addWrongAnswer({
      title: newWrong.question.substring(0, 30),
      subject: newWrong.subject,
      question: newWrong.question,
      userAnswer: newWrong.userAnswer,
      correctAnswer: newWrong.correctAnswer,
      knowledgePoint: newWrong.knowledgePoint
    })
    setNewWrong({ question: '', userAnswer: '', correctAnswer: '', knowledgePoint: '', subject: '通用' })
    setShowAddModal(false)
  }

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    if (dateStr === today) return '今天'
    if (dateStr === tomorrow) return '明天'
    return dateStr
  }

  return (
    <div className="content-page">
      <div className="content-page-inner h-full flex flex-col">
        {/* 顶部标题栏 */}
        <div className="bg-white border-b border-[#332a23]/10 px-8 py-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
                <BookX className="w-7 h-7 text-[#993222]" />
                AI错题本
              </h1>
              <p className="text-[#332a23]/50">AI智师深度分析错因，精准推荐复习，告别重复犯错</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#332a23]/10 text-[#332a23]/80 font-medium rounded-xl hover:bg-white/70 hover:border-[#332a23]/15 transition-all"
              >
                <Plus className="w-5 h-5" />
                录入错题
              </button>
              <button
                onClick={() => analyzeAllWithAI()}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#993222]/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                {isAnalyzing ? 'AI分析中...' : 'AI批量分析'}
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#993222]/5 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#993222]/10 rounded-lg flex items-center justify-center">
                  <BookX className="w-5 h-5 text-[#993222]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#332a23]">{wrongAnswers.filter(q => q.status !== 'mastered').length}</div>
                  <div className="text-xs text-[#332a23]/50">待复习错题</div>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{todayList.length}</div>
                  <div className="text-xs text-[#332a23]/50">今日待复习</div>
                </div>
              </div>
            </div>
            <div className="bg-[#993222]/5 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#993222]/10 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-[#993222]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#993222]">{wrongAnswers.filter(q => q.status === 'reviewing').length}</div>
                  <div className="text-xs text-[#332a23]/50">复习中</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
                  <div className="text-xs text-[#332a23]/50">已掌握</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧筛选+错题列表 */}
          <div className="w-96 bg-white border-r border-[#332a23]/10 flex flex-col">
            {/* 筛选标签 */}
            <div className="p-4 border-b border-[#332a23]/5 flex gap-2">
              {[
                { key: 'all', label: '全部', count: wrongAnswers.filter(q => q.status !== 'mastered').length },
                { key: 'today', label: '今日待复习', count: todayList.length },
                { key: 'pending', label: '待复习', count: wrongAnswers.filter(q => q.status === 'pending').length },
                { key: 'reviewing', label: '复习中', count: wrongAnswers.filter(q => q.status === 'reviewing').length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.key
                      ? 'bg-[#993222] text-white'
                      : 'bg-white/80 text-[#7a6b5e] hover:bg-white/90'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* 错题列表 */}
            <div className="flex-1 overflow-y-auto">
              {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center text-[#332a23]/40">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#993222]/30" />
                  <p className="text-lg font-medium">太棒了！</p>
                  <p className="text-sm mt-1">暂无错题，继续保持！</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-sm text-[#993222] hover:text-[#993222]"
                  >
                    + 录入第一道错题
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredQuestions.map(q => {
                    const colors = getSubjectColorClasses(q.subject)
                    const isSelected = selectedId === q.id
                    const isToday = q.nextReviewDate <= new Date().toISOString().split('T')[0]
                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedId(q.id)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? `${colors.light} border-l-4 ${colors.border}`
                            : 'hover:bg-white/70 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 ${colors.light} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <BookX className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium text-sm line-clamp-2 ${
                                isSelected ? colors.text : 'text-[#332a23]'
                              }`}>
                                {q.title}
                              </h4>
                              {isToday && q.status !== 'mastered' && (
                                <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                  今日
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#332a23]/50">
                              <span className={`px-2 py-0.5 rounded ${colors.light} ${colors.text} font-medium`}>
                                {q.subject}
                              </span>
                              <span>错{q.wrongCount}次</span>
                              {q.aiAnalyzed && (
                                <span className="flex items-center gap-0.5 text-[#993222]">
                                  <Sparkles className="w-3 h-3" />
                                  AI已分析
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* AI薄弱点分析卡片 */}
            <div className="p-4 border-t border-[#332a23]/5">
              <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold text-sm">AI薄弱点诊断</span>
                </div>
                {weakPoints.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-xs text-white/80 mb-2">你的薄弱知识点：</p>
                    <div className="flex flex-wrap gap-1">
                      {weakPoints.slice(0, 3).map(wp => (
                        <span key={wp.knowledgePoint} className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                          {wp.knowledgePoint} ({wp.count}题)
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/80 mb-3">
                    暂无错题数据，AI将在你做题后自动分析薄弱点
                  </p>
                )}
                <button
                  onClick={handleAnalyzeWeakPoints}
                  disabled={analyzingWeakPoints || weakPoints.length === 0}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {analyzingWeakPoints ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {analyzingWeakPoints ? 'AI分析中...' : '查看AI详细诊断'}
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：错题详情 */}
          <div className="flex-1 overflow-y-auto p-8">
            {selectedQuestion ? (() => {
              const colors = getSubjectColorClasses(selectedQuestion.subject)
              return (
                <div className="max-w-3xl mx-auto">
                  {/* 题目头部 */}
                  <div className="bg-white rounded-2xl border border-[#332a23]/10 p-6 mb-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${colors.light} rounded-xl flex items-center justify-center`}>
                          <BookX className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-[#332a23]">{selectedQuestion.title}</h2>
                          <div className="flex items-center gap-3 text-sm text-[#332a23]/50 mt-1">
                            <span className={`px-2 py-0.5 rounded ${colors.light} ${colors.text} font-medium`}>
                              {selectedQuestion.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              错 {selectedQuestion.wrongCount} 次
                            </span>
                            <span>下次复习：{formatDate(selectedQuestion.nextReviewDate)}</span>
                            {selectedQuestion.knowledgePoint && (
                              <span className={colors.text}>{selectedQuestion.knowledgePoint}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteWrongAnswer(selectedQuestion.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-[#332a23]/40 hover:text-red-500"
                          title="删除错题"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedId(null)}
                          className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-[#332a23]/40" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 题目内容 */}
                  <div className="bg-white rounded-2xl border border-[#332a23]/10 p-6 mb-6 shadow-sm">
                    <h3 className="font-semibold text-[#332a23] mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#332a23]/50" />
                      题目
                    </h3>
                    <p className="text-[#332a23]/80 leading-relaxed whitespace-pre-wrap">
                      {selectedQuestion.question}
                    </p>
                  </div>

                  {/* 答案对比 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-red-700">我的答案</span>
                      </div>
                      <p className="text-sm text-[#332a23]/80 leading-relaxed bg-white/60 p-3 rounded-lg whitespace-pre-wrap">
                        {selectedQuestion.userAnswer}
                      </p>
                    </div>
                    {selectedQuestion.correctAnswer && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-green-700">正确答案</span>
                        </div>
                        <p className="text-sm text-[#332a23]/80 leading-relaxed bg-white/60 p-3 rounded-lg whitespace-pre-wrap">
                          {selectedQuestion.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI错因分析 */}
                  <div className="bg-gradient-to-br from-amber-50 to-[#993222]/5 border border-amber-100 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#993222]" />
                        <span className="font-semibold text-[#993222]">AI智师错因分析</span>
                      </div>
                      {!selectedQuestion.aiAnalyzed && (
                        <button
                          onClick={() => handleAnalyze(selectedQuestion.id)}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1 px-3 py-1 bg-[#993222] text-white text-sm rounded-lg hover:bg-[#7a2818] transition-colors disabled:opacity-50"
                        >
                          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                          {isAnalyzing ? '分析中...' : 'AI深度分析'}
                        </button>
                      )}
                    </div>
                    {selectedQuestion.aiAnalyzed && selectedQuestion.aiAnalysis ? (
                      <div className="text-sm text-[#332a23]/80 leading-relaxed whitespace-pre-wrap">
                        {cleanText(selectedQuestion.aiAnalysis)}
                      </div>
                    ) : (
                      <p className="text-sm text-[#332a23]/50 italic">
                        点击"AI深度分析"，让AI智师帮你找出错误根源，详细讲解知识点
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => reviewWithAI(selectedQuestion)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#993222] to-[#993222] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#993222]/20 transition-all"
                    >
                      <Bot className="w-5 h-5" />
                      AI智师一对一讲解
                    </button>
                    <button
                      onClick={() => {
                        recordReview(selectedQuestion.id, 'correct')
                        alert('已标记为答对，下次复习时间已更新')
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-50 text-green-700 border border-green-200 font-medium rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      我会了
                    </button>
                    <button
                      onClick={() => {
                        recordReview(selectedQuestion.id, 'wrong')
                        alert('已记录，将安排更多复习')
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-50 text-amber-700 border border-amber-200 font-medium rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      还不会
                    </button>
                    <button
                      onClick={() => navigate('/exercises')}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/70 text-[#332a23]/80 border border-[#332a23]/10 font-medium rounded-xl hover:bg-white/80 transition-colors"
                    >
                      <Zap className="w-5 h-5" />
                      练相似题
                    </button>
                  </div>
                </div>
              )
            })() : weakPointsAnalysis ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl border border-[#332a23]/10 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#993222] to-[#7a2818] rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#332a23]">AI学习诊断报告</h2>
                      <p className="text-sm text-[#332a23]/50">基于你的错题数据智能分析</p>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-[#332a23]/80 whitespace-pre-wrap leading-relaxed">
                    {cleanText(weakPointsAnalysis)}
                  </div>
                  <button
                    onClick={() => setWeakPointsAnalysis('')}
                    className="mt-6 flex items-center gap-2 text-[#332a23]/50 hover:text-[#332a23]/80"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    返回错题列表
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#332a23]/40">
                <BookX className="w-20 h-20 mb-4 opacity-30" />
                <p className="text-lg font-medium">选择一道错题查看详情</p>
                <p className="text-sm mt-2">点击左侧错题，AI智师帮你深度分析错因</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#993222] text-white font-medium rounded-xl hover:bg-[#993222] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    录入错题
                  </button>
                  <button
                    onClick={handleAnalyzeWeakPoints}
                    disabled={analyzingWeakPoints || weakPoints.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#993222] text-white font-medium rounded-xl hover:bg-[#7a2818] transition-colors disabled:opacity-50"
                  >
                    <Brain className="w-4 h-4" />
                    AI诊断薄弱点
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加错题弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-[#332a23]/5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#332a23] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#993222]" />
                  录入错题
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/80 rounded-lg"
                >
                  <X className="w-5 h-5 text-[#332a23]/40" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1">学科/方向</label>
                <select
                  value={newWrong.subject}
                  onChange={e => setNewWrong(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#332a23]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222]"
                >
                  <option value="通用">通用</option>
                  <option value="前端开发">前端开发</option>
                  <option value="后端开发">后端开发</option>
                  <option value="嵌入式">嵌入式</option>
                  <option value="数学">数学</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1">
                  题目内容 <span className="text-[#993222]">*</span>
                </label>
                <textarea
                  value={newWrong.question}
                  onChange={e => setNewWrong(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="粘贴或输入题目内容..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#332a23]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1">
                  你的答案 <span className="text-[#993222]">*</span>
                </label>
                <textarea
                  value={newWrong.userAnswer}
                  onChange={e => setNewWrong(prev => ({ ...prev, userAnswer: e.target.value }))}
                  placeholder="输入你当时的答案..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#332a23]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1">正确答案（选填）</label>
                <textarea
                  value={newWrong.correctAnswer}
                  onChange={e => setNewWrong(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="如果你知道正确答案可以填在这里..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#332a23]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1">相关知识点（选填）</label>
                <input
                  type="text"
                  value={newWrong.knowledgePoint}
                  onChange={e => setNewWrong(prev => ({ ...prev, knowledgePoint: e.target.value }))}
                  placeholder="例如：React Hooks、一元二次方程..."
                  className="w-full px-3 py-2 border border-[#332a23]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#332a23]/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 text-[#7a6b5e] hover:bg-white/80 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddWrong}
                className="px-5 py-2.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                保存错题，AI自动分析
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WrongBook
