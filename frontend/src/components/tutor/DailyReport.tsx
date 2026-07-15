import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
  ArrowUp,
  Sparkles,
} from 'lucide-react'
import type { DailyReport as DailyReportType } from '../../types'

interface DailyReportProps {
  report: DailyReportType
  compact?: boolean
}

const DailyReport = ({ report, compact = false }: DailyReportProps) => {
  const completionRate = report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0
  const durationHours = Math.floor(report.totalDuration / 60)
  const durationMins = report.totalDuration % 60

  /** 获取评语颜色 */
  const getCommentColor = () => {
    if (completionRate >= 80) return 'text-secondary-600'
    if (completionRate >= 50) return 'text-primary-600'
    return 'text-amber-600'
  }

  /** 获取激励文案 */
  const getEncouragement = () => {
    if (completionRate >= 90) return '太厉害了！今天的表现堪称完美 🌟'
    if (completionRate >= 70) return '今天表现很棒，继续保持！💪'
    if (completionRate >= 50) return '完成一半以上了，明天加把劲！📈'
    return '今天有点松懈哦，明天我们一起加油！🚀'
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-secondary-200 bg-gradient-to-br from-secondary-50 via-white to-primary-50 overflow-hidden">
        {/* 头部 */}
        <div className="px-5 py-4 bg-gradient-to-r from-secondary-500 to-primary-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">今日学习报告</span>
            </div>
            <span className="text-sm opacity-80 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {report.date}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 核心数据 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Clock className="w-4 h-4 text-primary-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">
                {durationHours > 0 ? `${durationHours}h` : ''}{durationMins}m
              </div>
              <div className="text-[10px] text-gray-500">学习时长</div>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-secondary-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">
                {report.completedTasks}/{report.totalTasks}
              </div>
              <div className="text-[10px] text-gray-500">完成任务</div>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Target className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">
                {report.accuracy !== undefined ? `${report.accuracy}%` : '-'}
              </div>
              <div className="text-[10px] text-gray-500">正确率</div>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-gray-900">+{report.earnedXP}</div>
              <div className="text-[10px] text-gray-500">经验值</div>
            </div>
          </div>

          {/* 完成进度条 */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-600 font-medium">今日完成度</span>
              <span className={`font-bold ${getCommentColor()}`}>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-secondary-400 to-primary-500 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* 掌握知识点 */}
          {report.masteredKnowledge.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-600 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                今日掌握
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.masteredKnowledge.map((kp, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md">
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 评语 */}
          <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "{report.comment}"
            </p>
            <p className={`text-xs font-semibold mt-2 ${getCommentColor()}`}>
              {getEncouragement()}
            </p>
          </div>

          {/* 明日建议 */}
          {report.tomorrowPlan && (
            <div className="flex items-start gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
              <ArrowUp className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-primary-700 mb-0.5">明日建议</div>
                <p className="text-xs text-primary-800 leading-relaxed">{report.tomorrowPlan}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 完整报告卡片
  return (
    <div className="rounded-2xl border border-secondary-200 bg-white overflow-hidden shadow-card">
      <div className="px-6 py-5 bg-gradient-to-r from-secondary-500 to-primary-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold">每日学习报告</h3>
              <p className="text-white/80 text-sm">{report.subject} · {report.date}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completionRate}%</div>
            <div className="text-xs text-white/80">今日完成度</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
            <Clock className="w-8 h-8 text-primary-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {durationHours > 0 ? `${durationHours}h ` : ''}{durationMins}min
              </div>
              <div className="text-xs text-gray-500">学习时长</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-secondary-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {report.completedTasks}/{report.totalTasks}
              </div>
              <div className="text-xs text-gray-500">完成任务</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <Target className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                {report.accuracy !== undefined ? `${report.accuracy}%` : '-'}
              </div>
              <div className="text-xs text-gray-500">做题正确率</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <Star className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">+{report.earnedXP}</div>
              <div className="text-xs text-gray-500">获得经验值</div>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">今日完成进度</span>
            <span className={`font-bold ${getCommentColor()}`}>{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-secondary-400 to-primary-500 transition-all duration-700 relative"
              style={{ width: `${completionRate}%` }}
            >
              {completionRate > 10 && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 掌握知识点 */}
          {report.masteredKnowledge.length > 0 && (
            <div className="p-4 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-secondary-700 mb-3">
                <Sparkles className="w-4 h-4" />
                今日掌握的知识点
              </div>
              <div className="flex flex-wrap gap-2">
                {report.masteredKnowledge.map((kp, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white text-secondary-700 rounded-lg text-sm font-medium shadow-sm">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 待加强 */}
          {report.weakKnowledge.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700 mb-3">
                <AlertCircle className="w-4 h-4" />
                需要继续加强
              </div>
              <div className="flex flex-wrap gap-2">
                {report.weakKnowledge.map((kp, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white text-red-700 rounded-lg text-sm font-medium shadow-sm">
                    {kp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 评语 */}
        <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-700 mb-1">智师寄语</div>
              <p className="text-sm text-gray-700 leading-relaxed">{report.comment}</p>
              <p className={`text-sm font-semibold mt-2 ${getCommentColor()}`}>
                {getEncouragement()}
              </p>
            </div>
          </div>
        </div>

        {/* 明日建议 */}
        {report.tomorrowPlan && (
          <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl border border-primary-200">
            <TrendingUp className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-primary-700 mb-1">明日学习建议</div>
              <p className="text-sm text-primary-800 leading-relaxed">{report.tomorrowPlan}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyReport
