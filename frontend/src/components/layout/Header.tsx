import { useState } from 'react'
import { User, LogIn, Settings2, LogOut, X } from 'lucide-react'
import { useBackground } from '../../contexts/BackgroundContext'
import { useAuth } from '../../contexts/AuthContext'
import BackgroundSettings from './BackgroundSettings'
import AuthModal from '../auth/AuthModal'

const Header = () => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { settingsOpen, setSettingsOpen } = useBackground()
  const { user, logout } = useAuth()

  const showToastMsg = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const toggleBackgroundSettings = () => {
    setSettingsOpen(!settingsOpen)
  }

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleLogout = () => {
    logout()
    showToastMsg('已退出登录')
  }

  return (
    <>
      <header className="top-header">
        {/* 左侧标题区域 */}
        <div className="header-title">
          <span className="header-title-main">AI INTELLIGENT TUTOR</span>
        </div>

        {/* 右侧操作区 */}
        <div className="header-actions">
          {/* 背景设置按钮 - 弹出 Dropdown */}
          <div className="relative">
            <button
              className={`header-icon-btn ${settingsOpen ? 'header-icon-btn-active' : ''}`}
              title="背景设置"
              onClick={toggleBackgroundSettings}
            >
              <Settings2 size={18} />
            </button>
            <BackgroundSettings />
          </div>

          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-amber-300">{user.nickname}</span>
              </div>
              <button
                className="header-btn"
                onClick={handleLogout}
                title="退出登录"
              >
                <LogOut size={16} className="inline mr-1.5" />
                退出
              </button>
            </>
          ) : (
            <>
              <button
                className="header-btn"
                onClick={() => openAuth('login')}
              >
                <LogIn size={16} className="inline mr-1.5" />
                登录
              </button>
              <button
                className="header-btn-primary"
                onClick={() => openAuth('register')}
              >
                <User size={16} className="inline mr-1.5" />
                注册
              </button>
            </>
          )}
        </div>
      </header>

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={setAuthMode}
      />

      {/* Toast提示 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#332a23] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-up">
          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm">!</span>
          </div>
          <span className="text-sm">{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 p-1 hover:bg-white/10 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  )
}

export default Header
