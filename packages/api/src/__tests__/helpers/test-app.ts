/**
 * Creates a minimal Express app for integration testing.
 * Wires real routes with mocked services — no DB, no AI, no Redis.
 */
import express from 'express'
import cookieParser from 'cookie-parser'
import { createJournalRouter } from '../../routes/journal.route'
import { createMitraRouter } from '../../routes/mitra.route'
import { createAuthRouter } from '../../routes/auth.route'
import { sanitiseResponse } from '../../middleware/security'
import type { JournalService } from '../../services/journal.service'
import type { MitraService } from '../../services/mitra.service'
import type { AuthService } from '../../services/auth.service'

export function createTestApp(services: {
  journal?: Partial<JournalService>
  mitra?: Partial<MitraService>
  auth?: Partial<AuthService>
}) {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use(sanitiseResponse())

  if (services.journal) {
    app.use('/api/journal', createJournalRouter(services.journal as JournalService))
  }
  if (services.mitra) {
    app.use('/api/mitra', createMitraRouter(services.mitra as MitraService))
  }
  if (services.auth) {
    app.use('/api/auth', createAuthRouter(services.auth as AuthService))
  }

  return app
}

/** Returns a signed JWT for userId using the test secret. */
export function makeTestToken(userId: string): string {
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
  return jwt.sign({ sub: userId }, 'test-jwt-secret-at-least-32-characters-long', { expiresIn: 900 })
}
