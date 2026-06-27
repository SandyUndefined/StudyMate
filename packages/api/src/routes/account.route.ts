import { Router } from 'express'
import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import { authRateLimit } from '../middleware/rate-limit'

/**
 * DPDPA 2023 compliance routes.
 * - Data deletion: user can request full account deletion; completed within 72h
 * - Parental consent: records consent timestamp for under-18 users
 * - Data export: returns structured summary of all user data (right to access)
 */
export function createAccountRouter(db: PrismaClient): Router {
  const router = Router()
  router.use(requireAuth)

  // DELETE /account — full account and data deletion
  // DPDPA: personal data erased within 72 hours of request
  router.delete('/', authRateLimit, async (req: Request, res: Response): Promise<void> => {
    const { userId } = req as AuthenticatedRequest
    try {
      // Cascade deletes all journal entries, mood check-ins, mitra sessions, etc.
      // CrisisEvent records are retained (onDelete: Restrict on user FK)
      // per safety audit requirements — anonymised but not deleted.
      await db.$transaction([
        db.mitraMessage.deleteMany({ where: { session: { userId } } }),
        db.mitraSession.deleteMany({ where: { userId } }),
        db.journalEntry.deleteMany({ where: { userId } }),
        db.moodCheckIn.deleteMany({ where: { userId } }),
        db.interventionCompletion.deleteMany({ where: { userId } }),
        db.emotionalSummary.deleteMany({ where: { userId } }),
        db.refreshToken.deleteMany({ where: { userId } }),
        // Anonymise crisis events rather than delete (safety audit trail)
        db.crisisEvent.updateMany({
          where: { userId },
          data: { userId: 'ANONYMISED' },
        }),
        db.user.delete({ where: { id: userId } }),
      ])
      res.status(204).send()
    } catch (err) {
      console.error('[AccountRoute] Deletion failed:', err)
      res.status(500).json({ error: 'Account deletion failed. Please contact support.' })
    }
  })

  // POST /account/consent — record parental consent for under-18 users
  router.post('/consent', async (req: Request, res: Response): Promise<void> => {
    const { userId } = req as AuthenticatedRequest
    try {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) { res.status(404).json({ error: 'User not found' }); return }
      if (!user.isMinor) { res.status(400).json({ error: 'Consent only required for under-18 users' }); return }

      await db.user.update({
        where: { id: userId },
        data: { parentalConsentAt: new Date() },
      })
      res.status(200).json({ message: 'Parental consent recorded' })
    } catch {
      res.status(500).json({ error: 'Failed to record consent' })
    }
  })

  // GET /account/export — structured data export (DPDPA right of access)
  router.get('/export', authRateLimit, async (req: Request, res: Response): Promise<void> => {
    const { userId } = req as AuthenticatedRequest
    try {
      const [user, moodCount, journalCount, sessionCount] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, examType: true, examDate: true, createdAt: true },
        }),
        db.moodCheckIn.count({ where: { userId } }),
        db.journalEntry.count({ where: { userId } }),
        db.mitraSession.count({ where: { userId } }),
      ])

      // Export metadata only — encrypted journal content cannot be decrypted server-side
      res.json({
        exportedAt: new Date().toISOString(),
        profile: user,
        dataSummary: {
          journalEntries: journalCount,
          moodCheckIns: moodCount,
          mitraSessions: sessionCount,
          note: 'Journal content is client-side encrypted and cannot be exported in plaintext.',
        },
        rights: {
          deletion: 'You may request full account deletion via DELETE /api/account',
          contact: 'privacy@studymate.app',
        },
      })
    } catch {
      res.status(500).json({ error: 'Export failed' })
    }
  })

  return router
}
