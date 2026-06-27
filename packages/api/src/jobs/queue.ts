import Queue from 'bull'

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379'

const RETRY_OPTIONS: Queue.JobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 50,
}

export function createQueue<T extends object>(name: string): Queue.Queue<T> {
  return new Queue<T>(name, REDIS_URL, { defaultJobOptions: RETRY_OPTIONS })
}

export const QUEUE_NAMES = {
  JOURNAL_ANALYSIS: 'journal-analysis',
  WEEKLY_SUMMARY: 'weekly-summary',
  MOOD_INSIGHT: 'mood-insight',
} as const
