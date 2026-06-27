import type { JournalEntry, CreateJournalEntryDTO, JournalPrompt, TriggerPattern } from '@studymate/shared'
import type { IJournalRepository, IUserRepository } from '../db/repositories/interfaces'
import type { PrismaJournalRepository } from '../db/repositories/journal.repository'
import type { CrisisService } from './crisis.service'
import { runJournalAnalysis } from '../jobs/journal-analysis.job'
import { computeExamPhase } from './exam-context'

const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: 'general_1',
    text: 'How are you feeling right now? Not about the exam — just you, as a person.',
    textHi: 'अभी आप कैसा महसूस कर रहे हैं? परीक्षा के बारे में नहीं — बस आप, एक इंसान के रूप में।',
    examPhase: 'foundation',
    contextType: 'general',
  },
  {
    id: 'general_2',
    text: "What's one thing that felt heavy today? You don't have to fix it — just name it.",
    textHi: 'आज एक ऐसी चीज़ क्या थी जो भारी लगी? आपको इसे ठीक नहीं करना है — बस इसे नाम दें।',
    examPhase: 'intensive',
    contextType: 'general',
  },
  {
    id: 'mock_pre',
    text: "Mock test coming up. How are you feeling about it? What's the one thing making you most anxious?",
    textHi: 'मॉक टेस्ट आ रहा है। आप इसके बारे में कैसा महसूस कर रहे हैं? एक चीज़ जो सबसे ज़्यादा चिंता दे रही है?',
    examPhase: 'mock_cycle',
    contextType: 'pre_mock',
  },
  {
    id: 'mock_post',
    text: 'How did the score land for you today? What story are you telling yourself about it?',
    textHi: 'आज का स्कोर आपको कैसा लगा? आप खुद से इसके बारे में क्या कह रहे हैं?',
    examPhase: 'mock_cycle',
    contextType: 'post_mock',
  },
  {
    id: 'burnout',
    text: "When did you last do something that had nothing to do with studying? How did it feel?",
    textHi: 'आखिरी बार आपने कुछ ऐसा कब किया जिसका पढ़ाई से कोई लेना-देना नहीं था? कैसा लगा?',
    examPhase: 'intensive',
    contextType: 'burnout_risk',
  },
  {
    id: 'pre_exam',
    text: "The big day is almost here. What do you need to hear most right now?",
    textHi: 'बड़ा दिन लगभग आ गया है। अभी आपको सबसे ज़्यादा क्या सुनने की ज़रूरत है?',
    examPhase: 'final_sprint',
    contextType: 'pre_exam',
  },
]

export class JournalService {
  constructor(
    private readonly journal: IJournalRepository,
    private readonly users: IUserRepository,
    private readonly crisisService: CrisisService
  ) {}

  async createEntry(
    userId: string,
    dto: CreateJournalEntryDTO,
    plaintextForAnalysis?: string
  ): Promise<JournalEntry> {
    const entry = await this.journal.create(userId, dto)

    // Fire analysis in background — never blocks the HTTP response.
    // plaintextForAnalysis is processed in-memory and never written to DB.
    if (plaintextForAnalysis) {
      void runJournalAnalysis(
        { entryId: entry.id, userId, plaintextForAnalysis, language: dto.language },
        this.journal as PrismaJournalRepository,
        this.crisisService
      ).catch((err: unknown) => {
        console.error('[journal-analysis] background job failed:', err)
      })
    }

    return entry
  }

  async getEntries(
    userId: string,
    options: { limit: number; offset: number; startDate?: string; endDate?: string }
  ): Promise<JournalEntry[]> {
    const range =
      options.startDate && options.endDate
        ? { start: new Date(options.startDate), end: new Date(options.endDate) }
        : undefined

    return this.journal.findByUser(userId, { limit: options.limit, offset: options.offset }, range)
  }

  async getTodayPrompts(userId: string): Promise<JournalPrompt[]> {
    const user = await this.users.findById(userId)
    if (!user) return JOURNAL_PROMPTS.slice(0, 2)

    const daysUntil = Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const phase = computeExamPhase(daysUntil)

    const phasePrompts = JOURNAL_PROMPTS.filter((p) => p.examPhase === phase)
    const generalPrompts = JOURNAL_PROMPTS.filter((p) => p.contextType === 'general')

    // Return up to 2 prompts: 1 phase-specific + 1 general
    return [...phasePrompts.slice(0, 1), ...generalPrompts.slice(0, 1)]
  }

  async getTriggerPatterns(userId: string): Promise<TriggerPattern[]> {
    return this.journal.findTriggerPatterns(userId, 30)
  }
}
