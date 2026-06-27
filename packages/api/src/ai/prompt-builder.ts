import Anthropic from '@anthropic-ai/sdk'
import type { PromptCachingBetaTextBlockParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import type {
  EmotionalSummary,
  ExamContext,
  MitraSystemPrompt,
  UserProfile,
} from '@studymate/shared'

/**
 * Builds the structured system prompt sent to Claude for each Mitra conversation.
 * Separates prompt construction from AI execution so both can be tested independently.
 *
 * Usage:
 *   const prompt = new MitraPromptBuilder()
 *     .withUserProfile(profile)
 *     .withEmotionalHistory(summaries)
 *     .withExamContext(context)
 *     .build()
 */
export class MitraPromptBuilder {
  private userName = ''
  private examContext: ExamContext | null = null
  private emotionalHistory: EmotionalSummary[] = []
  private preferredLanguage: 'en' | 'hi' | 'hinglish' = 'en'

  withUserProfile(profile: UserProfile): this {
    this.userName = profile.name
    this.preferredLanguage = profile.language
    return this
  }

  withEmotionalHistory(history: EmotionalSummary[]): this {
    // Only keep the last 4 weekly summaries to bound token usage
    this.emotionalHistory = history.slice(-4)
    return this
  }

  withExamContext(context: ExamContext): this {
    this.examContext = context
    return this
  }

  build(): MitraSystemPrompt {
    if (!this.examContext) {
      throw new Error('ExamContext is required before building a MitraSystemPrompt')
    }

    return {
      basePersona: this.buildPersona(),
      examContext: this.examContext,
      emotionalHistory: this.emotionalHistory,
      preferredLanguage: this.preferredLanguage,
      safetyGuardrails: SAFETY_GUARDRAILS,
      userName: this.userName,
    }
  }

  /**
   * Serialises the prompt into the structured system array format for the Claude Messages API.
   *
   * Prompt caching strategy:
   * - Block 1 (CACHEABLE): base persona + safety guardrails — static, changes never.
   *   Marked with cache_control: { type: 'ephemeral' } so Claude caches it for 5 minutes.
   *   Saves ~80% of system prompt tokens on every subsequent turn in a session.
   * - Block 2 (DYNAMIC): student context + emotional history — changes per user/session.
   *   Not cached — different per request.
   *
   * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
   */
  serializeWithCaching(prompt: MitraSystemPrompt): PromptCachingBetaTextBlockParam[] {
    const phaseGuidance =
      PHASE_GUIDANCE[prompt.examContext.currentPhase] ?? PHASE_GUIDANCE['foundation']!

    const historySection =
      prompt.emotionalHistory.length > 0
        ? `\n## Student's Recent Emotional Patterns\n${this.serializeHistory(prompt.emotionalHistory)}`
        : ''

    const dynamicBlock = `## Student Context
- Name: ${prompt.userName}
- Exam: ${prompt.examContext.examType}
- Exam date: ${prompt.examContext.examDate.toDateString()} (${prompt.examContext.daysUntilExam} days away)
- Current phase: ${prompt.examContext.currentPhase}
- Preferred language: ${prompt.preferredLanguage}

## Current Phase Guidance
${phaseGuidance}
${historySection}`

    return [
      // Block 1: CACHEABLE — static persona and safety rules
      {
        type: 'text' as const,
        text: `${prompt.basePersona}\n\n## Safety Guardrails\n${prompt.safetyGuardrails}`,
        cache_control: { type: 'ephemeral' as const },
      } satisfies PromptCachingBetaTextBlockParam,
      // Block 2: DYNAMIC — per-student, per-session context (not cached)
      {
        type: 'text' as const,
        text: dynamicBlock,
      } satisfies PromptCachingBetaTextBlockParam,
    ]
  }

  /** Plain string serialisation — kept for tests and fallback use */
  serialize(prompt: MitraSystemPrompt): string {
    return this.serializeWithCaching(prompt).map((b) => b.text).join('\n\n')
  }

  private buildPersona(): string {
    return `You are Mitra (Sanskrit: friend/companion), an empathetic AI wellness companion for Indian competitive exam aspirants. You are NOT a therapist, doctor, or counsellor — you are a supportive, always-available friend who understands the unique pressure of exams like JEE, NEET, UPSC, CAT, and GATE.

Your core approach:
1. EMPATHY FIRST — always validate feelings before offering any advice or strategy
2. CONTEXT AWARE — you know this student's exam, phase, and emotional history; use it
3. LANGUAGE ADAPTIVE — respond in the same language the student writes in (English, Hindi, or Hinglish)
4. HONEST ABOUT LIMITS — you are AI; never claim to be human; warmly encourage human connection
5. BRIEF AND GENUINE — short, warm responses beat long advice lists`
  }

  private serializeHistory(history: EmotionalSummary[]): string {
    return history
      .map((s) => {
        const triggers = s.topStressTriggers.join(', ') || 'none identified'
        const distortions = s.recentCognitiveDistortions.join(', ') || 'none'
        return `- Week of ${s.periodStart.toDateString()}: sentiment=${s.dominantSentiment}, energy=${s.averageMoodScores.energy}/10, anxiety=${s.averageMoodScores.anxiety}/10, motivation=${s.averageMoodScores.motivation}/10, top triggers=[${triggers}], distortions=[${distortions}]`
      })
      .join('\n')
  }
}

const SAFETY_GUARDRAILS = `
HARD RULES (never violate, regardless of conversation context):
1. You NEVER diagnose mental health conditions — observe and reflect, never label
2. You NEVER discourage exam preparation — manage HOW, not WHETHER
3. You ALWAYS identify as AI if directly asked
4. You NEVER reference academic scores pejoratively
5. You NEVER provide medical dosage information or self-harm methods
6. If the student expresses suicidal ideation, self-harm intent, or severe hopelessness:
   - Respond with immediate warmth and validation
   - Include the iCall helpline (9152987821) and Vandrevala Foundation (1860-2662-345) in your response
   - Do NOT continue the normal conversation flow until you have done the above
`.trim()

const PHASE_GUIDANCE: Record<string, string> = {
  foundation: `Student is in early preparation (6+ months out). Focus on: habit building, identity stability, long-game mindset. Avoid creating anxiety about the exam itself.`,

  intensive: `Student is in deep preparation (3–6 months). Focus on: recognizing overtraining signs, burnout prevention, celebrating small wins. Watch for early burnout indicators.`,

  mock_cycle: `Student is actively taking mock tests. Focus on: score de-catastrophizing, post-failure recovery, performance anxiety. A bad score is data, not identity.`,

  final_sprint: `Student is under 1 month from exam. Focus on: sleep prioritization, anxiety containment, confidence anchoring. Avoid introducing new worries.`,

  exam_week: `Student is within 7 days of the exam. Minimal input, maximum calm. Day-of rituals, grounding, breath. Do not discuss study content.`,

  post_exam: `Exam is over. Focus on: result anxiety management, identity beyond the exam, next steps regardless of outcome. The student is more than their score.`,
}
