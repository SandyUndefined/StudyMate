import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate, validateQuery } from '../middleware/validate'
import { journalRateLimit } from '../middleware/rate-limit'
import { CreateJournalEntrySchema, JournalQuerySchema } from '@studymate/shared'
import { JournalService } from '../services/journal.service'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Request, Response } from 'express'

export function createJournalRouter(journalService: JournalService): Router {
  const router = Router()

  // All journal routes require authentication
  router.use(requireAuth)

  // POST /journal — submit a new encrypted journal entry
  router.post(
    '/',
    journalRateLimit,
    validate(CreateJournalEntrySchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        const entry = await journalService.createEntry(userId, req.body)
        res.status(201).json({ entry })
      } catch (err) {
        res.status(500).json({ error: 'Failed to save journal entry' })
      }
    }
  )

  // GET /journal — paginated list of the user's entries
  router.get(
    '/',
    validateQuery(JournalQuerySchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        const { limit, offset, startDate, endDate } = req.query as {
          limit: string
          offset: string
          startDate?: string
          endDate?: string
        }

        const entries = await journalService.getEntries(userId, {
          limit: Number(limit),
          offset: Number(offset),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        })
        res.json({ entries })
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch journal entries' })
      }
    }
  )

  // GET /journal/prompts — contextual prompts for today's journal
  router.get('/prompts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req as AuthenticatedRequest
      const prompts = await journalService.getTodayPrompts(userId)
      res.json({ prompts })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prompts' })
    }
  })

  // GET /journal/patterns — stress trigger patterns for dashboard
  router.get('/patterns', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req as AuthenticatedRequest
      const patterns = await journalService.getTriggerPatterns(userId)
      res.json({ patterns })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trigger patterns' })
    }
  })

  return router
}
