import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, User, Bot, MessageSquare, Sparkles, Camera, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { fileToBase64 } from '../services/aiService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  thinking?: boolean
}

const QA = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是智能答疑助手。你可以直接输入问题，或者拍照上传题目。如果需要更深入的引导式辅导，建议使用AI智师。',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const newImages: string[] = []
      for (let i = 0; i < files.length; i++) {
        try {
          const base64 = await fileToBase64(files[i], 1024, 0.8)
          newImages.push(base64)
        } catch (err) {
          alert(err instanceof Error ? err.message : '图片处理失败')
        }
      }
      if (newImages.length > 0) {
        setPendingImages(prev => [...prev, ...newImages])
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    const hasImages = pendingImages.length > 0
    if ((!input.trim() && !hasImages) || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (hasImages ? '[图片] 帮我看看这道题' : ''),
      images: hasImages ? [...pendingImages] : undefined,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPendingImages([])
    setIsTyping(true)

    setTimeout(() => {
      let response = ''
      const q = input.toLowerCase()

      if (hasImages) {
        response = '收到你上传的题目图片了！我来帮你分析一下：\n\n这道题看起来是一道典型的计算题。解题的关键步骤是：\n\n1. 先仔细审题，明确已知条件和求解目标\n2. 回忆相关的公式和定理\n3. 建立正确的方程或关系式\n4. 逐步推导求解\n\n如果你能告诉我这是什么学科、具体的题目文字内容，我可以给出更精准的解答。\n\n💡 想要更深入的引导式学习？试试AI智师，我会一步步引导你思考！'
      } else if (q.includes('方程') || q.includes('解')) {
        response = '这是一个关于方程的问题。建议你：\n\n1. 首先确定方程的类型（一元一次、一元二次等）\n2. 回忆对应的解题步骤\n3. 注意移项时符号变化\n\n如果需要更详细的引导式讲解，可以点击下方的"AI智师"，我会一步步引导你思考。'
      } else if (q.includes('函数') || q.includes('图像')) {
        response = '函数问题的关键是理解定义域、值域和对应关系。你可以先告诉我：\n\n1. 这是什么类型的函数？\n2. 题目具体问什么？\n\n或者直接进入AI智师获得一对一辅导。'
      } else if (q.includes('物理') || q.includes('力') || q.includes('牛顿')) {
        response = '物理问题要先分析受力情况，再选择合适的公式。建议你：\n\n1. 画受力分析图\n2. 确定研究对象\n3. 列方程求解\n\n需要我一步步引导你的话，去AI智师效果更好哦！'
      } else {
        response = '收到你的问题了！简单问题我可以直接回答，但如果是需要深入理解的知识点，建议你使用AI智师，那里有苏格拉底式引导教学，能帮你真正掌握知识。'
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      }])
      setIsTyping(false)
    }, 1500)
  }

  const quickQuestions = [
    '如何解一元一次方程？',
    '二次函数顶点公式是什么？',
    '牛顿第二定律怎么用？',
    '英语时态怎么区分？',
  ]

  return (
    <div className="content-page">
      <div className="content-page-inner">
        <div className="content-panel flex flex-col h-[calc(100vh-140px)] overflow-hidden animate-fade-up">
          {/* 顶部导航 */}
          <div className="px-6 py-4 border-b border-[#332a23]/10 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-[#332a23] flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#993222]" />
                智能答疑
              </h1>
              <p className="text-sm text-[#332a23]/50 mt-0.5">快速解答你的问题</p>
            </div>
            <button
              onClick={() => navigate('/tutor')}
              className="px-4 py-2 bg-[#993222]/10 text-[#993222] rounded-lg hover:bg-[#993222]/20 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI智师
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-[#993222]' : 'bg-gradient-to-br from-[#993222] to-[#7a2818]'
                  }`}>
                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block text-left px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-[#993222] text-white rounded-tr-sm'
                        : 'bg-white border border-[#332a23]/10 text-[#332a23] rounded-tl-sm'
                    }`}>
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.images.map((img, i) => (
                            <img key={i} src={img} alt={`上传图片${i+1}`} className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/20" />
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#993222] to-[#7a2818] flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-[#332a23]/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#332a23]/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#332a23]/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#332a23]/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 快捷问题 */}
          {messages.length <= 1 && (
            <div className="max-w-3xl mx-auto px-6 pb-3 w-full">
              <p className="text-xs text-[#332a23]/40 mb-2 font-medium">常见问题</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); setTimeout(handleSend, 100) }}
                    className="px-4 py-2 bg-white/70 border border-[#332a23]/10 rounded-full text-sm text-[#7a6b5e] hover:border-[#993222]/50 hover:text-[#993222] hover:bg-[#993222]/5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 border-t border-[#332a23]/10 flex-shrink-0 bg-white/30">
            <div className="max-w-3xl mx-auto">
              {/* 待上传图片预览 */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`待发送${i+1}`} className="w-14 h-14 object-cover rounded-lg border border-[#332a23]/10" />
                      <button
                        onClick={() => removePendingImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-3 text-[#332a23]/40 hover:text-[#993222] hover:bg-[#993222]/10 rounded-xl transition-colors disabled:opacity-50"
                    title="上传图片"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#993222]" /> : <ImageIcon className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={pendingImages.length > 0 ? "添加说明（可选）..." : "输入你的问题..."}
                    className="w-full px-5 py-3 bg-white border border-[#332a23]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#993222]/20 focus:border-[#993222] transition-all text-[#332a23]"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingImages.length === 0) || isTyping}
                  className="p-3.5 bg-[#993222] text-white rounded-xl hover:bg-[#7a2818] disabled:bg-[#332a23]/20 disabled:cursor-not-allowed transition-colors shadow-md shadow-[#993222]/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-xs text-[#332a23]/40 mt-3">
                💡 需要深入理解？试试 <button onClick={() => navigate('/tutor')} className="text-[#993222] hover:underline font-medium">AI智师引导式学习</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QA
