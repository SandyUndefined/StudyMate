import { PrismaClient } from '@prisma/client'
import type { CrisisAssessment } from '@studymate/shared'

/**
 * Writes an immutable audit record for every detected crisis event.
 *
 * Safety invariants:
 * - Records are NEVER deleted (onDelete: Restrict on the User FK)
 * - Each record is written synchronously before Mitra's response is returned
 * - A human review queue is flagged for 'high' and 'critical' events
 * - Failure to write DOES NOT suppress the helpline display to the user
 */
export class CrisisService {
  constructor(private readonly db: PrismaClient) {}

  async logEvent(params: {
    userId: string
    sourceType: 'journal' | 'chat'
    sourceId: string
    assessment: CrisisAssessment
    helplinesDisplayed: boolean
  }): Promise<void> {
    const { userId, sourceType, sourceId, assessment, helplinesDisplayed } = params

    // Fire-and-forget write — we never suppress the safety response waiting for this
    await this.db.crisisEvent
      .create({
        data: {
          userId,
          sourceType,
          sourceId,
          crisisLevel: assessment.level,
          triggerPhrases: assessment.triggerPhrases,
          confidence: assessment.confidence,
          actionTaken: assessment.recommendedAction,
          helplinesDisplayed,
          // Flag for human moderator review on high/critical
          reviewedByHuman: false,
        },
      })
      .catch((err: unknown) => {
        // Log the failure but never throw — safety display must not be blocked
        console.error('[CrisisService] Failed to write audit record:', err)
      })
  }

  /** Returns unreviewed high/critical events for the moderator queue. */
  async getPendingReview(
    limit = 50
  ): Promise<Array<{ id: string; userId: string; crisisLevel: string; createdAt: Date }>> {
    return this.db.crisisEvent.findMany({
      where: {
        reviewedByHuman: false,
        crisisLevel: { in: ['high', 'critical'] },
      },
      select: { id: true, userId: true, crisisLevel: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  async markReviewed(eventId: string): Promise<void> {
    await this.db.crisisEvent.update({
      where: { id: eventId },
      data: { reviewedByHuman: true, reviewedAt: new Date() },
    })
  }
}
