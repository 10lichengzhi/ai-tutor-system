import { useRef, useState, useEffect, ChangeEvent } from 'react'
import { Upload, RotateCcw, Image as ImageIcon, Check } from 'lucide-react'
import {
  useBackground,
  PRESET_BACKGROUNDS,
  PresetBackgroundKey,
} from '../../contexts/BackgroundContext'

/** 将本地文件读取为 base64 data URL */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** 范围滑块组件 */
function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#5c4a3e]">{label}</span>
        <span className="text-xs text-[#993222] font-medium bg-[rgba(153,50,34,0.08)] px-2 py-0.5 rounded-full">
          {value}
          {unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-range w-full"
      />
    </div>
  )
}

const BackgroundSettings = () => {
  const {
    type,
    preset,
    customImage,
    blur,
    overlayOpacity,
    selectPreset,
    setCustomImage,
    setBlur,
    setOverlayOpacity,
    resetToDefault,
    settingsOpen,
    setSettingsOpen,
  } = useBackground()

  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!settingsOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    // 延迟绑定，避免与打开按钮的 click 冲突
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [settingsOpen, setSettingsOpen])

  // ESC 关闭
  useEffect(() => {
    if (!settingsOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [settingsOpen, setSettingsOpen])

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件')
      return
    }

    // 限制图片大小为 5MB，避免 localStorage 超限
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB')
      return
    }

    try {
      const dataUrl = await readFileAsDataURL(file)
      setCustomImage(dataUrl)
    } catch {
      setUploadError('图片读取失败，请重试')
    }

    // 重置 input value，允许重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSelectPreset = (key: PresetBackgroundKey) => {
    selectPreset(key)
  }

  const handleReset = () => {
    resetToDefault()
  }

  if (!settingsOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+10px)] w-[340px] z-50 bg-settings-panel rounded-2xl shadow-settings-panel border border-[rgba(153,50,34,0.12)] overflow-hidden animate-scale-in"
    >
      {/* 头部 */}
      <div className="px-5 py-4 border-b border-[rgba(153,50,34,0.08)] flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[#332a23]">背景设置</h3>
          <p className="text-xs text-[#8a7566] mt-0.5">自定义你的专属护眼背景</p>
        </div>
        <button
          onClick={handleReset}
          title="重置为默认"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#8a7566] hover:bg-[rgba(153,50,34,0.08)] hover:text-[#993222] transition-colors"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* 内容区 */}
      <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
        {/* 预设背景 */}
        <div className="mb-5">
          <div className="text-xs font-medium text-[#8a7566] mb-2.5 tracking-wide uppercase">
            预设背景
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_BACKGROUNDS.map((p) => {
              const active = type === 'default' && preset === p.key
              return (
                <button
                  key={p.key}
                  onClick={() => handleSelectPreset(p.key)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    active
                      ? 'border-[#993222] shadow-[0_4px_12px_rgba(153,50,34,0.25)] scale-[1.02]'
                      : 'border-transparent hover:border-[rgba(153,50,34,0.3)] hover:scale-[1.02]'
                  }`}
                  title={p.label}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: p.background }}
                  />
                  {active && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#993222] flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-[rgba(51,42,35,0.55)] to-transparent">
                    <span className="text-[10px] text-white font-medium">{p.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 自定义图片 */}
        <div className="mb-5">
          <div className="text-xs font-medium text-[#8a7566] mb-2.5 tracking-wide uppercase">
            自定义图片
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
              type === 'custom' && customImage
                ? 'border-[#993222]'
                : 'border-[rgba(153,50,34,0.2)] hover:border-[rgba(153,50,34,0.4)] hover:bg-[rgba(153,50,34,0.03)]'
            }`}
            style={{ aspectRatio: '16/7' }}
          >
            {type === 'custom' && customImage ? (
              <>
                <img
                  src={customImage}
                  alt="自定义背景预览"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[rgba(51,42,35,0.15)] flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-[#993222] font-medium">
                    <Upload size={12} />
                    <span>更换图片</span>
                  </div>
                </div>
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#993222] flex items-center justify-center shadow-md">
                  <Check size={12} className="text-white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[#8a7566]">
                <ImageIcon size={22} className="opacity-60" />
                <span className="text-xs">点击上传本地图片</span>
                <span className="text-[10px] text-[#a09182]">支持 JPG/PNG，建议小于 5MB</span>
              </div>
            )}
          </button>
          {uploadError && (
            <div className="mt-2 text-xs text-[#c0392b]">{uploadError}</div>
          )}
          {type === 'custom' && customImage && (
            <button
              onClick={() => setCustomImage(null)}
              className="mt-2 text-xs text-[#8a7566] hover:text-[#993222] transition-colors"
            >
              移除自定义图片
            </button>
          )}
        </div>

        {/* 调节滑块 */}
        <div className="pt-3 border-t border-[rgba(153,50,34,0.08)]">
          <div className="text-xs font-medium text-[#8a7566] mb-3 tracking-wide uppercase">
            视觉调节
          </div>
          <RangeSlider
            label="模糊度"
            value={blur}
            min={0}
            max={10}
            step={1}
            unit="px"
            onChange={setBlur}
          />
          <RangeSlider
            label="遮罩透明度"
            value={overlayOpacity}
            min={0}
            max={0.5}
            step={0.05}
            onChange={setOverlayOpacity}
          />
        </div>
      </div>
    </div>
  )
}

export default BackgroundSettings
