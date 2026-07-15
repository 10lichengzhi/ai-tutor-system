import { Bot, User } from 'lucide-react'

interface ChatBubbleProps {
  content: string
  role: 'user' | 'assistant'
  timestamp?: string
  isLoading?: boolean
}

const ChatBubble = ({ content, role, timestamp, isLoading }: ChatBubbleProps) => {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div
        className={`
          w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-primary-600' : 'bg-secondary-600'}
        `}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser
              ? 'bg-primary-600 text-white rounded-tr-md'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '300ms' }}></span>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-400 mt-1 px-1">{timestamp}</span>
        )}
      </div>
    </div>
  )
}

export default ChatBubble
