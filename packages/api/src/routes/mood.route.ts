import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate, validateQuery } from '../middleware/validate'
import { moodRateLimit } from '../middleware/rate-limit'
import { CreateMoodCheckInSchema, MoodQuerySchema } from '@studymate/shared'
import { MoodService } from '../services/mood.service'
import type { AuthenticatedRequest } from '../middleware/auth'

export function createMoodRouter(moodService: MoodService): Router {
  const router = Router()

  router.use(requireAuth)

  // POST /mood — submit morning or evening check-in
  router.post(
    '/',
    moodRateLimit,
    validate(CreateMoodCheckInSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        const checkIn = await moodService.create(userId, req.body)
        res.status(201).json({ checkIn })
      } catch (err) {
        res.status(500).json({ error: 'Failed to save mood check-in' })
      }
    }
  )

  // GET /mood/trends — time-series mood data for dashboard
  router.get(
    '/trends',
    validateQuery(MoodQuerySchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        const days = Number(req.query['days'] ?? 30)
        const trends = await moodService.getTrends(userId, days)
        res.json({ trends })
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch mood trends' })
      }
    }
  )

  // GET /mood/resilience — resilience score for the dashboard
  router.get('/resilience', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req as AuthenticatedRequest
      const score = await moodService.getResilienceScore(userId)
      res.json({ score })
    } catch (err) {
      res.status(500).json({ error: 'Failed to calculate resilience score' })
    }
  })

  return router
}
