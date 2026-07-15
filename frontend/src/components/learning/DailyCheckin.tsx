import { useState } from 'react'
import {
  CheckCircle, Circle, Clock, BookOpen, Code, Flame, Smile, Frown,
  Meh, Zap, Award, ChevronRight, X, Star, Sparkles, MessageSquare
} from 'lucide-react'
import { useLearningPlan } from '../../contexts/LearningPlanContext'
import type { DailyTask } from '../../types/learning'

const MOOD_OPTIONS = [
  { value: 'great', icon: Smile, label: '很棒', color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  { value: 'good', icon: Smile, label: '不错', color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200' },
  { value: 'normal', icon: Meh, label: '一般', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'difficult', icon: Frown, label: '有点难', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { value: 'frustrated', icon: Frown, label: '很困惑', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
]

const TYPE_ICONS: Record<string, any> = {
  learn: BookOpen,
  practice: Code,
  project: Award,
  review: Flame,
  rest: Zap,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  learn: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  practice: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  project: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  review: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  rest: { bg: 'bg-bg-primary', text: 'text-text-primary', border: 'border-border-theme' },
}

const TYPE_LABELS: Record<string, string> = {
  learn: '学习',
  practice: '练习',
  project: '项目',
  review: '复习',
  rest: '休息',
}

interface TaskCheckinModalProps {
  task: DailyTask
  onClose: () => void
  onComplete: (data: { mood: string; understanding: number; note: string; studyMinutes: number }) => void
}

function TaskCheckinModal({ task, onClose, onComplete }: TaskCheckinModalProps) {
  const [mood, setMood] = useState('good')
  const [understanding, setUnderstanding] = useState(3)
  const [note, setNote] = useState('')
  const [studyMinutes, setStudyMinutes] = useState(task.duration)

  const handleSubmit = () => {
    onComplete({ mood, understanding, note, studyMinutes })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">🎉 学习打卡</h3>
            <p className="text-xs text-green-100">记录一下你的学习感受吧</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-secondary/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 任务信息 */}
          <div className={`p-3 rounded-lg ${TYPE_COLORS[task.type]?.bg || 'bg-bg-primary'} border ${TYPE_COLORS[task.type]?.border || 'border-border-theme'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${TYPE_COLORS[task.type]?.text || 'text-text-primary'}`}>
                {TYPE_LABELS[task.type]}
              </span>
              <span className="text-xs text-text-secondary">· {task.duration}分钟</span>
            </div>
            <div className="font-medium text-text-primary">{task.title}</div>
          </div>

          {/* 实际学习时长 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">实际学习时长</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={15}
                max={180}
                step={15}
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(parseInt(e.target.value))}
                className="flex-1 accent-green-600"
              />
              <span className="text-lg font-bold text-green-600 w-16 text-right">{studyMinutes}分钟</span>
            </div>
          </div>

          {/* 学习感受 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">学习感受</label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((m) => {
                const Icon = m.icon
                const isSelected = mood === m.value
                return (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      isSelected ? `${m.bg} border-current ${m.color}` : 'border-border-theme hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? m.color : 'text-text-secondary'}`} />
                    <span className={`text-xs ${isSelected ? m.color : 'text-text-secondary'}`}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 理解程度 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              理解程度 <span className="text-text-secondary font-normal">（{understanding}/5）</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setUnderstanding(n)}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                    n <= understanding
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-border-theme hover:border-gray-300'
                  }`}
                >
                  <Star className={`w-5 h-5 mx-auto ${n <= understanding ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1 px-1">
              <span>完全不懂</span>
              <span>完全掌握</span>
            </div>
          </div>

          {/* 学习笔记 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              学习笔记/心得 <span className="text-text-secondary font-normal">（选填）</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录一下今天学到了什么、遇到什么问题..."
              rows={3}
              className="w-full px-3 py-2 border border-border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border-theme bg-bg-primary flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-text-primary font-medium rounded-xl hover:bg-black/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-5 h-5" />
            完成打卡
          </button>
        </div>
      </div>
    </div>
  )
}

interface DailyCheckinProps {
  onAskAI?: (topic: string) => void
}

export default function DailyCheckin({ onAskAI }: DailyCheckinProps) {
  const {
    outline, currentWeekNumber, weeklyPlans, dailyCheckins, isThinking,
    completeDailyTask, generateNextWeek, generateWeekSummary,
    getTodayTasks, getCurrentWeekPlan, getWeekCheckins, hasCheckedInToday,
    wizardStep,
  } = useLearningPlan()

  const [checkinTask, setCheckinTask] = useState<DailyTask | null>(null)
  const todayTasks = getTodayTasks()
  const currentWeekPlan = getCurrentWeekPlan()
  const weekCheckins = getWeekCheckins(currentWeekNumber)
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const completedToday = todayTasks.filter(t => t.isComplete).length
  const totalToday = todayTasks.length
  const allTodayDone = totalToday > 0 && completedToday === totalToday

  // 检查是否本周所有任务都完成了
  const weekAllDone = currentWeekPlan && currentWeekPlan.dailyTasks.every(t => t.isComplete)

  const handleTaskClick = (task: DailyTask) => {
    if (task.isComplete) {
      // 点击已完成任务，可以去AI提问
      onAskAI?.(task.title)
    } else {
      setCheckinTask(task)
    }
  }

  const handleCheckinComplete = async (data: { mood: string; understanding: number; note: string; studyMinutes: number }) => {
    if (!checkinTask) return
    await completeDailyTask(checkinTask.id, {
      mood: data.mood as any,
      understanding: data.understanding as any,
      note: data.note,
      studyMinutes: data.studyMinutes,
    })
    setCheckinTask(null)
  }

  if (wizardStep !== 'active' || !outline || !currentWeekPlan) {
    return null
  }

  return (
    <div className="bg-bg-secondary border border-border-theme rounded-2xl shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Flame className="w-5 h-5" />
              第{currentWeekNumber}周 · {currentWeekPlan.theme}
            </h2>
            <p className="text-sm text-green-100 mt-0.5">{currentWeekPlan.overview}</p>
          </div>
          {allTodayDone && (
            <div className="bg-bg-secondary/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              今日任务完成！
            </div>
          )}
        </div>
        {/* 进度条 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-green-100 mb-1">
            <span>今日进度</span>
            <span>{completedToday}/{totalToday}</span>
          </div>
          <div className="w-full h-2 bg-bg-secondary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-bg-secondary rounded-full transition-all duration-500"
              style={{ width: totalToday > 0 ? `${(completedToday / totalToday) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* 本周目标 */}
      <div className="px-5 py-3 border-b border-border-theme bg-green-50/50">
        <div className="flex flex-wrap gap-1.5">
          {currentWeekPlan.goals.map((goal, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-bg-secondary text-green-700 rounded-full border border-green-200">
              🎯 {goal}
            </span>
          ))}
        </div>
      </div>

      {/* 今日任务 */}
      <div className="p-5">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-secondary" />
          今日任务（周{weekDays[dayOfWeek - 1]}）
        </h3>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>今天没有安排任务，休息一下吧 ☕</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => {
              const TypeIcon = TYPE_ICONS[task.type] || BookOpen
              const colors = TYPE_COLORS[task.type] || TYPE_COLORS.learn
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    task.isComplete
                      ? 'bg-green-50 border-green-200 opacity-70'
                      : `${colors.bg} ${colors.border} hover:shadow-md`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); if (!task.isComplete) setCheckinTask(task) }}
                    >
                      {task.isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-green-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TypeIcon className={`w-4 h-4 ${colors.text}`} />
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {TYPE_LABELS[task.type]}
                        </span>
                        <span className="text-xs text-text-secondary">· {task.duration}分钟</span>
                      </div>
                      <div className={`font-medium ${task.isComplete ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        {task.title}
                      </div>
                      {task.description && !task.isComplete && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.practiceSuggestion && !task.isComplete && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Code className="w-3 h-3" /> {task.practiceSuggestion}
                        </p>
                      )}
                    </div>
                    {!task.isComplete && (
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 全部完成后显示 */}
        {allTodayDone && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <div className="font-semibold text-green-700">太棒了！今日任务全部完成</div>
            <p className="text-sm text-green-600 mt-1">继续保持，你离目标又近了一步！</p>
          </div>
        )}

        {/* 本周全部完成 */}
        {weekAllDone && currentWeekNumber < (outline?.totalWeeks || 0) && (
          <button
            onClick={() => generateWeekSummary(currentWeekNumber)}
            disabled={isThinking}
            className="w-full mt-4 py-3 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isThinking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI生成周总结中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                查看本周总结并进入下一周
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}

        {/* 进入下一周按钮 */}
        {!weekAllDone && currentWeekNumber < (outline?.totalWeeks || 0) && weekCheckins.length >= 5 && (
          <button
            onClick={generateNextWeek}
            disabled={isThinking}
            className="w-full mt-4 py-3 border-2 border-[#993222]/30 text-[#993222] font-semibold rounded-xl hover:bg-[#993222]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isThinking ? (
              <>
                <div className="w-4 h-4 border-2 border-[#993222]/30 border-t-[#993222] rounded-full animate-spin" />
                生成下周计划中...
              </>
            ) : (
              <>
                <ChevronRight className="w-5 h-5" />
                提前进入第{currentWeekNumber + 1}周
              </>
            )}
          </button>
        )}
      </div>

      {/* 打卡弹窗 */}
      {checkinTask && (
        <TaskCheckinModal
          task={checkinTask}
          onClose={() => setCheckinTask(null)}
          onComplete={handleCheckinComplete}
        />
      )}
    </div>
  )
}
