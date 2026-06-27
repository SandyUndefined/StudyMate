/**
 * Validates required environment variables at startup.
 * The process exits immediately if any required variable is missing,
 * so misconfigured deployments fail fast rather than silently.
 */

interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  OPENAI_API_KEY: string
  PORT: number
  CLIENT_ORIGIN: string
  NODE_ENV: 'development' | 'test' | 'production'
  COOKIE_SECURE: boolean
}

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'OPENAI_API_KEY'] as const

export function loadEnv(): Env {
  const missing = REQUIRED.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`)
    console.error('[startup] Copy .env.example to .env and fill in the values.')
    process.exit(1)
  }

  const nodeEnv = (process.env['NODE_ENV'] ?? 'development') as Env['NODE_ENV']

  return {
    DATABASE_URL: process.env['DATABASE_URL']!,
    JWT_SECRET: process.env['JWT_SECRET']!,
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET']!,
    OPENAI_API_KEY: process.env['OPENAI_API_KEY']!,
    PORT: Number(process.env['PORT'] ?? 4000),
    CLIENT_ORIGIN: process.env['CLIENT_ORIGIN'] ?? 'http://localhost:3000',
    NODE_ENV: nodeEnv,
    COOKIE_SECURE: nodeEnv === 'production',
  }
}

export type { Env }
