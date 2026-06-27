import { AI_MODELS } from '@studymate/shared'

/**
 * Centralised model selection policy.
 *
 * Cost hierarchy (cheapest → most expensive per token):
 *   Haiku → Sonnet
 *
 * Rule: use the cheapest model that produces acceptable quality for the task.
 * Safety-critical paths (crisis assessment) always use Sonnet regardless of cost.
 */

export type AiTask =
  | 'mood_response'          // Haiku: simple encouragement after mood check-in
  | 'journal_analysis'       // Haiku: structured extraction (sentiment, triggers)
  | 'context_summariser'     // Haiku: compress history to <500 tokens
  | 'mitra_conversation'     // Sonnet: empathetic conversation requires nuance
  | 'crisis_assessment'      // Sonnet: safety-critical, never downgrade
  | 'weekly_insight'         // Sonnet: quality matters, runs once/week per user

export function selectModel(task: AiTask): string {
  return MODEL_MAP[task]
}

const MODEL_MAP: Record<AiTask, string> = {
  mood_response: AI_MODELS.MOOD_RESPONSE,
  journal_analysis: AI_MODELS.JOURNAL_ANALYSIS,
  context_summariser: AI_MODELS.CONTEXT_SUMMARIZER,
  mitra_conversation: AI_MODELS.MITRA_CONVERSATION,
  crisis_assessment: AI_MODELS.CRISIS_ASSESSMENT,
  weekly_insight: AI_MODELS.WEEKLY_INSIGHT,
}

/** Token budgets per task — caps max_tokens to control spend */
export const TOKEN_BUDGETS: Record<AiTask, number> = {
  mood_response: 128,
  journal_analysis: 512,
  context_summariser: 512,
  mitra_conversation: 512,
  crisis_assessment: 256,
  weekly_insight: 768,
}
