import { MitraPromptBuilder } from '../../ai/prompt-builder'
import type { ExamContext, EmotionalSummary } from '@studymate/shared'

function makeExamContext(overrides: Partial<ExamContext> = {}): ExamContext {
  return {
    examType: 'JEE',
    examDate: new Date('2025-05-15'),
    daysUntilExam: 120,
    currentPhase: 'intensive',
    ...overrides,
  }
}

function makeEmotionalSummary(overrides: Partial<EmotionalSummary> = {}): EmotionalSummary {
  return {
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-07'),
    dominantSentiment: 'neutral',
    averageMoodScores: { energy: 6, anxiety: 4, motivation: 7 },
    topStressTriggers: ['mock tests'],
    recentCognitiveDistortions: ['catastrophizing'],
    crisisHistoryThisPeriod: false,
    ...overrides,
  }
}

describe('MitraPromptBuilder', () => {
  let builder: MitraPromptBuilder

  beforeEach(() => {
    builder = new MitraPromptBuilder()
  })

  describe('build()', () => {
    test('throws if examContext not set', () => {
      builder.withUserProfile({ id: 'u1', name: 'Arjun', examType: 'JEE', examDate: new Date(), language: 'en', daysUntilExam: 60 })
      expect(() => builder.build()).toThrow('ExamContext is required')
    })

    test('returns complete MitraSystemPrompt when all fields set', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Priya', examType: 'NEET', examDate: new Date(), language: 'hi', daysUntilExam: 90 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory([])
        .build()

      expect(prompt.userName).toBe('Priya')
      expect(prompt.preferredLanguage).toBe('hi')
      expect(prompt.safetyGuardrails).toContain('iCall')
      expect(prompt.basePersona).toContain('Mitra')
      expect(prompt.examContext.examType).toBe('JEE')
    })

    test('caps emotional history to 4 summaries', () => {
      const summaries = Array.from({ length: 6 }, () => makeEmotionalSummary())

      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Raj', examType: 'CAT', examDate: new Date(), language: 'en', daysUntilExam: 45 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory(summaries)
        .build()

      expect(prompt.emotionalHistory).toHaveLength(4)
    })
  })

  describe('serializeWithCaching()', () => {
    test('returns exactly 2 text blocks', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Ananya', examType: 'UPSC', examDate: new Date(), language: 'en', daysUntilExam: 200 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory([])
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks).toHaveLength(2)
      expect(blocks[0]?.type).toBe('text')
      expect(blocks[1]?.type).toBe('text')
    })

    test('Block 1 contains persona text (type=text)', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Dev', examType: 'GATE', examDate: new Date(), language: 'en', daysUntilExam: 150 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory([])
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks[0]).toHaveProperty('type', 'text')
      expect(blocks[0]?.text).toContain('Mitra')
    })

    test('Block 2 contains student context', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Meera', examType: 'JEE', examDate: new Date(), language: 'en', daysUntilExam: 30 })
        .withExamContext(makeExamContext({ currentPhase: 'final_sprint' }))
        .withEmotionalHistory([])
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks[1]?.text).toContain('Student Context')
    })

    test('Block 1 text contains safety guardrails', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Vik', examType: 'JEE', examDate: new Date(), language: 'en', daysUntilExam: 80 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory([])
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks[0]?.text).toContain('HARD RULES')
      expect(blocks[0]?.text).toContain('Mitra')
    })

    test('Block 2 text contains dynamic student context', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Sunita', examType: 'NEET', examDate: new Date(), language: 'hi', daysUntilExam: 75 })
        .withExamContext(makeExamContext({ examType: 'NEET', currentPhase: 'foundation' }))
        .withEmotionalHistory([])
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks[1]?.text).toContain('Sunita')
      expect(blocks[1]?.text).toContain('NEET')
    })

    test('Block 2 text includes emotional history when provided', () => {
      const summaries = [makeEmotionalSummary()]
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Kiran', examType: 'JEE', examDate: new Date(), language: 'en', daysUntilExam: 60 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory(summaries)
        .build()

      const blocks = builder.serializeWithCaching(prompt)
      expect(blocks[1]?.text).toContain('Emotional Patterns')
      expect(blocks[1]?.text).toContain('mock tests')
    })
  })

  describe('serialize() fallback', () => {
    test('returns non-empty string joining both blocks', () => {
      const prompt = builder
        .withUserProfile({ id: 'u1', name: 'Ritu', examType: 'CAT', examDate: new Date(), language: 'en', daysUntilExam: 50 })
        .withExamContext(makeExamContext())
        .withEmotionalHistory([])
        .build()

      const text = builder.serialize(prompt)
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(100)
      expect(text).toContain('Mitra')
      expect(text).toContain('Ritu')
    })
  })
})
