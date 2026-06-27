'use client'

/**
 * Auth state — held in React context (not Zustand/localStorage) to avoid
 * persisting sensitive data. Cleared automatically on tab close.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { api, setAccessToken, clearAccessToken } from '../services/api-client'
import { deriveKey, setSessionKey, clearSessionKey } from '../services/crypto'
import type { AuthResponse, UserProfile } from '@studymate/shared'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login(email: string, password: string): Promise<void>
  register(data: RegisterData): Promise<void>
  logout(): Promise<void>
}

export interface RegisterData {
  email: string
  password: string
  name: string
  examType: string
  examDate: string
  dateOfBirth: string
  language: 'en' | 'hi' | 'hinglish'
}

type AuthContextValue = AuthState & AuthActions

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: attempt silent refresh to restore session from httpOnly cookie
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await api.post<{ accessToken: string; user: UserProfile }>(
          '/auth/refresh',
          {}
        )
        setAccessToken(data.accessToken)
        setUser(data.user)
      } catch {
        // No valid session — stay logged out
      } finally {
        setIsLoading(false)
      }
    }
    void restoreSession()
  }, [])

  // Listen for session expiry events from the API client
  useEffect(() => {
    function handleExpiry() {
      setUser(null)
      clearAccessToken()
      clearSessionKey()
    }
    window.addEventListener('auth:session-expired', handleExpiry)
    return () => window.removeEventListener('auth:session-expired', handleExpiry)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password })
    setAccessToken(data.tokens.accessToken)
    setUser(data.user)
    // Derive encryption key and hold in memory for this session
    const key = await deriveKey(password, data.user.id)
    setSessionKey(key)
  }, [])

  const register = useCallback(async (formData: RegisterData) => {
    const examDate = new Date(formData.examDate).toISOString()
    const dateOfBirth = new Date(formData.dateOfBirth).toISOString()
    const data = await api.post<AuthResponse>('/auth/register', {
      ...formData,
      examDate,
      dateOfBirth,
    })
    setAccessToken(data.tokens.accessToken)
    setUser(data.user)
    const key = await deriveKey(formData.password, data.user.id)
    setSessionKey(key)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } finally {
      setUser(null)
      clearAccessToken()
      clearSessionKey()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: user !== null, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
