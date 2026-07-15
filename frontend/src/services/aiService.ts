/**
 * 前端AI服务 - 通过后端代理调用大模型
 * 后端负责隐藏API Key，前端只发普通消息
 * 支持用户选择不同的AI模型、学习模式、思维策略
 */

import type { WizardMessage, LearningOutline, WeeklyPlanDetail, WeeklySummary, UserProfileCollection } from '../types/learning'

// API基础路径（通过vite代理转发到后端）
const API_BASE = '/api/ai'

// ========== 类型定义 ==========

export type LearningMode = 'goal_oriented' | 'deep_learning'
export type ThinkingStrategy = 'occam' | 'first_principles' | 'feynman' | 'structured' | 'reverse'
export type TutorPersonality = 'socratic' | 'patient' | 'strict' | 'humorous'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatContent[]
}

export interface ChatContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

export interface AIModel {
  id: string
  name: string
  description: string
  recommended: boolean
  type: string
}

export interface AIConfig {
  personalities: { id: TutorPersonality; name: string }[]
  learningModes: { id: LearningMode; name: string }[]
  thinkingStrategies: { id: ThinkingStrategy; name: string }[]
}

export interface GeneratePlanParams {
  direction: string
  direction_name: string
  current_level: string
  daily_hours: number
  weekly_days: number
  total_weeks: number
  final_goal: string
  project_focus?: string
  learning_style: string
  programming_level?: string
  hardware_level?: string
  model?: string
}

export interface GeneratedPlan {
  phases: any[]
  knowledgePoints: any[]
  suggestions?: string[]
}

export interface ChatParams {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  personality?: TutorPersonality
  learningMode?: LearningMode
  thinkingStrategy?: ThinkingStrategy
}

export interface AnalyzeWrongParams {
  question: string
  user_answer: string
  correct_answer?: string
  knowledge_point?: string
  model?: string
}

export interface GenerateExerciseParams {
  knowledge_point: string
  difficulty: number
  count: number
  exercise_type: string
  model?: string
}

// ========== 通用请求封装 ==========

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`HTTP错误: ${response.status} ${errorText ? '- ' + errorText.slice(0, 200) : ''}`)
  }

  const data = await response.json()
  if (data.code !== 0) {
    throw new Error(data.message || '请求失败')
  }
  return data.data
}

// ========== API方法 ==========

/**
 * 获取AI配置（人格、学习模式、思维策略列表）
 */
export async function getAIConfig(): Promise<AIConfig> {
  return request('/config')
}

/**
 * 获取可用的AI模型列表
 */
export async function getModels(): Promise<{
  success: boolean
  provider: string
  provider_name: string
  model: string
  models: AIModel[]
  models_count: number
}> {
  return request('/models')
}

/**
 * 测试AI连接
 */
export async function testConnection(model?: string): Promise<{
  success: boolean
  provider: string
  provider_name: string
  model: string
  models: AIModel[]
  models_count: number
}> {
  return request('/test-connection', {
    method: 'POST',
    body: JSON.stringify({ model }),
  })
}

/**
 * AI对话（非流式）
 */
export async function chat(params: ChatParams): Promise<{ content: string }> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: params.messages,
      model: params.model,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 4096,
      stream: false,
    }),
  })
}

/**
 * SSE流式解析通用逻辑
 */
async function processStream(
  response: Response,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
) {
  try {
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') {
          onDone?.()
          return
        }

        try {
          const data = JSON.parse(dataStr)
          if (data.error) {
            throw new Error(data.error)
          }
          // OpenAI SSE格式: choices[0].delta.content
          if (data.choices?.[0]?.delta?.content) {
            onChunk(data.choices[0].delta.content)
          }
          // 非流式兼容: content字段
          else if (data.content) {
            onChunk(data.content)
          }
        } catch (e) {
          console.warn('解析SSE数据失败:', e)
        }
      }
    }

    onDone?.()
  } catch (error) {
    onError?.(error as Error)
  }
}

/**
 * AI对话（流式SSE）
 */
export async function chatStream(
  params: ChatParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: params.messages,
        model: params.model,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
        stream: true,
      }),
    })
    await processStream(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

/**
 * AI智师对话（流式，支持多人格+学习模式+思维策略+图片）
 */
export async function tutorChatStream(
  params: ChatParams,
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/tutor-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: params.messages,
        model: params.model,
        temperature: params.temperature,
        max_tokens: params.max_tokens ?? 4096,
        stream: true,
        personality: params.personality || 'socratic',
        learningMode: params.learningMode,
        thinkingStrategy: params.thinkingStrategy,
      }),
    })
    await processStream(response, onChunk, onDone, onError)
  } catch (error) {
    onError?.(error as Error)
  }
}

/**
 * AI生成学习方案
 */
export async function aiGeneratePlan(params: GeneratePlanParams): Promise<GeneratedPlan> {
  return request('/generate-plan', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * AI分析错题
 */
export async function analyzeWrong(params: AnalyzeWrongParams): Promise<{ analysis: string }> {
  return request('/analyze-wrong', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * AI生成练习题
 */
export async function generateExercises(params: GenerateExerciseParams): Promise<{
  exercises: Array<{
    id: string
    type: string
    difficulty: number
    question: string
    options?: string[]
    answer: string
    explanation: string
    knowledgePoint: string
  }>
}> {
  return request('/generate-exercises', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * AI生成学习方案（别名，保持向后兼容）
 */
export const generatePlan = aiGeneratePlan

// ========== 对话式学习计划API ==========

export interface PlanInterviewParams {
  messages: WizardMessage[]
  collectedInfo: UserProfileCollection
  model?: string
}

export interface PlanInterviewResult {
  reply: string
  suggestedAnswers: string[]
  collectedInfo: UserProfileCollection
  isComplete: boolean
  missingInfo: string[]
}

export async function planInterview(params: PlanInterviewParams): Promise<PlanInterviewResult> {
  return request('/plan/interview', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function generateOutline(
  collectedInfo: UserProfileCollection,
  model?: string
): Promise<LearningOutline> {
  return request('/plan/generate-outline', {
    method: 'POST',
    body: JSON.stringify({ collectedInfo, model }),
  })
}

export interface GenerateWeekParams {
  outline: LearningOutline
  weekNumber: number
  previousWeekSummary?: WeeklySummary | null
  checkinHistory?: any[]
  model?: string
}

export async function generateWeekPlan(params: GenerateWeekParams): Promise<WeeklyPlanDetail> {
  return request('/plan/generate-week', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export interface WeeklySummaryParams {
  weekNumber: number
  checkins: any[]
  weekPlan: WeeklyPlanDetail
  outline: LearningOutline
  model?: string
}

export async function generateWeeklySummary(params: WeeklySummaryParams): Promise<WeeklySummary> {
  return request('/plan/weekly-summary', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ========== 工具函数：图片转base64 ==========

/**
 * 将File/Blob压缩并转为base64 data URL
 * @param file 图片文件
 * @param maxWidth 最大宽度（默认1024px）
 * @param quality JPEG质量（0-1，默认0.8）
 */
export function fileToBase64(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('只能上传图片文件'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('图片大小不能超过5MB'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算缩放后的尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string) // 降级：直接使用原图
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        // 统一输出JPEG（透明背景变白）
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export default {
  getAIConfig,
  getModels,
  testConnection,
  chat,
  chatStream,
  aiGeneratePlan,
  generatePlan,
  tutorChatStream,
  analyzeWrong,
  generateExercises,
  planInterview,
  generateOutline,
  generateWeekPlan,
  generateWeeklySummary,
  fileToBase64,
}
