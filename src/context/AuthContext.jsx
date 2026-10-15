import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/services'
import { TOKEN_KEY } from '../api/client'

const AuthContext = createContext(null)

/**
 * Lưu user đang đăng nhập. Token để trong localStorage, user lấy lại từ /api/auth/me khi tải trang.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const me = await authApi.me()
      setUser(me)
      return me
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const handleAuth = (res) => {
    localStorage.setItem(TOKEN_KEY, res.token)
    setUser(res.user)
    return res.user
  }

  const login = async (email, password) => handleAuth(await authApi.login(email, password))
  const register = async (payload) => handleAuth(await authApi.register(payload))

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, refreshUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider')
  return ctx
}
