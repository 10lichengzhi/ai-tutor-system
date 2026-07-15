// ========== 学习方案类型定义 ==========

/** 学习方向（预留扩展） */
export type LearningDirection = 'embedded_robot' | 'frontend' | 'backend' | 'custom'

/** 学习模式 */
export type LearningMode = 'practice' | 'theory' | 'mixed' // 实操导向/理论导向/混合

/** 编程基础等级 */
export type ProgrammingLevel = 'zero' | 'basic' | 'familiar' | 'proficient'
// zero: 零基础, basic: 皮毛/入门, familiar: 熟悉语法, proficient: 熟练应用

/** 硬件基础等级 */
export type HardwareLevel = 'zero' | 'basic' | 'familiar' | 'proficient'

/** 节点类型 */
export type NodeType = 'learn' | 'practice' | 'project' | 'review' | 'exam' | 'concept'

/** 节点状态 */
export type NodeStatus = 'completed' | 'in_progress' | 'pending' | 'not_started'

/** 资源类型 */
export type ResourceType = 'video' | 'book' | 'doc' | 'code' | 'tool'

/** 产出物类型 */
export type DeliverableType = 'code' | 'video' | 'doc' | 'hardware' | 'blog'

// ========== 知识点（知识图谱用） ==========
export interface KnowledgePoint {
  id: string
  name: string
  desc: string
  difficulty: 1 | 2 | 3 | 4 | 5 // 1-5星难度
  chapter: string // 所属阶段
  prerequisites: string[] // 前置知识点ID
  estimatedMinutes: number // 预计学习分钟数
  tags: string[]
  status: 'mastered' | 'learning' | 'not_started'
  progress: number
}

// ========== 推荐资源 ==========
export interface Resource {
  type: ResourceType
  title: string
  url?: string
  desc?: string
}

// ========== 产出物 ==========
export interface Deliverable {
  type: DeliverableType
  title: string
  desc: string
  required: boolean // 是否必须完成
}

// ========== 学习节点 ==========
export interface LearningNode {
  id: string | number
  title: string
  duration?: number // 分钟
  type: NodeType
  status: NodeStatus
  desc?: string
  description?: string
  knowledgePointIds: string[] // 关联的知识点ID
  resources?: Resource[] // 推荐资源
  deliverables?: Deliverable[] // 产出物要求
  day?: number // 第几天
  week?: number // 第几周
  isMilestone?: boolean // 是否是里程碑（每周项目）
  projectName?: string
}

// ========== 周计划 ==========
export interface WeekPlan {
  id?: string
  weekNumber: number
  theme?: string // 本周主题
  title?: string
  goals?: string[] // 本周目标
  nodes: LearningNode[]
  summary?: string // 用户填写的每周小结
  completedDays?: number[] // 已完成的天（打勾）
  progress?: number
  projectName?: string
}

// ========== 学习阶段 ==========
export interface Phase {
  id: number | string
  title?: string
  name?: string
  color?: string
  bgColor?: string
  borderColor?: string
  durationWeeks?: number
  startWeek?: number
  description: string
  weeks: WeekPlan[]
  progress?: number
}

// ========== 用户画像 ==========
export interface UserProfile {
  // 方向选择
  direction: LearningDirection | string
  directionName: string
  
  // 个人基础
  major?: string // 专业
  grade?: string // 年级
  programmingLevel?: ProgrammingLevel | 'beginner' | 'intermediate' | 'advanced'
  currentLevel?: 'beginner' | 'intermediate' | 'advanced'
  programmingDesc?: string // 编程基础补充说明
  hardwareLevel?: HardwareLevel
  hardwareDesc?: string // 硬件基础补充说明
  mathLevel?: 'weak' | 'average' | 'good' // 数学基础
  
  // 时间投入
  dailyHours: number
  daysPerWeek?: number
  weeklyDays?: number
  totalWeeks: number
  startDate?: string
  
  // 学习偏好
  learningMode?: LearningMode | 'project' | 'theory' | 'mixed'
  learningStyle?: 'project' | 'theory' | 'mixed'
  hasHardwareBudget?: boolean // 是否有硬件预算
  needJobPreparation?: boolean // 是否需要求职准备
  finalGoal: string
  method?: string
  projectFocus?: string
  
  // 生成元信息
  createdAt?: string
}

// ========== 学习方案完整结构 ==========
export interface LearningPlan {
  id: string
  name: string
  userProfile: UserProfile
  phases: Phase[]
  knowledgePoints: KnowledgePoint[]
  createdAt: string
}

