import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { LearningStats, SRSItem, SRSRating, KnowledgePoint } from '../types/learning'

const STORAGE_KEY_STATS = 'ai-tutor-learning-stats'
const STORAGE_KEY_SRS = 'ai-tutor-srs-items'
const STORAGE_KEY_KP_MASTERY = 'ai-tutor-kp-mastery'

// SM-2算法实现（参考Anki）
function calculateSM2(
  item: SRSItem,
  rating: SRSRating
): SRSItem {
  let { easeFactor, interval, repetitions } = item
  const today = new Date().toISOString().split('T')[0]

  if (rating < 3) {
    // 答错了，重置重复次数
    repetitions = 0
    interval = 1
  } else {
    // 答对了
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // 更新难度系数
  easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // 计算下次复习日期
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    ...item,
    easeFactor,
    interval,
    repetitions,
    lastReviewDate: today,
    nextReviewDate: nextDate.toISOString().split('T')[0]
  }
}

// 初始化默认统计数据
const defaultStats: LearningStats = {
  totalStudyDays: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutes: 0,
  totalExercises: 0,
  correctExercises: 0,
  masteredKnowledgePoints: 0,
  lastStudyDate: null
}

// 从localStorage加载
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(`加载${key}失败:`, e)
  }
  return defaultValue
}

// 保存到localStorage
function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`保存${key}失败:`, e)
  }
}

interface LearningStatsContextType {
  stats: LearningStats
  srsItems: SRSItem[]
  kpMastery: Record<string, number> // knowledgePointId -> 0-100掌握度
  isLoaded: boolean

  // 学习记录
  recordStudySession: (minutes: number) => void
  recordExercise: (isCorrect: boolean, knowledgePointId?: string) => void
  
  // 知识点掌握度
  updateKPMastery: (kpId: string, delta: number) => void // delta可以是正负
  setKPMastery: (kpId: string, mastery: number) => void
  getKPMastery: (kpId: string) => number
  getKPMasteryLevel: (kpId: string) => 'not_started' | 'learning' | 'familiar' | 'mastered'
  markKPMastered: (kpId: string) => void

  // SM-2间隔重复
  reviewKP: (kpId: string, rating: SRSRating) => void
  getTodayReviewKPIds: () => string[]
  getSRSItem: (kpId: string) => SRSItem | undefined
  initSRSForKP: (kpId: string) => void

  // 辅助
  getMasteryColor: (mastery: number) => string
  getAccuracyRate: () => number

  // 重置
  resetAll: () => void
}

const LearningStatsContext = createContext<LearningStatsContextType | null>(null)

