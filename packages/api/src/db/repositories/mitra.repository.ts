import { PrismaClient } from '@prisma/client'
import type { MitraSession, MitraMessage } from '@studymate/shared'
import type { IMitraSessionRepository } from './interfaces'

export class PrismaMitraSessionRepository implements IMitraSessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async createSession(userId: string): Promise<MitraSession> {
    const row = await this.db.mitraSession.create({
      data: { userId },
      include: { messages: true },
    })
    return this.mapSession(row)
  }

  async findSessionById(id: string): Promise<MitraSession | null> {
    const row = await this.db.mitraSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    return row ? this.mapSession(row) : null
  }

  async addMessage(
    sessionId: string,
    message: Omit<MitraMessage, 'id' | 'sessionId' | 'createdAt'>
  ): Promise<MitraMessage> {
    const row = await this.db.mitraMessage.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
        language: message.language,
        crisisFlag: message.crisisFlag,
      },
    })
    return this.mapMessage(row)
  }

  async getRecentMessages(sessionId: string, limit: number): Promise<MitraMessage[]> {
    const rows = await this.db.mitraMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.reverse().map(this.mapMessage)
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.db.mitraSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    })
  }

  private mapSession(row: {
    id: string
    userId: string
    startedAt: Date
    lastActivityAt: Date
    messages: Array<{
      id: string
      sessionId: string
      role: string
      content: string
      language: string
      crisisFlag: string
      createdAt: Date
    }>
  }): MitraSession {
    return {
      id: row.id,
      userId: row.userId,
      messages: row.messages.map(this.mapMessage),
      startedAt: row.startedAt,
      lastActivityAt: row.lastActivityAt,
    }
  }

  private mapMessage(row: {
    id: string
    sessionId: string
    role: string
    content: string
    language: string
    crisisFlag: string
    createdAt: Date
  }): MitraMessage {
    return {
      id: row.id,
      sessionId: row.sessionId,
      role: row.role as MitraMessage['role'],
      content: row.content,
      language: row.language as MitraMessage['language'],
      crisisFlag: row.crisisFlag as MitraMessage['crisisFlag'],
      createdAt: row.createdAt,
    }
  }
}
