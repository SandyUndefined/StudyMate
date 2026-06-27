import { Router } from 'express'
import type { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { validate } from '../middleware/validate'
import { authRateLimit } from '../middleware/rate-limit'
import { CreateUserSchema, LoginSchema } from '@studymate/shared'
import { AuthService } from '../services/auth.service'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  router.use(cookieParser())

  // POST /auth/register
  router.post(
    '/register',
    authRateLimit,
    validate(CreateUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await authService.register(req.body)
        authService.setRefreshCookie(res, result.tokens.refreshToken)
        // Return access token in body; refresh token set as httpOnly cookie
        res.status(201).json({ user: result.user, accessToken: result.tokens.accessToken })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed'
        const status = message.includes('already registered') ? 409 : 500
        res.status(status).json({ error: message })
      }
    }
  )

  // POST /auth/login
  router.post(
    '/login',
    authRateLimit,
    validate(LoginSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await authService.login(req.body)
        if (!result) {
          res.status(401).json({ error: 'Invalid email or password' })
          return
        }
        authService.setRefreshCookie(res, result.tokens.refreshToken)
        res.json({ user: result.user, accessToken: result.tokens.accessToken })
      } catch {
        res.status(500).json({ error: 'Login failed' })
      }
    }
  )

  // POST /auth/refresh — reads refresh token from httpOnly cookie
  router.post('/refresh', authRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies['refresh_token'] as string | undefined
      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token' })
        return
      }
      const tokens = await authService.refreshTokens(refreshToken)
      if (!tokens) {
        authService.clearRefreshCookie(res)
        res.status(401).json({ error: 'Invalid or expired session' })
        return
      }
      authService.setRefreshCookie(res, tokens.refreshToken)
      res.json({ accessToken: tokens.accessToken })
    } catch {
      res.status(500).json({ error: 'Token refresh failed' })
    }
  })

  // POST /auth/logout
  router.post('/logout', async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies['refresh_token'] as string | undefined
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken)
      }
      authService.clearRefreshCookie(res)
      res.status(204).send()
    } catch {
      res.status(500).json({ error: 'Logout failed' })
    }
  })

  return router
}
