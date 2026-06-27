import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { User, CreateUserDTO } from '@studymate/shared'
import type { IUserRepository } from './interfaces'

const BCRYPT_ROUNDS = 12

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(dto: CreateUserDTO): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const examDate = new Date(dto.examDate)
    const dateOfBirth = new Date(dto.dateOfBirth)
    const isMinor = this.computeIsMinor(dateOfBirth)

    const row = await this.db.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name.trim(),
        examType: dto.examType,
        examDate,
        dateOfBirth,
        isMinor,
        language: dto.language,
      },
    })

    return this.mapRow(row)
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } })
    return row ? this.mapRow(row) : null
  }

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const row = await this.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (!row) return null
    return { ...this.mapRow(row), passwordHash: row.passwordHash }
  }

  async updateParentalConsent(userId: string, consentAt: Date): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { parentalConsentAt: consentAt },
    })
  }

  private computeIsMinor(dateOfBirth: Date): boolean {
    const today = new Date()
    const age = today.getFullYear() - dateOfBirth.getFullYear()
    const hadBirthdayThisYear =
      today.getMonth() > dateOfBirth.getMonth() ||
      (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate())
    return (hadBirthdayThisYear ? age : age - 1) < 18
  }

  private mapRow(row: {
    id: string
    email: string
    name: string
    examType: string
    examDate: Date
    dateOfBirth: Date
    isMinor: boolean
    parentalConsentAt: Date | null
    language: string
    createdAt: Date
    updatedAt: Date
  }): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      examType: row.examType as User['examType'],
      examDate: row.examDate,
      isMinor: row.isMinor,
      parentalConsentAt: row.parentalConsentAt,
      language: row.language as User['language'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
