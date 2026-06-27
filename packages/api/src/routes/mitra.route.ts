import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { chatRateLimit } from '../middleware/rate-limit'
import { SendMessageSchema, InterventionFeedbackSchema } from '@studymate/shared'
import { MitraService } from '../services/mitra.service'
import type { AuthenticatedRequest } from '../middleware/auth'

export function createMitraRouter(mitraService: MitraService): Router {
  const router = Router()

  router.use(requireAuth)

  // POST /mitra/chat — send a message to Mitra
  router.post(
    '/chat',
    chatRateLimit,
    validate(SendMessageSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        const response = await mitraService.sendMessage(userId, req.body)
        res.json(response)
      } catch (err) {
        res.status(500).json({ error: 'Mitra is temporarily unavailable. Please try again.' })
      }
    }
  )

  // GET /mitra/session/:sessionId — load a previous session
  router.get('/session/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req as AuthenticatedRequest
      const sessionId = Array.isArray(req.params['sessionId'])
        ? (req.params['sessionId'][0] ?? '')
        : (req.params['sessionId'] ?? '')
      const session = await mitraService.getSession(userId, sessionId)
      if (!session) {
        res.status(404).json({ error: 'Session not found' })
        return
      }
      res.json({ session })
    } catch (err) {
      res.status(500).json({ error: 'Failed to load session' })
    }
  })

  // POST /mitra/intervention/feedback — rate an intervention after completion
  router.post(
    '/intervention/feedback',
    validate(InterventionFeedbackSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req as AuthenticatedRequest
        await mitraService.recordInterventionFeedback(userId, req.body)
        res.status(204).send()
      } catch (err) {
        res.status(500).json({ error: 'Failed to record feedback' })
      }
    }
  )

  return router
}
