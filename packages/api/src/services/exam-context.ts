import type { User, ExamContext } from '@studymate/shared'
import type { ExamPhase } from '@studymate/shared'

export function computeExamContext(user: User): ExamContext {
  const daysUntilExam = Math.ceil(
    (user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return {
    examType: user.examType,
    examDate: user.examDate,
    daysUntilExam,
    currentPhase: computeExamPhase(daysUntilExam),
  }
}

export function computeExamPhase(daysUntilExam: number): ExamPhase {
  if (daysUntilExam < 0) return 'post_exam'
  if (daysUntilExam <= 7) return 'exam_week'
  if (daysUntilExam <= 30) return 'final_sprint'
  if (daysUntilExam <= 90) return 'mock_cycle'
  if (daysUntilExam <= 180) return 'intensive'
  return 'foundation'
}
