import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    if (api.hasToken()) {
      api.getMe()
        .then((data) => setUser(data.user))
        .catch(() => api.signOut())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signUp = async (firstName, lastName, email, password) => {
    try {
      const data = await api.signUp(firstName, lastName, email, password)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { error: err.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      const data = await api.signIn(email, password)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err) {
      return { error: err.message }
    }
  }

  const signOut = () => {
    api.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
