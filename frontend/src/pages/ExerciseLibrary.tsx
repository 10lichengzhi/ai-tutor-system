import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Library, Sparkles, Clock, CheckCircle, XCircle,
  Zap, BookOpen, Target, Play, Loader2, RefreshCw,
  ChevronRight, Brain, Award, BarChart3, ArrowLeft, Send
} from 'lucide-react'
import { useExercises } from '../contexts/ExercisesContext'
import type { Exercise, ExerciseDifficulty, ExerciseType, ExerciseSession } from '../types/learning'

const ExerciseLibrary = () => {
  const navigate = useNavigate()
  const {
    exercises,
    records,
    sessions,
    isGenerating,
    isGrading,
    generateExercises,
    generateWrongReviewExercises,
    generateMixedExercises,
    startSession,
    submitAnswer,
    completeSession,
    getStatistics,
    getRecentRecords
  } = useExercises()

  const [activeSession, setActiveSession] = useState<ExerciseSession | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null)
  const [generatingType, setGeneratingType] = useState<string | null>(null)

  // 生成参数状态
  const [genParams, setGenParams] = useState({
    knowledgePoint: '',
    count: 5,
    difficulty: 3 as ExerciseDifficulty,
    type: 'mixed' as ExerciseType | 'mixed'
  })
  const [showGenModal, setShowGenModal] = useState(false)

  const stats = getStatistics()
  const recentRecords = getRecentRecords(10)

  // 开始AI生成练习
  const handleGenerate = async (type: 'knowledge' | 'wrong' | 'mixed') => {
    setGeneratingType(type)
    try {
      let newExercises: Exercise[]
      let title = ''
      let sessionType: ExerciseSession['type'] = 'knowledge-point'

      switch (type) {
        case 'wrong':
          newExercises = await generateWrongReviewExercises(5)
          title = '错题强化练习'
          sessionType = 'wrong-review'
          break
        case 'mixed':
          newExercises = await generateMixedExercises(5)
          title = '综合能力练习'
          sessionType = 'mixed'
          break
        case 'knowledge':
          if (!genParams.knowledgePoint.trim()) {
            alert('请输入知识点')
            setGeneratingType(null)
            return
          }
          newExercises = await generateExercises({
            knowledgePoint: genParams.knowledgePoint,
            count: genParams.count,
            difficulty: genParams.difficulty,
            type: genParams.type
          })
          title = `${genParams.knowledgePoint} 专项练习`
          sessionType = 'knowledge-point'
          setShowGenModal(false)
          break
      }

      if (newExercises.length > 0) {
        const session = startSession(newExercises, title, sessionType)
        setActiveSession(session)
        setCurrentExerciseIndex(0)
        setUserAnswer('')
        setShowResult(false)
        setLastResult(null)
      }
    } catch (e) {
      alert('生成题目失败，请稍后重试')
      console.error(e)
    } finally {
      setGeneratingType(null)
    }
  }

  // 提交答案
  const handleSubmitAnswer = async () => {
    if (!activeSession || !userAnswer.trim()) return
    
    const currentExercise = activeSession.exercises[currentExerciseIndex]
    try {
      const record = await submitAnswer(
        activeSession.id,
        currentExercise.id,
        userAnswer,
        0 // 暂时不计时
      )
      setLastResult({
        isCorrect: record.isCorrect,
        feedback: record.aiFeedback || ''
      })
      setShowResult(true)
    } catch (e) {
      alert('提交失败，请重试')
    }
  }

  // 下一题
  const handleNext = () => {
    if (!activeSession) return
    
    if (currentExerciseIndex < activeSession.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setUserAnswer('')
      setShowResult(false)
      setLastResult(null)
    } else {
      // 完成练习
      completeSession(activeSession.id)
      const correctCount = activeSession.records.filter(r => r.isCorrect).length + (lastResult?.isCorrect ? 1 : 0)
      const total = activeSession.exercises.length
      alert(`练习完成！正确率：${Math.round((correctCount / total) * 100)}%`)
      setActiveSession(null)
      setCurrentExerciseIndex(0)
    }
  }

  // 退出练习
  const handleExitSession = () => {
    if (activeSession && confirm('确定要退出当前练习吗？进度将不会保存。')) {
      setActiveSession(null)
      setCurrentExerciseIndex(0)
      setUserAnswer('')
      setShowResult(false)
      setLastResult(null)
    }
  }

  const getDifficultyStars = (d: number) => '★'.repeat(d) + '☆'.repeat(5 - d)
  
  const getTypeLabel = (t: string) => {
    const typeMap: Record<string, string> = {
      choice: '选择题',
      fill: '填空题',
      calculate: '计算题',
      program: '编程题',
      'short-answer': '简答题'
    }
    return typeMap[t] || t
  }

  const getTypeColor = (t: string) => {
    const colorMap: Record<string, string> = {
      choice: 'bg-[#993222]/5 text-[#993222]',
      fill: 'bg-teal-50 text-teal-600',
      calculate: 'bg-orange-50 text-orange-600',
      program: 'bg-green-50 text-green-600',
      'short-answer': 'bg-amber-50 text-amber-600'
    }
    return colorMap[t] || 'bg-white/70 text-[#7a6b5e]'
  }

  // 如果正在练习中，显示练习界面
  if (activeSession) {
    const currentExercise = activeSession.exercises[currentExerciseIndex]
    const progress = ((currentExerciseIndex + 1) / activeSession.exercises.length) * 100
    const correctCount = activeSession.records.filter(r => r.isCorrect).length + (showResult && lastResult?.isCorrect ? 1 : 0)

    return (
      <div className="content-page">
        <div className="content-page-inner h-full flex flex-col">
        {/* 练习顶栏 */}
        <div className="bg-white border-b border-[#332a23]/10 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleExitSession}
              className="flex items-center gap-2 text-[#332a23]/50 hover:text-[#332a23]/80"
            >
              <ArrowLeft className="w-5 h-5" />
              退出练习
            </button>
            <div className="text-center">
              <h2 className="font-bold text-[#332a23]">{activeSession.title}</h2>
              <p className="text-sm text-[#332a23]/50">
                第 {currentExerciseIndex + 1} / {activeSession.exercises.length} 题
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{correctCount} 对</span>
            </div>
          </div>
          <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#993222] to-[#7a2818] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 题目内容 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* 题目卡片 */}
            <div className="bg-white rounded-2xl border border-[#332a23]/10 p-8 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(currentExercise.type)}`}>
                  {getTypeLabel(currentExercise.type)}
                </span>
                <span className="text-amber-500 text-sm">
                  {getDifficultyStars(currentExercise.difficulty)}
                </span>
                <span className="text-[#332a23]/40 text-sm">
                  知识点：{currentExercise.knowledgePoint}
                </span>
              </div>

              <div className="text-lg text-[#332a23]/90 leading-relaxed mb-8 whitespace-pre-wrap">
                {currentExercise.question}
              </div>

              {/* 选择题选项 */}
              {currentExercise.type === 'choice' && currentExercise.options && (
                <div className="space-y-3 mb-6">
                  {currentExercise.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !showResult && setUserAnswer(option.replace(/^[A-D]\.\s*/, '').charAt(0))}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showResult
                          ? userAnswer === option.replace(/^[A-D]\.\s*/, '').charAt(0)
                            ? lastResult?.isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-[#332a23]/10'
                          : userAnswer === option.replace(/^[A-D]\.\s*/, '').charAt(0)
                            ? 'border-[#993222] bg-[#993222]/5'
                            : 'border-[#332a23]/10 hover:border-[#332a23]/15 hover:bg-white/70'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* 其他题型输入框 */}
              {currentExercise.type !== 'choice' && (
                <div className="mb-6">
                  <textarea
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    disabled={showResult || isGrading}
                    placeholder="输入你的答案..."
                    rows={4}
                    className="w-full px-4 py-3 border border-[#332a23]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222] resize-none disabled:bg-white/70"
                  />
                </div>
              )}

              {/* 结果反馈 */}
              {showResult && lastResult && (
                <div className={`rounded-xl p-5 mb-6 ${
                  lastResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {lastResult.isCorrect ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-green-700 text-lg">回答正确！🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="font-bold text-red-700 text-lg">回答错误</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-[#332a23]/80 whitespace-pre-wrap">
                    {lastResult.feedback}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                {!showResult ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || isGrading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isGrading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {isGrading ? 'AI批改中...' : '提交答案'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  >
                    {currentExerciseIndex < activeSession.exercises.length - 1 ? (
                      <>
                        下一题
                        <ChevronRight className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        完成练习
                        <Award className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    )
  }

  // 练习库主页
  return (
    <div className="content-page">
      <div className="content-page-inner animate-fade-up">
      {/* 顶部标题 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
            <Library className="w-7 h-7 text-[#993222]" />
            AI智能练习库
          </h1>
          <p className="text-[#332a23]/50">AI根据你的学习进度和薄弱点，智能生成定制练习题</p>
        </div>
      </div>

      {/* AI出题卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          onClick={() => setShowGenModal(true)}
          className="bg-gradient-to-br from-[#993222] to-[#993222] rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-[#993222]/20 transition-all transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">知识点专项练习</h3>
          <p className="text-sm text-white/80 mb-4">针对指定知识点，AI生成定制练习题</p>
          <div className="flex items-center text-sm font-medium">
            开始出题 <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div
          onClick={() => handleGenerate('wrong')}
          className="bg-gradient-to-br from-[#993222] to-[#7a2818] rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-[#993222]/20 transition-all transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">错题强化练习</h3>
          <p className="text-sm text-white/80 mb-4">AI分析错题本，针对性出题强化薄弱点</p>
          <div className="flex items-center text-sm font-medium">
            {generatingType === 'wrong' ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-1" /> AI出题中...</>
            ) : (
              <>开始练习 <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </div>
        </div>

        <div
          onClick={() => handleGenerate('mixed')}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-emerald-200 transition-all transform hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">AI智能组卷</h3>
          <p className="text-sm text-emerald-100 mb-4">综合学习进度，AI生成阶段性测试卷</p>
          <div className="flex items-center text-sm font-medium">
            {generatingType === 'mixed' ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-1" /> AI组卷中...</>
            ) : (
              <>开始测试 <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#993222]/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#993222]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#332a23]">{stats.total}</div>
              <div className="text-xs text-[#332a23]/50">总题数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#332a23]">{stats.completed}</div>
              <div className="text-xs text-[#332a23]/50">已完成</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#332a23]">{stats.accuracy}%</div>
              <div className="text-xs text-[#332a23]/50">正确率</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#332a23]">{sessions.length}</div>
              <div className="text-xs text-[#332a23]/50">练习次数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近题目和记录 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 已生成的题目列表 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-6 shadow-sm">
          <h3 className="font-bold text-[#332a23] mb-4 flex items-center gap-2">
            <Library className="w-5 h-5 text-[#993222]" />
            最近生成的题目
          </h3>
          {exercises.length === 0 ? (
            <div className="text-center py-12 text-[#332a23]/40">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#993222]/30" />
              <p className="text-lg font-medium">还没有题目</p>
              <p className="text-sm mt-1">点击上方卡片，让AI为你生成练习题</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {exercises.slice(0, 10).map(ex => {
                const done = records.some(r => r.exerciseId === ex.id)
                const correct = records.find(r => r.exerciseId === ex.id)?.isCorrect
                return (
                  <div
                    key={ex.id}
                    className="p-4 border border-[#332a23]/5 rounded-xl hover:border-[#993222]/30 hover:bg-[#993222]/5/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(ex.type)}`}>
                            {getTypeLabel(ex.type)}
                          </span>
                          <span className="text-amber-500 text-xs">{getDifficultyStars(ex.difficulty)}</span>
                          {done && (
                            correct ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )
                          )}
                        </div>
                        <p className="text-sm text-[#332a23]/80 line-clamp-2">{ex.question}</p>
                        <p className="text-xs text-[#332a23]/40 mt-1">{ex.knowledgePoint}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 练习记录 */}
        <div className="bg-white rounded-xl border border-[#332a23]/10 p-6 shadow-sm">
          <h3 className="font-bold text-[#332a23] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#993222]" />
            最近练习记录
          </h3>
          {recentRecords.length === 0 ? (
            <div className="text-center py-12 text-[#332a23]/40">
              <Award className="w-16 h-16 mx-auto mb-4 text-[#993222]/30" />
              <p className="text-lg font-medium">还没有练习记录</p>
              <p className="text-sm mt-1">开始你的第一次AI练习吧！</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentRecords.map(record => {
                const ex = exercises.find(e => e.id === record.exerciseId)
                return (
                  <div
                    key={record.id}
                    className="p-4 border border-[#332a23]/5 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {record.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          record.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {record.isCorrect ? '回答正确' : '回答错误'}
                        </span>
                      </div>
                      <span className="text-xs text-[#332a23]/40">
                        {new Date(record.completedAt).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {ex && (
                      <p className="text-sm text-[#7a6b5e] line-clamp-2">{ex.question}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 生成题目弹窗 */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-[#332a23]/5">
              <h3 className="text-lg font-bold text-[#332a23] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#993222]" />
                AI定制专项练习
              </h3>
              <p className="text-sm text-[#332a23]/50 mt-1">输入知识点，AI为你生成专属练习题</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-2">
                  知识点 <span className="text-[#993222]">*</span>
                </label>
                <input
                  type="text"
                  value={genParams.knowledgePoint}
                  onChange={e => setGenParams(prev => ({ ...prev, knowledgePoint: e.target.value }))}
                  placeholder="例如：React Hooks、JavaScript闭包、一元二次方程..."
                  className="w-full px-4 py-3 border border-[#332a23]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#332a23]/80 mb-2">题目数量</label>
                  <select
                    value={genParams.count}
                    onChange={e => setGenParams(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-[#332a23]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222]"
                  >
                    <option value={3}>3道题</option>
                    <option value={5}>5道题</option>
                    <option value={10}>10道题</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#332a23]/80 mb-2">难度</label>
                  <select
                    value={genParams.difficulty}
                    onChange={e => setGenParams(prev => ({ ...prev, difficulty: parseInt(e.target.value) as ExerciseDifficulty }))}
                    className="w-full px-4 py-3 border border-[#332a23]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222]"
                  >
                    <option value={1}>★ 入门</option>
                    <option value={2}>★★ 基础</option>
                    <option value={3}>★★★ 进阶</option>
                    <option value={4}>★★★★ 提高</option>
                    <option value={5}>★★★★★ 挑战</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-2">题型</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mixed', label: '混合' },
                    { id: 'choice', label: '选择题' },
                    { id: 'fill', label: '填空题' },
                    { id: 'calculate', label: '计算题' },
                    { id: 'program', label: '编程题' },
                    { id: 'short-answer', label: '简答题' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setGenParams(prev => ({ ...prev, type: t.id as any }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        genParams.type === t.id
                          ? 'bg-[#993222] text-white'
                          : 'bg-white/80 text-[#7a6b5e] hover:bg-white/90'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#332a23]/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowGenModal(false)}
                className="px-5 py-2.5 text-[#7a6b5e] hover:bg-white/80 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleGenerate('knowledge')}
                disabled={!genParams.knowledgePoint.trim() || generatingType === 'knowledge'}
                className="px-5 py-2.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {generatingType === 'knowledge' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> AI出题中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> 开始AI出题</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ExerciseLibrary
