import type { InterventionType } from '../constants'

export interface Intervention {
  id: string
  type: InterventionType
  title: string
  titleHi: string
  description: string
  descriptionHi: string
  durationMinutes: number
  steps: InterventionStep[]
  triggerConditions: string[]   // When Mitra recommends this
  evidenceBase: string          // Brief citation for credibility
}

export interface InterventionStep {
  order: number
  instruction: string
  instructionHi: string
  durationSeconds: number
  audioUrl?: string             // Optional guided audio
}

export interface InterventionCompletion {
  id: string
  userId: string
  interventionId: string
  helpfulnessRating: number     // 1–5, collected after completion
  completedAt: Date
}
