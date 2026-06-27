import { z } from 'zod'
import { EXAM_TYPES, LANGUAGES } from '../constants'

export const CreateUserSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  examType: z.enum(EXAM_TYPES),
  examDate: z.string().datetime({ message: 'examDate must be an ISO datetime string' }),
  dateOfBirth: z.string().datetime({ message: 'dateOfBirth must be an ISO datetime string' }),
  language: z.enum(LANGUAGES).default('en'),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>
