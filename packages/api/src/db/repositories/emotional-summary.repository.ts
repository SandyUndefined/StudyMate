import { PrismaClient } from '@prisma/client'
import type { EmotionalSummary } from '@studymate/shared'
import type { IEmotionalSummaryRepository } from './interfaces'

// Prisma model shape from schema.prisma — flat fields
interface StoredSummary {
  id: string
  userId: string
  periodStart: Date
  periodEnd: Date
  dominantSentiment: string
  avgEnergy: number
  avgAnxiety: number
  avgMotivation: number
  topStressTriggers: unknown
  recentCognitiveDistortions: unknown
  crisisHistoryThisPeriod: boolean
  createdAt: Date
}

export class PrismaEmotionalSummaryRepository implements IEmotionalSummaryRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    userId: string,
    summary: Omit<EmotionalSummary, 'id' | 'userId'>
  ): Promise<EmotionalSummary> {
    const row = await this.db.emotionalSummary.create({
      data: {
        userId,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
        dominantSentiment: summary.dominantSentiment,
        avgEnergy: summary.averageMoodScores.energy,
        avgAnxiety: summary.averageMoodScores.anxiety,
        avgMotivation: summary.averageMoodScores.motivation,
        topStressTriggers: summary.topStressTriggers,
        recentCognitiveDistortions: summary.recentCognitiveDistortions,
        crisisHistoryThisPeriod: summary.crisisHistoryThisPeriod,
      },
    })
    return this.mapRow(row as StoredSummary)
  }

  async findByUser(userId: string, limit: number): Promise<EmotionalSummary[]> {
    const rows = await this.db.emotionalSummary.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
      take: limit,
    })
    return (rows as StoredSummary[]).map(this.mapRow)
  }

  async findLatest(userId: string): Promise<EmotionalSummary | null> {
    const row = await this.db.emotionalSummary.findFirst({
      where: { userId },
      orderBy: { periodStart: 'desc' },
    })
    return row ? this.mapRow(row as StoredSummary) : null
  }

  private mapRow(row: StoredSummary): EmotionalSummary {
    return {
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      dominantSentiment: row.dominantSentiment,
      averageMoodScores: {
        energy: row.avgEnergy,
        anxiety: row.avgAnxiety,
        motivation: row.avgMotivation,
      },
      topStressTriggers: (row.topStressTriggers as string[]) ?? [],
      recentCognitiveDistortions: (row.recentCognitiveDistortions as string[]) ?? [],
      crisisHistoryThisPeriod: row.crisisHistoryThisPeriod,
    }
  }
}
