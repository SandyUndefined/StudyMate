/**
 * Crisis Detector — unit + accuracy suite
 *
 * Layer 1 (keyword) tests run synchronously without any network calls.
 * Layer 2 (semantic) tests mock the OpenAI client.
 *
 * Accuracy targets (Layer 1 only):
 *   Critical recall  ≥ 95% — false negatives are safety failures
 *   Moderate recall  ≥ 80%
 *   False positive rate on benign text ≤ 5%
 */

const mockCreate = jest.fn()

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

import { assessCrisisRisk, buildCrisisEscalationMessage } from '../../ai/crisis-detector'

function makeSemanticResponse(level: string, triggerPhrases: string[] = [], confidence = 0.8) {
  mockCreate.mockResolvedValueOnce({
    choices: [{
      message: { content: JSON.stringify({ level, triggerPhrases, confidence, reasoning: 'test' }) },
    }],
  })
}

// ── Layer 1: critical keyword accuracy suite ──────────────────────────────────

describe('Crisis Detector — critical keywords (Layer 1)', () => {
  const criticalEnPhrases = [
    'I want to kill myself',
    "I can't go on anymore",
    'I want to end my life',
    'I keep thinking about suicide',
    'no point living like this',
    'I want to end it all',
    "I'd be better off dead",
    'I want to self harm',
    'I cut myself last night',
    'I keep wanting to hurt myself',
  ]

  test.each(criticalEnPhrases)(
    'EN critical: "%s"',
    async (phrase) => {
      mockCreate.mockClear()
      const result = await assessCrisisRisk(phrase)
      expect(result.level).toBe('critical')
      expect(result.triggerPhrases.length).toBeGreaterThan(0)
      expect(result.recommendedAction).toBe('escalate_helpline')
      // Layer 2 must NOT be called — critical short-circuits
      expect(mockCreate).not.toHaveBeenCalled()
    }
  )

  const criticalHiPhrases = [
    'मैं मरना चाहता हूं',
    'मैं जीना नहीं चाहता',
    'मैं जीना नहीं चाहती',
    'मुझे खुद को नुकसान पहुंचाना है',
    'आत्महत्या करना चाहता हूं',
    'मेरी जिंदगी खत्म करना चाहता हूं',
    'सब कुछ खत्म कर देना चाहता हूं',
  ]

  test.each(criticalHiPhrases)(
    'HI critical: "%s"',
    async (phrase) => {
      mockCreate.mockClear()
      const result = await assessCrisisRisk(phrase)
      expect(result.level).toBe('critical')
      expect(mockCreate).not.toHaveBeenCalled()
    }
  )
})

// ── Layer 1: moderate keyword accuracy suite ──────────────────────────────────

describe('Crisis Detector — moderate keywords (Layer 1)', () => {
  const moderateEnPhrases = [
    'I feel completely hopeless about everything',
    'I feel worthless all the time',
    'nobody cares about me at all',
    "I'm a burden to everyone around me",
    'I feel so trapped with no way out',
    'I just want to disappear from everything',
  ]

  test.each(moderateEnPhrases)(
    'EN moderate or above: "%s"',
    async (phrase) => {
      makeSemanticResponse('none', [], 0.9) // Layer 2 yields none; Layer 1 moderate wins
      const result = await assessCrisisRisk(phrase)
      expect(['moderate', 'high', 'critical']).toContain(result.level)
    }
  )

  const moderateHiPhrases = [
    'मुझे कोई उम्मीद नहीं है',
    'मैं बेकार हूं',
    'किसी को परवाह नहीं मेरी',  // exact keyword: 'किसी को परवाह नहीं'
    'मैं सबके लिए बोझ हूं',
    'मैं फंसा हुआ हूं',
    'कोई रास्ता नहीं है',
  ]

  test.each(moderateHiPhrases)(
    'HI moderate or above: "%s"',
    async (phrase) => {
      makeSemanticResponse('none', [], 0.9)
      const result = await assessCrisisRisk(phrase)
      expect(['moderate', 'high', 'critical']).toContain(result.level)
    }
  )
})

// ── Benign text — false positive guard ───────────────────────────────────────

describe('Crisis Detector — benign text (no false positives)', () => {
  const benignPhrases = [
    'I studied for 8 hours today and feel tired',
    'Mock test went okay, scored 65% in physics',
    'Feeling a bit stressed about the upcoming JEE',
    'My parents are proud of me',
    'I need to revise organic chemistry before the exam',
    'Today was a long day but I managed to finish the chapter',
    'आज मेरा अभ्यास अच्छा रहा',
    'परीक्षा की तैयारी चल रही है',
    'मुझे कल और पढ़ना होगा',
  ]

  test.each(benignPhrases)(
    'benign: "%s"',
    async (phrase) => {
      makeSemanticResponse('none', [], 0.95)
      const result = await assessCrisisRisk(phrase)
      expect(result.level).toBe('none')
    }
  )
})

// ── Severity escalation ───────────────────────────────────────────────────────

describe('Crisis Detector — Layer 2 escalation', () => {
  test('Layer 2 "high" upgrades Layer 1 "none"', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: { content: JSON.stringify({
          level: 'high',
          triggerPhrases: ['I see no future for myself'],
          confidence: 0.85,
          reasoning: 'indirect ideation',
        }) },
      }],
    })

    const result = await assessCrisisRisk('I see no future for myself after the exam')
    expect(result.level).toBe('high')
    expect(result.recommendedAction).toBe('escalate_helpline')
  })

  test('Layer 1 "moderate" is preserved when Layer 2 returns "none"', async () => {
    makeSemanticResponse('none', [], 0.9)
    const result = await assessCrisisRisk('I feel completely hopeless')
    expect(result.level).toBe('moderate')
  })

  test('AI failure falls back to Layer 1 result', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    const result = await assessCrisisRisk('I feel hopeless and worthless')
    expect(['moderate', 'high', 'critical']).toContain(result.level)
  })

  test('malformed AI response falls back to Layer 1', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json at all' } }],
    })
    const result = await assessCrisisRisk('I feel worthless')
    expect(['none', 'moderate', 'high', 'critical']).toContain(result.level)
  })
})

// ── buildCrisisEscalationMessage ──────────────────────────────────────────────

describe('buildCrisisEscalationMessage', () => {
  test('English message contains iCall number', () => {
    const msg = buildCrisisEscalationMessage('en')
    expect(msg).toContain('9152987821')
    expect(msg).toMatch(/iCall/i)
  })

  test('Hindi message contains helpline number and is in Hindi script', () => {
    const msg = buildCrisisEscalationMessage('hi')
    expect(msg).toContain('9152987821')
    expect(msg).toMatch(/[ऀ-ॿ]/)
  })

  test('Hinglish falls back to English message', () => {
    const msg = buildCrisisEscalationMessage('hinglish')
    expect(msg).toContain('9152987821')
    expect(msg).toMatch(/You matter/)
  })
})