export function LearningStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<LearningStats>(defaultStats)
  const [srsItems, setSrsItems] = useState<SRSItem[]>([])
  const [kpMastery, setKpMasteryState] = useState<Record<string, number>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // 初始化加载
  useEffect(() => {
    setStats(loadFromStorage(STORAGE_KEY_STATS, defaultStats))
    setSrsItems(loadFromStorage<SRSItem[]>(STORAGE_KEY_SRS, []))
    setKpMasteryState(loadFromStorage<Record<string, number>>(STORAGE_KEY_KP_MASTERY, {}))
    setIsLoaded(true)
  }, [])

  // 自动保存
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_STATS, stats) }, [stats, isLoaded])
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_SRS, srsItems) }, [srsItems, isLoaded])
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_KP_MASTERY, kpMastery) }, [kpMastery, isLoaded])

  // 更新连续学习天数
  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    setStats(prev => {
      if (prev.lastStudyDate === today) {
        return prev // 今天已经记录过了
      }

      let currentStreak = prev.currentStreak
      let longestStreak = prev.longestStreak
      let totalStudyDays = prev.totalStudyDays

      if (prev.lastStudyDate) {
        const lastDate = new Date(prev.lastStudyDate)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // 连续学习
          currentStreak += 1
        } else if (diffDays > 1) {
          // 断了，重置
          currentStreak = 1
        }
      } else {
        // 第一次学习
        currentStreak = 1
      }

      totalStudyDays += 1
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }

      return {
        ...prev,
        currentStreak,
        longestStreak,
        totalStudyDays,
        lastStudyDate: today
      }
    })
  }, [])

  // 记录学习时长
  const recordStudySession = useCallback((minutes: number) => {
    updateStreak()
    setStats(prev => ({
      ...prev,
      totalMinutes: prev.totalMinutes + minutes
    }))
  }, [updateStreak])

  // 记录练习题结果
  const recordExercise = useCallback((isCorrect: boolean, knowledgePointId?: string) => {
    updateStreak()
    setStats(prev => ({
      ...prev,
      totalExercises: prev.totalExercises + 1,
      correctExercises: isCorrect ? prev.correctExercises + 1 : prev.correctExercises
    }))

    // 如果答对了，提升知识点掌握度
    if (isCorrect && knowledgePointId) {
      setKpMasteryState(prev => {
        const current = prev[knowledgePointId] || 0
        const newValue = Math.min(100, current + 10)
        return { ...prev, [knowledgePointId]: newValue }
      })
    }
  }, [updateStreak])

  // 更新知识点掌握度（增量）
  const updateKPMastery = useCallback((kpId: string, delta: number) => {
    setKpMasteryState(prev => {
      const current = prev[kpId] || 0
      const newValue = Math.max(0, Math.min(100, current + delta))
      const newMastery = { ...prev, [kpId]: newValue }
      
      // 更新掌握的知识点数量
      const masteredCount = Object.values(newMastery).filter(v => v >= 80).length
      setStats(s => ({ ...s, masteredKnowledgePoints: masteredCount }))
      
      return newMastery
    })
  }, [])

  // 设置知识点掌握度（绝对值）
  const setKPMastery = useCallback((kpId: string, mastery: number) => {
    setKpMasteryState(prev => {
      const newValue = Math.max(0, Math.min(100, mastery))
      const newMastery = { ...prev, [kpId]: newValue }
      
      const masteredCount = Object.values(newMastery).filter(v => v >= 80).length
      setStats(s => ({ ...s, masteredKnowledgePoints: masteredCount }))
      
      return newMastery
    })
  }, [])

  // 获取知识点掌握度
  const getKPMastery = useCallback((kpId: string): number => {
    return kpMastery[kpId] || 0
  }, [kpMastery])

  // 获取掌握度等级
  const getKPMasteryLevel = useCallback((kpId: string): 'not_started' | 'learning' | 'familiar' | 'mastered' => {
    const mastery = kpMastery[kpId] || 0
    if (mastery >= 80) return 'mastered'
    if (mastery >= 50) return 'familiar'
    if (mastery > 0) return 'learning'
    return 'not_started'
  }, [kpMastery])

  // 标记知识点已掌握
  const markKPMastered = useCallback((kpId: string) => {
    setKPMastery(kpId, 100)
    // 移除SRS复习项
    setSrsItems(prev => prev.filter(item => item.knowledgePointId !== kpId))
  }, [setKPMastery])

  // 初始化SRS复习项
  const initSRSForKP = useCallback((kpId: string) => {
    setSrsItems(prev => {
      if (prev.some(item => item.knowledgePointId === kpId)) {
        return prev // 已存在
      }
      const today = new Date().toISOString().split('T')[0]
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 1)
      
      return [...prev, {
        id: 'SRS-' + kpId,
        knowledgePointId: kpId,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        nextReviewDate: nextDate.toISOString().split('T')[0]
      }]
    })
  }, [])

  // 复习知识点（SM-2算法）
  const reviewKP = useCallback((kpId: string, rating: SRSRating) => {
    setSrsItems(prev => {
      const itemIndex = prev.findIndex(item => item.knowledgePointId === kpId)
      if (itemIndex === -1) {
        // 不存在则创建
        const today = new Date().toISOString().split('T')[0]
        const newItem: SRSItem = {
          id: 'SRS-' + kpId,
          knowledgePointId: kpId,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReviewDate: today
        }
        const updated = calculateSM2(newItem, rating)
        
        // 更新掌握度
        const masteryDelta = rating >= 3 ? 15 : -5
        setKpMasteryState(p => {
          const current = p[kpId] || 0
          const newValue = Math.max(0, Math.min(100, current + masteryDelta))
          return { ...p, [kpId]: newValue }
        })
        
        return [...prev, updated]
      }

      // 更新已存在的
      const newItems = [...prev]
      newItems[itemIndex] = calculateSM2(prev[itemIndex], rating)
      
      // 更新掌握度
      const masteryDelta = rating >= 3 ? Math.round(rating * 3) : -10
      setKpMasteryState(p => {
        const current = p[kpId] || 0
        const newValue = Math.max(0, Math.min(100, current + masteryDelta))
        return { ...p, [kpId]: newValue }
      })
      
      return newItems
    })
  }, [])

  // 获取今日待复习知识点ID列表
  const getTodayReviewKPIds = useCallback((): string[] => {
    const today = new Date().toISOString().split('T')[0]
    return srsItems
      .filter(item => item.nextReviewDate <= today)
      .map(item => item.knowledgePointId)
  }, [srsItems])

  // 获取SRS项
  const getSRSItem = useCallback((kpId: string): SRSItem | undefined => {
    return srsItems.find(item => item.knowledgePointId === kpId)
  }, [srsItems])

  // 掌握度颜色
  const getMasteryColor = useCallback((mastery: number): string => {
    if (mastery >= 80) return '#10b981' // green
    if (mastery >= 50) return '#3b82f6' // blue
    if (mastery >= 20) return '#f59e0b' // amber
    return '#9ca3af' // gray
  }, [])

  // 正确率
  const getAccuracyRate = useCallback((): number => {
    if (stats.totalExercises === 0) return 0
    return Math.round((stats.correctExercises / stats.totalExercises) * 100)
  }, [stats])

  // 重置所有统计数据
  const resetAll = useCallback(() => {
    setStats(defaultStats)
    setSrsItems([])
    setKpMasteryState({})
    localStorage.removeItem(STORAGE_KEY_STATS)
    localStorage.removeItem(STORAGE_KEY_SRS)
    localStorage.removeItem(STORAGE_KEY_KP_MASTERY)
  }, [])

  const value: LearningStatsContextType = {
    stats,
    srsItems,
    kpMastery,
    isLoaded,
    recordStudySession,
    recordExercise,
    updateKPMastery,
    setKPMastery,
    getKPMastery,
    getKPMasteryLevel,
    markKPMastered,
    reviewKP,
    getTodayReviewKPIds,
    getSRSItem,
    initSRSForKP,
    getMasteryColor,
    getAccuracyRate,
    resetAll
  }

  return (
    <LearningStatsContext.Provider value={value}>
      {children}
    </LearningStatsContext.Provider>
  )
}

export function useLearningStats() {
  const context = useContext(LearningStatsContext)
  if (!context) {
    throw new Error('useLearningStats must be used within LearningStatsProvider')
  }
  return context
}
