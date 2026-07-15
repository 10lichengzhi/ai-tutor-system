import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { WrongAnswer, WrongAnswerStatus } from '../types/learning'
import { analyzeWrong } from '../services/aiService'
import { useSettings } from './SettingsContext'

// 扩展的Context类型
interface WrongAnswersContextTypeExtended {
  wrongAnswers: WrongAnswer[]
  isAnalyzing: boolean
  isLoaded: boolean
  addWrongAnswer: (wrong: any) => WrongAnswer
  deleteWrongAnswer: (id: string) => void
  markAsMastered: (id: string) => void
  recordReview: (id: string, result: 'correct' | 'wrong') => void
  analyzeWithAI: (id: string) => Promise<void>
  analyzeAllWithAI: () => Promise<void>
  batchAnalyzeWeakPoints: () => Promise<string>
  getWrongAnswersByStatus: (status: WrongAnswerStatus) => WrongAnswer[]
  getTodayReviewList: () => WrongAnswer[]
  getWeakPoints: () => { knowledgePoint: string; count: number }[]
  resetAll: () => void
}

const STORAGE_KEY = 'ai-tutor-wrong-answers'

// 计算下次复习日期（艾宾浩斯遗忘曲线：1天、2天、4天、7天、15天）
function calculateNextReviewDate(wrongCount: number, lastReview?: string): string {
  const intervals = [1, 2, 4, 7, 15] // 天
  const intervalIndex = Math.min(wrongCount, intervals.length - 1)
  const days = intervals[intervalIndex]
  const baseDate = lastReview ? new Date(lastReview) : new Date()
  baseDate.setDate(baseDate.getDate() + days)
  return baseDate.toISOString().split('T')[0]
}

function generateId(): string {
  return 'WA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// 从localStorage加载数据
function loadFromStorage(): WrongAnswer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('加载错题本数据失败:', e)
  }
  return []
}

// 保存到localStorage
function saveToStorage(wrongAnswers: WrongAnswer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongAnswers))
  } catch (e) {
    console.error('保存错题本数据失败:', e)
  }
}

const WrongAnswersContext = createContext<WrongAnswersContextTypeExtended | null>(null)