// ========== 知识库模板（用于生成方案） ==========
export interface KnowledgeTemplate {
  direction: LearningDirection
  name: string
  description: string
  defaultTotalWeeks: number
  phases: PhaseTemplate[]
  knowledgeBase: KnowledgePoint[]
  projectLibrary: ProjectTemplate[] // 项目库
}

export interface PhaseTemplate {
  id: number
  title: string
  description: string
  minWeeks: number // 最少需要周数
  maxWeeks: number // 最多可分配周数
  defaultWeeks: number
  required: boolean // 是否必须（求职方向）
  knowledgePointIds: string[] // 包含的知识点
  weeklyProjects?: ProjectTemplate[] // 每周可选项目
}

export interface ProjectTemplate {
  id: string
  title: string
  desc: string
  difficulty: 1 | 2 | 3 | 4 | 5
  requiredKnowledgePointIds: string[] // 需要先掌握的知识点
  deliverables: Deliverable[]
  estimatedDays: number
  tags: string[]
}

// ========== 进度跟踪 ==========
export interface DailyRecord {
  date: string
  weekNumber: number
  dayOfWeek: number // 1-7
  completedNodeIds: (string | number)[]
  studyMinutes: number
  note?: string
}

export interface ProgressData {
  dailyRecords: DailyRecord[]
  weeklySummaries: { weekNumber: number; summary: string; date: string }[]
  streakDays: number // 连续学习天数
  totalStudyMinutes: number
}

// ========== Context 类型 ==========
interface LearningPlanContextType {
  // 方案数据
  phases: Phase[]
  knowledgePoints: KnowledgePoint[]
  userProfile: UserProfile | null
  activePlan: boolean
  isLoaded?: boolean
  isGenerating: boolean
  progressData: ProgressData
  
  // 方案操作
  generatePlan: (profile: UserProfile) => Promise<void> | void
  setPhases: (phases: Phase[]) => void
  setKnowledgePoints: (kps: KnowledgePoint[]) => void
  setUserProfile: (profile: UserProfile | null) => void
  resetPlan: () => void
  
  // 节点操作
  markNodeComplete: (nodeId: string | number) => void
  markNodeInProgress: (nodeId: string | number) => void
  updateNodeStatus: (nodeId: string | number, status: NodeStatus) => void
  addNode: (phaseId: number | string, weekId: string | number, node: Partial<LearningNode>) => void
  deleteNode: (phaseId: number | string, weekId: string | number, nodeId: string | number) => void
  
  // 周/阶段操作
  addWeek: (phaseId: number | string, week: Partial<WeekPlan>) => void
  deleteWeek: (phaseId: number | string, weekId: string | number) => void
  deletePhase: (phaseId: number | string) => void
  
  // 进度跟踪
  toggleDayComplete: (weekNumber: number, dayOfWeek: number, nodeId: string | number) => void
  saveWeeklySummary: (weekNumber: number, summary: string) => void
  getWeekPlan: (weekNumber: number) => WeekPlan | undefined
}

export type { LearningPlanContextType }

// ========== 错题本类型定义 ==========

/** 错题复习状态 */
export type WrongAnswerStatus = 'pending' | 'reviewing' | 'mastered'

/** 错题来源 */
export type WrongAnswerSource = 'manual' | 'exercise' | 'ai-generated'

/** 错题记录 */
export interface WrongAnswer {
  id: string
  title: string
  subject: string
  question: string // 题目内容
  userAnswer: string // 用户答案
  correctAnswer?: string // 正确答案（可选）
  knowledgePoint?: string // 关联知识点
  wrongCount: number // 错误次数
  firstWrongDate: string // 第一次做错时间
  lastWrongDate: string // 最近一次做错时间
  nextReviewDate: string // 下次复习时间
  status: WrongAnswerStatus
  source: WrongAnswerSource
  aiAnalysis?: string // AI分析结果
  aiAnalyzed: boolean // 是否已AI分析
  tags: string[]
  reviewHistory: { date: string; result: 'correct' | 'wrong' }[] // 复习历史
}

/** AI错题分析结果 */
export interface AIWrongAnalysis {
  errorReason: string // 错误原因
  correctSolution: string // 正确解法
  knowledgeExplanation: string // 知识点讲解
  pitfalls: string[] // 避坑提醒
  suggestions: string[] // 改进建议
  similarExercises?: string[] // 推荐相似练习
}

