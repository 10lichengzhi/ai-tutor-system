import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/** 背景类型：default 为内置渐变预设，custom 为用户上传的自定义图片 */
export type BackgroundType = 'default' | 'custom'

/** 内置预设渐变背景 key */
export type PresetBackgroundKey =
  | 'eye-care'
  | 'warm-beige'
  | 'fresh-green'
  | 'elegant-blue'
  | 'morning-pink'
  | 'ink-gray'

/** 预设背景配置 */
export interface PresetBackground {
  key: PresetBackgroundKey
  label: string
  /** CSS background 字符串（渐变） */
  background: string
}

/** 内置预设背景列表 */
export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    key: 'eye-care',
    label: '护眼纸色',
    background:
      'radial-gradient(ellipse at 20% 30%, rgba(153, 51, 34, 0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(200, 170, 130, 0.08) 0%, transparent 50%), linear-gradient(180deg, #f8f6f0 0%, #f5f3ee 50%, #f0ede5 100%)',
  },
  {
    key: 'warm-beige',
    label: '温暖米色',
    background:
      'radial-gradient(ellipse at 30% 20%, rgba(212, 168, 83, 0.08) 0%, transparent 55%), linear-gradient(180deg, #faf6ef 0%, #f3ece0 50%, #ebe2d2 100%)',
  },
  {
    key: 'fresh-green',
    label: '清新绿色',
    background:
      'radial-gradient(ellipse at 20% 30%, rgba(34, 139, 34, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(144, 188, 144, 0.1) 0%, transparent 55%), linear-gradient(180deg, #f3f7f0 0%, #ecf2e8 50%, #e4ecdd 100%)',
  },
  {
    key: 'elegant-blue',
    label: '淡雅蓝色',
    background:
      'radial-gradient(ellipse at 20% 30%, rgba(70, 110, 160, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(150, 180, 210, 0.1) 0%, transparent 55%), linear-gradient(180deg, #f2f5f9 0%, #ebf0f6 50%, #e3eaf2 100%)',
  },
  {
    key: 'morning-pink',
    label: '晨曦粉调',
    background:
      'radial-gradient(ellipse at 20% 30%, rgba(200, 120, 130, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(220, 180, 170, 0.1) 0%, transparent 55%), linear-gradient(180deg, #faf3f2 0%, #f5ecea 50%, #efe4e1 100%)',
  },
  {
    key: 'ink-gray',
    label: '水墨灰调',
    background:
      'radial-gradient(ellipse at 30% 20%, rgba(51, 42, 35, 0.04) 0%, transparent 55%), linear-gradient(180deg, #f5f4f2 0%, #eeece8 50%, #e6e3dd 100%)',
  },
]

/** localStorage 存储 key */
const STORAGE_KEY = 'zhixue-background-settings'

/** 背景设置持久化数据结构 */
interface StoredBackgroundSettings {
  type: BackgroundType
  preset: PresetBackgroundKey
  customImage: string | null
  blur: number
  overlayOpacity: number
}

/** 默认设置 */
const DEFAULT_SETTINGS: StoredBackgroundSettings = {
  type: 'default',
  preset: 'eye-care',
  customImage: null,
  blur: 2,
  overlayOpacity: 0.1,
}

/** Context 对外暴露的 API */
interface BackgroundContextType {
  /** 当前背景类型 */
  type: BackgroundType
  /** 当前选中的预设 key */
  preset: PresetBackgroundKey
  /** 自定义图片 base64 URL（type==='custom' 时使用） */
  customImage: string | null
  /** 模糊度 px, 范围 0-10 */
  blur: number
  /** 遮罩透明度, 范围 0-0.5 */
  overlayOpacity: number
  /** 背景设置面板是否打开 */
  settingsOpen: boolean
  /** 切换到某个预设（自动将 type 切为 default） */
  selectPreset: (key: PresetBackgroundKey) => void
  /** 设置自定义图片 base64（自动将 type 切为 custom） */
  setCustomImage: (dataUrl: string | null) => void
  /** 设置模糊度 */
  setBlur: (value: number) => void
  /** 设置遮罩透明度 */
  setOverlayOpacity: (value: number) => void
  /** 重置为默认设置 */
  resetToDefault: () => void
  /** 打开/关闭背景设置面板 */
  setSettingsOpen: (open: boolean) => void
  /** 获取当前预设配置 */
  currentPreset: PresetBackground
}

const BackgroundContext = createContext<BackgroundContextType | null>(null)

/** 从 localStorage 读取设置，容错返回默认值 */
function loadSettings(): StoredBackgroundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<StoredBackgroundSettings>
    return {
      type: parsed.type === 'custom' ? 'custom' : 'default',
      preset:
        parsed.preset && PRESET_BACKGROUNDS.some((p) => p.key === parsed.preset)
          ? (parsed.preset as PresetBackgroundKey)
          : DEFAULT_SETTINGS.preset,
      customImage: typeof parsed.customImage === 'string' ? parsed.customImage : null,
      blur: typeof parsed.blur === 'number' ? Math.max(0, Math.min(10, parsed.blur)) : DEFAULT_SETTINGS.blur,
      overlayOpacity:
        typeof parsed.overlayOpacity === 'number'
          ? Math.max(0, Math.min(0.5, parsed.overlayOpacity))
          : DEFAULT_SETTINGS.overlayOpacity,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StoredBackgroundSettings>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // localStorage 可能在隐私模式或配额满时抛错，静默忽略
    }
  }, [settings])

  const selectPreset = useCallback((key: PresetBackgroundKey) => {
    setSettings((prev) => ({ ...prev, type: 'default', preset: key }))
  }, [])

  const setCustomImage = useCallback((dataUrl: string | null) => {
    setSettings((prev) => ({
      ...prev,
      type: dataUrl ? 'custom' : 'default',
      customImage: dataUrl,
    }))
  }, [])

  const setBlur = useCallback((value: number) => {
    setSettings((prev) => ({ ...prev, blur: Math.max(0, Math.min(10, value)) }))
  }, [])

  const setOverlayOpacity = useCallback((value: number) => {
    setSettings((prev) => ({
      ...prev,
      overlayOpacity: Math.max(0, Math.min(0.5, value)),
    }))
  }, [])

  const resetToDefault = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  const currentPreset =
    PRESET_BACKGROUNDS.find((p) => p.key === settings.preset) ?? PRESET_BACKGROUNDS[0]

  return (
    <BackgroundContext.Provider
      value={{
        type: settings.type,
        preset: settings.preset,
        customImage: settings.customImage,
        blur: settings.blur,
        overlayOpacity: settings.overlayOpacity,
        settingsOpen,
        selectPreset,
        setCustomImage,
        setBlur,
        setOverlayOpacity,
        resetToDefault,
        setSettingsOpen,
        currentPreset,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  )
}

export const useBackground = () => {
  const ctx = useContext(BackgroundContext)
  if (!ctx) throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}
