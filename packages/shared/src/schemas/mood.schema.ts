import { z } from 'zod'
import { MOOD_MIN, MOOD_MAX } from '../constants'

const moodAxis = z
  .number()
  .int()
  .min(MOOD_MIN, `Score must be at least ${MOOD_MIN}`)
  .max(MOOD_MAX, `Score must be at most ${MOOD_MAX}`)

export const CreateMoodCheckInSchema = z.object({
  energy: moodAxis,
  anxiety: moodAxis,
  motivation: moodAxis,
  microPromptResponse: z.string().max(200).optional(),
  checkInTime: z.enum(['morning', 'evening']),
})

export const MoodQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
})

export type CreateMoodCheckInInput = z.infer<typeof CreateMoodCheckInSchema>
export type MoodQueryInput = z.infer<typeof MoodQuerySchema>
