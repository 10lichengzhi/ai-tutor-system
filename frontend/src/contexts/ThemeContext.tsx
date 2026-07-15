import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Theme = 'eye-care'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

// 护眼模式主题配置 - 暖纸色调
const themeConfig = {
  'eye-care': {
    '--bg-primary': '245 243 238',       // #f5f3ee 暖纸色
    '--bg-secondary': '252 250 245',     // #fcfaf5
    '--text-primary': '51 42 35',        // #332a23 深褐色文字
    '--text-secondary': '122 107 94',    // #7a6b5e 中褐色
    '--text-muted': '160 145 130',       // #a09182 浅褐色
    '--border-color': '222 213 200',     // #ded5c8
    '--accent-color': '153 51 34',       // #993222 沉稳红褐
    isDark: false,
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme] = useState<Theme>('eye-care')

  useEffect(() => {
    const root = document.documentElement
    const config = themeConfig[theme]

    // 设置CSS变量
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'isDark') return
      root.style.setProperty(key, value as string)
    })

    // 设置data-theme属性
    root.setAttribute('data-theme', theme)

    // 确保没有dark class
    root.classList.remove('dark')
  }, [theme])

  const setTheme = () => {
    // 只有护眼模式，无需切换
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
