import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Exercise, ExerciseDifficulty, ExerciseRecord, ExerciseSession, ExerciseType, ExercisesContextType } from '../types/learning'
import { generateExercises as aiGenerateExercisesApi } from '../services/aiService'
import { useSettings } from './SettingsContext'
import { useWrongAnswers } from './WrongAnswersContext'
import { useLearningStats } from './LearningStatsContext'

const STORAGE_KEY_EXERCISES = 'ai-tutor-exercises'
const STORAGE_KEY_RECORDS = 'ai-tutor-exercise-records'
const STORAGE_KEY_SESSIONS = 'ai-tutor-exercise-sessions'

function generateId(prefix: string = 'EX'): string {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
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

// 简单判断答案是否正确（支持选择题、填空题等）
function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return normalize(userAnswer) === normalize(correctAnswer)
}

const ExercisesContext = createContext<ExercisesContextType | null>(null)

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [records, setRecords] = useState<ExerciseRecord[]>([])
  const [sessions, setSessions] = useState<ExerciseSession[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { ai: aiSettings } = useSettings()
  const { addWrongAnswer } = useWrongAnswers()
  const { recordExercise } = useLearningStats()

  // 初始化加载
  useEffect(() => {
    setExercises(loadFromStorage(STORAGE_KEY_EXERCISES, []))
    setRecords(loadFromStorage(STORAGE_KEY_RECORDS, []))
    setSessions(loadFromStorage(STORAGE_KEY_SESSIONS, []))
    setIsLoaded(true)
  }, [])

  // 自动保存
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_EXERCISES, exercises) }, [exercises, isLoaded])
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_RECORDS, records) }, [records, isLoaded])
  useEffect(() => { if (isLoaded) saveToStorage(STORAGE_KEY_SESSIONS, sessions) }, [sessions, isLoaded])

  // AI生成练习题
  const generateExercises = useCallback(async (params: {
    knowledgePoint: string
    count: number
    difficulty: ExerciseDifficulty
    type?: ExerciseType | 'mixed'
    subject?: string
  }): Promise<Exercise[]> => {
    setIsGenerating(true)
    try {
      const result = await aiGenerateExercisesApi({
        knowledge_point: params.knowledgePoint,
        count: params.count,
        difficulty: params.difficulty,
        exercise_type: params.type || 'mixed',
        model: aiSettings.selectedModel || undefined
      })

      const newExercises: Exercise[] = (result.exercises || []).map((ex: any) => ({
        id: ex.id || generateId(),
        type: ex.type || 'short-answer',
        difficulty: ex.difficulty || params.difficulty,
        question: ex.question,
        options: ex.options,
        answer: ex.answer,
        explanation: ex.explanation || '',
        knowledgePoint: ex.knowledgePoint || params.knowledgePoint,
        subject: params.subject,
        createdAt: new Date().toISOString(),
        source: 'ai-generated',
        tags: [params.knowledgePoint]
      }))

      setExercises(prev => [...newExercises, ...prev])
      return newExercises
    } catch (e) {
      console.error('生成练习题失败:', e)
      throw e
    } finally {
      setIsGenerating(false)
    }
  }, [aiSettings.selectedModel])

  // 根据错题生成复习练习
  const generateWrongReviewExercises = useCallback(async (count: number = 5): Promise<Exercise[]> => {
    // 从错题本获取薄弱知识点
    const weakPointsStr = localStorage.getItem('ai-tutor-wrong-answers')
    let knowledgePoint = '综合复习'
    let subject = '通用'
    
    try {
      if (weakPointsStr) {
        const wrongAnswers = JSON.parse(weakPointsStr)
        const activeWrong = wrongAnswers.filter((w: any) => w.status !== 'mastered')
        if (activeWrong.length > 0) {
          // 找出错最多的知识点
          const kpCount: Record<string, { count: number; subject: string }> = {}
          activeWrong.forEach((w: any) => {
            const kp = w.knowledgePoint || '未分类'
            if (!kpCount[kp]) kpCount[kp] = { count: 0, subject: w.subject || '通用' }
            kpCount[kp].count++
          })
          const sortedKps = Object.entries(kpCount).sort((a, b) => b[1].count - a[1].count)
          if (sortedKps.length > 0) {
            knowledgePoint = sortedKps[0][0]
            subject = sortedKps[0][1].subject
          }
        }
      }
    } catch (e) {
      console.error('解析错题失败:', e)
    }

    return generateExercises({
      knowledgePoint: knowledgePoint + ' 错题强化练习',
      count,
      difficulty: 3,
      type: 'mixed',
      subject
    })
  }, [generateExercises])

  // 生成综合练习
  const generateMixedExercises = useCallback(async (count: number = 10): Promise<Exercise[]> => {
    return generateExercises({
      knowledgePoint: '当前学习进度综合练习',
      count,
      difficulty: 3,
      type: 'mixed'
    })
  }, [generateExercises])

  // 开始练习会话
  const startSession = useCallback((exerciseList: Exercise[], title: string, type: ExerciseSession['type']): ExerciseSession => {
    const session: ExerciseSession = {
      id: generateId('SES'),
      title,
      type,
      exercises: exerciseList,
      records: [],
      startedAt: new Date().toISOString()
    }
    setSessions(prev => [session, ...prev])
    return session
  }, [])

  // 提交答案（自动批改）
  const submitAnswer = useCallback(async (sessionId: string, exerciseId: string, userAnswer: string, timeSpent: number): Promise<ExerciseRecord> => {
    setIsGrading(true)
    try {
      const exercise = exercises.find(e => e.id === exerciseId)
      if (!exercise) throw new Error('题目不存在')

      const isCorrect = checkAnswer(userAnswer, exercise.answer)

      const record: ExerciseRecord = {
        id: generateId('REC'),
        exerciseId,
        userAnswer,
        isCorrect,
        timeSpent,
        completedAt: new Date().toISOString(),
        aiFeedback: isCorrect ? '回答正确！' : `答案不对哦。正确答案是：${exercise.answer}\n\n解析：${exercise.explanation}`
      }

      setRecords(prev => [record, ...prev])
      
      // 更新会话记录
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, records: [...s.records, record] }
          : s
      ))

      // 如果答错了，自动加入错题本
      if (!isCorrect) {
        addWrongAnswer({
          title: exercise.question.substring(0, 30),
          subject: exercise.subject || '通用',
          question: exercise.question,
          userAnswer: userAnswer,
          correctAnswer: exercise.answer,
          knowledgePoint: exercise.knowledgePoint,
          source: 'exercise'
        })
      }

      // 记录练习结果到学习统计，更新知识点掌握度
      recordExercise(isCorrect, exercise.knowledgePoint)

      return record
    } catch (e) {
      console.error('提交答案失败:', e)
      throw e
    } finally {
      setIsGrading(false)
    }
  }, [exercises, addWrongAnswer, recordExercise])

  // 完成会话
  const completeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      
      const correctCount = s.records.filter(r => r.isCorrect).length
      const totalCount = s.exercises.length
      const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      
      return {
        ...s,
        completedAt: new Date().toISOString(),
        score: correctCount * (100 / totalCount),
        accuracy
      }
    }))
  }, [])

  // 根据ID获取题目
  const getExerciseById = useCallback((id: string) => {
    return exercises.find(e => e.id === id)
  }, [exercises])

  // 根据知识点获取题目
  const getExercisesByKnowledgePoint = useCallback((kp: string) => {
    return exercises.filter(e => e.knowledgePoint.includes(kp))
  }, [exercises])

  // 获取最近练习记录
  const getRecentRecords = useCallback((limit: number = 20) => {
    return records.slice(0, limit)
  }, [records])

  // 获取统计数据
  const getStatistics = useCallback(() => {
    const total = exercises.length
    const completedExerciseIds = new Set(records.map(r => r.exerciseId))
    const completed = completedExerciseIds.size
    
    const correctRecords = records.filter(r => r.isCorrect)
    const accuracy = records.length > 0 ? Math.round((correctRecords.length / records.length) * 100) : 0
    
    const byDifficulty: Record<number, { total: number; correct: number }> = {}
    for (let i = 1; i <= 5; i++) {
      byDifficulty[i] = { total: 0, correct: 0 }
    }
    
    exercises.forEach(ex => {
      const exRecords = records.filter(r => r.exerciseId === ex.id)
      if (exRecords.length > 0) {
        byDifficulty[ex.difficulty].total++
        if (exRecords.some(r => r.isCorrect)) {
          byDifficulty[ex.difficulty].correct++
        }
      }
    })

    return { total, completed, accuracy, byDifficulty }
  }, [exercises, records])

  // 重置所有练习数据
  const resetAll = useCallback(() => {
    setExercises([])
    setRecords([])
    setSessions([])
    localStorage.removeItem(STORAGE_KEY_EXERCISES)
    localStorage.removeItem(STORAGE_KEY_RECORDS)
    localStorage.removeItem(STORAGE_KEY_SESSIONS)
  }, [])

  const value: ExercisesContextType = {
    exercises,
    records,
    sessions,
    isGenerating,
    isGrading,
    isLoaded,
    generateExercises,
    generateWrongReviewExercises,
    generateMixedExercises,
    startSession,
    submitAnswer,
    completeSession,
    getExerciseById,
    getExercisesByKnowledgePoint,
    getRecentRecords,
    getStatistics,
    resetAll
  }

  return (
    <ExercisesContext.Provider value={value}>
      {children}
    </ExercisesContext.Provider>
  )
}

export function useExercises() {
  const context = useContext(ExercisesContext)
  if (!context) {
    throw new Error('useExercises must be used within ExercisesProvider')
  }
  return context
}
