import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import type { Response } from 'express'
import type { AuthResponse, AuthTokens, CreateUserInput, LoginInput } from '@studymate/shared'
import { TOKEN_TTL } from '@studymate/shared'
import type { IUserRepository } from '../db/repositories/interfaces'
import type { Env } from '../config/env'

// Secrets injected at construction time from validated env — no process.env access in service
export class AuthService {
  private readonly JWT_SECRET: string
  private readonly JWT_REFRESH_SECRET: string
  private readonly COOKIE_SECURE: boolean

  constructor(
    private readonly users: IUserRepository,
    private readonly db: PrismaClient,
    env: Env
  ) {
    this.JWT_SECRET = env.JWT_SECRET
    this.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET
    this.COOKIE_SECURE = env.COOKIE_SECURE
  }

  async register(dto: CreateUserInput): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email)
    if (existing) throw new Error('Email already registered')

    const user = await this.users.create(dto)
    const tokens = await this.generateTokens(user.id)

    return {
      user: {
        id: user.id,
        name: user.name,
        examType: user.examType,
        examDate: user.examDate,
        language: user.language,
        daysUntilExam: Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
      tokens,
    }
  }

  async login(dto: LoginInput): Promise<AuthResponse | null> {
    const user = await this.users.findByEmail(dto.email)
    if (!user) return null

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatches) return null

    const tokens = await this.generateTokens(user.id)

    return {
      user: {
        id: user.id,
        name: user.name,
        examType: user.examType,
        examDate: user.examDate,
        language: user.language,
        daysUntilExam: Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
      tokens,
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
    try {
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { sub: string }
      const tokenHash = this.hashToken(refreshToken)

      const stored = await this.db.refreshToken.findUnique({ where: { tokenHash } })
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) return null

      // Rotate: revoke old, issue new
      await this.db.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      })

      return this.generateTokens(payload.sub)
    } catch {
      return null
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken)
    await this.db.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    }).catch(() => void 0)
  }

  /**
   * Sets the refresh token as an httpOnly, Secure, SameSite=Strict cookie.
   * Call this on login, register, and token refresh responses.
   */
  setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: TOKEN_TTL.REFRESH_DAYS * 24 * 60 * 60 * 1000,
      path: '/api/auth',  // Only sent to auth endpoints
    })
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie('refresh_token', { path: '/api/auth' })
  }

  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = jwt.sign({ sub: userId }, this.JWT_SECRET, {
      expiresIn: TOKEN_TTL.ACCESS_SECONDS,
    })

    const refreshToken = jwt.sign({ sub: userId }, this.JWT_REFRESH_SECRET, {
      expiresIn: `${TOKEN_TTL.REFRESH_DAYS}d`,
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL.REFRESH_DAYS)

    await this.db.refreshToken.create({
      data: { userId, tokenHash: this.hashToken(refreshToken), expiresAt },
    })

    return { accessToken, refreshToken }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
