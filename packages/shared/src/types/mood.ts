export interface MoodCheckIn {
  id: string
  userId: string
  energy: number             // 1–10
  anxiety: number            // 1–10
  motivation: number         // 1–10
  microPromptResponse: string | null  // Optional one-word/phrase response
  checkInTime: 'morning' | 'evening'
  createdAt: Date
}

export interface MoodTrend {
  date: Date
  averageEnergy: number
  averageAnxiety: number
  averageMotivation: number
  compositeWellbeingScore: number  // Derived: (energy + motivation + (10 - anxiety)) / 3
}

export interface ResilienceScore {
  score: number              // 0–100
  trend: 'improving' | 'stable' | 'declining'
  // How quickly user returns to baseline after a dip
  averageDaysToRecovery: number
  calculatedAt: Date
}

export interface CreateMoodCheckInDTO {
  energy: number
  anxiety: number
  motivation: number
  microPromptResponse?: string
  checkInTime: 'morning' | 'evening'
}

export interface MoodInsight {
  pattern: string            // e.g., "Your anxiety spikes on Thursdays"
  patternHi: string          // Hindi translation
  suggestion: string
  confidence: number
}
