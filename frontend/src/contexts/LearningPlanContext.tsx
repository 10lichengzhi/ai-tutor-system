import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import {
  Phase, WeekPlan, LearningNode, UserProfile, KnowledgePoint,
  ProgressData, DailyRecord, NodeStatus,
  PlanWizardStep, WizardMessage, LearningOutline, WeeklyPlanDetail,
  DailyCheckin, WeeklySummary, DailyTask, UserProfileCollection
} from '../types/learning'
import { 
  generatePlan as aiGeneratePlan,
  planInterview as aiPlanInterview,
  generateOutline as aiGenerateOutline,
  generateWeekPlan as aiGenerateWeekPlan,
  generateWeeklySummary as aiGenerateWeeklySummary
} from '../services/aiService'
import { useSettings } from './SettingsContext'

// ========== Context类型 ==========
interface LearningPlanContextType {
  // 方案数据（旧结构，保持兼容）
  phases: Phase[]
  knowledgePoints: KnowledgePoint[]
  userProfile: UserProfile | null
  activePlan: boolean
  isLoaded: boolean
  isGenerating: boolean
  progressData: ProgressData
  generateError: string | null

  // ========== 新对话式计划工作流 ==========
  wizardStep: PlanWizardStep
  wizardMessages: WizardMessage[]
  collectedInfo: UserProfileCollection
  outline: LearningOutline | null
  currentWeekNumber: number
  weeklyPlans: Record<number, WeeklyPlanDetail>
  weeklySummaries: Record<number, WeeklySummary>
  dailyCheckins: DailyCheckin[]
  isThinking: boolean
  wizardError: string | null

  // 向导操作
  startWizard: () => void
  sendWizardMessage: (content: string) => Promise<void>
  generateOutline: () => Promise<void>
  confirmOutline: () => Promise<void>
  regenerateOutline: () => Promise<void>
  generateNextWeek: () => Promise<void>
  completeDailyTask: (taskId: string, checkinData?: Partial<DailyCheckin>) => Promise<void>
  generateWeekSummary: (weekNumber: number) => Promise<void>
  cancelWizard: () => void

  // 查询辅助
  getTodayTasks: () => DailyTask[]
  getCurrentWeekPlan: () => WeeklyPlanDetail | null
  getWeekCheckins: (weekNumber: number) => DailyCheckin[]
  hasCheckedInToday: () => boolean

  // 方案操作（旧）
  generatePlan: (profile: UserProfile) => Promise<void>
  setPhases: (phases: Phase[]) => void
  setKnowledgePoints: (kps: KnowledgePoint[]) => void
  setUserProfile: (profile: UserProfile | null) => void
  resetPlan: () => void

  // 节点操作（旧）
  markNodeComplete: (nodeId: string | number) => void
  markNodeInProgress: (nodeId: string | number) => void
  updateNodeStatus: (nodeId: string | number, status: NodeStatus) => void
  addNode: (phaseId: number | string, weekId: string | number, node: Partial<LearningNode>) => void
  deleteNode: (phaseId: number | string, weekId: string | number, nodeId: string | number) => void

  // 周/阶段操作（旧）
  addWeek: (phaseId: number | string, week: Partial<WeekPlan>) => void
  deleteWeek: (phaseId: number | string, weekId: string | number) => void
  deletePhase: (phaseId: number | string) => void

  // 进度跟踪（旧）
  toggleDayComplete: (weekNumber: number, dayOfWeek: number, nodeId: string | number) => void
  saveWeeklySummary: (weekNumber: number, summary: string) => void
  getWeekPlan: (weekNumber: number) => WeekPlan | undefined
}

const LearningPlanContext = createContext<LearningPlanContextType | null>(null)

export const useLearningPlan = () => {
  const ctx = useContext(LearningPlanContext)
  if (!ctx) throw new Error('useLearningPlan must be used within LearningPlanProvider')
  return ctx
}

