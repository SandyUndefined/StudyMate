import type {
  User,
  JournalEntry,
  MitraSession,
  MitraMessage,
  MoodCheckIn,
  EmotionalSummary,
  CrisisAssessment,
} from '@studymate/shared'
import type {
  IJournalRepository,
  IMoodRepository,
  IUserRepository,
  IMitraSessionRepository,
  IEmotionalSummaryRepository,
} from '../../db/repositories/interfaces'

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Arjun Sharma',
    email: 'arjun@test.com',
    examType: 'JEE',
    examDate: new Date('2025-05-15'),
    language: 'en',
    isMinor: false,
    parentalConsentAt: null,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function makeJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'entry-1',
    userId: 'user-1',
    encryptedContent: 'encrypted-base64-content',
    wordCount: 120,
    language: 'en',
    analysis: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function makeMitraSession(overrides: Partial<MitraSession> = {}): MitraSession {
  return {
    id: 'session-1',
    userId: 'user-1',
    startedAt: new Date(),
    lastMessageAt: new Date(),
    messageCount: 0,
    ...overrides,
  }
}

export function makeMitraMessage(overrides: Partial<MitraMessage> = {}): MitraMessage {
  return {
    id: 'msg-1',
    sessionId: 'session-1',
    role: 'assistant',
    content: "I'm here with you.",
    language: 'en',
    crisisFlag: 'none',
    createdAt: new Date(),
    ...overrides,
  }
}

export function makeMoodCheckIn(overrides: Partial<MoodCheckIn> = {}): MoodCheckIn {
  return {
    id: 'mood-1',
    userId: 'user-1',
    energy: 6,
    anxiety: 4,
    motivation: 7,
    focus: 5,
    physicalWellbeing: 6,
    overallMood: 7,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function makeCrisisAssessment(overrides: Partial<CrisisAssessment> = {}): CrisisAssessment {
  return {
    level: 'none',
    triggerPhrases: [],
    confidence: 0.9,
    recommendedAction: 'none',
    ...overrides,
  }
}

export function makeEmotionalSummary(overrides: Partial<EmotionalSummary> = {}): EmotionalSummary {
  return {
    id: 'summary-1',
    userId: 'user-1',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-07'),
    dominantSentiment: 'neutral',
    averageMoodScores: { energy: 6, anxiety: 4, motivation: 7, focus: 5, physicalWellbeing: 6 },
    topStressTriggers: ['mock tests', 'time management'],
    recentCognitiveDistortions: ['catastrophizing'],
    resilienceScore: 65,
    createdAt: new Date(),
    ...overrides,
  }
}

// ── Repository mocks ──────────────────────────────────────────────────────────

export function makeMockJournalRepo(
  overrides: Partial<IJournalRepository> = {}
): jest.Mocked<IJournalRepository> {
  return {
    create: jest.fn().mockResolvedValue(makeJournalEntry()),
    findById: jest.fn().mockResolvedValue(makeJournalEntry()),
    findByUser: jest.fn().mockResolvedValue([makeJournalEntry()]),
    updateAnalysis: jest.fn().mockResolvedValue(undefined),
    findTriggerPatterns: jest.fn().mockResolvedValue([]),
    countByUser: jest.fn().mockResolvedValue(5),
    ...overrides,
  } as jest.Mocked<IJournalRepository>
}

export function makeMockUserRepo(
  overrides: Partial<IUserRepository> = {}
): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn().mockResolvedValue(makeUser()),
    findById: jest.fn().mockResolvedValue(makeUser()),
    findByEmail: jest.fn().mockResolvedValue(null),
    updateParentalConsent: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<IUserRepository>
}

export function makeMockMoodRepo(
  overrides: Partial<IMoodRepository> = {}
): jest.Mocked<IMoodRepository> {
  return {
    create: jest.fn().mockResolvedValue(makeMoodCheckIn()),
    findByUser: jest.fn().mockResolvedValue([makeMoodCheckIn()]),
    getTrends: jest.fn().mockResolvedValue([]),
    getLatest: jest.fn().mockResolvedValue(makeMoodCheckIn()),
    ...overrides,
  } as jest.Mocked<IMoodRepository>
}

export function makeMockMitraRepo(
  overrides: Partial<IMitraSessionRepository> = {}
): jest.Mocked<IMitraSessionRepository> {
  return {
    createSession: jest.fn().mockResolvedValue(makeMitraSession()),
    findSessionById: jest.fn().mockResolvedValue(makeMitraSession()),
    addMessage: jest.fn().mockResolvedValue(makeMitraMessage()),
    getRecentMessages: jest.fn().mockResolvedValue([]),
    touchSession: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<IMitraSessionRepository>
}

export function makeMockSummaryRepo(
  overrides: Partial<IEmotionalSummaryRepository> = {}
): jest.Mocked<IEmotionalSummaryRepository> {
  return {
    create: jest.fn().mockResolvedValue(makeEmotionalSummary()),
    findByUser: jest.fn().mockResolvedValue([makeEmotionalSummary()]),
    findLatest: jest.fn().mockResolvedValue(makeEmotionalSummary()),
    ...overrides,
  } as jest.Mocked<IEmotionalSummaryRepository>
}
