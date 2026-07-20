import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  username: string
  nickname: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (username: string, password: string, nickname?: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'ai-tutor-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 启动时检查本地存储的 token
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      setToken(savedToken)
      // 验证 token 是否有效
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === 0 && data.data) {
            setUser(data.data)
          } else {
            // token 无效，清除
            localStorage.removeItem(TOKEN_KEY)
            setToken(null)
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.code === 0 && data.data) {
        setToken(data.data.token)
        setUser(data.data.user)
        localStorage.setItem(TOKEN_KEY, data.data.token)
        return { success: true, message: '登录成功' }
      }
      return { success: false, message: data.message || '登录失败' }
    } catch {
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  const register = async (username: string, password: string, nickname?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname }),
      })
      const data = await res.json()
      if (data.code === 0 && data.data) {
        setToken(data.data.token)
        setUser(data.data.user)
        localStorage.setItem(TOKEN_KEY, data.data.token)
        return { success: true, message: '注册成功' }
      }
      return { success: false, message: data.message || '注册失败' }
    } catch {
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
