import express from 'express'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'

import { loadEnv } from './config/env'
import { securityHeaders, requestId, sanitiseResponse } from './middleware/security'

import { createAuthRouter } from './routes/auth.route'
import { createJournalRouter } from './routes/journal.route'
import { createMoodRouter } from './routes/mood.route'
import { createMitraRouter } from './routes/mitra.route'
import { createAccountRouter } from './routes/account.route'

import { AuthService } from './services/auth.service'
import { JournalService } from './services/journal.service'
import { MoodService } from './services/mood.service'
import { MitraService } from './services/mitra.service'
import { CrisisService } from './services/crisis.service'

import { PrismaUserRepository } from './db/repositories/user.repository'
import { PrismaJournalRepository } from './db/repositories/journal.repository'
import { PrismaMoodRepository } from './db/repositories/mood.repository'
import { PrismaMitraSessionRepository } from './db/repositories/mitra.repository'
import { PrismaEmotionalSummaryRepository } from './db/repositories/emotional-summary.repository'

async function bootstrap(): Promise<void> {
  // Validate env at startup — exits immediately if any required var is missing
  const env = loadEnv()

  const db = new PrismaClient()
  await db.$connect()

  // Repositories
  const userRepo = new PrismaUserRepository(db)
  const journalRepo = new PrismaJournalRepository(db)
  const moodRepo = new PrismaMoodRepository(db)
  const mitraRepo = new PrismaMitraSessionRepository(db)
  const summaryRepo = new PrismaEmotionalSummaryRepository(db)

  // Services
  const authService = new AuthService(userRepo, db, env)
  const crisisService = new CrisisService(db)
  const journalService = new JournalService(journalRepo, userRepo, crisisService)
  const moodService = new MoodService(moodRepo)
  const mitraService = new MitraService(mitraRepo, summaryRepo, userRepo, crisisService)

  const app = express()
  app.set('trust proxy', 1)

  // ── Security middleware ─────────────────────────────────────────────────────
  app.use(requestId())
  app.use(securityHeaders())
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '512kb' }))
  app.use(sanitiseResponse())

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/api/auth', createAuthRouter(authService))
  app.use('/api/journal', createJournalRouter(journalService))
  app.use('/api/mood', createMoodRouter(moodService))
  app.use('/api/mitra', createMitraRouter(mitraService))
  app.use('/api/account', createAccountRouter(db))

  // Health check — no auth required
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  )

  // 404 catch-all
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  // Global error handler — never expose stack traces to clients
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[unhandled error]', err.message)
    res.status(500).json({ error: 'An unexpected error occurred' })
  })

  app.listen(env.PORT, () => {
    console.log(`StudyMate API listening on port ${env.PORT} [${env.NODE_ENV}]`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err)
  process.exit(1)
})
