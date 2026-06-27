import type { CognitiveDistortion, CrisisLevel, Language } from '../constants'

export interface JournalEntry {
  id: string
  userId: string
  content: string             // Decrypted on client only; encrypted blob on server
  encryptedContent: string    // AES-256-GCM ciphertext stored server-side
  wordCount: number
  language: Language
  analysis: JournalAnalysis | null
  createdAt: Date
}

export interface JournalAnalysis {
  sentimentScore: number      // -1.0 (very negative) to 1.0 (very positive)
  sentimentLabel: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  energyLevel: number         // 1–10, inferred from language
  stressTriggers: StressTrigger[]
  cognitiveDistortions: CognitiveDistortion[]
  crisisAssessment: CrisisAssessment
  keyThemes: string[]
  analysedAt: Date
}

export interface StressTrigger {
  topic: string               // e.g., "Organic Chemistry", "parents", "mock test score"
  sentiment: number           // How negatively this topic is mentioned
  frequency: number           // Times mentioned in recent entries
}

export interface CrisisAssessment {
  level: CrisisLevel
  triggerPhrases: string[]    // Exact phrases that raised the flag
  confidence: number          // 0.0–1.0
  recommendedAction: CrisisAction
}

export type CrisisAction =
  | 'none'
  | 'monitor'
  | 'gentle_check_in'
  | 'escalate_helpline'
  | 'escalate_trusted_contact'

export interface CreateJournalEntryDTO {
  encryptedContent: string    // Client encrypts before sending
  wordCount: number
  language: Language
}

export interface JournalPrompt {
  id: string
  text: string
  textHi: string             // Hindi translation
  examPhase: string
  contextType: 'pre_mock' | 'post_mock' | 'pre_exam' | 'general' | 'burnout_risk'
}

export interface TriggerPattern {
  topic: string
  occurrences: number
  averageSentiment: number
  firstSeen: Date
  lastSeen: Date
}
