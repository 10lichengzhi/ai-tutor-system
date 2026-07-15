import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, Clock,
  Calendar, Target, BookOpen, Sparkles, Wand2, Brain,
  LineChart, FolderKanban, RotateCcw, Route, Check, Award, Flame, Network
} from 'lucide-react'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { cleanText } from '../utils/textCleaner'
import PlanWizard from '../components/learning/PlanWizard'
import DailyCheckin from '../components/learning/DailyCheckin'

const phaseColors = [
  { bg: 'bg-[#993222]', light: 'bg-[#993222]/5', text: 'text-[#993222]', border: 'border-[#993222]/30' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
]

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const LearningPath = () => {
  const navigate = useNavigate()
  const {
    // 新工作流
    wizardStep, outline, currentWeekNumber, weeklyPlans, weeklySummaries, dailyCheckins,
    isThinking, startWizard, cancelWizard, resetPlan, generateNextWeek, completeDailyTask,
    getCurrentWeekPlan, getWeekCheckins, getTodayTasks, hasCheckedInToday,
    // 旧数据兼容
    phases, knowledgePoints, userProfile, isGenerating, activePlan,
  } = useLearningPlan()

  const hasNewPlan = outline !== null && wizardStep === 'active'
  const hasOldPlan = phases.length > 0 && userProfile !== null

  // ========== 新工作流：激活学习状态 ==========
  if (hasNewPlan && outline) {
    const currentWeekPlan = getCurrentWeekPlan()
    const todayTasks = getTodayTasks()
    const totalTasks = currentWeekPlan?.dailyTasks.length || 0
    const completedTasks = currentWeekPlan?.dailyTasks.filter(t => t.isComplete).length || 0
    const weekProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const today = new Date()
    const todayDow = today.getDay() === 0 ? 7 : today.getDay()
    const completedToday = todayTasks.filter(t => t.isComplete).length

    // 找到当前阶段
    let currentPhase = outline.phases[0]
    for (const p of outline.phases) {
      if (currentWeekNumber >= p.startWeek && currentWeekNumber <= p.endWeek) {
        currentPhase = p
        break
      }
    }
    const phaseIndex = outline.phases.findIndex(p => p.id === currentPhase.id)
    const colors = phaseColors[phaseIndex % phaseColors.length]

    // 计算整体进度
    const allCompletedTasks = Object.values(weeklyPlans).reduce((sum, wp) =>
      sum + wp.dailyTasks.filter(t => t.isComplete).length, 0)
    const allTotalTasks = Object.values(weeklyPlans).reduce((sum, wp) =>
      sum + wp.dailyTasks.length, 0)
    const overallProgress = allTotalTasks > 0
      ? Math.round(((currentWeekNumber - 1) / outline.totalWeeks) * 100 + (weekProgress / outline.totalWeeks))
      : Math.round(((currentWeekNumber - 1) / outline.totalWeeks) * 100)

    const isLastWeek = currentWeekNumber >= outline.totalWeeks
    const canGenerateNextWeek = !isLastWeek && completedTasks >= Math.ceil(totalTasks * 0.6)

    return (
      <>
        <div className="content-page">
          <div className="content-page-inner animate-fade-up">
          {/* 头部 */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
                <Route className="w-7 h-7 text-[#993222]" />
                {cleanText(outline.title)}
              </h1>
              <p className="text-[#332a23]/50 text-sm">{cleanText(outline.overview)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('确定要重置学习计划吗？所有进度将丢失。')) {
                    resetPlan()
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-[#332a23]/10 text-[#7a6b5e] rounded-xl hover:bg-white/70 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                重新规划
              </button>
            </div>
          </div>

          {/* 总进度条 */}
          <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#332a23]/80">总进度</span>
                <span className="text-sm text-[#332a23]/50">
                  第{currentWeekNumber}周 / 共{outline.totalWeeks}周
                </span>
              </div>
              <span className="text-lg font-bold text-[#993222]">
                {overallProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            {/* 里程碑标记 */}
            {outline.milestones && outline.milestones.length > 0 && (
              <div className="flex justify-between mt-2">
                {outline.milestones.map((m, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: `${100 / outline.milestones.length}%` }}>
                    <div className={`w-3 h-3 rounded-full ${
                      currentWeekNumber >= m.week ? 'bg-[#993222]' : 'bg-gray-300'
                    }`} />
                    <span className={`text-xs mt-1 text-center ${
                      currentWeekNumber >= m.week ? 'text-[#993222] font-medium' : 'text-[#332a23]/40'
                    }`}>
                      {cleanText(m.title)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 今日任务快速入口 */}
          {todayTasks.length > 0 && (
            <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-2xl p-5 mb-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <h3 className="font-bold">今日任务</h3>
                </div>
                <span className="text-sm text-white/80">{completedToday}/{todayTasks.length} 已完成</span>
              </div>
              <div className="space-y-2 mb-4">
                {todayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${task.isComplete ? 'bg-white/20' : 'bg-white/10'}`}
                  >
                    {task.isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/50 flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${task.isComplete ? 'text-white/60 line-through' : ''}`}>
                      {cleanText(task.title)}
                    </span>
                    <span className="text-xs text-white/60">{task.duration}分钟</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const nextTask = todayTasks.find(t => !t.isComplete)
                  if (nextTask) {
                    completeDailyTask(nextTask.id)
                    navigate(`/tutor?topic=${encodeURIComponent(nextTask.title)}`)
                  }
                }}
                disabled={completedToday >= todayTasks.length}
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {completedToday >= todayTasks.length ? '今日任务已完成！' : '开始今日学习'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：阶段总览 + 周选择 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 当前阶段信息 */}
              <div className={`${colors.light} border ${colors.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center text-white font-bold`}>
                    {currentPhase.order}
                  </div>
                  <div>
                    <div className={`font-bold ${colors.text}`}>
                      阶段{currentPhase.order}：{cleanText(currentPhase.title)}
                    </div>
                    <div className="text-xs text-[#332a23]/50">
                      第{currentPhase.startWeek}-{currentPhase.endWeek}周 · 共{currentPhase.durationWeeks}周
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#7a6b5e] mb-3">{cleanText(currentPhase.description)}</p>
                {currentPhase.deliverable && (
                  <div className="flex items-center gap-2 text-sm bg-white/60 px-3 py-2 rounded-lg">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-[#332a23]/80">阶段产出：{cleanText(currentPhase.deliverable)}</span>
                  </div>
                )}
              </div>

              {/* 本周计划详情 */}
              {currentWeekPlan && (
                <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm overflow-hidden">
                  <div className={`${colors.light} border-b ${colors.border} px-5 py-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-[#332a23] flex items-center gap-2">
                          <Calendar className={`w-5 h-5 ${colors.text}`} />
                          第{currentWeekNumber}周：{cleanText(currentWeekPlan.theme)}
                        </h2>
                        <p className="text-sm text-[#7a6b5e] mt-1">{cleanText(currentWeekPlan.overview)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${colors.text}`}>{weekProgress}%</div>
                        <div className="text-xs text-[#332a23]/50">{completedTasks}/{totalTasks}任务</div>
                      </div>
                    </div>
                    {/* 周目标 */}
                    {currentWeekPlan.goals && currentWeekPlan.goals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {currentWeekPlan.goals.map((g, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/80 text-[#332a23]/80 rounded-full border border-[#332a23]/10">
                            🎯 {cleanText(g)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 一周7天任务 */}
                  <div className="divide-y divide-[#332a23]/5">
                    {currentWeekPlan.dailyTasks.reduce((acc: any[], task) => {
                      const dayGroup = acc.find(g => g.day === task.dayOfWeek)
                      if (dayGroup) {
                        dayGroup.tasks.push(task)
                      } else {
                        acc.push({ day: task.dayOfWeek, tasks: [task] })
                      }
                      return acc
                    }, []).sort((a, b) => a.day - b.day).map(({ day, tasks }) => {
                      const isToday = day === todayDow
                      const dayProgress = tasks.filter((t: any) => t.isComplete).length
                      const dayTotal = tasks.length
                      const allDone = dayProgress === dayTotal && dayTotal > 0

                      return (
                        <div key={day} className={`p-4 ${isToday ? 'bg-[#993222]/5' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                                isToday ? 'bg-[#993222] text-white' : allDone ? 'bg-green-100 text-green-700' : 'bg-white/80 text-[#7a6b5e]'
                              }`}>
                                {allDone ? <Check className="w-4 h-4" /> : weekDays[day - 1]}
                              </span>
                              <span className={`font-medium ${isToday ? 'text-[#993222]' : 'text-[#332a23]'}`}>
                                周{weekDays[day - 1]}
                                {isToday && <span className="ml-2 text-xs bg-[#993222]/10 text-[#993222] px-2 py-0.5 rounded-full">今天</span>}
                              </span>
                            </div>
                            {dayTotal > 0 && (
                              <span className="text-xs text-[#332a23]/50">{dayProgress}/{dayTotal}</span>
                            )}
                          </div>
                          <div className="space-y-2 ml-9">
                            {tasks.map((task: any) => {
                              const typeIcons: Record<string, any> = {
                                learn: BookOpen, practice: Target, project: Award, review: Flame, rest: Sparkles
                              }
                              const TypeIcon = typeIcons[task.type] || BookOpen
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => {
                                    if (!task.isComplete) {
                                      navigate(`/tutor?topic=${encodeURIComponent(task.title)}`)
                                    }
                                  }}
                                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                    task.isComplete
                                      ? 'bg-green-50 border border-green-100 opacity-70'
                                      : 'bg-white/70 hover:bg-white/80 border border-transparent hover:border-[#332a23]/10'
                                  }`}
                                >
                                  {task.isComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-[#332a23]/30 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className="w-4 h-4 text-[#332a23]/40" />
                                      <span className={`text-sm font-medium ${task.isComplete ? 'text-[#332a23]/40 line-through' : 'text-[#332a23]'}`}>
                                        {cleanText(task.title)}
                                      </span>
                                      <span className="text-xs text-[#332a23]/40">·{task.duration}分钟</span>
                                    </div>
                                    {task.keyPoints && task.keyPoints.length > 0 && !task.isComplete && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {task.keyPoints.slice(0, 3).map((kp: string, i: number) => (
                                          <span key={i} className="text-xs px-1.5 py-0.5 bg-white text-[#332a23]/50 rounded">{cleanText(kp)}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {!task.isComplete && (
                                    <ChevronRight className="w-4 h-4 text-[#332a23]/30 flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 周末反思 */}
                  {currentWeekPlan.weekendReview && (
                    <div className="p-4 bg-teal-50 border-t border-teal-100">
                      <div className="flex items-start gap-2">
                        <Brain className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-teal-900">周末反思</div>
                          <p className="text-sm text-teal-700 mt-1">{cleanText(currentWeekPlan.weekendReview.reflectionPrompt)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 生成下周按钮 */}
                  {!isLastWeek && (
                    <div className="p-4 border-t border-[#332a23]/5 bg-white/50">
                      <button
                        onClick={() => generateNextWeek()}
                        disabled={isThinking || !canGenerateNextWeek}
                        className="w-full py-3 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isThinking ? (
                          <>AI正在生成下周计划...</>
                        ) : canGenerateNextWeek ? (
                          <>
                            <Sparkles className="w-4 h-4" />
                            生成第{currentWeekNumber + 1}周学习计划
                            <ChevronRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>完成本周60%以上任务后可解锁下周计划</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 阶段总览 */}
              <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-[#332a23] mb-4 flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-[#332a23]/40" />
                  学习阶段总览
                </h3>
                <div className="space-y-3">
                  {outline.phases.map((phase, i) => {
                    const pc = phaseColors[i % phaseColors.length]
                    const isCurrent = currentWeekNumber >= phase.startWeek && currentWeekNumber <= phase.endWeek
                    const isPast = currentWeekNumber > phase.endWeek
                    const phaseProgress = isPast
                      ? 100
                      : isCurrent
                      ? Math.round(((currentWeekNumber - phase.startWeek) / phase.durationWeeks) * 100)
                      : 0

                    return (
                      <div key={phase.id} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          isPast ? 'bg-green-500' : isCurrent ? pc.bg : 'bg-white/90 border border-[#332a23]/10'
                        }`}>
                          {isPast ? <Check className="w-4 h-4" /> : phase.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${isCurrent ? pc.text : isPast ? 'text-green-700' : 'text-[#332a23]/50'}`}>
                              {cleanText(phase.title)}
                            </span>
                            <span className="text-xs text-[#332a23]/40">{phase.durationWeeks}周</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isPast ? 'bg-green-500' : pc.bg}`}
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 学习建议 */}
              {outline.learningTips && outline.learningTips.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI学习建议
                  </h3>
                  <ul className="space-y-2">
                    {outline.learningTips.slice(0, 4).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="text-amber-500 mt-0.5">💡</span>
                        {cleanText(tip)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 右侧：今日打卡 */}
            <div className="space-y-6">
              <DailyCheckin onAskAI={(topic) => navigate(`/tutor?topic=${encodeURIComponent(topic)}`)} />

              {/* 周总结（如果有） */}
              {weeklySummaries[currentWeekNumber] && (
                <div className="bg-gradient-to-br from-amber-50 to-[#993222]/5 border border-amber-200 rounded-2xl p-5">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    本周AI总结
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed mb-3">
                    {cleanText(weeklySummaries[currentWeekNumber].aiAdvice)}
                  </p>
                  {weeklySummaries[currentWeekNumber].strengths && weeklySummaries[currentWeekNumber].strengths.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-green-700 mb-1">👍 做得好的地方</div>
                      <ul className="text-xs text-[#7a6b5e] space-y-0.5">
                        {weeklySummaries[currentWeekNumber].strengths.slice(0, 3).map((s, i) => (
                          <li key={i}>• {cleanText(s)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 快速入口 */}
              <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-[#332a23] mb-3">快速操作</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/tutor')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#993222]/5 text-left transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#993222]/10 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-[#993222]" />
                    </div>
                    <div>
                      <div className="font-medium text-[#332a23] text-sm">AI智师答疑</div>
                      <div className="text-xs text-[#332a23]/50">随时向AI提问</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#332a23]/30 ml-auto" />
                  </button>
                  <button
                    onClick={() => navigate('/exercises')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-[#332a23] text-sm">做练习题</div>
                      <div className="text-xs text-[#332a23]/50">巩固今日知识点</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#332a23]/30 ml-auto" />
                  </button>
                  <button
                    onClick={() => navigate('/knowledge')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Network className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-[#332a23] text-sm">知识图谱</div>
                      <div className="text-xs text-[#332a23]/50">查看知识点掌握情况</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#332a23]/30 ml-auto" />
                  </button>
                  <button
                    onClick={() => navigate('/wrong-book')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-[#332a23] text-sm">错题本</div>
                      <div className="text-xs text-[#332a23]/50">复习薄弱知识点</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#332a23]/30 ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <PlanWizard />
      </>
    )
  }

  // ========== 向导中间状态（interview/outline/confirmed）显示PlanWizard弹窗 ==========
  if (wizardStep === 'interview' || wizardStep === 'outline' || wizardStep === 'confirmed') {
    return (
      <>
        <div className="content-page">
          <div className="content-page-inner animate-fade-up flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#993222] to-amber-500 flex items-center justify-center mb-6 shadow-xl mx-auto">
                <Wand2 className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-[#332a23] mb-2">AI正在为你定制学习方案</h2>
              <p className="text-[#332a23]/50 mb-6">请在弹出的对话框中与AI对话</p>
              <button
                onClick={cancelWizard}
                className="px-6 py-2 border border-[#332a23]/10 text-[#7a6b5e] rounded-xl hover:bg-white/70 transition-colors"
              >
                取消定制
              </button>
            </div>
          </div>
        </div>
        <PlanWizard />
      </>
    )
  }

  // ========== 旧格式计划兼容显示 ==========
  if (hasOldPlan && userProfile) {
    return (
      <>
        <div className="content-page">
          <div className="content-page-inner animate-fade-up">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
                <Route className="w-7 h-7 text-[#993222]" />
                学习路径
              </h1>
              <p className="text-[#332a23]/50 text-sm">
                {userProfile.directionName || '定制学习方案'} · 共{userProfile.totalWeeks}周
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/planner')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white rounded-xl text-sm"
              >
                <Sparkles className="w-4 h-4" />
                体验新版对话式规划
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要重置学习计划吗？所有进度将丢失。')) {
                    resetPlan()
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-[#332a23]/10 text-[#7a6b5e] rounded-xl hover:bg-white/70 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                重新规划
              </button>
            </div>
          </div>

          {/* 旧格式路径展示 */}
          <div className="space-y-6">
            {phases.map((phase, pi) => {
              const pc = phaseColors[pi % phaseColors.length]
              return (
                <div key={phase.id} className={`${pc.light} border ${pc.border} rounded-2xl overflow-hidden`}>
                  <div className="px-5 py-4 border-b ${pc.border}">
                    <h2 className={`font-bold text-lg ${pc.text}`}>
                      {phase.title || phase.name}
                    </h2>
                    <p className="text-sm text-[#7a6b5e] mt-1">{phase.description}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {phase.weeks.map(week => (
                      <div key={week.id} className="bg-white rounded-xl p-4 border border-white/80">
                        <h3 className="font-semibold text-[#332a23] mb-2">
                          第{week.weekNumber}周：{week.theme || week.title}
                        </h3>
                        <div className="space-y-2">
                          {week.nodes.map(node => (
                            <div
                              key={node.id}
                              onClick={() => {
                                if (node.status !== 'completed') {
                                  navigate(`/tutor?topic=${encodeURIComponent(node.title)}`)
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                                node.status === 'completed'
                                  ? 'bg-green-50 opacity-70'
                                  : 'bg-white/70 hover:bg-white'
                              }`}
                            >
                              {node.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-[#332a23]/30 flex-shrink-0" />
                              )}
                              <span className={`flex-1 text-sm ${node.status === 'completed' ? 'text-[#332a23]/40 line-through' : 'text-[#332a23]'}`}>
                                {cleanText(node.title)}
                              </span>
                              <span className="text-xs text-[#332a23]/40">{node.duration}分钟</span>
                              <ChevronRight className="w-4 h-4 text-[#332a23]/30" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
        <PlanWizard />
      </>
    )
  }

  // ========== 空状态：欢迎页 ==========
  return (
    <>
      <div className="content-page">
        <div className="content-page-inner animate-fade-up flex items-center justify-center">
          <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-[#993222]/5 relative overflow-hidden">
            {/* 装饰背景 */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#993222]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/20 rounded-full blur-3xl" />

            <div className="relative h-full flex flex-col items-center justify-center px-6">
              <div className="text-center max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#993222]/5 text-[#993222] rounded-full text-sm font-medium mb-6 border border-[#993222]/10">
                  <Sparkles className="w-4 h-4" />
                  AI 对话式个性化学习规划
                </div>

                <h1 className="text-5xl font-bold text-[#332a23] mb-6 leading-tight">
                  定制你的专属学习方案
                </h1>
                <p className="text-xl text-[#7a6b5e] mb-4 leading-relaxed">
                  AI通过对话了解你的目标和基础
                  <br />先制定学习总纲，再按周生成详细计划，每日打卡追踪进度
                </p>
                <p className="text-[#332a23]/40 mb-12">
                  支持嵌入式、前端、后端、Python、考研、英语等任何学习方向
                </p>

                <div className="flex flex-wrap justify-center gap-8 mb-12">
                  {[
                    { icon: Brain, label: '对话式了解', desc: 'AI像朋友一样聊天了解你的情况' },
                    { icon: Target, label: '总纲+周计划', desc: '先看大框架，每周按需生成详情' },
                    { icon: Flame, label: '每日打卡', desc: '记录学习感受，AI动态调整计划' },
                  ].map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-3 border border-[#332a23]/5">
                        <feature.icon className="w-6 h-6 text-[#993222]" />
                      </div>
                      <div className="font-semibold text-[#332a23] mb-1">{feature.label}</div>
                      <div className="text-sm text-[#332a23]/50 max-w-[180px]">{feature.desc}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => startWizard()}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white text-lg font-semibold rounded-2xl shadow-xl shadow-[#993222]/20 hover:shadow-2xl hover:shadow-[#993222]/20 transition-all transform hover:-translate-y-1"
                >
                  <Wand2 className="w-6 h-6" />
                  开始定制我的学习方案
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PlanWizard />
    </>
  )
}

export default LearningPath
