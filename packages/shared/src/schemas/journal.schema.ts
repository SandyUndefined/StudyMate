import { z } from 'zod'
import { LANGUAGES } from '../constants'

export const CreateJournalEntrySchema = z.object({
  // Client encrypts content before sending — we validate it's a non-empty string
  encryptedContent: z
    .string()
    .min(1, 'Encrypted content is required')
    .max(100_000, 'Entry too large'),
  wordCount: z.number().int().min(1).max(10_000),
  language: z.enum(LANGUAGES),
  /**
   * Optional plaintext submitted alongside the ciphertext solely for AI analysis.
   * The server processes it in-memory only — it is NEVER written to any database.
   * Only the structured results (sentiment score, trigger tags) are persisted.
   * The client controls whether to include this field; analysis is skipped if absent.
   */
  plaintextForAnalysis: z.string().max(10_000).optional(),
})

export const JournalQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>
export type JournalQueryInput = z.infer<typeof JournalQuerySchema>
