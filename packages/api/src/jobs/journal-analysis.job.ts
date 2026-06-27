import Anthropic from '@anthropic-ai/sdk'
import type { JournalAnalysis } from '@studymate/shared'
import { COGNITIVE_DISTORTIONS } from '@studymate/shared'
import { selectModel, TOKEN_BUDGETS } from '../ai/model-router'
import { assessCrisisRisk } from '../ai/crisis-detector'
import type { PrismaJournalRepository } from '../db/repositories/journal.repository'
import type { CrisisService } from '../services/crisis.service'

const anthropic = new Anthropic()

export interface JournalAnalysisPayload {
  entryId: string
  userId: string
  /**
   * Plaintext sent by the client for analysis only.
   * It is processed in-memory and NEVER written to any database.
   * The server already holds only the encrypted ciphertext in the DB.
   *
   * This is an intentional security trade-off:
   * - The client controls what plaintext to send (they own the key)
   * - The server analyses it transiently and discards it
   * - Only the structured analysis results (sentiment score, trigger tags) are persisted
   */
  plaintextForAnalysis: string
  language: string
}

/**
 * Analyses journal entry plaintext and writes structured results back to DB.
 * Called async — runs after the HTTP save response has been returned to the user.
 *
 * Security: plaintext is held only in memory during this function's execution.
 * Only sentimentScore, triggers, distortions, and keyThemes are stored.
 */
export async function runJournalAnalysis(
  payload: JournalAnalysisPayload,
  journalRepo: PrismaJournalRepository,
  crisisService: CrisisService
): Promise<void> {
  const { entryId, userId, plaintextForAnalysis: text, language } = payload

  const [crisisAssessment, insights] = await Promise.all([
    assessCrisisRisk(text),
    extractInsights(text, language),
  ])

  if (crisisAssessment.level !== 'none') {
    await crisisService.logEvent({
      userId,
      sourceType: 'journal',
      sourceId: entryId,
      assessment: crisisAssessment,
      helplinesDisplayed: false,
    })
  }

  const analysis: JournalAnalysis = {
    ...insights,
    crisisAssessment,
    analysedAt: new Date(),
  }

  await journalRepo.updateAnalysis(entryId, analysis)
}

async function extractInsights(text: string, language: string): Promise<Omit<JournalAnalysis, 'crisisAssessment' | 'analysedAt'>> {
  const prompt = `You are a compassionate mental health analyst. Analyse this student journal entry and extract structured insights.

Language: ${language}

ENTRY:
"""
${text.slice(0, 3000)}
"""

Return ONLY valid JSON with this exact structure:
{
  "sentimentScore": <number -1.0 to 1.0>,
  "sentimentLabel": <"very_negative"|"negative"|"neutral"|"positive"|"very_positive">,
  "energyLevel": <integer 1-10>,
  "stressTriggers": [{ "topic": "<string>", "averageSentiment": <number -1 to 1>, "occurrences": <int>, "firstSeen": "<ISO>", "lastSeen": "<ISO>" }],
  "cognitiveDistortions": [<subset of: ${COGNITIVE_DISTORTIONS.join(', ')}>],
  "keyThemes": [<up to 5 short strings>]
}

Only include stressTriggers mentioned negatively (max 5). Empty arrays are valid.`

  const response = await anthropic.messages.create({
    model: selectModel('journal_analysis'),
    max_tokens: TOKEN_BUDGETS.journal_analysis,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block?.type !== 'text') throw new Error('Unexpected response from journal analysis AI')

  return JSON.parse(block.text) as Omit<JournalAnalysis, 'crisisAssessment' | 'analysedAt'>
}
