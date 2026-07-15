import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, CheckCircle2, Circle, Calendar, Target,
  Sparkles, Wand2, Brain, Clock, BookOpen, Award, Flame,
  RotateCcw, Route, Zap, TrendingUp, ListChecks
} from 'lucide-react'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { cleanText } from '../utils/textCleaner'
import PlanWizard from '../components/learning/PlanWizard'

const phaseColors = [
  { bg: 'bg-[#993222]', light: 'bg-[#993222]/5', text: 'text-[#993222]', border: 'border-[#993222]/30' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
]

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const Planner = () => {
  const navigate = useNavigate()
  const {
    wizardStep, outline, currentWeekNumber, weeklyPlans, weeklySummaries,
    isThinking, startWizard, resetPlan, generateNextWeek, completeDailyTask,
    getCurrentWeekPlan, getTodayTasks, getWeekCheckins,
    phases, userProfile, activePlan,
  } = useLearningPlan()

  const hasNewPlan = outline !== null && wizardStep === 'active'
  const hasOldPlan = phases.length > 0 && userProfile !== null
  const hasPlan = hasNewPlan || hasOldPlan

  const today = new Date()
  const todayDow = today.getDay() === 0 ? 7 : today.getDay()

  // 今日任务
  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks])
  const currentWeekPlan = useMemo(() => getCurrentWeekPlan(), [getCurrentWeekPlan])
  const completedToday = todayTasks.filter(t => t.isComplete).length

  // ========== 新格式计划激活状态 ==========
  if (hasNewPlan && outline) {
    const totalTasks = currentWeekPlan?.dailyTasks.length || 0
    const completedTasks = currentWeekPlan?.dailyTasks.filter(t => t.isComplete).length || 0
    const weekProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const isLastWeek = currentWeekNumber >= outline.totalWeeks
    const canGenerateNextWeek = !isLastWeek && completedTasks >= Math.ceil(totalTasks * 0.6)

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

    // 整体进度
    const overallProgress = Math.round(((currentWeekNumber - 1) / outline.totalWeeks) * 100 + (weekProgress / outline.totalWeeks))

    return (
      <>
        <div className="content-page">
          <div className="content-page-inner animate-fade-up">
          {/* 头部 */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-[#993222]" />
                学习规划
              </h1>
              <p className="text-[#332a23]/50 text-sm">
                {cleanText(outline.title)} · 第{currentWeekNumber}周/{outline.totalWeeks}周
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/learning-path')}
                className="flex items-center gap-2 px-4 py-2 border border-[#332a23]/10 text-[#7a6b5e] rounded-xl hover:bg-white/70 text-sm"
              >
                <Route className="w-4 h-4" />
                查看学习路径
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

          {/* 进度概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#993222] to-[#7a2818] rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm text-white/80">整体进度</span>
              </div>
              <div className="text-3xl font-bold">{overallProgress}%</div>
              <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
            <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-5 h-5 text-green-600" />
                <span className="text-sm text-[#332a23]/60">本周任务</span>
              </div>
              <div className="text-3xl font-bold text-[#332a23]">{completedTasks}/{totalTasks}</div>
              <div className="text-xs text-[#332a23]/40 mt-1">已完成 {weekProgress}%</div>
            </div>
            <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-[#332a23]/60">今日任务</span>
              </div>
              <div className="text-3xl font-bold text-[#332a23]">{completedToday}/{todayTasks.length}</div>
              <div className="text-xs text-[#332a23]/40 mt-1">
                {completedToday >= todayTasks.length ? '全部完成！' : '继续加油'}
              </div>
            </div>
            <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-[#332a23]/60">学习阶段</span>
              </div>
              <div className="text-lg font-bold text-[#332a23] truncate">{cleanText(currentPhase.title)}</div>
              <div className="text-xs text-[#332a23]/40 mt-1">
                第{currentPhase.startWeek}-{currentPhase.endWeek}周
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：本周日历视图 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 本周计划日历 */}
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

                  {/* 一周7天任务网格 */}
                  <div className="p-5">
                    <div className="grid grid-cols-7 gap-3">
                      {Array.from({ length: 7 }, (_, i) => i + 1).map(day => {
                        const dayTasks = currentWeekPlan.dailyTasks.filter(t => t.dayOfWeek === day)
                        const isToday = day === todayDow
                        const dayCompleted = dayTasks.filter(t => t.isComplete).length
                        const dayTotal = dayTasks.length
                        const allDone = dayCompleted === dayTotal && dayTotal > 0

                        return (
                          <div
                            key={day}
                            className={`rounded-xl p-3 min-h-[120px] ${
                              isToday ? `${colors.light} border-2 ${colors.border}` : 'bg-[#332a23]/[0.02] border border-transparent'
                            }`}
                          >
                            <div className={`text-center mb-2 ${
                              isToday ? 'font-bold' : ''
                            }`}>
                              <span className={`text-sm ${
                                isToday ? colors.text : 'text-[#332a23]/60'
                              }`}>
                                周{weekDays[day - 1]}
                              </span>
                              {isToday && (
                                <span className="block text-[10px] text-[#993222] mt-0.5">今天</span>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              {dayTasks.slice(0, 3).map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => {
                                    if (!task.isComplete && isToday) {
                                      navigate(`/tutor?topic=${encodeURIComponent(task.title)}`)
                                    }
                                  }}
                                  className={`text-[10px] p-1.5 rounded-lg truncate cursor-pointer ${
                                    task.isComplete
                                      ? 'bg-green-100 text-green-700 line-through'
                                      : isToday
                                      ? 'bg-white text-[#332a23] hover:shadow-sm'
                                      : 'bg-white/60 text-[#332a23]/60'
                                  }`}
                                  title={cleanText(task.title)}
                                >
                                  {task.isComplete ? '✓ ' : ''}{cleanText(task.title)}
                                </div>
                              ))}
                              {dayTasks.length > 3 && (
                                <div className="text-[10px] text-[#332a23]/40 text-center">
                                  +{dayTasks.length - 3}更多
                                </div>
                              )}
                            </div>
                            {dayTotal > 0 && (
                              <div className="mt-2 text-center">
                                <div className="w-full h-1 bg-white rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${allDone ? 'bg-green-500' : colors.bg}`}
                                    style={{ width: `${(dayCompleted / dayTotal) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

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

              {/* 学习总纲概览 */}
              <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-[#332a23] mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5 text-[#332a23]/40" />
                  学习总纲
                </h3>
                <p className="text-sm text-[#7a6b5e] mb-4 leading-relaxed">{cleanText(outline.overview)}</p>
                <div className="space-y-3">
                  {outline.phases.map((phase, i) => {
                    const pc = phaseColors[i % phaseColors.length]
                    const isCurrent = currentWeekNumber >= phase.startWeek && currentWeekNumber <= phase.endWeek
                    const isPast = currentWeekNumber > phase.endWeek
                    const phaseProgress = isPast ? 100 : isCurrent ? Math.round(((currentWeekNumber - phase.startWeek) / phase.durationWeeks) * 100) : 0

                    return (
                      <div key={phase.id} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          isPast ? 'bg-green-500' : isCurrent ? pc.bg : 'bg-white/90 border border-[#332a23]/10'
                        }`}>
                          {isPast ? <CheckCircle2 className="w-4 h-4" /> : phase.order}
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
                {outline.prerequisites && outline.prerequisites.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#332a23]/5">
                    <span className="text-xs text-[#332a23]/50 block mb-2">前置知识要求</span>
                    <div className="flex flex-wrap gap-1.5">
                      {outline.prerequisites.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {cleanText(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：今日任务 + 周总结 */}
            <div className="space-y-6">
              {/* 今日任务列表 */}
              <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-[#332a23] mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#993222]" />
                  今日任务
                </h3>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-[#332a23]/40">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">今天没有安排任务</p>
                    <p className="text-xs mt-1">好好休息一下吧</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (!task.isComplete) {
                            navigate(`/tutor?topic=${encodeURIComponent(task.title)}`)
                          }
                        }}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          task.isComplete
                            ? 'bg-green-50 border border-green-100'
                            : 'bg-[#332a23]/[0.02] hover:bg-[#332a23]/[0.04] border border-transparent hover:border-[#332a23]/10'
                        }`}
                      >
                        {task.isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#332a23]/30 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${task.isComplete ? 'text-[#332a23]/40 line-through' : 'text-[#332a23]'}`}>
                            {cleanText(task.title)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.type === 'learn' ? 'bg-blue-50 text-blue-600' :
                              task.type === 'practice' ? 'bg-amber-50 text-amber-600' :
                              task.type === 'project' ? 'bg-teal-50 text-teal-600' :
                              task.type === 'review' ? 'bg-teal-50 text-teal-600' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {task.type === 'learn' ? '学习' :
                               task.type === 'practice' ? '练习' :
                               task.type === 'project' ? '项目' :
                               task.type === 'review' ? '复习' : '休息'}
                            </span>
                            <span className="text-xs text-[#332a23]/40">{task.duration}分钟</span>
                          </div>
                        </div>
                        {!task.isComplete && (
                          <ChevronRight className="w-4 h-4 text-[#332a23]/30 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 周总结 */}
              {weeklySummaries[currentWeekNumber] && (
                <div className="bg-gradient-to-br from-amber-50 to-[#993222]/5 border border-amber-200 rounded-2xl p-5">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    本周AI总结
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed mb-3">
                    {cleanText(weeklySummaries[currentWeekNumber].aiAdvice)}
                  </p>
                  {weeklySummaries[currentWeekNumber].nextWeekFocus && weeklySummaries[currentWeekNumber].nextWeekFocus.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-amber-900 mb-1">下周重点：</div>
                      <ul className="text-xs text-[#7a6b5e] space-y-0.5">
                        {weeklySummaries[currentWeekNumber].nextWeekFocus.slice(0, 3).map((s, i) => (
                          <li key={i}>• {cleanText(s)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 快速入口 */}
              <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
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
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-[#332a23] text-sm">知识图谱</div>
                      <div className="text-xs text-[#332a23]/50">查看知识点掌握情况</div>
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

  // ========== 向导中间状态 ==========
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
            </div>
          </div>
        </div>
        <PlanWizard />
      </>
    )
  }

  // ========== 旧格式计划 ==========
  if (hasOldPlan && userProfile) {
    return (
      <>
        <div className="content-page">
          <div className="content-page-inner animate-fade-up">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-[#993222]" />
              学习规划
            </h1>
            <p className="text-[#332a23]/50 text-sm">
              {userProfile.directionName || '定制学习方案'} · 共{userProfile.totalWeeks}周
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  if (confirm('确定要重置并使用新版对话式规划吗？')) {
                    resetPlan()
                    setTimeout(() => startWizard(), 100)
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white rounded-xl text-sm"
              >
                <Sparkles className="w-4 h-4" />
                体验新版对话式规划
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#332a23]/10 rounded-2xl p-5 shadow-sm">
            <p className="text-[#332a23]/60 text-sm mb-4">
              你当前使用的是旧版学习计划格式。点击上方按钮可以体验全新的AI对话式规划，获得更个性化的学习体验。
            </p>
            <button
              onClick={() => navigate('/learning-path')}
              className="text-[#993222] text-sm font-medium flex items-center gap-1 hover:underline"
            >
              查看当前学习路径 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </div>
        </div>
        <PlanWizard />
      </>
    )
  }

  // ========== 空状态：引导用户开始定制 ==========
  return (
    <>
      <div className="content-page">
        <div className="content-page-inner animate-fade-up flex items-center justify-center">
          <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-[#993222]/5 relative overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#993222]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />

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
                  <br />先制定学习总纲，再按周生成详细计划
                </p>

                <div className="flex flex-wrap justify-center gap-8 mb-12">
                  {[
                    { icon: Brain, label: '对话式了解', desc: 'AI像朋友一样聊天了解你的情况' },
                    { icon: Target, label: '总纲+周计划', desc: '先看大框架，每周按需生成详情' },
                    { icon: Flame, label: '每日打卡', desc: '记录学习感受，AI动态调整' },
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

export default Planner
