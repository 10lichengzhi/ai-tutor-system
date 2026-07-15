import { TrendingUp, TrendingDown, AlertTriangle, Award, Clock, Calendar, Target, Zap } from 'lucide-react'
import Card from '../common/Card'
import type { Diagnosis, KnowledgeTag } from '../../types'

interface DiagnosisCardProps {
  diagnosis: Diagnosis
  /** 是否紧凑显示（在消息气泡内） */
  compact?: boolean
}

/** 水平等级对应的颜色和描述 */
const levelConfig: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
  1: { label: '入门', color: 'text-text-primary', bg: 'bg-bg-primary', emoji: '🌱' },
  2: { label: '基础', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '📖' },
  3: { label: '进阶', color: 'text-primary-700', bg: 'bg-primary-100', emoji: '💪' },
  4: { label: '熟练', color: 'text-secondary-600', bg: 'bg-secondary-100', emoji: '⭐' },
  5: { label: '精通', color: 'text-teal-600', bg: 'bg-teal-100', emoji: '🏆' },
}

/** 知识点标签颜色（根据薄弱程度） */
const getWeakTagStyle = (level?: number) => {
  if (!level || level < 30) return 'bg-red-100 text-red-700 border-red-200'
  if (level < 60) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-yellow-100 text-yellow-700 border-yellow-200'
}

const KnowledgeTagList = ({ tags, type }: { tags: KnowledgeTag[]; type: 'weak' | 'strength' }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border
            ${type === 'weak' ? getWeakTagStyle(tag.weaknessLevel) : 'bg-secondary-100 text-secondary-700 border-secondary-200'}
          `}
        >
          {type === 'weak' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Award className="w-3 h-3" />
          )}
          {tag.name}
          {tag.weaknessLevel !== undefined && type === 'weak' && (
            <span className="opacity-70 ml-0.5">{tag.weaknessLevel}%</span>
          )}
          {tag.strengthScore !== undefined && type === 'strength' && (
            <span className="opacity-70 ml-0.5">{tag.strengthScore}%</span>
          )}
        </span>
      ))}
    </div>
  )
}

const DiagnosisCard = ({ diagnosis, compact = false }: DiagnosisCardProps) => {
  const level = levelConfig[diagnosis.overallLevel] || levelConfig[3]

  if (compact) {
    return (
      <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
        {/* 头部 */}
        <div className="px-5 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
            <Target className="w-4 h-4" />
            <span>学情诊断报告 · {diagnosis.subject}</span>
          </div>
          <h3 className="text-lg font-bold">你的学习画像</h3>
        </div>

        <div className="p-5 space-y-4">
          {/* 核心数据 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-bg-primary rounded-xl">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${level.bg} mb-1`}>
                <span className="text-lg">{level.emoji}</span>
              </div>
              <div className={`text-lg font-bold ${level.color}`}>Lv.{diagnosis.overallLevel}</div>
              <div className="text-xs text-text-secondary">{level.label}</div>
            </div>
            <div className="text-center p-3 bg-bg-primary rounded-xl">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 mb-1">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div className="text-lg font-bold text-text-primary">{diagnosis.studyDays}</div>
              <div className="text-xs text-text-secondary">学习天数</div>
            </div>
            <div className="text-center p-3 bg-bg-primary rounded-xl">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 mb-1">
                <Clock className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="text-lg font-bold text-text-primary">{Math.round(diagnosis.totalDuration / 60)}h</div>
              <div className="text-xs text-text-secondary">累计时长</div>
            </div>
          </div>

          {/* 薄弱知识点 */}
          {diagnosis.weakPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600 mb-2">
                <TrendingDown className="w-4 h-4" />
                需要加强（{diagnosis.weakPoints.length}个）
              </div>
              <KnowledgeTagList tags={diagnosis.weakPoints} type="weak" />
            </div>
          )}

          {/* 优势知识点 */}
          {diagnosis.strengthPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                掌握良好（{diagnosis.strengthPoints.length}个）
              </div>
              <KnowledgeTagList tags={diagnosis.strengthPoints} type="strength" />
            </div>
          )}

          {/* 学习建议 */}
          {diagnosis.suggestions.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 mb-2">
                <Zap className="w-4 h-4" />
                智师建议
              </div>
              <ul className="space-y-1">
                {diagnosis.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 完整模式
  return (
    <Card>
      <Card.Header
        action={
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${level.bg} ${level.color}`}>
            {level.emoji} {level.label} · Lv.{diagnosis.overallLevel}
          </span>
        }
      >
        <Card.Title>学情诊断报告</Card.Title>
        <p className="text-sm text-text-secondary mt-1">{diagnosis.subject} · 诊断于 {diagnosis.diagnosedAt}</p>
      </Card.Header>
      <Card.Content className="space-y-5">
        {/* 数据概览 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl">
            <div className="text-2xl mb-1">{level.emoji}</div>
            <div className={`text-2xl font-bold ${level.color}`}>Lv.{diagnosis.overallLevel}</div>
            <div className="text-sm text-text-secondary mt-1">{level.label}水平</div>
          </div>
          <div className="text-center p-4 bg-bg-primary rounded-xl">
            <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-text-primary">{diagnosis.studyDays}</div>
            <div className="text-sm text-text-secondary mt-1">学习天数</div>
          </div>
          <div className="text-center p-4 bg-bg-primary rounded-xl">
            <Clock className="w-6 h-6 text-secondary-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-text-primary">{Math.round(diagnosis.totalDuration / 60)}h</div>
            <div className="text-sm text-text-secondary mt-1">累计时长</div>
          </div>
        </div>

        {/* 薄弱知识点 */}
        {diagnosis.weakPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-red-600 mb-3">
              <TrendingDown className="w-5 h-5" />
              待加强知识点
              <span className="text-xs font-normal text-red-400">（点击可进入专项学习）</span>
            </div>
            <KnowledgeTagList tags={diagnosis.weakPoints} type="weak" />
          </div>
        )}

        {/* 优势知识点 */}
        {diagnosis.strengthPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-secondary-600 mb-3">
              <TrendingUp className="w-5 h-5" />
              已掌握知识点
            </div>
            <KnowledgeTagList tags={diagnosis.strengthPoints} type="strength" />
          </div>
        )}

        {/* 学习建议 */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2">
            <Zap className="w-5 h-5" />
            智师的学习建议
          </div>
          <ul className="space-y-2">
            {diagnosis.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </Card.Content>
    </Card>
  )
}

export default DiagnosisCard
