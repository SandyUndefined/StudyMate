import type { CreateMoodCheckInDTO, MoodCheckIn, MoodTrend, ResilienceScore } from '@studymate/shared'
import type { IMoodRepository } from '../db/repositories/interfaces'

export class MoodService {
  constructor(private readonly mood: IMoodRepository) {}

  async create(userId: string, dto: CreateMoodCheckInDTO): Promise<MoodCheckIn> {
    return this.mood.create(userId, dto)
  }

  async getTrends(userId: string, days: number): Promise<MoodTrend[]> {
    return this.mood.getTrends(userId, days)
  }

  async getResilienceScore(userId: string): Promise<ResilienceScore> {
    const trends = await this.mood.getTrends(userId, 30)
    if (trends.length < 3) {
      return { score: 50, trend: 'stable', averageDaysToRecovery: 0, calculatedAt: new Date() }
    }

    // Simple resilience: measures how quickly composite score recovers after dips
    let totalRecoveryDays = 0
    let dipCount = 0

    for (let i = 1; i < trends.length - 1; i++) {
      const prev = trends[i - 1]!.compositeWellbeingScore
      const curr = trends[i]!.compositeWellbeingScore
      const next = trends[i + 1]!.compositeWellbeingScore

      // A dip is where current is lower than both neighbors
      if (curr < prev - 1 && curr < next) {
        const daysToRecover = next > prev ? 1 : 2
        totalRecoveryDays += daysToRecover
        dipCount++
      }
    }

    const avgRecovery = dipCount > 0 ? totalRecoveryDays / dipCount : 1
    const recentAvg = trends.slice(-7).reduce((s, t) => s + t.compositeWellbeingScore, 0) / Math.min(7, trends.length)
    const olderAvg = trends.slice(0, 7).reduce((s, t) => s + t.compositeWellbeingScore, 0) / Math.min(7, trends.length)

    const score = Math.round(Math.min(100, Math.max(0, recentAvg * 10)))
    const trend: ResilienceScore['trend'] =
      recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'declining' : 'stable'

    return {
      score,
      trend,
      averageDaysToRecovery: Math.round(avgRecovery * 10) / 10,
      calculatedAt: new Date(),
    }
  }
}
