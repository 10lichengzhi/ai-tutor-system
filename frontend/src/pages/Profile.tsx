import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Settings, LogOut, BookOpen, Target, Clock, ChevronRight,
  X, Moon, Bell, Volume2, Save, Sparkles, Bot, Award, TrendingUp,
  Calendar, Zap
} from 'lucide-react'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { useLearningStats } from '../contexts/LearningStatsContext'
import { useWrongAnswers } from '../contexts/WrongAnswersContext'
import { useExercises } from '../contexts/ExercisesContext'

const Profile = () => {
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    sound: true,
    dailyReminder: true,
    reminderTime: '19:00',
  })

  const { outline, wizardStep, activePlan, dailyCheckins, resetPlan } = useLearningPlan()
  const { stats } = useLearningStats()
  const { wrongAnswers, resetAll: resetWrongAnswers } = useWrongAnswers()
  const { getStatistics, resetAll: resetExercises } = useExercises()
  const { resetAll: resetStats } = useLearningStats()

  const exerciseStats = getStatistics()

  // 安全清除所有数据
  const handleClearData = () => {
    if (confirm('确定要清除所有本地学习数据吗？此操作不可恢复。')) {
      resetPlan()
      resetWrongAnswers()
      resetExercises()
      resetStats()
      // 清除所有ai-tutor开头的localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ai-tutor-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      alert('数据已清除，即将返回首页')
      setTimeout(() => navigate('/dashboard'), 300)
    }
  }

  // 计算真实统计数据
  const realStats = useMemo(() => {
    const totalMinutes = stats.totalMinutes || 0
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const timeStr = hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`

    return [
      { label: '学习天数', value: String(stats.totalStudyDays || 0), icon: Clock, color: 'brand', trend: stats.currentStreak > 0 ? `🔥${stats.currentStreak}天` : '-' },
      { label: '已掌握知识点', value: String(stats.masteredKnowledgePoints || 0), icon: BookOpen, color: 'green', trend: `正确率${exerciseStats.accuracy || 0}%` },
      { label: '累计学习', value: timeStr, icon: TrendingUp, color: 'teal', trend: `共${exerciseStats.total || 0}题` },
      { label: '错题本', value: String(wrongAnswers.filter(w => w.status !== 'mastered').length), icon: Zap, color: 'orange', trend: wrongAnswers.length > 0 ? '待复习' : '清空' },
    ]
  }, [stats, exerciseStats, wrongAnswers])

  // 成就计算（基于真实数据）
  const achievements = useMemo(() => [
    { icon: '🔥', label: '连续学习7天', unlocked: stats.longestStreak >= 7 },
    { icon: '📚', label: '掌握10个知识点', unlocked: stats.masteredKnowledgePoints >= 10 },
    { icon: '🎯', label: '完成第一阶段', unlocked: activePlan && outline ? true : false },
    { icon: '⭐', label: '消灭5道错题', unlocked: wrongAnswers.filter(w => w.status === 'mastered').length >= 5 },
    { icon: '🏆', label: '学习30天', unlocked: stats.totalStudyDays >= 30 },
    { icon: '💪', label: '累计10小时', unlocked: stats.totalMinutes >= 600 },
  ], [stats, wrongAnswers, activePlan, outline])

  // 获取学习方向标签
  const learningDirection = useMemo(() => {
    if (outline) {
      return outline.title || '学习中'
    }
    return '还没开始学习'
  }, [outline])

  // 计算等级
  const userLevel = useMemo(() => {
    const days = stats.totalStudyDays || 0
    if (days >= 30) return 'Lv.5 学习达人'
    if (days >= 14) return 'Lv.4 进阶学员'
    if (days >= 7) return 'Lv.3 坚持学习者'
    if (days >= 3) return 'Lv.2 初学者'
    return 'Lv.1 新手上路'
  }, [stats.totalStudyDays])

  // AI建议（基于真实数据）
  const aiSuggestion = useMemo(() => {
    if (!activePlan || !outline) {
      return '你还没有定制学习方案，点击下方按钮开始AI定制你的专属学习路径吧！'
    }
    const todayTasks = dailyCheckins.filter(c => c.date === new Date().toISOString().split('T')[0])
    const pendingWrong = wrongAnswers.filter(w => w.status !== 'mastered').length
    if (todayTasks.length === 0) {
      return `你正在学习「${outline.title}」，今天还没有开始学习哦。当前阶段：${outline.phases[0]?.title || ''}。加油！`
    }
    if (pendingWrong > 0) {
      return `今天已完成${todayTasks[0].completedNodeIds.length}个任务！错题本还有${pendingWrong}道错题待复习，建议及时巩固。`
    }
    return `继续保持！你在「${outline.title}」的学习进展顺利，坚持每天学习，目标就在前方！`
  }, [activePlan, outline, dailyCheckins, wrongAnswers])

  const quickActions = [
    { icon: Bot, label: 'AI智师', desc: '继续一对一辅导', path: '/tutor', color: 'brand' },
    { icon: BookOpen, label: '学习路径', desc: '查看当前进度', path: '/learning-path', color: 'green' },
    { icon: Target, label: '知识图谱', desc: '浏览知识点', path: '/knowledge', color: 'teal' },
    { icon: Calendar, label: '学习规划', desc: '制定计划', path: '/planner', color: 'orange' },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'brand':
        return { icon: 'text-[#993222]', bg: 'bg-[#993222]/10', gradient: 'from-[#993222] to-[#7a2818]' }
      case 'green':
        return { icon: 'text-green-600', bg: 'bg-green-500/10', gradient: 'from-green-500 to-green-600' }
      case 'teal':
        return { icon: 'text-teal-600', bg: 'bg-teal-500/10', gradient: 'from-teal-500 to-teal-600' }
      case 'orange':
        return { icon: 'text-orange-500', bg: 'bg-orange-500/10', gradient: 'from-orange-500 to-orange-600' }
      default:
        return { icon: 'text-[#993222]', bg: 'bg-[#993222]/10', gradient: 'from-[#993222] to-[#7a2818]' }
    }
  }

  return (
    <div className="content-page">
      <div className="content-page-inner animate-fade-up">
        {/* 顶部渐变用户信息 */}
        <div className="bg-gradient-to-r from-[#993222] via-[#8a2c1e] to-[#7a2818] rounded-2xl px-8 pt-8 pb-20 text-white shadow-lg mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg border border-white/20">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">学习者</h1>
                <p className="text-white/70 text-base mb-2">本地学习账户</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur border border-white/10">
                    🎯 {learningDirection}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur border border-white/10">
                    {userLevel}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/15 hover:bg-white/25 rounded-xl transition-colors backdrop-blur border border-white/10"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 统计卡片 - 悬浮在渐变卡片上 */}
        <div className="px-4 -mt-14 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realStats.map((stat, i) => {
              const Icon = stat.icon
              const colors = getColorClasses(stat.color)
              return (
                <div key={i} className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <span className={`text-xs font-medium ${colors.icon} ${colors.bg} px-2 py-0.5 rounded-full`}>
                      {stat.trend}
                    </span>
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-label">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：快捷入口 + 最近学习 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 快捷入口网格 */}
            <div className="content-panel p-6">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#993222]" />
                快捷入口
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, i) => {
                  const Icon = action.icon
                  const colors = getColorClasses(action.color)
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className="group p-4 rounded-xl bg-white/50 border border-[#332a23]/5 hover:border-[#993222]/20 hover:shadow-md transition-all text-left"
                    >
                      <div className={`w-11 h-11 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="font-semibold text-[#332a23] text-sm">{action.label}</div>
                      <div className="text-xs text-[#332a23]/50 mt-0.5">{action.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AI学习建议 */}
            <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur border border-white/10">
                  <Bot className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    AI智师建议
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-normal">今日</span>
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    {aiSuggestion}
                  </p>
                  <button
                    onClick={() => navigate(activePlan ? '/learning-path' : '/dashboard')}
                    className="px-5 py-2 bg-white text-[#993222] font-medium rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    {activePlan ? '查看学习路径' : '开始定制方案'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：成就 + 设置 */}
          <div className="space-y-6">
            {/* 成就徽章 */}
            <div className="content-panel p-6">
              <h2 className="text-lg font-bold text-[#332a23] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                成就徽章
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((ach, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-center transition-all ${
                      ach.unlocked
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
                        : 'bg-white/40 border border-[#332a23]/5 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{ach.icon}</div>
                    <div className={`text-xs font-medium ${ach.unlocked ? 'text-amber-700' : 'text-[#332a23]/40'}`}>
                      {ach.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 账户设置 */}
            <div className="content-panel overflow-hidden p-0">
              <div className="p-5 border-b border-[#332a23]/5">
                <h2 className="text-lg font-bold text-[#332a23]">账户</h2>
              </div>
              <div className="divide-y divide-[#332a23]/5">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#332a23]/5 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[#7a6b5e]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-[#332a23] text-sm">学习设置</div>
                    <div className="text-xs text-[#332a23]/50">AI模型、通知、偏好</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#332a23]/30" />
                </button>
                <button
                  onClick={handleClearData}
                  className="w-full flex items-center gap-4 p-4 hover:bg-red-50/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-red-600 text-sm">清除学习数据</div>
                    <div className="text-xs text-[#332a23]/40">重置所有本地学习记录</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#332a23]/30" />
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-[#332a23]/40 pt-2">
              AI智师导学系统 v1.0.0
            </p>
          </div>
        </div>

        {/* 设置弹窗 */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[#332a23]/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#332a23]">学习设置</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-[#332a23]/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#332a23]/40" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-4">
                  {[
                    { icon: Moon, label: '深色模式', key: 'darkMode' as const },
                    { icon: Bell, label: '学习通知', key: 'notifications' as const },
                    { icon: Volume2, label: '提示音效', key: 'sound' as const },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-[#332a23]/40" />
                          <span className="text-sm font-medium text-[#332a23]/80">{item.label}</span>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings[item.key] ? 'bg-[#993222]' : 'bg-[#332a23]/10'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-[#332a23]/40 pt-2">
                  更多设置请前往「设置」页面配置AI模型、教学风格、学习偏好等
                </p>
              </div>
              <div className="p-5 border-t border-[#332a23]/5 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2.5 border border-[#332a23]/10 text-[#332a23]/80 font-medium rounded-lg hover:bg-[#332a23]/5 transition-colors text-sm"
                >
                  关闭
                </button>
                <button
                  onClick={() => { setShowSettings(false); navigate('/settings') }}
                  className="flex-1 py-2.5 bg-[#993222] text-white font-medium rounded-lg hover:bg-[#7a2818] transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Settings className="w-4 h-4" />
                  前往完整设置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
