// Exam types supported by StudyMate
export const EXAM_TYPES = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC', 'OTHER'] as const
export type ExamType = (typeof EXAM_TYPES)[number]

// Exam phases drive Mitra's support posture
export const EXAM_PHASES = [
  'foundation',    // 6+ months out
  'intensive',     // 3–6 months out
  'mock_cycle',    // Active mock test period
  'final_sprint',  // < 1 month out
  'exam_week',     // 7 days before
  'post_exam',     // After the exam
] as const
export type ExamPhase = (typeof EXAM_PHASES)[number]

// Three-axis mood dimensions
export const MOOD_DIMENSIONS = ['energy', 'anxiety', 'motivation'] as const
export type MoodDimension = (typeof MOOD_DIMENSIONS)[number]

export const MOOD_MIN = 1
export const MOOD_MAX = 10

// Crisis severity levels — drives escalation protocol
export const CRISIS_LEVELS = ['none', 'moderate', 'high', 'critical'] as const
export type CrisisLevel = (typeof CRISIS_LEVELS)[number]

// Intervention categories available in the library
export const INTERVENTION_TYPES = [
  'breathing',
  'grounding',
  'cognitive_reframe',
  'sleep_hygiene',
  'motivational_anchor',
  'social_reconnect',
  'study_break',
  'exam_ritual',
] as const
export type InterventionType = (typeof INTERVENTION_TYPES)[number]

// Cognitive distortion tags extracted from journal entries
export const COGNITIVE_DISTORTIONS = [
  'catastrophizing',
  'mind_reading',
  'all_or_nothing',
  'overgeneralization',
  'emotional_reasoning',
  'should_statements',
  'personalization',
  'mental_filter',
] as const
export type CognitiveDistortion = (typeof COGNITIVE_DISTORTIONS)[number]

// Supported languages for Mitra
export const LANGUAGES = ['en', 'hi', 'hinglish'] as const
export type Language = (typeof LANGUAGES)[number]

// Rate limits (requests per window)
export const RATE_LIMITS = {
  JOURNAL_PER_HOUR: 10,
  CHAT_PER_HOUR: 30,
  MOOD_PER_HOUR: 20,
  AUTH_PER_MINUTE: 20,
} as const

// AI model selection per use case
export const AI_MODELS = {
  MITRA_CONVERSATION: 'gpt-4o',
  CRISIS_ASSESSMENT: 'gpt-4o',
  JOURNAL_ANALYSIS: 'gpt-4o-mini',
  MOOD_RESPONSE: 'gpt-4o-mini',
  WEEKLY_INSIGHT: 'gpt-4o',
  CONTEXT_SUMMARIZER: 'gpt-4o-mini',
} as const

// Context window management
export const AI_CONTEXT = {
  MAX_CONVERSATION_TURNS: 10,
  MAX_EMOTIONAL_SUMMARY_TOKENS: 500,
  SYSTEM_PROMPT_CACHE_TTL_SECONDS: 300,
} as const

// Crisis helpline numbers (India)
export const CRISIS_HELPLINES = [
  { name: 'iCall', number: '9152987821', hours: 'Mon–Sat, 8AM–10PM' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', hours: '24/7' },
  { name: 'NIMHANS', number: '080-46110007', hours: 'Mon–Sat, 9AM–5PM' },
] as const

// JWT token lifetimes
export const TOKEN_TTL = {
  ACCESS_SECONDS: 900,        // 15 minutes
  REFRESH_DAYS: 30,
} as const
