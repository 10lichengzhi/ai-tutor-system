// ============================================
// 通用类型定义
// ============================================

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// ============================================
// 用户相关类型
// ============================================

export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: UserRole
  level?: number
  createdAt?: string
  updatedAt?: string
}

// ============================================
// 知识点/知识图谱相关类型
// ============================================

export type KnowledgeStatus = 'mastered' | 'learning' | 'locked' | 'not_started'

export interface KnowledgeNode {
  id: string
  label: string
  subject: string
  status: KnowledgeStatus
  progress: number
  description?: string
  prerequisites: string[]
  level: number
  resources?: Resource[]
  relatedQuestions?: number
}

export interface KnowledgeEdge {
  source: string
  target: string
  relation: 'prerequisite' | 'related' | 'contains'
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface Subject {
  id: string
  name: string
  icon?: string
  progress: number
  nodeCount: number
}

// ============================================
// 学习资源类型
// ============================================

export type ResourceType = 'video' | 'article' | 'exercise' | 'book'

export interface Resource {
  id: string
  title: string
  type: ResourceType
  url?: string
  duration?: number
  description?: string
}

// ============================================
// 学习路径类型
// ============================================

export type PathStepStatus = 'completed' | 'current' | 'locked'

export interface PathStep {
  id: string
  title: string
  description: string
  status: PathStepStatus
  duration: number
  resources: Resource[]
  knowledgeNodes: string[]
}

export interface LearningPath {
  id: string
  title: string
  description: string
  subject: string
  steps: PathStep[]
  totalDuration: number
  progress: number
  aiGenerated?: boolean
  createdAt: string
}

// ============================================
// 学习计划/任务类型
// ============================================

export type TaskType = 'study' | 'practice' | 'review'

export interface StudyTask {
  id: string
  title: string
  type: TaskType
  startTime: string
  duration: number
  completed: boolean
  knowledgePointId?: string
}

export interface StudyPlan {
  id: string
  date: string
  tasks: StudyTask[]
  totalDuration: number
  completedDuration: number
}

// ============================================
// 答疑/对话类型
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Reference {
  type: 'knowledge' | 'question' | 'resource'
  id: string
  title: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  references?: Reference[]
}

export interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: string
  messageCount: number
}

// ============================================
// 错题类型
// ============================================

export type WrongQuestionStatus = 'pending' | 'reviewed' | 'mastered'

export interface WrongQuestion {
  id: string
  subject: string
  title: string
  content: string
  wrongAnswer: string
  correctAnswer: string
  analysis: string
  wrongCount: number
  lastWrongAt: string
  status: WrongQuestionStatus
  tags: string[]
  knowledgePointId: string
}

// ============================================
// 学习统计类型
// ============================================

export interface LearningStats {
  totalDuration: number
  totalQuestions: number
  completedNodes: number
  streak: number
  todayDuration: number
  todayQuestions: number
  dailyStats: DailyStat[]
}

export interface DailyStat {
  date: string
  duration: number
  questions: number
}

export interface AbilityRadar {
  understanding: number
  calculation: number
  logic: number
  application: number
  creativity: number
  analysis: number
}

// ============================================
// AI教师导学相关类型
// ============================================

/** 消息类型：诊断分析、任务布置、引导提问、鼓励反馈、学习报告、普通文本、学习反馈 */
export type TutorMessageType =
  | 'diagnosis'
  | 'task'
  | 'guidance'
  | 'encouragement'
  | 'report'
  | 'text'
  | 'feedback'

/** 知识点强度标签 */
export interface KnowledgeTag {
  id: string
  name: string
  /** 薄弱程度 0-100，越高越薄弱 */
  weaknessLevel?: number
  /** 强度评分 0-100 */
  strengthScore?: number
  subject?: string
}

/** 学情诊断结果 */
export interface Diagnosis {
  id: string
  subject: string
  /** 整体水平等级：1-5级 */
  overallLevel: number
  levelLabel: string
  /** 学习天数 */
  studyDays: number
  /** 累计学习时长（分钟） */
  totalDuration: number
  /** 薄弱知识点 */
  weakPoints: KnowledgeTag[]
  /** 优势知识点 */
  strengthPoints: KnowledgeTag[]
  /** 能力雷达数据 */
  abilityRadar: AbilityRadar
  /** 学习建议 */
  suggestions: string[]
  /** 诊断时间 */
  diagnosedAt: string
}

/** 学习任务状态 */
export type StudyTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

/** 学习任务类型（扩展） */
export type TutorTaskType = 'study' | 'practice' | 'review' | 'quiz' | 'video' | 'reading'

/** 导学任务（扩展StudyTask） */
export interface TutorTask {
  id: string
  title: string
  description?: string
  type: TutorTaskType
  status: StudyTaskStatus
  /** 预计时长（分钟） */
  estimatedDuration: number
  /** 实际花费时长（分钟） */
  actualDuration?: number
  /** 关联知识点ID */
  knowledgePointId?: string
  knowledgePointName?: string
  /** 任务进度 0-100 */
  progress: number
  /** 难度 1-5 */
  difficulty?: number
  /** 完成奖励经验值 */
  rewardXP?: number
  /** 开始时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 排序权重 */
  order?: number
}

