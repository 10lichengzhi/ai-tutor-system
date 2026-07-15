import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

const Modal = ({ open, onClose, title, children, footer, width = 'max-w-md' }: ModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`
          relative glass-panel rounded-2xl shadow-2xl w-full ${width}
          animate-fade-in max-h-[90vh] flex flex-col
        `}
      >
        {/* 头部 */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-theme/30">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 内容 */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {/* 底部 */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-theme/30">
            {footer}
          </div>
        )}

        {!footer && title && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-theme/30">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={onClose}>确定</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
