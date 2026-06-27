import { z } from 'zod'

export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long — please keep it under 2000 characters'),
  sessionId: z.string().uuid().optional(),
})

export const InterventionFeedbackSchema = z.object({
  interventionId: z.string().uuid(),
  helpfulnessRating: z.number().int().min(1).max(5),
})

export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type InterventionFeedbackInput = z.infer<typeof InterventionFeedbackSchema>