// ========== 练习库类型定义 ==========

/** 练习题类型 */
export type ExerciseType = 'choice' | 'fill' | 'calculate' | 'program' | 'short-answer'

/** 练习题难度 */
export type ExerciseDifficulty = 1 | 2 | 3 | 4 | 5

/** 练习题状态 */
export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'wrong'

/** 练习题 */
export interface Exercise {
  id: string
  type: ExerciseType
  difficulty: ExerciseDifficulty
  question: string // 题目内容
  options?: string[] // 选择题选项
  answer: string // 正确答案
  explanation: string // 答案解析
  knowledgePoint: string // 考察知识点
  subject?: string // 学科/方向
  createdAt: string // 生成时间
  source: 'ai-generated' | 'wrong-book' | 'manual'
  tags: string[]
}

/** 用户练习记录 */
export interface ExerciseRecord {
  id: string
  exerciseId: string
  userAnswer: string
  isCorrect: boolean
  score?: number
  timeSpent: number // 秒
  completedAt: string
  aiFeedback?: string // AI批改反馈
}

/** 练习会话（一次做题练习） */
export interface ExerciseSession {
  id: string
  title: string
  type: 'knowledge-point' | 'wrong-review' | 'mixed' | 'exam'
  exercises: Exercise[]
  records: ExerciseRecord[]
  startedAt: string
  completedAt?: string
  score?: number
  accuracy?: number
}

// ========== 错题本 Context 类型 ==========
export interface WrongAnswersContextType {
  wrongAnswers: WrongAnswer[]
  isAnalyzing: boolean
  isLoaded: boolean

  // 错题操作
  addWrongAnswer: (wrong: Omit<WrongAnswer, 'id' | 'firstWrongDate' | 'lastWrongDate' | 'nextReviewDate' | 'wrongCount' | 'status' | 'source' | 'aiAnalyzed' | 'reviewHistory' | 'tags'> & { source?: WrongAnswerSource }) => void
  deleteWrongAnswer: (id: string) => void
  markAsMastered: (id: string) => void
  recordReview: (id: string, result: 'correct' | 'wrong') => void

  // AI功能
  analyzeWithAI: (id: string) => Promise<void>
  analyzeAllWithAI: () => Promise<void>
  batchAnalyzeWeakPoints: () => Promise<string>

  // 查询
  getWrongAnswersByStatus: (status: WrongAnswerStatus) => WrongAnswer[]
  getTodayReviewList: () => WrongAnswer[]
  getWeakPoints: () => { knowledgePoint: string; count: number }[]
}

// ========== 练习库 Context 类型 ==========
export interface ExercisesContextType {
  exercises: Exercise[]
  records: ExerciseRecord[]
  sessions: ExerciseSession[]
  isGenerating: boolean
  isGrading: boolean
  isLoaded: boolean

  // AI生成练习
  generateExercises: (params: {
    knowledgePoint: string
    count: number
    difficulty: ExerciseDifficulty
    type?: ExerciseType | 'mixed'
    subject?: string
  }) => Promise<Exercise[]>
  generateWrongReviewExercises: (count?: number) => Promise<Exercise[]>
  generateMixedExercises: (count?: number) => Promise<Exercise[]>

  // 练习操作
  startSession: (exercises: Exercise[], title: string, type: ExerciseSession['type']) => ExerciseSession
  submitAnswer: (sessionId: string, exerciseId: string, userAnswer: string, timeSpent: number) => Promise<ExerciseRecord>
  completeSession: (sessionId: string) => void

  // 查询
  getExerciseById: (id: string) => Exercise | undefined
  getExercisesByKnowledgePoint: (kp: string) => Exercise[]
  getRecentRecords: (limit?: number) => ExerciseRecord[]
  getStatistics: () => { total: number; completed: number; accuracy: number; byDifficulty: Record<number, { total: number; correct: number }> }

  // 重置
  resetAll: () => void
}

// ========== 学习统计类型 ==========
export interface LearningStats {
  totalStudyDays: number // 总学习天数
  currentStreak: number // 当前连续学习天数
  longestStreak: number // 最长连续学习天数
  totalMinutes: number // 总学习时长（分钟）
  totalExercises: number // 总练习题数
  correctExercises: number // 答对题数
  masteredKnowledgePoints: number // 已掌握知识点数
  lastStudyDate: string | null // 最近学习日期
}

