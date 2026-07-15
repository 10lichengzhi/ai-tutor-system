import { useState, useMemo } from 'react'
import { BookOpen, Clock, Target, Flame, Bot, ChevronRight, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Zap, Award, Brain, Calendar, BarChart3, ListChecks } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { useLearningStats } from '../contexts/LearningStatsContext'
import { useExercises } from '../contexts/ExercisesContext'
import { useWrongAnswers } from '../contexts/WrongAnswersContext'
import { cleanText } from '../utils/textCleaner'

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    phases, knowledgePoints, userProfile, activePlan,
    outline, wizardStep, currentWeekNumber, weeklyPlans,
    getTodayTasks, getCurrentWeekPlan, hasCheckedInToday
  } = useLearningPlan()
  const { stats, getKPMastery, getMasteryColor, getAccuracyRate, getTodayReviewKPIds } = useLearningStats()
  const { getStatistics } = useExercises()
  const { getTodayReviewList } = useWrongAnswers()
  
  const exerciseStats = getStatistics()
  const todayReviewCount = getTodayReviewKPIds().length + getTodayReviewList().length

  // 判断是否有有效的学习计划（旧格式或新格式）
  const hasOldPlan = phases.length > 0 && userProfile !== null
  const hasNewPlan = outline !== null && wizardStep === 'active'
  const hasPlan = hasOldPlan || hasNewPlan

  // 今日任务（新格式）
  const todayTasks = useMemo(() => getTodayTasks(), [getTodayTasks])
  const currentWeekPlan = useMemo(() => getCurrentWeekPlan(), [getCurrentWeekPlan])
  const completedTodayTasks = todayTasks.filter(t => t.isComplete).length
  const checkedInToday = hasCheckedInToday()

  // 旧格式统计
  const completedNodes = phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.nodes.filter(n => n.status === 'completed').length, 0), 0)
  const totalNodes = phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.nodes.length, 0), 0)

  // 新格式统计
  const newPlanCompletedTasks = useMemo(() => {
    let count = 0
    Object.values(weeklyPlans).forEach(wp => {
      count += wp.dailyTasks.filter(t => t.isComplete).length
    })
    return count
  }, [weeklyPlans])

  const newPlanTotalTasks = useMemo(() => {
    let count = 0
    Object.values(weeklyPlans).forEach(wp => {
      count += wp.dailyTasks.length
    })
    return count
  }, [weeklyPlans])

  const newPlanProgress = newPlanTotalTasks > 0 ? Math.round((newPlanCompletedTasks / newPlanTotalTasks) * 100) : 0

  const [tasks, setTasks] = useState([
    { id: 1, title: '欢迎使用AI智师导学系统', done: true },
    { id: 2, title: '点击"AI智师一对一"开始学习', done: false },
    { id: 3, title: '先定制你的学习路径', done: false },
  ])

  // 统计卡片数据
  const statCards = [
    {
      title: '连续学习',
      value: stats.currentStreak.toString(),
      unit: '天',
      icon: Flame,
      color: 'orange',
      subtext: stats.longestStreak > 0 ? `最长 ${stats.longestStreak} 天` : '开始第一天！',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: '总学习时长',
      value: Math.floor(stats.totalMinutes / 60).toString(),
      unit: '小时',
      icon: Clock,
      color: 'blue',
      subtext: `共 ${stats.totalStudyDays} 天`,
      gradient: 'from-[#993222] to-[#993222]'
    },
    {
      title: '答题正确率',
      value: stats.totalExercises > 0 ? getAccuracyRate().toString() : '--',
      unit: stats.totalExercises > 0 ? '%' : '',
      icon: Target,
      color: 'green',
      subtext: `共 ${stats.totalExercises} 道题`,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: '今日待复习',
      value: todayReviewCount.toString(),
      unit: '项',
      icon: Brain,
      color: 'teal',
      subtext: todayReviewCount > 0 ? 'AI推荐复习' : '暂无待复习',
      gradient: 'from-teal-500 to-cyan-500'
    },
  ]

  const quickActions = [
    {
      label: 'AI智师一对一',
      path: '/tutor',
      desc: '苏格拉底式引导，个性化学习',
      icon: Bot,
      gradient: 'from-[#993222] to-[#993222]',
      primary: true
    },
    {
      label: '学习路径',
      path: '/learning-path',
      desc: '查看你的专属学习方案',
      icon: Target,
      color: 'amber'
    },
    {
      label: 'AI练习',
      path: '/exercises',
      desc: '智能出题，自动批改',
      icon: Zap,
      color: 'amber'
    },
    {
      label: '错题本',
      path: '/wrong-book',
      desc: 'AI分析错因，精准复习',
      icon: BookOpen,
      color: 'rose'
    },
  ]

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; light: string }> = {
      blue: { bg: 'bg-[#993222]', text: 'text-[#993222]', light: 'bg-[#993222]/5' },
      green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
      red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
      purple: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
      rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
      sky: { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50' },
    }
    return colors[color] || colors.blue
  }

  // 获取知识点掌握度数据（前6个）
  const kpMasteryData = knowledgePoints.slice(0, 6).map(kp => ({
    name: kp.name,
    mastery: getKPMastery(kp.id),
    difficulty: kp.difficulty
  }))

  return (
    <div className="content-page">
      <div className="content-page-inner animate-fade-up">
      {/* 欢迎区域 */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#332a23] mb-1">
              {new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}！
              {stats.currentStreak > 0 && (
                <span className="ml-2 text-orange-500">🔥 连续学习{stats.currentStreak}天</span>
              )}
            </h1>
            <p className="text-[#332a23]/50">
              {hasPlan ? '继续你的学习之旅，今天也要加油！' : '开始定制你的专属AI学习方案'}
            </p>
            {hasNewPlan && outline && (
              <p className="text-[#993222] text-sm mt-1">
                当前方案：{cleanText(outline.title)} · 第{currentWeekNumber}周/{outline.totalWeeks}周
              </p>
            )}
          </div>
          {!hasPlan && (
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#993222] to-[#993222] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#993222]/20 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              开始定制
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-white/80 text-sm">{stat.unit}</span>
              </div>
              <div className="text-sm text-white/80">{stat.title}</div>
              <div className="text-xs text-white/60 mt-1">{stat.subtext}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：快捷入口 + 学习进度 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 快捷入口 */}
          <div>
            <h2 className="text-lg font-bold text-[#332a23] mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#993222]" />
              快捷入口
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                const colors = action.gradient
                  ? null
                  : getColorClasses(action.color || 'blue')
                return (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={`group relative overflow-hidden p-4 rounded-2xl text-left transition-all transform hover:-translate-y-1 ${
                      action.primary
                        ? `bg-gradient-to-br ${action.gradient} text-white shadow-lg shadow-[#993222]/20 hover:shadow-xl`
                        : 'bg-white border border-[#332a23]/10 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="relative z-10 flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        action.primary ? 'bg-white/20' : colors?.light
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          action.primary ? 'text-white' : colors?.text
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold mb-0.5 ${
                          action.primary ? 'text-white' : 'text-[#332a23]'
                        }`}>
                          {action.label}
                        </div>
                        <div className={`text-sm ${
                          action.primary ? 'text-white/80' : 'text-[#332a23]/50'
                        }`}>
                          {action.desc}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                        action.primary ? 'text-white/70' : 'text-[#332a23]/30'
                      }`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 今日学习任务（新格式） */}
          {hasNewPlan && todayTasks.length > 0 && (
            <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#332a23] flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-[#993222]" />
                  今日学习任务
                </h2>
                <span className="text-sm text-[#332a23]/50">
                  {completedTodayTasks}/{todayTasks.length} 已完成
                </span>
              </div>
              {currentWeekPlan && (
                <div className="mb-3 px-3 py-2 bg-[#993222]/5 rounded-lg">
                  <span className="text-xs text-[#993222]/70">本周主题：</span>
                  <span className="text-sm font-medium text-[#993222]">{cleanText(currentWeekPlan.theme)}</span>
                </div>
              )}
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      task.isComplete ? 'bg-green-50' : 'bg-[#332a23]/[0.02] hover:bg-[#332a23]/[0.04]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.isComplete ? 'bg-green-500' : 'border-2 border-[#332a23]/20'
                    }`}>
                      {task.isComplete && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
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
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/planner')}
                className="w-full mt-4 py-2.5 bg-[#993222] text-white rounded-xl font-medium hover:bg-[#7a2818] transition-colors flex items-center justify-center gap-1"
              >
                进入学习规划 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 知识点掌握度（旧格式） */}
          {hasOldPlan && kpMasteryData.length > 0 && (
            <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#993222]" />
                知识点掌握度
              </h2>
              <div className="space-y-4">
                {kpMasteryData.map(kp => (
                  <div key={kp.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#332a23]/80 flex items-center gap-2">
                        {kp.name}
                        <span className="text-xs text-[#332a23]/40">
                          {'★'.repeat(kp.difficulty)}{'☆'.repeat(5 - kp.difficulty)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold" style={{ color: getMasteryColor(kp.mastery) }}>
                        {kp.mastery}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${kp.mastery}%`,
                          backgroundColor: getMasteryColor(kp.mastery)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/knowledge')}
                className="w-full mt-4 py-2 text-sm text-[#993222] hover:text-[#993222] font-medium flex items-center justify-center gap-1"
              >
                查看全部知识点 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 当前学习方案（旧格式） */}
          {hasOldPlan && userProfile && (
            <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#993222]" />
                当前学习方案
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-[#993222]/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#993222]">{userProfile.totalWeeks}</div>
                  <div className="text-xs text-[#993222]/70">学习周数</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{completedNodes}</div>
                  <div className="text-xs text-green-600/70">已完成节点</div>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-teal-600">{knowledgePoints.length}</div>
                  <div className="text-xs text-teal-600/70">知识点数</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0}%
                  </div>
                  <div className="text-xs text-amber-600/70">整体进度</div>
                </div>
              </div>
              {userProfile.finalGoal && (
                <div className="bg-white/70 rounded-xl p-3 mb-4">
                  <span className="text-xs text-[#332a23]/50">最终目标</span>
                  <p className="text-sm text-[#332a23]/80 mt-0.5">{cleanText(userProfile.finalGoal)}</p>
                </div>
              )}
              <button
                onClick={() => navigate('/learning-path')}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
              >
                查看学习路径 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 当前学习方案（新格式） */}
          {hasNewPlan && outline && (
            <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#993222]" />
                我的学习总纲
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-[#993222]/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#993222]">{outline.totalWeeks}</div>
                  <div className="text-xs text-[#993222]/70">学习周数</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{currentWeekNumber}</div>
                  <div className="text-xs text-green-600/70">当前周次</div>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-teal-600">{outline.phases?.length || 0}</div>
                  <div className="text-xs text-teal-600/70">学习阶段</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{newPlanProgress}%</div>
                  <div className="text-xs text-amber-600/70">整体进度</div>
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 mb-4">
                <span className="text-xs text-[#332a23]/50">方案概述</span>
                <p className="text-sm text-[#332a23]/80 mt-0.5 line-clamp-2">{cleanText(outline.overview)}</p>
              </div>
              <div className="mb-4">
                <span className="text-xs text-[#332a23]/50 block mb-2">学习阶段</span>
                <div className="space-y-2">
                  {outline.phases?.slice(0, 3).map((phase) => (
                    <div key={phase.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        currentWeekNumber >= phase.startWeek && currentWeekNumber <= phase.endWeek
                          ? 'bg-[#993222]'
                          : currentWeekNumber > phase.endWeek
                          ? 'bg-green-500'
                          : 'bg-[#332a23]/20'
                      }`} />
                      <span className={`${
                        currentWeekNumber >= phase.startWeek && currentWeekNumber <= phase.endWeek
                          ? 'text-[#993222] font-medium'
                          : 'text-[#332a23]/60'
                      }`}>
                        {cleanText(phase.title)}
                      </span>
                      <span className="text-xs text-[#332a23]/40 ml-auto">
                        第{phase.startWeek}-{phase.endWeek}周
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/planner')}
                className="w-full py-2.5 bg-[#993222] text-white rounded-xl font-medium hover:bg-[#7a2818] transition-colors flex items-center justify-center gap-1"
              >
                查看学习规划 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 右侧：今日任务 + 学习贴士 */}
        <div className="space-y-6">
          {/* 今日待复习提醒 */}
          {todayReviewCount > 0 && (
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold">今日待复习</h3>
              </div>
              <p className="text-white/80 text-sm mb-4">
                AI根据记忆曲线为你安排了 {todayReviewCount} 项复习任务，及时复习效果更好！
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/wrong-book')}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
                >
                  错题复习
                </button>
                <button
                  onClick={() => navigate('/exercises')}
                  className="flex-1 py-2 bg-white text-teal-700 hover:bg-white/90 rounded-xl font-medium text-sm transition-colors"
                >
                  开始练习
                </button>
              </div>
            </div>
          )}

          {/* 今日打卡提示（新格式） */}
          {hasNewPlan && todayTasks.length > 0 && !checkedInToday && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold">今日学习提醒</h3>
              </div>
              <p className="text-white/80 text-sm mb-4">
                今天还有 {todayTasks.length - completedTodayTasks} 个任务待完成，加油！
              </p>
              <button
                onClick={() => navigate('/planner')}
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
              >
                开始今日学习
              </button>
            </div>
          )}

          {/* 新手引导 */}
          <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
              新手引导
            </h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-white/70 rounded-xl transition-colors -mx-3"
                >
                  {task.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#332a23]/15 flex-shrink-0 hover:border-[#993222]/80 transition-colors" />
                  )}
                  <span className={`text-sm ${task.done ? 'text-[#332a23]/40 line-through' : 'text-[#332a23]/80'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 学习成就 */}
          {stats.totalStudyDays > 0 && (
            <div className="bg-white border border-[#332a23]/10 rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                学习成就
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {stats.currentStreak >= 3 && (
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <div className="text-2xl">🔥</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">连续3天</div>
                  </div>
                )}
                {stats.correctExercises >= 10 && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl">✅</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">答对10题</div>
                  </div>
                )}
                {stats.masteredKnowledgePoints > 0 && (
                  <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <div className="text-2xl">🎓</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">掌握{stats.masteredKnowledgePoints}个知识点</div>
                  </div>
                )}
                {stats.totalMinutes >= 60 && (
                  <div className="bg-[#993222]/5 rounded-xl p-3 text-center">
                    <div className="text-2xl">⏱️</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">学习1小时</div>
                  </div>
                )}
                {stats.totalStudyDays === 1 && (
                  <div className="bg-[#993222]/5 rounded-xl p-3 text-center">
                    <div className="text-2xl">🌱</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">开始学习</div>
                  </div>
                )}
                {stats.currentStreak >= 7 && (
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="text-2xl">🏆</div>
                    <div className="text-xs text-[#7a6b5e] mt-1">坚持一周</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 学习小贴士 */}
          <div className="bg-gradient-to-br from-[#993222] to-[#7a2818] rounded-2xl p-5 text-white shadow-xl">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI学习贴士
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              {stats.currentStreak === 0
                ? '千里之行始于足下，今天就开始你的第一节AI辅导课吧！'
                : stats.currentStreak < 3
                  ? '太棒了！坚持下去，连续学习3天就能养成好习惯。'
                  : stats.currentStreak < 7
                    ? `连续学习${stats.currentStreak}天！你已经超过了90%的人，继续保持！`
                    : `连续学习${stats.currentStreak}天！你已经成为学习达人了，AI智师为你骄傲！🎉`
              }
            </p>
            <button
              onClick={() => navigate('/tutor')}
              className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              开始AI辅导
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Dashboard