// ========== 本地存储Key ==========
const STORAGE_KEYS = {
  PHASES: 'ai-tutor-phases',
  KNOWLEDGE_POINTS: 'ai-tutor-knowledge-points',
  USER_PROFILE: 'ai-tutor-user-profile',
  PROGRESS: 'ai-tutor-progress',
}

// ========== 颜色配置 ==========
const PHASE_COLORS = [
  { color: 'text-[#993222]', bgColor: 'bg-[#993222]/5', borderColor: 'border-[#993222]/20' },
  { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
]

// ========== 辅助函数：安全解析JSON ==========
function safeParseJSON<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

// ========== 辅助函数：规范化AI返回的数据 ==========
function normalizePlanData(data: any): { phases: Phase[]; knowledgePoints: KnowledgePoint[] } {
  let phases: Phase[] = []
  let knowledgePoints: KnowledgePoint[] = []

  // 处理知识点
  if (Array.isArray(data.knowledgePoints)) {
    knowledgePoints = data.knowledgePoints.map((kp: any) => ({
      id: kp.id || `KP-${Math.random().toString(36).slice(2, 8)}`,
      name: kp.name || '未命名知识点',
      desc: kp.desc || kp.description || '',
      difficulty: (kp.difficulty as 1|2|3|4|5) || 3,
      chapter: kp.chapter || '未分类',
      prerequisites: Array.isArray(kp.prerequisites) ? kp.prerequisites : [],
      estimatedMinutes: kp.estimatedMinutes || 60,
      tags: Array.isArray(kp.tags) ? kp.tags : [],
      status: 'not_started' as const,
      progress: 0,
    }))
  }

  // 处理阶段
  if (Array.isArray(data.phases)) {
    let globalWeekNumber = 1
    phases = data.phases.map((phase: any, phaseIndex: number) => {
      const colorSet = PHASE_COLORS[phaseIndex % PHASE_COLORS.length]
      const weeks: WeekPlan[] = []

      if (Array.isArray(phase.weeks)) {
        phase.weeks.forEach((week: any, weekIdx: number) => {
          const weekNum = week.weekNumber || globalWeekNumber
          const nodes: LearningNode[] = Array.isArray(week.nodes)
            ? week.nodes.map((node: any, nodeIdx: number) => ({
                id: node.id || `NODE-W${weekNum}-${nodeIdx}`,
                title: node.title || '未命名节点',
                duration: node.duration || 60,
                type: node.type || 'learn',
                status: 'not_started' as const,
                desc: node.desc || node.description || '',
                description: node.description || node.desc || '',
                knowledgePointIds: Array.isArray(node.knowledgePointIds) ? node.knowledgePointIds : [],
                week: weekNum,
                day: node.day,
                isMilestone: node.isMilestone || false,
                projectName: node.projectName,
                resources: node.resources,
                deliverables: node.deliverables,
              }))
            : []

          weeks.push({
            id: week.id || `WEEK-${weekNum}`,
            weekNumber: weekNum,
            theme: week.theme || week.title || `第${weekNum}周`,
            title: week.title || week.theme || `第${weekNum}周`,
            goals: Array.isArray(week.goals) ? week.goals : [],
            nodes,
            summary: '',
            completedDays: [],
            progress: 0,
            projectName: week.projectName,
          })
          globalWeekNumber++
        })
      }

      return {
        id: phase.id || phaseIndex + 1,
        title: phase.title || phase.name || `阶段${phaseIndex + 1}`,
        name: phase.name || phase.title || `阶段${phaseIndex + 1}`,
        description: phase.description || '',
        durationWeeks: phase.durationWeeks || weeks.length,
        startWeek: phase.startWeek || (weeks.length > 0 ? weeks[0].weekNumber : globalWeekNumber - weeks.length),
        weeks,
        progress: 0,
        color: colorSet.color,
        bgColor: colorSet.bgColor,
        borderColor: colorSet.borderColor,
      }
    })
  }

  return { phases, knowledgePoints }
}

// ========== Provider组件 ==========
export function LearningPlanProvider({ children }: { children: ReactNode }) {
  const { ai: aiSettings } = useSettings()
  const [phases, setPhasesState] = useState<Phase[]>([])
  const [knowledgePoints, setKnowledgePointsState] = useState<KnowledgePoint[]>([])
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<ProgressData>({
    dailyRecords: [],
    weeklySummaries: [],
    streakDays: 0,
    totalStudyMinutes: 0,
  })

  // ========== 新对话式计划工作流状态 ==========
  const [wizardStep, setWizardStep] = useState<PlanWizardStep>('idle')
  const [wizardMessages, setWizardMessages] = useState<WizardMessage[]>([])
  const [collectedInfo, setCollectedInfo] = useState<UserProfileCollection>({})
  const [outline, setOutline] = useState<LearningOutline | null>(null)
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(1)
  const [weeklyPlans, setWeeklyPlans] = useState<Record<number, WeeklyPlanDetail>>({})
  const [weeklySummaries, setWeeklySummaries] = useState<Record<number, WeeklySummary>>({})
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)

  // 新工作流存储key
  const WIZARD_KEYS = {
    OUTLINE: 'ai-tutor-outline',
    WEEKLY_PLANS: 'ai-tutor-weekly-plans',
    WEEKLY_SUMMARIES: 'ai-tutor-weekly-summaries',
    CHECKINS: 'ai-tutor-daily-checkins',
    CURRENT_WEEK: 'ai-tutor-current-week',
    WIZARD_STEP: 'ai-tutor-wizard-step',
  }

  // ========== 计算是否有激活的方案 ==========
  const hasNewPlan = outline !== null && wizardStep === 'active'
  const hasOldPlan = phases.length > 0 && userProfile !== null
  const activePlan = hasOldPlan || hasNewPlan

  // ========== 从localStorage加载数据 ==========
  useEffect(() => {
    try {
      const savedPhases = safeParseJSON<Phase[]>(localStorage.getItem(STORAGE_KEYS.PHASES), [])
      const savedKps = safeParseJSON<KnowledgePoint[]>(localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_POINTS), [])
      const savedProfile = safeParseJSON<UserProfile | null>(localStorage.getItem(STORAGE_KEYS.USER_PROFILE), null)
      const savedProgress = safeParseJSON<ProgressData>(localStorage.getItem(STORAGE_KEYS.PROGRESS), {
        dailyRecords: [],
        weeklySummaries: [],
        streakDays: 0,
        totalStudyMinutes: 0,
      })
      // 新工作流数据
      const savedOutline = safeParseJSON<LearningOutline | null>(localStorage.getItem(WIZARD_KEYS.OUTLINE), null)
      const savedWeeklyPlans = safeParseJSON<Record<number, WeeklyPlanDetail>>(localStorage.getItem(WIZARD_KEYS.WEEKLY_PLANS), {})
      const savedWeeklySummaries = safeParseJSON<Record<number, WeeklySummary>>(localStorage.getItem(WIZARD_KEYS.WEEKLY_SUMMARIES), {})
      const savedCheckins = safeParseJSON<DailyCheckin[]>(localStorage.getItem(WIZARD_KEYS.CHECKINS), [])
      const savedCurrentWeek = safeParseJSON<number>(localStorage.getItem(WIZARD_KEYS.CURRENT_WEEK), 1)
      const savedStep = safeParseJSON<PlanWizardStep>(localStorage.getItem(WIZARD_KEYS.WIZARD_STEP), 'idle')

      setPhasesState(savedPhases)
      setKnowledgePointsState(savedKps)
      setUserProfileState(savedProfile)
      setProgressData(savedProgress)
      setOutline(savedOutline)
      setWeeklyPlans(savedWeeklyPlans)
      setWeeklySummaries(savedWeeklySummaries)
      setDailyCheckins(savedCheckins)
      setCurrentWeekNumber(savedCurrentWeek)
      // 如果已有outline，说明处于active状态
      if (savedOutline && savedStep !== 'interview' && savedStep !== 'outline') {
        setWizardStep('active')
      }
    } catch (e) {
      console.error('加载学习数据失败:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // ========== 保存数据到localStorage ==========
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PHASES, JSON.stringify(phases))
    }
  }, [phases, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_POINTS, JSON.stringify(knowledgePoints))
    }
  }, [knowledgePoints, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      if (userProfile) {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile))
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
      }
    }
  }, [userProfile, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData))
    }
  }, [progressData, isLoaded])

  // 新工作流数据持久化
  useEffect(() => {
    if (isLoaded && outline) {
      localStorage.setItem(WIZARD_KEYS.OUTLINE, JSON.stringify(outline))
    }
  }, [outline, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIZARD_KEYS.WEEKLY_PLANS, JSON.stringify(weeklyPlans))
    }
  }, [weeklyPlans, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIZARD_KEYS.WEEKLY_SUMMARIES, JSON.stringify(weeklySummaries))
    }
  }, [weeklySummaries, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIZARD_KEYS.CHECKINS, JSON.stringify(dailyCheckins))
    }
  }, [dailyCheckins, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIZARD_KEYS.CURRENT_WEEK, JSON.stringify(currentWeekNumber))
    }
  }, [currentWeekNumber, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WIZARD_KEYS.WIZARD_STEP, JSON.stringify(wizardStep))
    }
  }, [wizardStep, isLoaded])

  // ========== 核心方法：AI生成学习方案 ==========
  const generatePlan = useCallback(async (profile: UserProfile) => {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const result = await aiGeneratePlan({
        direction: profile.direction,
        direction_name: profile.directionName,
        current_level: profile.currentLevel || 'beginner',
        daily_hours: profile.dailyHours,
        weekly_days: profile.weeklyDays || profile.daysPerWeek || 5,
        total_weeks: profile.totalWeeks,
        final_goal: profile.finalGoal,
        project_focus: profile.projectFocus,
        learning_style: profile.learningStyle || profile.learningMode || 'mixed',
        programming_level: profile.programmingLevel,
        hardware_level: profile.hardwareLevel,
        model: aiSettings.selectedModel || undefined,
      })

      // 规范化数据
      const { phases: newPhases, knowledgePoints: newKps } = normalizePlanData(result)

      if (newPhases.length === 0) {
        throw new Error('AI生成的学习方案为空，请重试')
      }

      setPhasesState(newPhases)
      setKnowledgePointsState(newKps)
      setUserProfileState({
        ...profile,
        createdAt: new Date().toISOString(),
      })
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '生成学习方案失败'
      setGenerateError(errorMsg)
      throw e
    } finally {
      setIsGenerating(false)
    }
  }, [aiSettings.selectedModel])

  const setPhases = (newPhases: Phase[]) => setPhasesState(newPhases)
  const setKnowledgePoints = (kps: KnowledgePoint[]) => setKnowledgePointsState(kps)
  const setUserProfile = (profile: UserProfile | null) => setUserProfileState(profile)

  const resetPlan = () => {
    setPhasesState([])
    setKnowledgePointsState([])
    setUserProfileState(null)
    setProgressData({
      dailyRecords: [],
      weeklySummaries: [],
      streakDays: 0,
      totalStudyMinutes: 0,
    })
    setGenerateError(null)
    // 重置新工作流状态
    setWizardStep('idle')
    setWizardMessages([])
    setCollectedInfo({})
    setOutline(null)
    setCurrentWeekNumber(1)
    setWeeklyPlans({})
    setWeeklySummaries({})
    setDailyCheckins([])
    setWizardError(null)
    // 清除本地存储
    localStorage.removeItem(STORAGE_KEYS.PHASES)
    localStorage.removeItem(STORAGE_KEYS.KNOWLEDGE_POINTS)
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
    localStorage.removeItem(STORAGE_KEYS.PROGRESS)
    localStorage.removeItem(WIZARD_KEYS.OUTLINE)
    localStorage.removeItem(WIZARD_KEYS.WEEKLY_PLANS)
    localStorage.removeItem(WIZARD_KEYS.WEEKLY_SUMMARIES)
    localStorage.removeItem(WIZARD_KEYS.CHECKINS)
    localStorage.removeItem(WIZARD_KEYS.CURRENT_WEEK)
    localStorage.removeItem(WIZARD_KEYS.WIZARD_STEP)
  }

  // ========== 节点状态更新 ==========
  const updateNodeStatus = (nodeId: string | number, status: NodeStatus) => {
    setPhasesState(prev => prev.map(phase => ({
      ...phase,
      weeks: phase.weeks.map(week => ({
        ...week,
        nodes: week.nodes.map(node =>
          node.id === nodeId ? { ...node, status } : node
        ),
      })),
    })))

    // 如果完成，更新知识点状态
    if (status === 'completed') {
      setPhasesState(prev => {
        // 找到该节点关联的知识点
        const completedKpIds: string[] = []
        prev.forEach(phase => {
          phase.weeks.forEach(week => {
            week.nodes.forEach(node => {
              if (node.id === nodeId && node.knowledgePointIds) {
                completedKpIds.push(...node.knowledgePointIds)
              }
            })
          })
        })
        if (completedKpIds.length > 0) {
          setKnowledgePointsState(kps => kps.map(kp =>
            completedKpIds.includes(kp.id) ? { ...kp, status: 'mastered', progress: 100 } : kp
          ))
        }
        return prev
      })
    }
  }

  const markNodeComplete = (nodeId: string | number) => updateNodeStatus(nodeId, 'completed')
  const markNodeInProgress = (nodeId: string | number) => updateNodeStatus(nodeId, 'in_progress')

  // ========== 添加/删除操作 ==========
  const addNode = (phaseId: number | string, weekId: string | number, node: Partial<LearningNode>) => {
    setPhasesState(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase
      return {
        ...phase,
        weeks: phase.weeks.map(week => {
          if (week.id !== weekId && week.weekNumber !== weekId) return week
          const newNode: LearningNode = {
            id: `NODE-${Date.now()}`,
            title: node.title || '新节点',
            type: node.type || 'learn',
            status: 'not_started',
            desc: node.desc || '',
            knowledgePointIds: node.knowledgePointIds || [],
            duration: node.duration || 30,
            ...node,
          }
          return { ...week, nodes: [...week.nodes, newNode] }
        }),
      }
    }))
  }

  const deleteNode = (phaseId: number | string, weekId: string | number, nodeId: string | number) => {
    setPhasesState(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase
      return {
        ...phase,
        weeks: phase.weeks.map(week => {
          if (week.id !== weekId && week.weekNumber !== weekId) return week
          return { ...week, nodes: week.nodes.filter(n => n.id !== nodeId) }
        }),
      }
    }))
  }

  const addWeek = (phaseId: number | string, week: Partial<WeekPlan>) => {
    setPhasesState(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase
      const maxWeekNum = Math.max(0, ...phase.weeks.map(w => w.weekNumber))
      const newWeek: WeekPlan = {
        id: `WEEK-${Date.now()}`,
        weekNumber: week.weekNumber || maxWeekNum + 1,
        theme: week.theme || week.title || `第${maxWeekNum + 1}周`,
        title: week.title || week.theme || `第${maxWeekNum + 1}周`,
        goals: week.goals || [],
        nodes: week.nodes || [],
        summary: '',
        completedDays: [],
        progress: 0,
      }
      return { ...phase, weeks: [...phase.weeks, newWeek] }
    }))
  }

  const deleteWeek = (phaseId: number | string, weekId: string | number) => {
    setPhasesState(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase
      return { ...phase, weeks: phase.weeks.filter(w => w.id !== weekId && w.weekNumber !== weekId) }
    }))
  }

  const deletePhase = (phaseId: number | string) => {
    setPhasesState(prev => prev.filter(p => p.id !== phaseId))
  }

  // ========== 进度跟踪 ==========
  const toggleDayComplete = (weekNumber: number, dayOfWeek: number, nodeId: string | number) => {
    // 标记节点完成
    markNodeComplete(nodeId)
  }

  const saveWeeklySummary = (weekNumber: number, summary: string) => {
    setPhasesState(prev => prev.map(phase => ({
      ...phase,
      weeks: phase.weeks.map(week =>
        week.weekNumber === weekNumber ? { ...week, summary } : week
      ),
    })))

    setProgressData(prev => ({
      ...prev,
      weeklySummaries: [
        ...prev.weeklySummaries.filter(s => s.weekNumber !== weekNumber),
        { weekNumber, summary, date: new Date().toISOString() },
      ],
    }))
  }

  const getWeekPlan = (weekNumber: number): WeekPlan | undefined => {
    for (const phase of phases) {
      const week = phase.weeks.find(w => w.weekNumber === weekNumber)
      if (week) return week
    }
    return undefined
  }

  // ========== 新对话式计划工作流方法 ==========

  // 开始向导
  const startWizard = useCallback(() => {
    setWizardStep('interview')
    setWizardMessages([{
      id: `msg-${Date.now()}`,
      role: 'ai',
      content: '你好呀！👋 我是你的AI学习规划师。在开始定制专属学习方案之前，我想先了解一下你的情况。\n\n首先，你现在读几年级呢？或者你最想提升哪个科目？',
      suggestedAnswers: ['高中数学', '高中物理', '高中英语', '高中化学', '初中数学', '初中物理', '高考冲刺', '中考冲刺', '其他（我自己输入）'],
      timestamp: new Date().toISOString(),
    }])
    setCollectedInfo({})
    setOutline(null)
    setWeeklyPlans({})
    setWeeklySummaries({})
    setWizardError(null)
  }, [])

  // 取消向导
  const cancelWizard = useCallback(() => {
    setWizardStep('idle')
    setWizardMessages([])
    setWizardError(null)
  }, [])

  // 发送向导消息
  const sendWizardMessage = useCallback(async (content: string) => {
    if (!content.trim() || isThinking) return

    // 添加用户消息
    const userMsg: WizardMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    const newMessages = [...wizardMessages, userMsg]
    setWizardMessages(newMessages)
    setIsThinking(true)
    setWizardError(null)

    try {
      const result = await aiPlanInterview({
        messages: newMessages,
        collectedInfo,
        model: aiSettings.selectedModel || undefined,
      })

      // 更新收集到的信息
      setCollectedInfo(result.collectedInfo)

      // 添加AI回复
      const aiMsg: WizardMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: result.reply,
        suggestedAnswers: result.suggestedAnswers,
        timestamp: new Date().toISOString(),
      }
      setWizardMessages(prev => [...prev, aiMsg])

      // 如果信息收集完毕，自动进入总纲生成阶段
      if (result.isComplete) {
        setWizardStep('outline')
      }
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : '对话失败，请重试')
    } finally {
      setIsThinking(false)
    }
  }, [wizardMessages, collectedInfo, isThinking, aiSettings.selectedModel])

  // 生成学习总纲
  const generateOutline = useCallback(async () => {
    setIsThinking(true)
    setWizardError(null)
    try {
      const newOutline = await aiGenerateOutline(collectedInfo, aiSettings.selectedModel || undefined)
      setOutline(newOutline)
      setWizardStep('outline')
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : '生成总纲失败')
    } finally {
      setIsThinking(false)
    }
  }, [collectedInfo, aiSettings.selectedModel])

  // 重新生成总纲
  const regenerateOutline = useCallback(async () => {
    await generateOutline()
  }, [generateOutline])

  // 确认总纲，开始学习
  const confirmOutline = useCallback(async () => {
    if (!outline) return
    setWizardStep('confirmed')
    setIsThinking(true)
    try {
      // 生成第一周计划
      const week1 = await aiGenerateWeekPlan({
        outline,
        weekNumber: 1,
        model: aiSettings.selectedModel || undefined,
      })
      setWeeklyPlans({ [1]: week1 })
      setCurrentWeekNumber(1)
      setWizardStep('active')
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : '生成第一周计划失败')
      setWizardStep('outline')
    } finally {
      setIsThinking(false)
    }
  }, [outline, aiSettings.selectedModel])

  // 生成下一周计划
  const generateNextWeek = useCallback(async () => {
    if (!outline) return
    const nextWeek = currentWeekNumber + 1
    if (nextWeek > outline.totalWeeks) return

    setIsThinking(true)
    setWizardError(null)
    try {
      // 先为当前周生成总结（如果还没有）
      let prevSummary: WeeklySummary | null = weeklySummaries[currentWeekNumber] || null
      if (!prevSummary && dailyCheckins.filter(c => c.weekNumber === currentWeekNumber).length > 0) {
        prevSummary = await aiGenerateWeeklySummary({
          weekNumber: currentWeekNumber,
          checkins: dailyCheckins.filter(c => c.weekNumber === currentWeekNumber),
          weekPlan: weeklyPlans[currentWeekNumber],
          outline,
          model: aiSettings.selectedModel || undefined,
        })
        setWeeklySummaries(prev => ({ ...prev, [currentWeekNumber]: prevSummary! }))
      }

      const newWeek = await aiGenerateWeekPlan({
        outline,
        weekNumber: nextWeek,
        previousWeekSummary: prevSummary,
        checkinHistory: dailyCheckins,
        model: aiSettings.selectedModel || undefined,
      })
      setWeeklyPlans(prev => ({ ...prev, [nextWeek]: newWeek }))
      setCurrentWeekNumber(nextWeek)
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : `生成第${nextWeek}周计划失败`)
    } finally {
      setIsThinking(false)
    }
  }, [outline, currentWeekNumber, weeklyPlans, weeklySummaries, dailyCheckins, aiSettings.selectedModel])

  // 完成每日任务并打卡
  const completeDailyTask = useCallback(async (taskId: string, checkinData?: Partial<DailyCheckin>) => {
    const today = new Date()
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // 周一=1, 周日=7
    const dateStr = today.toISOString().split('T')[0]

    // 找到当前周的计划
    const weekPlan = weeklyPlans[currentWeekNumber]
    if (!weekPlan) return

    // 找到任务
    const task = weekPlan.dailyTasks.find(t => t.id === taskId)
    if (!task) return

    // 更新任务状态
    setWeeklyPlans(prev => {
      const wp = prev[currentWeekNumber]
      if (!wp) return prev
      return {
        ...prev,
        [currentWeekNumber]: {
          ...wp,
          dailyTasks: wp.dailyTasks.map(t =>
            t.id === taskId ? { ...t, isComplete: true, completedAt: new Date().toISOString() } : t
          ),
        },
      }
    })

    // 查找或创建今日打卡记录
    const existingCheckin = dailyCheckins.find(c => c.date === dateStr)
    const checkin: DailyCheckin = {
      date: dateStr,
      weekNumber: currentWeekNumber,
      dayOfWeek,
      completedNodeIds: existingCheckin
        ? [...new Set([...existingCheckin.completedNodeIds, taskId])]
        : [taskId],
      studyMinutes: checkinData?.studyMinutes ?? (existingCheckin?.studyMinutes || task.duration),
      mood: checkinData?.mood ?? existingCheckin?.mood ?? 'good',
      understanding: checkinData?.understanding ?? existingCheckin?.understanding ?? 3,
      note: checkinData?.note ?? existingCheckin?.note ?? '',
      obstacles: checkinData?.obstacles ?? existingCheckin?.obstacles,
      createdAt: existingCheckin?.createdAt ?? new Date().toISOString(),
    }

    setDailyCheckins(prev => {
      const filtered = prev.filter(c => c.date !== dateStr)
      return [...filtered, checkin]
    })
  }, [currentWeekNumber, weeklyPlans, dailyCheckins])

  // 生成周总结
  const generateWeekSummary = useCallback(async (weekNumber: number) => {
    if (!outline) return
    const checkins = dailyCheckins.filter(c => c.weekNumber === weekNumber)
    const weekPlan = weeklyPlans[weekNumber]
    if (!weekPlan || checkins.length === 0) return

    setIsThinking(true)
    try {
      const summary = await aiGenerateWeeklySummary({
        weekNumber,
        checkins,
        weekPlan,
        outline,
        model: aiSettings.selectedModel || undefined,
      })
      setWeeklySummaries(prev => ({ ...prev, [weekNumber]: summary }))
    } catch (e) {
      console.error('生成周总结失败:', e)
    } finally {
      setIsThinking(false)
    }
  }, [outline, weeklyPlans, dailyCheckins, aiSettings.selectedModel])

  // 查询辅助：获取今日任务
  const getTodayTasks = useCallback((): DailyTask[] => {
    const today = new Date()
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
    const weekPlan = weeklyPlans[currentWeekNumber]
    if (!weekPlan) return []
    return weekPlan.dailyTasks.filter(t => t.dayOfWeek === dayOfWeek)
  }, [weeklyPlans, currentWeekNumber])

  // 查询辅助：获取当前周计划
  const getCurrentWeekPlan = useCallback((): WeeklyPlanDetail | null => {
    return weeklyPlans[currentWeekNumber] || null
  }, [weeklyPlans, currentWeekNumber])

  // 查询辅助：获取某周的打卡记录
  const getWeekCheckins = useCallback((weekNumber: number): DailyCheckin[] => {
    return dailyCheckins.filter(c => c.weekNumber === weekNumber)
  }, [dailyCheckins])

  // 查询辅助：今天是否已打卡
  const hasCheckedInToday = useCallback((): boolean => {
    const dateStr = new Date().toISOString().split('T')[0]
    return dailyCheckins.some(c => c.date === dateStr && c.completedNodeIds.length > 0)
  }, [dailyCheckins])

  return (
    <LearningPlanContext.Provider value={{
      // 旧字段
      phases,
      knowledgePoints,
      userProfile,
      activePlan: activePlan || (outline !== null && wizardStep === 'active'),
      isLoaded,
      isGenerating: isGenerating || isThinking,
      progressData,
      generatePlan,
      setPhases,
      setKnowledgePoints,
      setUserProfile,
      resetPlan,
      markNodeComplete,
      markNodeInProgress,
      updateNodeStatus,
      addNode,
      deleteNode,
      addWeek,
      deleteWeek,
      deletePhase,
      toggleDayComplete,
      saveWeeklySummary,
      getWeekPlan,
      generateError,

      // 新工作流字段
      wizardStep,
      wizardMessages,
      collectedInfo,
      outline,
      currentWeekNumber,
      weeklyPlans,
      weeklySummaries,
      dailyCheckins,
      isThinking,
      wizardError,

      // 新工作流方法
      startWizard,
      sendWizardMessage,
      generateOutline,
      confirmOutline,
      regenerateOutline,
      generateNextWeek,
      completeDailyTask,
      generateWeekSummary,
      cancelWizard,

      // 查询辅助
      getTodayTasks,
      getCurrentWeekPlan,
      getWeekCheckins,
      hasCheckedInToday,
    }}>
      {children}
    </LearningPlanContext.Provider>
  )
}
