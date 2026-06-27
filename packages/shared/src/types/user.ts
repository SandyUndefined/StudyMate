import type { ExamType, Language } from '../constants'

export interface User {
  id: string
  email: string
  name: string
  examType: ExamType
  examDate: Date
  language: Language
  isMinor: boolean           // Under 18 — triggers parental consent flow
  parentalConsentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  name: string
  examType: ExamType
  examDate: Date
  language: Language
  // Derived from exam date — computed, not stored
  daysUntilExam: number
}

export interface CreateUserDTO {
  email: string
  password: string
  name: string
  examType: ExamType
  examDate: string            // ISO date string from client
  dateOfBirth: string         // To determine isMinor
  language: Language
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: UserProfile
  tokens: AuthTokens
}
