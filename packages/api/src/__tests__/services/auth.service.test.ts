import { AuthService } from '../../services/auth.service'
import { makeMockUserRepo, makeUser } from '../helpers/mock-factories'
import type { Env } from '../../config/env'
import bcrypt from 'bcryptjs'

const mockRefreshTokenCreate = jest.fn().mockResolvedValue({})
const mockRefreshTokenFindUnique = jest.fn()
const mockRefreshTokenUpdate = jest.fn()
const mockRefreshTokenUpdateMany = jest.fn()

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    refreshToken: {
      create: mockRefreshTokenCreate,
      findUnique: mockRefreshTokenFindUnique,
      update: mockRefreshTokenUpdate,
      updateMany: mockRefreshTokenUpdateMany,
    },
  })),
}))

import { PrismaClient } from '@prisma/client'

function makeEnv(): Env {
  return {
    PORT: 3001,
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters',
    ANTHROPIC_API_KEY: 'test-key',
    CLIENT_ORIGIN: 'http://localhost:3000',
    COOKIE_SECURE: false,
  }
}

const EXAM_DATE_ISO = new Date('2025-05-15').toISOString()
const DOB_ISO = new Date('2005-01-01').toISOString()

describe('AuthService', () => {
  let service: AuthService
  let db: InstanceType<typeof PrismaClient>

  beforeEach(() => {
    db = new PrismaClient()
    mockRefreshTokenCreate.mockResolvedValue({})
  })

  describe('register()', () => {
    test('throws when email already exists', async () => {
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue({ ...makeUser(), passwordHash: 'hash' }),
      })
      service = new AuthService(userRepo, db, makeEnv())

      await expect(
        service.register({ name: 'Arjun', email: 'arjun@test.com', password: 'pass123', examType: 'JEE', examDate: EXAM_DATE_ISO, dateOfBirth: DOB_ISO, language: 'en' })
      ).rejects.toThrow('Email already registered')
    })

    test('returns authResponse with accessToken on success', async () => {
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue(null),
      })
      service = new AuthService(userRepo, db, makeEnv())

      const result = await service.register({
        name: 'Priya',
        email: 'priya@test.com',
        password: 'strongPassword1!',
        examType: 'NEET',
        examDate: EXAM_DATE_ISO,
        dateOfBirth: DOB_ISO,
        language: 'en',
      })

      expect(result.user.name).toBe('Arjun Sharma') // from makeUser() mock
      expect(result.tokens.accessToken).toBeTruthy()
      expect(result.tokens.refreshToken).toBeTruthy()
      expect(mockRefreshTokenCreate).toHaveBeenCalled()
    })
  })

  describe('login()', () => {
    test('returns null for unknown email', async () => {
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue(null),
      })
      service = new AuthService(userRepo, db, makeEnv())

      const result = await service.login({ email: 'nobody@test.com', password: 'pass' })
      expect(result).toBeNull()
    })

    test('returns null for wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 4)
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue({ ...makeUser(), passwordHash: hash }),
      })
      service = new AuthService(userRepo, db, makeEnv())

      const result = await service.login({ email: 'arjun@test.com', password: 'wrong-password' })
      expect(result).toBeNull()
    })

    test('returns authResponse with tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('correct-password', 4)
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue({ ...makeUser(), passwordHash: hash }),
      })
      service = new AuthService(userRepo, db, makeEnv())

      const result = await service.login({ email: 'arjun@test.com', password: 'correct-password' })
      expect(result).not.toBeNull()
      expect(result?.tokens.accessToken).toBeTruthy()
    })
  })

  describe('refreshTokens()', () => {
    test('returns null when token not found in DB', async () => {
      mockRefreshTokenFindUnique.mockResolvedValue(null)
      const userRepo = makeMockUserRepo({
        findByEmail: jest.fn().mockResolvedValue(null),
      })
      service = new AuthService(userRepo, db, makeEnv())

      const { tokens } = await service.register({
        name: 'T', email: 't@t.com', password: 'p', examType: 'JEE',
        examDate: EXAM_DATE_ISO, dateOfBirth: DOB_ISO, language: 'en',
      })

      const result = await service.refreshTokens(tokens.refreshToken)
      expect(result).toBeNull()
    })

    test('returns null for completely invalid token string', async () => {
      const userRepo = makeMockUserRepo()
      service = new AuthService(userRepo, db, makeEnv())

      const result = await service.refreshTokens('not-a-real-jwt')
      expect(result).toBeNull()
    })
  })

  describe('setRefreshCookie()', () => {
    test('sets httpOnly cookie with correct options', () => {
      const userRepo = makeMockUserRepo()
      service = new AuthService(userRepo, db, makeEnv())

      const mockCookie = jest.fn()
      const mockRes = { cookie: mockCookie } as unknown as import('express').Response

      service.setRefreshCookie(mockRes, 'my-refresh-token')

      expect(mockCookie).toHaveBeenCalledWith(
        'refresh_token',
        'my-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth',
        })
      )
    })
  })
})
