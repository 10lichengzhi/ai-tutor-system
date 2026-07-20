import { useState, useEffect } from 'react'
import { X, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  mode: 'login' | 'register'
  onClose: () => void
  onSwitchMode: (mode: 'login' | 'register') => void
}

const AuthModal = ({ isOpen, mode, onClose, onSwitchMode }: AuthModalProps) => {
  const { login, register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setError('')
      setUsername('')
      setPassword('')
      setNickname('')
    }
  }, [isOpen, mode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result =
      mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password, nickname.trim() || undefined)

    setLoading(false)

    if (result.success) {
      onClose()
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#1a1612]/95 border border-amber-500/20 rounded-2xl shadow-2xl p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl mb-3">
            {mode === 'login' ? <LogIn size={26} className="text-amber-400" /> : <UserPlus size={26} className="text-amber-400" />}
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {mode === 'login' ? '登录以同步你的学习进度' : '注册以开始你的个性化学习之旅'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="2-20个字符"
              maxLength={20}
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">昵称（可选）</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="留空则使用用户名"
                maxLength={20}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少6位' : '请输入密码'}
                required
                className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? '请稍候...' : mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>

        {/* 切换模式 */}
        <div className="text-center mt-5 text-sm text-white/40">
          {mode === 'login' ? (
            <>
              还没有账号？
              <button
                onClick={() => onSwitchMode('register')}
                className="ml-1 text-amber-400 hover:text-amber-300 font-medium"
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？
              <button
                onClick={() => onSwitchMode('login')}
                className="ml-1 text-amber-400 hover:text-amber-300 font-medium"
              >
                立即登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
