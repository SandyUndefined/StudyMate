import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  userId: string
}

const JWT_SECRET = process.env['JWT_SECRET']

/**
 * Verifies the JWT access token from the Authorization header.
 * Token must be short-lived (15 min); refresh is handled separately.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'Server misconfiguration' })
    return
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    ;(req as AuthenticatedRequest).userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