/** 引导问题类型 */
export type GuidanceQuestionType = 'single_choice' | 'multi_choice' | 'fill_blank' | 'free_text'

/** 引导问题选项 */
export interface GuidanceOption {
  id: string
  label: string
  /** 是否为正确答案（苏格拉底式不一定有唯一正确答案） */
  isCorrect?: boolean
  /** 选择后的反馈 */
  feedback?: string
}

/** 引导步骤 */
export interface GuidanceStep {
  id: string
  sessionId: string
  /** 步骤序号 */
  stepNumber: number
  /** 引导问题 */
  question: string
  questionType: GuidanceQuestionType
  /** 选项（选择题时使用） */
  options?: GuidanceOption[]
  /** 提示/上下文 */
  hint?: string
  /** 用户回答 */
  userAnswer?: string | string[]
  /** AI反馈 */
  aiFeedback?: string
  /** 是否完成 */
  completed: boolean
}

/** 导学会话 */
export interface TutorSession {
  id: string
  subject: string
  /** 会话标题 */
  title: string
  /** 当前任务ID */
  currentTaskId?: string
  /** 当前引导步骤ID */
  currentGuidanceId?: string
  /** 会话状态 */
  status: 'active' | 'paused' | 'completed'
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 累计学习时长（分钟） */
  totalDuration: number
}

/** AI教师消息 */
export interface TutorChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  type: TutorMessageType
  content: string
  timestamp: string
  /** 诊断数据（type=diagnosis时） */
  diagnosis?: Diagnosis
  /** 任务数据（type=task时） */
  task?: TutorTask
  /** 引导问题数据（type=guidance时） */
  guidance?: GuidanceStep
  /** 报告数据（type=report时） */
  report?: DailyReport
  /** 附加数据 */
  metadata?: Record<string, any>
}

/** 每日学习报告 */
export interface DailyReport {
  id: string
  date: string
  subject: string
  /** 今日学习时长（分钟） */
  totalDuration: number
  /** 完成任务数 */
  completedTasks: number
  /** 总任务数 */
  totalTasks: number
  /** 正确率 */
  accuracy?: number
  /** 获得经验值 */
  earnedXP: number
  /** 掌握的知识点 */
  masteredKnowledge: string[]
  /** 需加强的知识点 */
  weakKnowledge: string[]
  /** 学习评语 */
  comment: string
  /** 明日建议 */
  tomorrowPlan?: string
  /** 能力变化 */
  abilityChanges?: Partial<AbilityRadar>
}

// ============================================
// 学习反馈相关类型
// ============================================

/** 反馈类型 */
export type FeedbackType =
  | 'understood'   // 听懂了
  | 'confused'     // 有点困惑
  | 'stuck'        // 卡住了
  | 'question'     // 有问题
  | 'note'         // 做笔记
  | 'harvest'      // 有收获

/** 反馈状态 */
export type FeedbackStatus = 'pending' | 'resolved' | 'addressed'

/** 学习反馈记录 */
export interface LearningFeedback {
  id: string
  /** 反馈类型 */
  type: FeedbackType
  /** 学生反馈内容 */
  content: string
  /** AI教师回应 */
  aiResponse?: string
  /** 关联会话ID */
  sessionId?: string
  /** 关联知识点ID */
  knowledgeId?: string
  /** 关联知识点名称 */
  knowledgeName?: string
  /** 反馈状态 */
  status: FeedbackStatus
  /** 是否解决 */
  resolved: boolean
  /** 解决时间 */
  resolvedAt?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
}

/** 提交反馈请求 */
export interface FeedbackSubmitRequest {
  type: FeedbackType
  content?: string
  sessionId?: string
  knowledgeId?: string
}

/** AI回应数据 */
export interface FeedbackResponse {
  id: string
  feedbackId: string
  /** AI回应内容 */
  content: string
  /** 即时提示/知识点解释 */
  hint?: string
  /** 推荐资源 */
  suggestions?: string[]
  /** 相关知识点 */
  relatedKnowledge?: KnowledgeTag[]
  /** 回应时间 */
  respondedAt: string
}

/** 今日反馈统计 */
export interface FeedbackStats {
  /** 今日反馈总次数 */
  totalCount: number
  /** 各类反馈次数 */
  byType: Record<FeedbackType, number>
  /** 未解决问题数 */
  unresolvedCount: number
  /** 今日获得经验值 */
  earnedXP: number
  /** 连续反馈天数 */
  streakDays: number
}

/** 即时提示（知识点快速解释） */
export interface InstantHint {
  id: string
  knowledgeId: string
  /** 简短解释 */
  explanation: string
  /** 关键要点 */
  keyPoints: string[]
  /** 常见误区 */
  commonMistakes?: string[]
  /** 一个快速例子 */
  quickExample?: string
}
