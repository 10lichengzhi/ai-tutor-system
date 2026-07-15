import { useState, KeyboardEvent, FormEvent } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import Button from '../common/Button'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const ChatInput = ({
  onSend,
  disabled = false,
  placeholder = '输入你的问题...',
}: ChatInputProps) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* 附件按钮 */}
        <button
          type="button"
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="上传图片/文件"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white disabled:opacity-50 max-h-32"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* 语音按钮 */}
        <button
          type="button"
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="语音输入"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* 发送按钮 */}
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          icon={<Send className="w-4 h-4" />}
          className="flex-shrink-0 rounded-full w-10 h-10 p-0"
        >
          <span className="sr-only">发送</span>
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
        <span>按 Enter 发送，Shift + Enter 换行</span>
      </div>
    </form>
  )
}

export default ChatInput
