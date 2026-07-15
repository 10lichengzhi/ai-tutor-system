import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AIModel, getModels, testConnection } from '../services/aiService'

// ========== 设置类型 ==========
export type TutorPersonality = 'socratic' | 'patient' | 'strict' | 'humorous'

export interface AISettings {
  selectedModel: string | null  // 选中的AI模型ID，null表示使用后端默认
  temperature: number
  personality: TutorPersonality
}

export const TUTOR_PERSONALITY_INFO: Record<TutorPersonality, { name: string; desc: string; icon: string }> = {
  socratic: {
    name: '苏格拉底型',
    desc: '不直接给答案，用提问引导你思考',
    icon: '🧠'
  },
  patient: {
    name: '耐心细致型',
    desc: '讲解细致，多用类比，适合零基础',
    icon: '🌸'
  },
  strict: {
    name: '严谨学术型',
    desc: '逻辑严密，概念准确，注重原理',
    icon: '🎓'
  },
  humorous: {
    name: '幽默风趣型',
    desc: '轻松有趣，用段子讲解知识',
    icon: '😄'
  }
}

export interface LearningSettings {
  dailyGoal: number  // 每日学习目标（分钟）
  autoNext: boolean
  showHints: boolean
  notifications: boolean
}

export interface SettingsContextType {
  // AI设置
  ai: AISettings
  setAISettings: (settings: Partial<AISettings>) => void
  
  // 学习设置
  learning: LearningSettings
  setLearningSettings: (settings: Partial<LearningSettings>) => void
  
  // 模型列表
  models: AIModel[]
  defaultModel: string
  loadingModels: boolean
  
  // 连接测试
  testingConnection: boolean
  connectionStatus: 'idle' | 'success' | 'error'
  connectionMessage: string
  testAIConnection: () => Promise<void>
  
  // 重置
  resetSettings: () => void
}

const STORAGE_KEY = 'ai-tutor-settings'

const defaultAISettings: AISettings = {
  selectedModel: null,
  temperature: 0.7,
  personality: 'socratic',
}

const defaultLearningSettings: LearningSettings = {
  dailyGoal: 45,
  autoNext: true,
  showHints: true,
  notifications: true,
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // 从localStorage加载设置
  const [ai, setAIState] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return { ...defaultAISettings, ...data.ai }
      }
    } catch (e) {
      console.error('加载设置失败:', e)
    }
    return defaultAISettings
  })

  const [learning, setLearningState] = useState<LearningSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return { ...defaultLearningSettings, ...data.learning }
      }
    } catch (e) {
      console.error('加载设置失败:', e)
    }
    return defaultLearningSettings
  })

  const [models, setModels] = useState<AIModel[]>([])
  const [defaultModel, setDefaultModel] = useState('agnes-2.0-flash')
  const [loadingModels, setLoadingModels] = useState(true)

  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ai, learning }))
  }, [ai, learning])

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true)
        const data = await getModels()
        setModels(data.models || [])
        setDefaultModel(data.model)
      } catch (e) {
        console.error('加载AI模型列表失败（后端可能未启动）:', e)
        // 默认显示模型
        setModels([
          {
            id: 'agnes-2.0-flash',
            name: 'Agnes 2.0 Flash',
            description: '最新最快的文本模型，适合日常对话和学习',
            recommended: true,
            type: 'text',
          },
          {
            id: 'agnes-1.5-flash',
            name: 'Agnes 1.5 Flash',
            description: '稳定可靠的文本模型，兼容性好',
            recommended: false,
            type: 'text',
          }
        ])
      } finally {
        setLoadingModels(false)
      }
    }
    loadModels()
  }, [])

  const setAISettings = (settings: Partial<AISettings>) => {
    setAIState(prev => ({ ...prev, ...settings }))
  }

  const setLearningSettings = (settings: Partial<LearningSettings>) => {
    setLearningState(prev => ({ ...prev, ...settings }))
  }

  const testAIConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus('idle')
    setConnectionMessage('')
    try {
      const result = await testConnection(ai.selectedModel || undefined)
      setModels(result.models || models)
      setConnectionStatus('success')
      setConnectionMessage(`连接成功！当前模型: ${result.model}，可用模型数: ${result.models_count}`)
    } catch (e) {
      setConnectionStatus('error')
      setConnectionMessage(e instanceof Error ? e.message : '连接失败，请检查后端是否启动')
    } finally {
      setTestingConnection(false)
    }
  }

  const resetSettings = () => {
    setAIState(defaultAISettings)
    setLearningState(defaultLearningSettings)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <SettingsContext.Provider value={{
      ai,
      setAISettings,
      learning,
      setLearningSettings,
      models,
      defaultModel,
      loadingModels,
      testingConnection,
      connectionStatus,
      connectionMessage,
      testAIConnection,
      resetSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
