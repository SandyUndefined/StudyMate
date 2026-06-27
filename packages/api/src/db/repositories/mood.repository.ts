import { PrismaClient } from '@prisma/client'
import type { CreateMoodCheckInDTO, MoodCheckIn, MoodTrend } from '@studymate/shared'
import type { IMoodRepository, DateRange } from './interfaces'

export class PrismaMoodRepository implements IMoodRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(userId: string, dto: CreateMoodCheckInDTO): Promise<MoodCheckIn> {
    const row = await this.db.moodCheckIn.create({
      data: {
        userId,
        energy: dto.energy,
        anxiety: dto.anxiety,
        motivation: dto.motivation,
        microPromptResponse: dto.microPromptResponse ?? null,
        checkInTime: dto.checkInTime,
      },
    })
    return this.mapRow(row)
  }

  async findByUser(userId: string, range: DateRange): Promise<MoodCheckIn[]> {
    const rows = await this.db.moodCheckIn.findMany({
      where: { userId, createdAt: { gte: range.start, lte: range.end } },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(this.mapRow)
  }

  async getTrends(userId: string, days: number): Promise<MoodTrend[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const rows = await this.db.moodCheckIn.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by calendar date and average each axis
    const byDate = new Map<string, { energy: number[]; anxiety: number[]; motivation: number[] }>()

    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10)
      const existing = byDate.get(key) ?? { energy: [], anxiety: [], motivation: [] }
      existing.energy.push(row.energy)
      existing.anxiety.push(row.anxiety)
      existing.motivation.push(row.motivation)
      byDate.set(key, existing)
    }

    return Array.from(byDate.entries()).map(([dateStr, scores]) => {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const avgEnergy = avg(scores.energy)
      const avgAnxiety = avg(scores.anxiety)
      const avgMotivation = avg(scores.motivation)

      return {
        date: new Date(dateStr),
        averageEnergy: avgEnergy,
        averageAnxiety: avgAnxiety,
        averageMotivation: avgMotivation,
        // Composite: energy + motivation + inverted anxiety, normalized to 1–10
        compositeWellbeingScore: (avgEnergy + avgMotivation + (10 - avgAnxiety)) / 3,
      }
    })
  }

  async getLatest(userId: string): Promise<MoodCheckIn | null> {
    const row = await this.db.moodCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return row ? this.mapRow(row) : null
  }

  private mapRow(row: {
    id: string
    userId: string
    energy: number
    anxiety: number
    motivation: number
    microPromptResponse: string | null
    checkInTime: string
    createdAt: Date
  }): MoodCheckIn {
    return {
      id: row.id,
      userId: row.userId,
      energy: row.energy,
      anxiety: row.anxiety,
      motivation: row.motivation,
      microPromptResponse: row.microPromptResponse,
      checkInTime: row.checkInTime as MoodCheckIn['checkInTime'],
      createdAt: row.createdAt,
    }
  }
}