// ========== SM-2间隔重复记忆卡片状态 ==========
export interface SRSItem {
  id: string
  knowledgePointId: string
  easeFactor: number // 难度系数（初始2.5）
  interval: number // 间隔天数
  repetitions: number // 连续正确次数
  nextReviewDate: string // 下次复习日期
  lastReviewDate?: string // 上次复习日期
}

export type SRSRating = 0 | 1 | 2 | 3 | 4 | 5 // 0=完全忘记，5=完全记住

// ========== 新对话式学习计划工作流类型 ==========

/** 计划向导阶段 */
export type PlanWizardStep = 
  | 'idle'           // 未开始
  | 'interview'      // AI多轮对话了解用户
  | 'outline'        // 显示学习总纲，用户确认/修改
  | 'confirmed'      // 总纲已确认，开始生成周计划
  | 'active'         // 计划执行中

/** 引导对话消息 */
export interface WizardMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
  suggestedAnswers?: string[] // AI给的快捷回答选项
}

/** 每日任务打卡记录 */
export interface DailyCheckin {
  date: string
  weekNumber: number
  dayOfWeek: number // 1-7
  completedNodeIds: (string | number)[]
  studyMinutes: number // 实际学习时长
  mood: 'great' | 'good' | 'normal' | 'difficult' | 'frustrated' // 学习感受
  understanding: 1 | 2 | 3 | 4 | 5 // 理解程度自评
  note: string // 学习笔记/心得
  obstacles?: string // 遇到的困难
  createdAt: string
}

/** 周学习总结（AI生成） */
export interface WeeklySummary {
  weekNumber: number
  startDate: string
  endDate: string
  plannedTasks: number
  completedTasks: number
  totalMinutes: number
  averageUnderstanding: number
  strengths: string[] // 做得好的地方
  weaknesses: string[] // 需要加强的地方
  aiAdvice: string // AI建议
  nextWeekFocus: string[] // 下周重点
  adjustedDifficulty?: 'easier' | 'same' | 'harder' // 难度调整建议
}

/** 学习总纲（阶段划分，不含每日细节） */
export interface LearningOutline {
  title: string // 方案名称
  overview: string // 整体概述
  targetLevel: string // 学完后达到的水平
  totalWeeks: number
  estimatedHours: number // 总预估时长
  phases: OutlinePhase[]
  prerequisites: string[] // 前置知识要求
  milestones: { week: number; title: string; desc: string }[] // 里程碑
  learningTips: string[] // 学习建议
}

export interface OutlinePhase {
  id: string
  order: number
  title: string
  description: string
  durationWeeks: number
  startWeek: number
  endWeek: number
  coreKnowledge: string[] // 核心知识点列表
  goals: string[] // 阶段目标
  deliverable?: string // 阶段产出（如：完成XX项目）
  color?: string
}

/** 单周详细计划（按需生成） */
export interface WeeklyPlanDetail {
  weekNumber: number
  phaseId: string
  phaseTitle: string
  theme: string // 本周主题
  goals: string[] // 本周目标
  overview: string // 本周内容概述
  dailyTasks: DailyTask[]
  weekendReview: {
    focusPoints: string[]
    practiceQuestions?: string[]
    reflectionPrompt: string
  }
  estimatedMinutes: number
  difficulty: 1 | 2 | 3 | 4 | 5
  generatedAt: string
}

export interface DailyTask {
  id: string
  dayOfWeek: number // 1-7 (周一到周日)
  title: string
  type: 'learn' | 'practice' | 'project' | 'review' | 'rest'
  duration: number // 分钟
  knowledgePoints: string[]
  description: string
  keyPoints: string[] // 学习要点
  practiceSuggestion?: string // 练习建议
  resources?: { type: string; title: string }[]
  isComplete: boolean
  completedAt?: string
}

/** 用户画像收集状态 */
export interface UserProfileCollection {
  // 已收集的信息
  learningGoal?: string // 学习目标（想学什么）
  targetLevel?: string // 期望达到的水平
  currentLevel?: string // 当前基础水平
  timeAvailable?: {
    dailyMinutes: number
    weeklyDays: number
    preferredTime?: 'morning' | 'afternoon' | 'evening' | 'night'
  }
  experience?: string // 相关经验描述
  learningStyle?: 'visual' | 'hands-on' | 'reading' | 'video' | 'mixed' // 学习风格偏好
  specificNeeds?: string // 特殊需求（如考研、求职、兴趣等）
  deadline?: string // 截止日期（如有）
}


