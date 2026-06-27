import rateLimit from 'express-rate-limit'
import { RATE_LIMITS } from '@studymate/shared'

export const journalRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.JOURNAL_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many journal entries. Please wait before submitting again.' },
  keyGenerator: (req) => (req as { userId?: string }).userId ?? req.ip ?? 'unknown',
})

export const chatRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.CHAT_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please take a short break.' },
  keyGenerator: (req) => (req as { userId?: string }).userId ?? req.ip ?? 'unknown',
})

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMITS.AUTH_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a minute.' },
})

export const moodRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.MOOD_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many mood check-ins.' },
  keyGenerator: (req) => (req as { userId?: string }).userId ?? req.ip ?? 'unknown',
})
