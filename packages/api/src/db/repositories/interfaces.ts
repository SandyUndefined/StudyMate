import type {
  CreateJournalEntryDTO,
  JournalEntry,
  TriggerPattern,
  CreateMoodCheckInDTO,
  MoodCheckIn,
  MoodTrend,
  User,
  CreateUserDTO,
  MitraSession,
  MitraMessage,
  EmotionalSummary,
} from '@studymate/shared'

export interface DateRange {
  start: Date
  end: Date
}

export interface PaginationOptions {
  limit: number
  offset: number
}

// ── Journal ──────────────────────────────────────────────────────────────────

export interface IJournalRepository {
  create(userId: string, dto: CreateJournalEntryDTO): Promise<JournalEntry>
  findById(id: string): Promise<JournalEntry | null>
  findByUser(userId: string, options: PaginationOptions, range?: DateRange): Promise<JournalEntry[]>
  updateAnalysis(id: string, analysis: JournalEntry['analysis']): Promise<void>
  findTriggerPatterns(userId: string, lookbackDays: number): Promise<TriggerPattern[]>
  countByUser(userId: string): Promise<number>
}

// ── Mood ─────────────────────────────────────────────────────────────────────

export interface IMoodRepository {
  create(userId: string, dto: CreateMoodCheckInDTO): Promise<MoodCheckIn>
  findByUser(userId: string, range: DateRange): Promise<MoodCheckIn[]>
  getTrends(userId: string, days: number): Promise<MoodTrend[]>
  getLatest(userId: string): Promise<MoodCheckIn | null>
}

// ── User ─────────────────────────────────────────────────────────────────────

export interface IUserRepository {
  create(dto: CreateUserDTO): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<(User & { passwordHash: string }) | null>
  updateParentalConsent(userId: string, consentAt: Date): Promise<void>
}

// ── Mitra ─────────────────────────────────────────────────────────────────────

export interface IMitraSessionRepository {
  createSession(userId: string): Promise<MitraSession>
  findSessionById(id: string): Promise<MitraSession | null>
  addMessage(sessionId: string, message: Omit<MitraMessage, 'id' | 'sessionId' | 'createdAt'>): Promise<MitraMessage>
  getRecentMessages(sessionId: string, limit: number): Promise<MitraMessage[]>
  touchSession(sessionId: string): Promise<void>
}

// ── Emotional Summaries ───────────────────────────────────────────────────────

export interface IEmotionalSummaryRepository {
  create(userId: string, summary: Omit<EmotionalSummary, 'id' | 'userId'>): Promise<EmotionalSummary>
  findByUser(userId: string, limit: number): Promise<EmotionalSummary[]>
  findLatest(userId: string): Promise<EmotionalSummary | null>
}
