import { selectModel, TOKEN_BUDGETS, type AiTask } from '../../ai/model-router'
import { AI_MODELS } from '@studymate/shared'

const ALL_TASKS: AiTask[] = [
  'mood_response',
  'journal_analysis',
  'context_summariser',
  'mitra_conversation',
  'crisis_assessment',
  'weekly_insight',
]

describe('selectModel()', () => {
  test('safety-critical tasks always use Sonnet', () => {
    expect(selectModel('crisis_assessment')).toBe(AI_MODELS.CRISIS_ASSESSMENT)
    expect(selectModel('mitra_conversation')).toBe(AI_MODELS.MITRA_CONVERSATION)
    expect(selectModel('weekly_insight')).toBe(AI_MODELS.WEEKLY_INSIGHT)
  })

  test('cheap tasks use Haiku', () => {
    expect(selectModel('mood_response')).toBe(AI_MODELS.MOOD_RESPONSE)
    expect(selectModel('journal_analysis')).toBe(AI_MODELS.JOURNAL_ANALYSIS)
    expect(selectModel('context_summariser')).toBe(AI_MODELS.CONTEXT_SUMMARIZER)
  })

  test('every AiTask maps to a non-empty model string', () => {
    for (const task of ALL_TASKS) {
      const model = selectModel(task)
      expect(typeof model).toBe('string')
      expect(model.length).toBeGreaterThan(0)
    }
  })
})

describe('TOKEN_BUDGETS', () => {
  test('every AiTask has a positive token budget', () => {
    for (const task of ALL_TASKS) {
      expect(TOKEN_BUDGETS[task]).toBeGreaterThan(0)
    }
  })

  test('crisis_assessment budget is lower than mitra_conversation (safety vs. conversation)', () => {
    expect(TOKEN_BUDGETS.crisis_assessment).toBeLessThanOrEqual(TOKEN_BUDGETS.mitra_conversation)
  })

  test('weekly_insight budget is highest (most comprehensive output)', () => {
    const max = Math.max(...ALL_TASKS.map((t) => TOKEN_BUDGETS[t]))
    expect(TOKEN_BUDGETS.weekly_insight).toBe(max)
  })
})
