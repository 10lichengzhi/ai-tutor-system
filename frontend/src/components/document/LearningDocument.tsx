import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Send, Bot, User, CheckCircle, BookOpen, Target, Calendar,
  Sparkles, Zap, ChevronRight, Lightbulb, AlertTriangle, Code,
  FileText, ArrowRight, RefreshCw, Bookmark
} from 'lucide-react'

export type LearningMode = 'knowledge' | 'daily'

interface DocumentSection {
  title: string
  icon: any
  content: string | string[]
  type?: 'text' | 'list' | 'code' | 'warning' | 'tip'
}

interface LearningDocumentData {
  title: string
  subject: string
  duration: number // 分钟
  mode: LearningMode
  sections: DocumentSection[]
  nextNodeId?: number
  prevNodeId?: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  nodeData: {
    id: number | string
    title: string
    subject: string
    type: string
    mode?: LearningMode
    duration?: number
    desc?: string
  } | null
  onMarkMastered?: (id: number | string) => void
  onNextNode?: () => void
  onPrevNode?: () => void
}

// 模拟生成文档内容（根据知识点）
const generateDocument = (data: Props['nodeData'], mode: LearningMode): LearningDocumentData => {
  if (!data) {
    return {
      title: '',
      subject: '',
      duration: 0,
      mode: 'knowledge',
      sections: []
    }
  }

  if (mode === 'knowledge') {
    // 知识点模式（义务教育）
    return {
      title: data.title,
      subject: data.subject,
      duration: data.duration || 20,
      mode: 'knowledge',
      sections: [
        {
          title: '本节学习目标',
          icon: Target,
          type: 'list',
          content: [
            `理解${data.title}的基本概念`,
            '掌握核心公式和解题方法',
            '能够独立完成基础练习题',
            '识别常见易错点'
          ]
        },
        {
          title: '核心概念讲解',
          icon: BookOpen,
          type: 'text',
          content: `${data.title}是${data.subject}中的重要知识点。${data.desc || ''}\n\n简单来说，我们需要理解它的定义、性质和应用场景。在考试中，这部分内容通常会以选择题、填空题和解答题的形式出现，占分约5-10分。\n\n学习建议：先理解概念，再通过例题熟悉解题步骤，最后通过练习巩固。`
        },
        {
          title: '💡 知识要点',
          icon: Lightbulb,
          type: 'list',
          content: [
            '定义：明确概念的内涵和外延',
            '性质：记住关键性质和推论',
            '公式：熟练记忆并理解推导过程',
            '应用：知道什么场景下使用'
          ]
        },
        {
          title: '⚠️ 易错点提醒',
          icon: AlertTriangle,
          type: 'warning',
          content: [
            '注意符号变化：移项时符号容易出错',
            '前提条件：公式使用前先看是否满足条件',
            '单位统一：物理/计算类题目注意单位',
            '多解情况：有些题目可能有多个答案'
          ]
        },
        {
          title: '📝 典型例题',
          icon: FileText,
          type: 'text',
          content: '【例1】基础概念题\n\n题目：下列关于' + data.title + '的说法正确的是（  ）\nA. ...  B. ...  C. ...  D. ...\n\n解析：做这类题目时，先回忆概念的定义，逐个选项排除。正确答案是B。\n\n【例2】计算应用题\n\n解题步骤：\n1. 审题，明确已知条件\n2. 选择合适的公式\n3. 代入计算\n4. 检查结果合理性'
        },
        {
          title: '🎯 本节小结',
          icon: CheckCircle,
          type: 'list',
          content: [
            '概念理解了吗？能复述出来吗？',
            '公式记住了吗？会推导吗？',
            '例题看懂了吗？能独立做吗？',
            '完成3-5道课后练习题巩固'
          ]
        }
      ]
    }
  } else {
    // 每日计划模式（成人自学/嵌入式）
    return {
      title: `今日学习：${data.title}`,
      subject: data.subject,
      duration: data.duration || 45,
      mode: 'daily',
      sections: [
        {
          title: '🎯 今日目标',
          icon: Target,
          type: 'list',
          content: [
            `完成${data.title}的学习`,
            '理解核心原理和使用场景',
            '动手实践：写代码/搭电路/做实验',
            '输出笔记：用自己的话总结'
          ]
        },
        {
          title: '⏱ 时间分配建议',
          icon: Calendar,
          type: 'list',
          content: [
            '概念学习：15分钟（看文档/视频）',
            '动手实践：20分钟（写代码/实验）',
            '总结笔记：10分钟（整理到自己的知识库）'
          ]
        },
        {
          title: '📚 学习步骤',
          icon: BookOpen,
          type: 'list',
          content: [
            '第一步：先看资料，了解这个东西是什么、解决什么问题',
            '第二步：理解核心原理，不需要死记细节，懂逻辑即可',
            '第三步：跟着教程动手做一遍，跑通Hello World',
            '第四步：尝试修改参数/代码，看看会发生什么',
            '第五步：脱离教程，自己重新实现一遍',
            '第六步：记录踩过的坑和解决方法'
          ]
        },
        {
          title: '✅ 必须记住的要点',
          icon: Bookmark,
          type: 'list',
          content: [
            '核心概念：它是什么？解决什么问题？',
            '关键API/函数：常用的5-10个',
            '常见坑：新手最容易踩的3-5个问题',
            '调试技巧：出问题了怎么排查'
          ]
        },
        data.subject.includes('嵌入式') || data.subject.includes('编程') ? {
          title: '💻 动手练习',
          icon: Code,
          type: 'code',
          content: '// 今天的练习任务：\n// 1. 搭建开发环境（如果是第一次）\n// 2. 实现基础Demo\n// 3. 修改Demo观察变化\n// 4. 自己写一个小功能\n\n// 示例代码框架：\n#include <stdio.h>\n\nint main() {\n    // TODO: 今天的练习代码\n    printf("Hello, today I learned!");\n    return 0;\n}'
        } : {
          title: '✏️ 练习任务',
          icon: Zap,
          type: 'list',
          content: [
            '完成教程中的示例',
            '做2-3道相关练习题',
            '用费曼学习法讲给别人听（或自言自语）',
            '整理1页笔记'
          ]
        },
        {
          title: '📊 验收标准',
          icon: CheckCircle,
          type: 'list',
          content: [
            '能说清楚这个知识点是什么、解决什么问题',
            '能独立动手完成基础Demo/练习',
            '知道遇到问题去哪里查资料',
            '笔记整理完成'
          ]
        }
      ]
    }
  }
}