export function WrongAnswersProvider({ children }: { children: ReactNode }) {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { ai: aiSettings } = useSettings()

  // 初始化加载
  useEffect(() => {
    const data = loadFromStorage()
    setWrongAnswers(data)
    setIsLoaded(true)
  }, [])

  // 数据变化时自动保存
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(wrongAnswers)
    }
  }, [wrongAnswers, isLoaded])

  // 添加错题
  const addWrongAnswer = useCallback((wrong: Omit<WrongAnswer, 'id' | 'firstWrongDate' | 'lastWrongDate' | 'nextReviewDate' | 'wrongCount' | 'status' | 'source' | 'aiAnalyzed' | 'reviewHistory' | 'tags'> & { source?: any }) => {
    const now = new Date().toISOString()
    const today = now.split('T')[0]
    
    const newWrong: WrongAnswer = {
      id: generateId(),
      title: wrong.title || wrong.question.substring(0, 30) + (wrong.question.length > 30 ? '...' : ''),
      subject: wrong.subject || '通用',
      question: wrong.question,
      userAnswer: wrong.userAnswer,
      correctAnswer: wrong.correctAnswer,
      knowledgePoint: wrong.knowledgePoint,
      wrongCount: 1,
      firstWrongDate: today,
      lastWrongDate: today,
      nextReviewDate: calculateNextReviewDate(0),
      status: 'pending',
      source: wrong.source || 'manual',
      aiAnalyzed: false,
      tags: wrong.knowledgePoint ? [wrong.knowledgePoint] : [],
      reviewHistory: []
    }

    setWrongAnswers(prev => [newWrong, ...prev])
    return newWrong
  }, [])

  // 删除错题
  const deleteWrongAnswer = useCallback((id: string) => {
    setWrongAnswers(prev => prev.filter(w => w.id !== id))
  }, [])

  // 标记为已掌握
  const markAsMastered = useCallback((id: string) => {
    setWrongAnswers(prev => prev.map(w => 
      w.id === id ? { ...w, status: 'mastered' as WrongAnswerStatus } : w
    ))
  }, [])

  // 记录复习结果
  const recordReview = useCallback((id: string, result: 'correct' | 'wrong') => {
    const today = new Date().toISOString().split('T')[0]
    
    setWrongAnswers(prev => prev.map(w => {
      if (w.id !== id) return w
      
      const newWrongCount = result === 'wrong' ? w.wrongCount + 1 : w.wrongCount
      const newHistory = [...w.reviewHistory, { date: today, result }]
      
      // 如果连续答对2次，标记为复习中
      let newStatus: WrongAnswerStatus = w.status
      if (result === 'correct') {
        const recentCorrect = newHistory.slice(-2).filter(h => h.result === 'correct').length
        if (recentCorrect >= 2) {
          newStatus = 'reviewing'
        }
      } else {
        newStatus = 'pending'
      }

      return {
        ...w,
        wrongCount: newWrongCount,
        lastWrongDate: result === 'wrong' ? today : w.lastWrongDate,
        nextReviewDate: calculateNextReviewDate(newWrongCount, today),
        reviewHistory: newHistory,
        status: newStatus
      }
    }))
  }, [])

  // AI分析单道错题
  const analyzeWithAI = useCallback(async (id: string) => {
    const wrong = wrongAnswers.find(w => w.id === id)
    if (!wrong || wrong.aiAnalyzed) return

    setIsAnalyzing(true)
    try {
      const result = await analyzeWrong({
        question: wrong.question,
        user_answer: wrong.userAnswer,
        correct_answer: wrong.correctAnswer,
        knowledge_point: wrong.knowledgePoint,
        model: aiSettings.selectedModel || undefined
      })

      setWrongAnswers(prev => prev.map(w => 
        w.id === id 
          ? { ...w, aiAnalysis: result.analysis, aiAnalyzed: true }
          : w
      ))
    } catch (e) {
      console.error('AI分析错题失败:', e)
      throw e
    } finally {
      setIsAnalyzing(false)
    }
  }, [wrongAnswers, aiSettings.selectedModel])

  // AI批量分析所有待分析错题
  const analyzeAllWithAI = useCallback(async () => {
    const toAnalyze = wrongAnswers.filter(w => !w.aiAnalyzed && w.status !== 'mastered')
    setIsAnalyzing(true)
    
    let successCount = 0
    for (const wrong of toAnalyze) {
      try {
        const result = await analyzeWrong({
          question: wrong.question,
          user_answer: wrong.userAnswer,
          correct_answer: wrong.correctAnswer,
          knowledge_point: wrong.knowledgePoint,
          model: aiSettings.selectedModel || undefined
        })
        
        setWrongAnswers(prev => prev.map(w => 
          w.id === wrong.id 
            ? { ...w, aiAnalysis: result.analysis, aiAnalyzed: true }
            : w
        ))
        successCount++
      } catch (e) {
        console.error('分析错题失败:', wrong.id, e)
      }
    }
    
    setIsAnalyzing(false)
  }, [wrongAnswers, aiSettings.selectedModel])

  // AI批量分析薄弱点
  const batchAnalyzeWeakPoints = useCallback(async (): Promise<string> => {
    const activeWrong = wrongAnswers.filter(w => w.status !== 'mastered')
    if (activeWrong.length === 0) {
      return '暂无错题数据，继续加油！'
    }

    const wrongSummary = activeWrong.slice(0, 10).map(w => 
      `- ${w.knowledgePoint || '未知知识点'}: ${w.title} (错${w.wrongCount}次)`
    ).join('\n')

    setIsAnalyzing(true)
    try {
      // 使用chat接口进行综合分析
      const { chat } = await import('../services/aiService')
      const response = await chat({
        messages: [
          {
            role: 'system',
            content: '你是一位专业的学习分析师，根据学生的错题情况分析薄弱知识点，给出针对性的改进建议。语言简洁明了，重点突出。'
          },
          {
            role: 'user',
            content: `这是我最近的错题列表，请分析我的薄弱知识点并给出学习建议：\n\n${wrongSummary}\n\n请从以下方面分析：\n1. 最薄弱的3个知识点\n2. 错误原因归类\n3. 具体改进建议\n4. 推荐优先复习顺序`
          }
        ],
        model: aiSettings.selectedModel || undefined
      })
      return response.content
    } catch (e) {
      console.error('薄弱点分析失败:', e)
      return '分析失败，请稍后重试'
    } finally {
      setIsAnalyzing(false)
    }
  }, [wrongAnswers, aiSettings.selectedModel])

  // 按状态获取错题
  const getWrongAnswersByStatus = useCallback((status: WrongAnswerStatus) => {
    return wrongAnswers.filter(w => w.status === status)
  }, [wrongAnswers])

  // 获取今日待复习列表
  const getTodayReviewList = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return wrongAnswers.filter(w => 
      w.status !== 'mastered' && 
      w.nextReviewDate <= today
    )
  }, [wrongAnswers])

  // 获取薄弱知识点统计
  const getWeakPoints = useCallback(() => {
    const pointCount: Record<string, number> = {}
    wrongAnswers
      .filter(w => w.status !== 'mastered')
      .forEach(w => {
        const kp = w.knowledgePoint || '未分类'
        pointCount[kp] = (pointCount[kp] || 0) + 1
      })
    
    return Object.entries(pointCount)
      .map(([knowledgePoint, count]) => ({ knowledgePoint, count }))
      .sort((a, b) => b.count - a.count)
  }, [wrongAnswers])

  // 重置所有错题数据
  const resetAll = useCallback(() => {
    setWrongAnswers([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value: WrongAnswersContextTypeExtended = {
    wrongAnswers,
    isAnalyzing,
    isLoaded,
    addWrongAnswer,
    deleteWrongAnswer,
    markAsMastered,
    recordReview,
    analyzeWithAI,
    analyzeAllWithAI,
    batchAnalyzeWeakPoints,
    getWrongAnswersByStatus,
    getTodayReviewList,
    getWeakPoints,
    resetAll
  }

  return (
    <WrongAnswersContext.Provider value={value}>
      {children}
    </WrongAnswersContext.Provider>
  )
}

export function useWrongAnswers() {
  const context = useContext(WrongAnswersContext)
  if (!context) {
    throw new Error('useWrongAnswers must be used within WrongAnswersProvider')
  }
  return context
}
