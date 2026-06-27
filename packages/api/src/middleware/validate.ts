import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

/**
 * Validates request body against a Zod schema.
 * Returns 400 with structured field errors on failure.
 * No business logic — pure input gate.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        fields: result.error.flatten().fieldErrors,
      })
      return
    }

    req.body = result.data
    next()
  }
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        fields: result.error.flatten().fieldErrors,
      })
      return
    }

    req.query = result.data as typeof req.query
    next()
  }
}