const LearningDocument = ({ isOpen, onClose, nodeData, onMarkMastered, onNextNode, onPrevNode }: Props) => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LearningMode>('knowledge')
  const [doc, setDoc] = useState<LearningDocumentData | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nodeData && isOpen) {
      // 根据学科自动选择默认模式
      const isSelfLearning = nodeData.subject.includes('嵌入式') || nodeData.subject.includes('编程')
      const defaultMode: LearningMode = isSelfLearning ? 'daily' : 'knowledge'
      setMode(defaultMode)
      setDoc(generateDocument(nodeData, defaultMode))
      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `你好！我是你的AI学习助手。关于「${nodeData.title}」有任何问题都可以问我，比如：\n• 这个概念我没懂，能再讲通俗点吗？\n• 能再举个例子吗？\n• 这道题我不会做`
        }
      ])
    }
  }, [nodeData, isOpen])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAiTyping])

  const switchMode = (newMode: LearningMode) => {
    setMode(newMode)
    if (nodeData) {
      setDoc(generateDocument(nodeData, newMode))
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim() || isAiTyping) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput
    }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsAiTyping(true)

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        `好问题！关于${nodeData?.title}的这个问题，我来给你解释一下：\n\n首先我们要理解核心概念...（这里是AI针对文档内容的详细解答）\n\n还有什么不清楚的吗？`,
        `这个问题问得好！让我用更通俗的方式讲：\n\n你可以把它想象成...（通俗类比）\n\n这样理解是不是清楚多了？`,
        `我来给你举个例子：\n\n假设我们遇到这样一个场景...（具体例子）\n\n对应到这个知识点就是这样应用的。`
      ]
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)]
      }
      setChatMessages(prev => [...prev, aiMsg])
      setIsAiTyping(false)
    }, 1200)
  }

  const handleMarkMastered = () => {
    if (nodeData && onMarkMastered) {
      onMarkMastered(nodeData.id)
    }
    onClose()
  }

  if (!isOpen || !nodeData || !doc) return null

  const renderSectionContent = (section: DocumentSection) => {
    switch (section.type) {
      case 'list':
        return (
          <ul className="space-y-2">
            {(section.content as string[]).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary leading-relaxed">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      case 'warning':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <ul className="space-y-1.5">
              {(section.content as string[]).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-800">
                  <span>⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      case 'code':
        return (
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
            {section.content as string}
          </pre>
        )
      case 'tip':
        return (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-sm text-primary-900">
            💡 {section.content as string}
          </div>
        )
      default:
        return (
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {section.content as string}
          </p>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 遮罩 */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* 侧边抽屉 */}
      <div className="w-full max-w-2xl bg-bg-secondary shadow-2xl flex flex-col h-full animate-slide-in">
        {/* 顶部栏 */}
        <div className="border-b border-border-theme px-6 py-4 flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h2 className="font-bold text-lg text-text-primary">{doc.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">
                  {doc.subject}
                </span>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Target className="w-3 h-3" /> {doc.duration}分钟
                </span>
              </div>
            </div>
          </div>

          {/* 模式切换 */}
          <div className="flex bg-bg-primary rounded-lg p-1">
            <button
              onClick={() => switchMode('knowledge')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'knowledge' ? 'bg-bg-secondary text-primary-700 shadow-sm' : 'text-text-primary hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              知识点模式
            </button>
            <button
              onClick={() => switchMode('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'daily' ? 'bg-bg-secondary text-primary-700 shadow-sm' : 'text-text-primary hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              每日计划
            </button>
          </div>
        </div>

        {/* 内容区 - 文档 + AI对话 */}
        <div className="flex-1 overflow-y-auto bg-bg-primary">
          {/* 学习文档 */}
          <div className="p-6 space-y-5">
            {doc.sections.map((section, i) => {
              const Icon = section.icon
              return (
                <div key={i} className="bg-bg-secondary rounded-xl border border-border-theme p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 font-semibold text-text-primary mb-3">
                    <Icon className="w-5 h-5 text-primary-700" />
                    {section.title}
                  </h3>
                  {renderSectionContent(section)}
                </div>
              )
            })}
          </div>

          {/* AI问答区 */}
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-[#993222] to-[#7a2818] rounded-xl p-4 text-white mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">AI智师答疑</span>
                <span className="text-xs bg-bg-secondary/20 px-2 py-0.5 rounded-full">关于本文档</span>
              </div>
              <p className="text-sm text-primary-100">
                学习过程中有任何疑问，直接在这里问我，我会结合当前知识点为你解答。
              </p>
            </div>

            <div className="bg-bg-secondary rounded-xl border border-border-theme overflow-hidden">
              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-[#993222]' : 'bg-gradient-to-br from-[#993222] to-[#7a2818]'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-white" />
                      }
                    </div>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-700 text-white rounded-tr-sm'
                        : 'bg-bg-primary text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#993222] to-[#7a2818] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-bg-primary px-3 py-2 rounded-xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-border-theme p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="关于这个知识点，有什么不懂的？"
                    className="flex-1 px-3 py-2 bg-bg-primary border border-border-theme rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isAiTyping}
                    className="p-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部功能按钮栏 */}
        <div className="border-t border-border-theme bg-bg-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onPrevNode}
              disabled={!onPrevNode}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border-theme text-text-primary rounded-lg hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              上一个
            </button>

            <button
              onClick={() => navigate('/qa')}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border-theme text-text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium"
            >
              <Zap className="w-4 h-4" />
              快速答疑
            </button>

            <button
              onClick={() => navigate('/tutor')}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border-theme text-text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI深聊
            </button>

            <div className="flex-1" />

            <button
              onClick={handleMarkMastered}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              已掌握
            </button>

            <button
              onClick={() => navigate('/wrong-book')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              去练习
            </button>

            <button
              onClick={onNextNode}
              disabled={!onNextNode}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#993222] to-[#7a2818] text-white rounded-lg hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-md shadow-[#993222]/20"
            >
              下一个
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LearningDocument
