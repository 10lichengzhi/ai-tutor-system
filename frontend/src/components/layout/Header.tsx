import { useState } from 'react'
import { User, LogIn, Settings2, X } from 'lucide-react'
import { useBackground } from '../../contexts/BackgroundContext'
import BackgroundSettings from './BackgroundSettings'

const Header = () => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { settingsOpen, setSettingsOpen } = useBackground()

  const showNotAvailable = (feature: string) => {
    setToastMessage(`${feature}功能暂未开放，敬请期待！`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const toggleBackgroundSettings = () => {
    setSettingsOpen(!settingsOpen)
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
          <button
            className="header-btn"
            onClick={() => showNotAvailable('登录')}
          >
            <LogIn size={16} className="inline mr-1.5" />
            登录
          </button>
          <button
            className="header-btn-primary"
            onClick={() => showNotAvailable('注册')}
          >
            <User size={16} className="inline mr-1.5" />
            注册
          </button>
        </div>
      </header>

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
