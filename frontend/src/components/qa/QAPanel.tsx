import { useRef, useEffect } from 'react'
import { Sparkles, History, Plus } from 'lucide-react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import Button from '../common/Button'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp?: string
}

interface QAPanelProps {
  messages: ChatMessage[]
  onSend: (message: string) => void
  loading?: boolean
  title?: string
}

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: '你好！我是你的AI学习助手，有什么学习问题可以随时问我。我可以帮你解答知识点疑问、分析错题、提供学习建议。',
    timestamp: '10:30',
  },
]

const QAPanel = ({
  messages = sampleMessages,
  onSend,
  loading = false,
  title = '智能答疑',
}: QAPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-card overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">AI学习助手随时为你解答</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<History className="w-4 h-4" />}>
            历史
          </Button>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
            新对话
          </Button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            content={msg.content}
            role={msg.role}
            timestamp={msg.timestamp}
          />
        ))}
        {loading && (
          <ChatBubble content="" role="assistant" isLoading />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题 */}
      <div className="px-5 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['帮我解释这个概念', '这道题怎么做', '推荐学习资源', '总结今天学的内容'].map(
            (q) => (
              <button
                key={q}
                onClick={() => onSend(q)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors whitespace-nowrap"
              >
                {q}
              </button>
            )
          )}
        </div>
      </div>

      {/* 输入框 */}
      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  )
}

export default QAPanel
