import { PrismaClient } from '@prisma/client'
import type {
  CreateJournalEntryDTO,
  JournalEntry,
  JournalAnalysis,
  TriggerPattern,
} from '@studymate/shared'
import type { IJournalRepository, DateRange, PaginationOptions } from './interfaces'

export class PrismaJournalRepository implements IJournalRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(userId: string, dto: CreateJournalEntryDTO): Promise<JournalEntry> {
    const row = await this.db.journalEntry.create({
      data: {
        userId,
        encryptedContent: dto.encryptedContent,
        wordCount: dto.wordCount,
        language: dto.language,
      },
    })
    return this.mapRow(row)
  }

  async findById(id: string): Promise<JournalEntry | null> {
    const row = await this.db.journalEntry.findUnique({ where: { id } })
    return row ? this.mapRow(row) : null
  }

  async findByUser(
    userId: string,
    options: PaginationOptions,
    range?: DateRange
  ): Promise<JournalEntry[]> {
    const rows = await this.db.journalEntry.findMany({
      where: {
        userId,
        ...(range && { createdAt: { gte: range.start, lte: range.end } }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    })
    return rows.map(this.mapRow)
  }

  async updateAnalysis(id: string, analysis: JournalAnalysis | null): Promise<void> {
    if (!analysis) return
    await this.db.journalEntry.update({
      where: { id },
      data: {
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        energyInferred: analysis.energyLevel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stressTriggers: analysis.stressTriggers as any,
        cognitiveDistortions: analysis.cognitiveDistortions,
        crisisLevel: analysis.crisisAssessment.level,
        keyThemes: analysis.keyThemes,
        analysedAt: analysis.analysedAt,
      },
    })
  }

  async findTriggerPatterns(userId: string, lookbackDays: number): Promise<TriggerPattern[]> {
    const since = new Date()
    since.setDate(since.getDate() - lookbackDays)

    const entries = await this.db.journalEntry.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { userId, createdAt: { gte: since }, stressTriggers: { not: null } as any },
      select: { stressTriggers: true, createdAt: true },
    })

    // Aggregate trigger patterns across entries
    const triggerMap = new Map<string, { sentiments: number[]; dates: Date[] }>()

    for (const entry of entries) {
      const triggers = entry.stressTriggers as TriggerPattern[] | null
      if (!triggers) continue
      for (const trigger of triggers) {
        const existing = triggerMap.get(trigger.topic) ?? { sentiments: [], dates: [] }
        existing.sentiments.push(trigger.averageSentiment)
        existing.dates.push(entry.createdAt)
        triggerMap.set(trigger.topic, existing)
      }
    }

    return Array.from(triggerMap.entries()).map(([topic, data]) => ({
      topic,
      occurrences: data.sentiments.length,
      averageSentiment: data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length,
      firstSeen: data.dates.reduce((a, b) => (a < b ? a : b)),
      lastSeen: data.dates.reduce((a, b) => (a > b ? a : b)),
    }))
  }

  async countByUser(userId: string): Promise<number> {
    return this.db.journalEntry.count({ where: { userId } })
  }

  private mapRow(row: {
    id: string
    userId: string
    encryptedContent: string
    wordCount: number
    language: string
    sentimentScore: number | null
    sentimentLabel: string | null
    energyInferred: number | null
    stressTriggers: unknown
    cognitiveDistortions: unknown
    crisisLevel: string
    keyThemes: unknown
    analysedAt: Date | null
    createdAt: Date
  }): JournalEntry {
    const hasAnalysis =
      row.sentimentScore !== null && row.sentimentLabel !== null && row.analysedAt !== null

    return {
      id: row.id,
      userId: row.userId,
      content: '',               // Never stored server-side; empty placeholder
      encryptedContent: row.encryptedContent,
      wordCount: row.wordCount,
      language: row.language as JournalEntry['language'],
      analysis: hasAnalysis
        ? {
            sentimentScore: row.sentimentScore!,
            sentimentLabel: row.sentimentLabel! as JournalAnalysis['sentimentLabel'],
            energyLevel: row.energyInferred ?? 5,
            stressTriggers: (row.stressTriggers as JournalAnalysis['stressTriggers']) ?? [],
            cognitiveDistortions: (row.cognitiveDistortions as JournalAnalysis['cognitiveDistortions']) ?? [],
            crisisAssessment: {
              level: row.crisisLevel as JournalAnalysis['crisisAssessment']['level'],
              triggerPhrases: [],
              confidence: 0,
              recommendedAction: 'none',
            },
            keyThemes: (row.keyThemes as string[]) ?? [],
            analysedAt: row.analysedAt!,
          }
        : null,
      createdAt: row.createdAt,
    }
  }
}
