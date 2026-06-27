import type { CrisisAction } from './journal'
import type { CrisisLevel, Language } from '../constants'

export interface MitraMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  language: Language
  crisisFlag: CrisisLevel
  createdAt: Date
}

export interface MitraSession {
  id: string
  userId: string
  messages: MitraMessage[]
  startedAt: Date
  lastActivityAt: Date
}

// Structured emotional context sent to AI — never raw journal text
export interface EmotionalSummary {
  periodStart: Date
  periodEnd: Date
  dominantSentiment: string
  averageMoodScores: {
    energy: number
    anxiety: number
    motivation: number
  }
  topStressTriggers: string[]  // Topic names only
  recentCognitiveDistortions: string[]
  crisisHistoryThisPeriod: boolean
}

export interface ExamContext {
  examType: string
  examDate: Date
  daysUntilExam: number
  currentPhase: string
}

// What gets assembled and sent to Claude
export interface MitraSystemPrompt {
  basePersona: string
  examContext: ExamContext
  emotionalHistory: EmotionalSummary[]
  preferredLanguage: Language
  safetyGuardrails: string
  userName: string
}

export interface SendMessageDTO {
  content: string
  sessionId?: string         // If continuing existing session
}

export interface MitraResponse {
  message: MitraMessage
  crisisAction: CrisisAction
  suggestedIntervention: string | null  // Intervention type if recommended
  sessionId: string
}
