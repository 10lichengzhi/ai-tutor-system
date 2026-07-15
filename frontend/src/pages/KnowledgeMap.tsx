import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Network, CheckCircle2, Circle, ChevronRight,
  BookOpen, Target, Sparkles, Zap, Brain, Code, Cpu,
  CircuitBoard, Atom, GraduationCap, Layers, X, Bot, Trash2, Plus,
  Lock, ArrowRight, Clock
} from 'lucide-react'
import { useLearningPlan } from '../contexts/LearningPlanContext'
import { cleanText } from '../utils/textCleaner'
import type { KnowledgePoint } from '../types/learning'

const CHAPTER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'C语言基础': { bg: 'bg-[#993222]/10', text: 'text-[#993222]', border: 'border-[#993222]/50' },
  '硬件基础': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  '51单片机': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'STM32': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  'FreeRTOS': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  '嵌入式Linux': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  '机器人': { bg: 'bg-[#993222]/10', text: 'text-[#993222]', border: 'border-[#993222]/50' },
  '求职准备': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
}

const DIFFICULTY_STARS = (level: number) => {
  return '⭐'.repeat(Math.min(5, Math.max(1, level)))
}

const KnowledgeMap = () => {
  const navigate = useNavigate()
  const { knowledgePoints, phases, setKnowledgePoints, outline, wizardStep, weeklyPlans } = useLearningPlan()
  const [selectedKp, setSelectedKp] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'chapter' | 'dependency'>('chapter')
  // 添加知识点表单状态 - 所有hooks必须在顶层调用
  const [newKpName, setNewKpName] = useState('')
  const [newKpDesc, setNewKpDesc] = useState('')
  const [newKpChapter, setNewKpChapter] = useState('')
  const [newKpDifficulty, setNewKpDifficulty] = useState(2)

  // 是否为空状态：旧格式为空 且 新格式未激活（outline为null或wizardStep不是'active'）
  const isEmpty = knowledgePoints.length === 0 && phases.length === 0 && !(outline && wizardStep === 'active')

  // 从新格式学习计划（outline + weeklyPlans）生成知识点
  const outlineKnowledgePoints = useMemo<KnowledgePoint[]>(() => {
    if (!outline || wizardStep !== 'active') return []

    const kps: KnowledgePoint[] = []
    const addedNames = new Set<string>()

    outline.phases.forEach((phase, phaseIdx) => {
      phase.coreKnowledge.forEach((kpName, kpIdx) => {
        const name = cleanText(kpName.trim())
        if (!name || addedNames.has(name)) return
        addedNames.add(name)
        kps.push({
          id: `OUTLINE-KP-${phase.id}-${kpIdx}`,
          name,
          desc: cleanText(phase.description),
          difficulty: 3 as const,
          chapter: cleanText(phase.title),
          prerequisites: [],
          estimatedMinutes: 60,
          tags: ['AI规划'],
          status: 'not_started' as const,
          progress: 0,
        })
      })
    })

    // 从周计划中提取知识点（含任务完成状态）
    Object.values(weeklyPlans).forEach(wp => {
      wp.dailyTasks.forEach(task => {
        task.knowledgePoints.forEach(kpName => {
          const name = cleanText(kpName.trim())
          if (!name || addedNames.has(name)) return
          addedNames.add(name)
          kps.push({
            id: `WEEK-KP-W${wp.weekNumber}-${name.substring(0, 20)}`,
            name,
            desc: cleanText(task.description),
            difficulty: wp.difficulty,
            chapter: cleanText(wp.phaseTitle),
            prerequisites: [],
            estimatedMinutes: task.duration,
            tags: ['AI规划'],
            status: task.isComplete ? 'mastered' : 'not_started' as const,
            progress: task.isComplete ? 100 : 0,
          })
        })
      })
    })

    return kps
  }, [outline, wizardStep, weeklyPlans])

  // 合并展示的知识点：新格式生成的 + 旧格式自定义的（去重）
  const allKnowledgePoints = useMemo<KnowledgePoint[]>(() => {
    if (outlineKnowledgePoints.length === 0) return knowledgePoints
    const existingNames = new Set(outlineKnowledgePoints.map(kp => kp.name))
    const customUnique = knowledgePoints.filter(kp => !existingNames.has(kp.name))
    return [...outlineKnowledgePoints, ...customUnique]
  }, [knowledgePoints, outlineKnowledgePoints])

  // 用于展示的章节列表（合并旧格式phases和新格式outline.phases）
  const allChapters = useMemo(() => {
    if (phases.length > 0) {
      return phases.map(p => p.title || p.name || '未命名阶段')
    }
    if (outline) {
      return outline.phases.map(p => cleanText(p.title))
    }
    return []
  }, [phases, outline])

  // 设置默认章节
  useEffect(() => {
    if (!newKpChapter && allChapters.length > 0) {
      setNewKpChapter(allChapters[0] || '')
    }
  }, [allChapters, newKpChapter])

  // 按章节分组知识点 - useMemo在顶层调用
  const chapterGroups = useMemo(() => {
    const groups: Record<string, typeof allKnowledgePoints> = {}
    allKnowledgePoints.forEach(kp => {
      if (!groups[kp.chapter]) groups[kp.chapter] = []
      groups[kp.chapter].push(kp)
    })
    return groups
  }, [allKnowledgePoints])

  const chapters = Object.keys(chapterGroups)

  // 统计数据
  const masteredCount = allKnowledgePoints.filter(kp => kp.status === 'mastered').length
  const learningCount = allKnowledgePoints.filter(kp => kp.status === 'learning').length
  const totalProgress = allKnowledgePoints.length > 0
    ? Math.round(allKnowledgePoints.reduce((sum, kp) => sum + (kp.progress || 0), 0) / allKnowledgePoints.length)
    : 0

  const selectedKpData = allKnowledgePoints.find(kp => kp.id === selectedKp)

  // 检查知识点是否解锁（前置知识都已掌握）
  const isKpUnlocked = (kpId: string): boolean => {
    const kp = allKnowledgePoints.find(k => k.id === kpId)
    if (!kp) return false
    if (kp.prerequisites.length === 0) return true
    return kp.prerequisites.every(preId => {
      const pre = allKnowledgePoints.find(k => k.id === preId)
      return pre?.status === 'mastered'
    })
  }

  // 获取可学习的知识点（前置已掌握，自己未开始）
  const readyToLearn = allKnowledgePoints.filter(kp =>
    kp.status === 'not_started' && isKpUnlocked(kp.id)
  )

  const openKpDoc = (kp: any) => {
    navigate('/tutor', {
      state: {
        learningNode: {
          id: kp.id,
          title: kp.name,
          subject: `知识图谱-${kp.chapter}`,
          type: 'learn',
          duration: kp.estimatedMinutes,
          desc: kp.desc,
          isSelfLearning: true
        }
      }
    })
  }

  const handleAddKp = () => {
    if (!newKpName.trim()) return
    const newKp = {
      id: `CUSTOM-${Date.now()}`,
      name: newKpName.trim(),
      desc: newKpDesc.trim() || '待补充',
      difficulty: newKpDifficulty as 1|2|3|4|5,
      chapter: newKpChapter,
      prerequisites: [],
      estimatedMinutes: 45,
      tags: ['自定义'],
      status: 'not_started' as const,
      progress: 0,
    }
    setKnowledgePoints([...knowledgePoints, newKp])
    setNewKpName('')
    setNewKpDesc('')
    setShowAddModal(false)
  }

  const deleteKp = (kpId: string) => {
    // 不允许删除AI从学习计划生成的知识点
    if (kpId.startsWith('OUTLINE-KP-') || kpId.startsWith('WEEK-KP-')) {
      alert('AI规划的知识点不可删除')
      return
    }
    if (!confirm('确定删除这个知识点吗？')) return
    setKnowledgePoints(knowledgePoints.filter(kp => kp.id !== kpId))
    if (selectedKp === kpId) setSelectedKp(null)
  }

  // 空状态渲染
  if (isEmpty) {
    return (
      <div className="content-page">
        <div className="content-page-inner h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#993222] to-cyan-500 flex items-center justify-center mb-6 shadow-xl shadow-[#993222]/20">
          <Network className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#332a23] mb-2">还没有知识图谱</h2>
        <p className="text-[#332a23]/50 mb-6 text-center max-w-md">
          请先去学习路径页面，让AI为你定制专属学习方案，知识图谱会自动生成
        </p>
        <button
          onClick={() => navigate('/learning-path')}
          className="px-6 py-3 bg-gradient-to-r from-[#993222] to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          去AI定制学习方案
          <ChevronRight className="w-5 h-5" />
        </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="content-page">
        <div className="content-page-inner h-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-[#332a23]/10 px-8 py-5 shadow-sm flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#332a23] mb-1 flex items-center gap-3">
              <Network className="w-7 h-7 text-[#993222]" />
              知识图谱
            </h1>
            <p className="text-[#332a23]/50">
              共 {allKnowledgePoints.length} 个知识点 · 已掌握 {masteredCount} · 学习中 {learningCount}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'chapter' ? 'dependency' : 'chapter')}
              className="flex items-center gap-2 px-4 py-2 border border-[#332a23]/10 text-[#332a23]/80 font-medium rounded-xl hover:bg-white/70 transition-colors"
            >
              <Layers className="w-4 h-4" />
              {viewMode === 'chapter' ? '依赖视图' : '章节视图'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#332a23]/10 text-[#332a23]/80 font-medium rounded-xl hover:bg-white/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加知识点
            </button>
            <button
              onClick={() => navigate('/tutor', { state: { prompt: '帮我分析我的知识图谱掌握情况，给出学习建议' } })}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI定制知识图谱
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="bg-white/80 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#993222] to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* 待学习提示 */}
        {readyToLearn.length > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Brain className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 text-sm text-green-800">
              <span className="font-medium">AI推荐：</span>
              你现在可以学习：{readyToLearn.slice(0, 3).map(kp => cleanText(kp.name)).join('、')}
              {readyToLearn.length > 3 && ` 等${readyToLearn.length}个知识点`}
            </div>
            <button
              onClick={() => setSelectedKp(readyToLearn[0].id)}
              className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              开始学习
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧章节导航 */}
        <div className="w-64 bg-white border-r border-[#332a23]/10 overflow-y-auto p-5 flex-shrink-0">
          <h3 className="text-xs font-semibold text-[#332a23]/40 uppercase tracking-wider mb-4">章节分类</h3>
          <div className="space-y-2">
            {chapters.map((chapter, idx) => {
              const chKps = chapterGroups[chapter]
              const chMastered = chKps.filter(kp => kp.status === 'mastered').length
              const chProgress = Math.round((chMastered / chKps.length) * 100)
              const colors = CHAPTER_COLORS[chapter] || { bg: 'bg-white/80', text: 'text-[#332a23]/80', border: 'border-[#332a23]/10' }
              return (
                <button
                  key={chapter}
                  className={`w-full p-3 rounded-xl text-left transition-all hover:${colors.bg} group`}
                  onClick={() => {
                    const firstKp = chKps[0]
                    if (firstKp) setSelectedKp(firstKp.id)
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${colors.text}`}>{cleanText(chapter)}</span>
                    <span className="text-xs text-[#332a23]/40">{chMastered}/{chKps.length}</span>
                  </div>
                  <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bg.replace('100', '500')}`}
                      style={{ width: `${chProgress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 中间知识图谱展示 */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'chapter' ? (
            // 章节视图：按章节分组展示
            <div className="space-y-6">
              {chapters.map(chapter => {
                const chKps = chapterGroups[chapter]
                const colors = CHAPTER_COLORS[chapter] || { bg: 'bg-white/80', text: 'text-[#332a23]/80', border: 'border-[#332a23]/10' }
                return (
                  <div key={chapter} className="bg-white rounded-xl border border-[#332a23]/10 overflow-hidden">
                    <div className={`px-5 py-3 ${colors.bg} border-b ${colors.border}`}>
                      <h3 className={`font-semibold ${colors.text} flex items-center gap-2`}>
                        <BookOpen className="w-4 h-4" />
                        {cleanText(chapter)}
                        <span className="text-xs font-normal opacity-70">
                          ({chKps.filter(k => k.status === 'mastered').length}/{chKps.length})
                        </span>
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {chKps.map(kp => {
                          const unlocked = isKpUnlocked(kp.id)
                          const isSelected = selectedKp === kp.id
                          return (
                            <button
                              key={kp.id}
                              onClick={() => unlocked && setSelectedKp(kp.id)}
                              disabled={!unlocked}
                              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? `${colors.border} ${colors.bg} shadow-md`
                                  : !unlocked
                                    ? 'border-[#332a23]/5 bg-white/70 opacity-60 cursor-not-allowed'
                                    : kp.status === 'mastered'
                                      ? 'border-green-200 bg-green-50 hover:border-green-300'
                                      : kp.status === 'learning'
                                        ? 'border-[#993222]/30 bg-[#993222]/5 hover:border-[#993222]/50'
                                        : 'border-[#332a23]/10 bg-white hover:border-[#332a23]/15 hover:shadow-sm'
                              }`}
                            >
                              {!unlocked && (
                                <Lock className="absolute top-2 right-2 w-3.5 h-3.5 text-[#332a23]/40" />
                              )}
                              {kp.status === 'mastered' && (
                                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                              )}
                              <div className="pr-6">
                                <div className={`font-medium text-sm mb-1 ${
                                  !unlocked ? 'text-[#332a23]/40' : 'text-[#332a23]'
                                }`}>
                                  {cleanText(kp.name)}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-500">
                                    {DIFFICULTY_STARS(kp.difficulty)}
                                  </span>
                                  <span className="text-xs text-[#332a23]/40">
                                    {Math.round(kp.estimatedMinutes / 60 * 10) / 10}h
                                  </span>
                                </div>
                                {kp.prerequisites.length > 0 && (
                                  <div className="mt-1.5 text-[10px] text-[#332a23]/40">
                                    前置：{kp.prerequisites.length}个
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // 依赖视图：展示依赖关系
            <div className="bg-white rounded-xl border border-[#332a23]/10 p-6">
              <h3 className="text-lg font-semibold text-[#332a23] mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-[#993222]" />
                知识点依赖关系
              </h3>
              <div className="space-y-4">
                {allKnowledgePoints
                  .filter(kp => kp.prerequisites.length > 0 || allKnowledgePoints.some(k => k.prerequisites.includes(kp.id)))
                  .map(kp => {
                    const unlocked = isKpUnlocked(kp.id)
                    const prereqs = kp.prerequisites.map(pid => allKnowledgePoints.find(k => k.id === pid)).filter(Boolean)
                    return (
                      <div key={kp.id} className="relative">
                        <div className={`p-4 rounded-xl border-2 ${
                          kp.status === 'mastered' ? 'border-green-200 bg-green-50' :
                          kp.status === 'learning' ? 'border-[#993222]/30 bg-[#993222]/5' :
                          !unlocked ? 'border-[#332a23]/5 bg-white/70 opacity-60' :
                          'border-[#332a23]/10 bg-white'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {!unlocked && <Lock className="w-4 h-4 text-[#332a23]/40" />}
                                <span className="font-medium text-[#332a23]">{cleanText(kp.name)}</span>
                                <span className="text-xs text-amber-500">{DIFFICULTY_STARS(kp.difficulty)}</span>
                              </div>
                              <p className="text-sm text-[#332a23]/50 mt-1">{cleanText(kp.desc)}</p>
                            </div>
                            {unlocked && kp.status !== 'mastered' && (
                              <button
                                onClick={() => openKpDoc(kp)}
                                className="px-3 py-1 bg-[#993222] text-white text-xs font-medium rounded-lg hover:bg-[#993222] transition-colors flex items-center gap-1"
                              >
                                开始学习 <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {prereqs.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#332a23]/5">
                              <div className="text-xs text-[#332a23]/50 mb-2">前置知识：</div>
                              <div className="flex flex-wrap gap-2">
                                {prereqs.map(pre => pre && (
                                  <span
                                    key={pre.id}
                                    className={`text-xs px-2 py-1 rounded-md ${
                                      pre.status === 'mastered'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {pre.status === 'mastered' ? '✓ ' : '✗ '}{cleanText(pre.name)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* 右侧知识点详情 */}
        <div className="w-80 bg-white border-l border-[#332a23]/10 overflow-y-auto p-5 flex-shrink-0">
          {selectedKpData ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-[#332a23]">{cleanText(selectedKpData.name)}</h3>
                <button
                  onClick={() => deleteKp(selectedKpData.id)}
                  className="p-1.5 text-[#332a23]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-1">难度</div>
                  <div className="text-amber-500 text-lg">{DIFFICULTY_STARS(selectedKpData.difficulty)}</div>
                </div>

                <div>
                  <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-1">所属章节</div>
                  <div className={`inline-block px-2 py-1 rounded-md text-sm ${
                    (CHAPTER_COLORS[selectedKpData.chapter]?.bg || 'bg-white/80') + ' ' +
                    (CHAPTER_COLORS[selectedKpData.chapter]?.text || 'text-[#332a23]/80')
                  }`}>
                    {cleanText(selectedKpData.chapter)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-1">预计学习时长</div>
                  <div className="text-sm text-[#332a23]/80 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.round(selectedKpData.estimatedMinutes / 60 * 10) / 10} 小时
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-1">知识点描述</div>
                  <p className="text-sm text-[#7a6b5e] leading-relaxed">{cleanText(selectedKpData.desc)}</p>
                </div>

                {selectedKpData.prerequisites.length > 0 && (
                  <div>
                    <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-2">前置知识</div>
                    <div className="space-y-1.5">
                      {selectedKpData.prerequisites.map(pid => {
                        const pre = allKnowledgePoints.find(k => k.id === pid)
                        if (!pre) return null
                        return (
                          <button
                            key={pid}
                            onClick={() => setSelectedKp(pid)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                              pre.status === 'mastered'
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {pre.status === 'mastered'
                              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                              : <Circle className="w-4 h-4 flex-shrink-0" />
                            }
                            <span className="truncate">{cleanText(pre.name)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedKpData.tags.length > 0 && (
                  <div>
                    <div className="text-xs text-[#332a23]/40 uppercase tracking-wider mb-2">标签</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedKpData.tags.map(tag => (
                        <span key={tag} className="text-xs bg-white/80 text-[#7a6b5e] px-2 py-0.5 rounded">
                          {cleanText(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#332a23]/5">
                  {isKpUnlocked(selectedKpData.id) ? (
                    <button
                      onClick={() => openKpDoc(selectedKpData)}
                      className="w-full py-2.5 bg-gradient-to-r from-[#993222] to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {selectedKpData.status === 'mastered' ? '复习巩固' : '开始AI导学'}
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-white/70 rounded-xl">
                      <Lock className="w-5 h-5 text-[#332a23]/40 mx-auto mb-1" />
                      <p className="text-xs text-[#332a23]/50">请先掌握前置知识</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mb-4">
                <Network className="w-8 h-8 text-[#332a23]/40" />
              </div>
              <p className="text-[#332a23]/50 text-sm">选择一个知识点查看详情</p>
              <p className="text-[#332a23]/40 text-xs mt-1">点击左侧或中间区域的知识点</p>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>

      {/* 添加知识点弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-[#993222] p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6" />
                添加知识点
              </h3>
              <p className="text-white/80 text-sm mt-1">自定义知识点加入知识图谱</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1.5">知识点名称 *</label>
                <input
                  type="text"
                  value={newKpName}
                  onChange={(e) => setNewKpName(e.target.value)}
                  placeholder="例如：CAN总线通信"
                  className="w-full px-4 py-2.5 border border-[#332a23]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#993222]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1.5">所属章节</label>
                <select
                  value={newKpChapter}
                  onChange={(e) => setNewKpChapter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#332a23]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#993222] bg-white"
                >
                  {chapters.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1.5">难度（1-5星）</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setNewKpDifficulty(level)}
                      className={`flex-1 py-2 rounded-lg text-lg transition-colors ${
                        newKpDifficulty >= level
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-white/80 text-[#332a23]/30'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#332a23]/80 mb-1.5">知识点描述</label>
                <textarea
                  value={newKpDesc}
                  onChange={(e) => setNewKpDesc(e.target.value)}
                  placeholder="简单描述这个知识点..."
                  className="w-full px-4 py-2.5 border border-[#332a23]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#993222] resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-[#332a23]/10 text-[#332a23]/80 font-medium rounded-xl hover:bg-white/70 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddKp}
                  disabled={!newKpName.trim()}
                  className="flex-1 py-2.5 bg-[#993222] text-white font-medium rounded-xl hover:bg-[#993222] transition-colors disabled:bg-gray-300"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default KnowledgeMap
