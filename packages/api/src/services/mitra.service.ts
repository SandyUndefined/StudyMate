import Anthropic from '@anthropic-ai/sdk'
import type { PromptCachingBetaTextBlockParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import { AI_MODELS, AI_CONTEXT } from '@studymate/shared'
import type {
  MitraResponse,
  SendMessageDTO,
  MitraSession,
  InterventionFeedbackInput,
} from '@studymate/shared'
import { MitraPromptBuilder } from '../ai/prompt-builder'
import { assessCrisisRisk, buildCrisisEscalationMessage } from '../ai/crisis-detector'
import type { IMitraSessionRepository, IEmotionalSummaryRepository } from '../db/repositories/interfaces'
import type { IUserRepository } from '../db/repositories/interfaces'
import { computeExamContext } from './exam-context'
import type { CrisisService } from './crisis.service'

const anthropic = new Anthropic()

export class MitraService {
  constructor(
    private readonly sessions: IMitraSessionRepository,
    private readonly summaries: IEmotionalSummaryRepository,
    private readonly users: IUserRepository,
    private readonly crisisService: CrisisService
  ) {}

  async sendMessage(userId: string, dto: SendMessageDTO): Promise<MitraResponse> {
    const user = await this.users.findById(userId)
    if (!user) throw new Error('User not found')

    // Resolve or create session
    let session: MitraSession
    if (dto.sessionId) {
      const existing = await this.sessions.findSessionById(dto.sessionId)
      session = existing ?? (await this.sessions.createSession(userId))
    } else {
      session = await this.sessions.createSession(userId)
    }

    // Run crisis detection on incoming message before doing anything else
    const crisisAssessment = await assessCrisisRisk(dto.content)

    // Store user message
    const userMessage = await this.sessions.addMessage(session.id, {
      role: 'user',
      content: dto.content,
      language: user.language,
      crisisFlag: crisisAssessment.level,
    })

    // Audit every non-trivial crisis detection — runs in background, never blocks response
    if (crisisAssessment.level !== 'none') {
      const helplinesDisplayed =
        crisisAssessment.level === 'high' || crisisAssessment.level === 'critical'
      void this.crisisService.logEvent({
        userId,
        sourceType: 'chat',
        sourceId: userMessage.id,
        assessment: crisisAssessment,
        helplinesDisplayed,
      })
    }

    // Build Mitra's context-aware system prompt
    const recentSummaries = await this.summaries.findByUser(userId, 4)
    const examContext = computeExamContext(user)

    const promptBuilder = new MitraPromptBuilder()
    const prompt = promptBuilder
      .withUserProfile({
        id: user.id,
        name: user.name,
        examType: user.examType,
        examDate: user.examDate,
        language: user.language,
        daysUntilExam: examContext.daysUntilExam,
      })
      .withEmotionalHistory(recentSummaries)
      .withExamContext(examContext)
      .build()

    // Cached system blocks: static persona cached, dynamic context not cached
    const systemBlocks = promptBuilder.serializeWithCaching(prompt)

    // Get last N messages for conversation context (bounded to control tokens)
    const recentMessages = await this.sessions.getRecentMessages(
      session.id,
      AI_CONTEXT.MAX_CONVERSATION_TURNS
    )

    // If crisis is critical, prepend the escalation message to Mitra's response
    let assistantContent: string
    if (crisisAssessment.level === 'critical' || crisisAssessment.level === 'high') {
      const escalation = buildCrisisEscalationMessage(user.language)
      assistantContent = escalation
    } else {
      const aiResponse = await anthropic.beta.promptCaching.messages.create({
        model: AI_MODELS.MITRA_CONVERSATION,
        max_tokens: 512,
        system: systemBlocks as PromptCachingBetaTextBlockParam[],
        messages: recentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      const content = aiResponse.content[0]
      assistantContent = content?.type === 'text' ? content.text : "I'm here with you. Take a breath — what's on your mind?"
    }

    const assistantMessage = await this.sessions.addMessage(session.id, {
      role: 'assistant',
      content: assistantContent,
      language: user.language,
      crisisFlag: crisisAssessment.level,
    })

    await this.sessions.touchSession(session.id)

    return {
      message: assistantMessage,
      crisisAction: crisisAssessment.recommendedAction,
      suggestedIntervention: null,
      sessionId: session.id,
    }
  }

  async getSession(userId: string, sessionId: string): Promise<MitraSession | null> {
    const session = await this.sessions.findSessionById(sessionId)
    if (!session || session.userId !== userId) return null
    return session
  }

  async recordInterventionFeedback(
    userId: string,
    feedback: InterventionFeedbackInput
  ): Promise<void> {
    // Stored via InterventionCompletion — implementation deferred to Phase 3
    void userId
    void feedback
  }
}
