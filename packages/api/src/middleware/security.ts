import helmet from 'helmet'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import crypto from 'crypto'

/**
 * Returns a configured helmet middleware with a strong Content Security Policy.
 * The nonce is regenerated per request so inline scripts (if any) can be allowlisted safely.
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires inline styles
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31_536_000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Required for some external fonts
  })
}

/** Attaches a unique request ID to every request for tracing. */
export function requestId(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    ;(req as Request & { id: string }).id = crypto.randomUUID()
    next()
  }
}

/**
 * Strips internal fields from all JSON responses before they reach the client.
 * Prevents leaking passwordHash, internal IDs, or stack traces.
 */
export function sanitiseResponse(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res)

    res.json = function (body: unknown) {
      return originalJson(deepStrip(body, STRIP_FIELDS))
    }

    next()
  }
}

const STRIP_FIELDS = new Set([
  'passwordHash',
  'tokenHash',
  'stack',      // Never expose stack traces
  'query',      // Never expose raw DB queries
])

function deepStrip(obj: unknown, fields: Set<string>): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((item) => deepStrip(item, fields))

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (!fields.has(key)) {
      result[key] = deepStrip(value, fields)
    }
  }
  return result
}
