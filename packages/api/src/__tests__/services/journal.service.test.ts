jest.mock('../../jobs/journal-analysis.job', () => ({
  runJournalAnalysis: jest.fn().mockResolvedValue(undefined),
}))

import { JournalService } from '../../services/journal.service'
import { runJournalAnalysis } from '../../jobs/journal-analysis.job'
import {
  makeMockJournalRepo,
  makeMockUserRepo,
  makeJournalEntry,
  makeUser,
} from '../helpers/mock-factories'
import type { CrisisService } from '../../services/crisis.service'

const mockRunAnalysis = runJournalAnalysis as jest.MockedFunction<typeof runJournalAnalysis>

function makeMockCrisisService(): jest.Mocked<Pick<CrisisService, 'logEvent'>> {
  return { logEvent: jest.fn().mockResolvedValue(undefined) }
}

describe('JournalService', () => {
  describe('createEntry()', () => {
    test('saves the entry and returns it', async () => {
      const journalRepo = makeMockJournalRepo()
      const userRepo = makeMockUserRepo()
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      const dto = { encryptedContent: 'encrypted-data', wordCount: 100, language: 'en' as const }
      const entry = await service.createEntry('user-1', dto)

      expect(journalRepo.create).toHaveBeenCalledWith('user-1', dto)
      expect(entry.id).toBe('entry-1')
    })

    test('fires background analysis when plaintext provided', async () => {
      const journalRepo = makeMockJournalRepo()
      const entry = makeJournalEntry({ id: 'entry-42' })
      journalRepo.create.mockResolvedValue(entry)

      const userRepo = makeMockUserRepo()
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      const dto = { encryptedContent: 'enc', wordCount: 50, language: 'en' as const }
      await service.createEntry('user-1', dto, 'Today was really tough. I felt trapped.')

      // Give the microtask queue a tick to fire the void call
      await Promise.resolve()

      expect(mockRunAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 'entry-42',
          userId: 'user-1',
          plaintextForAnalysis: 'Today was really tough. I felt trapped.',
          language: 'en',
        }),
        expect.anything(),
        expect.anything()
      )
    })

    test('does NOT fire background analysis when no plaintext', async () => {
      mockRunAnalysis.mockClear()
      const journalRepo = makeMockJournalRepo()
      const userRepo = makeMockUserRepo()
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      await service.createEntry('user-1', { encryptedContent: 'enc', wordCount: 10, language: 'en' })
      await Promise.resolve()

      expect(mockRunAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('getTodayPrompts()', () => {
    test('returns fallback prompts when user not found', async () => {
      const journalRepo = makeMockJournalRepo()
      const userRepo = makeMockUserRepo()
      userRepo.findById.mockResolvedValue(null)
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      const prompts = await service.getTodayPrompts('user-1')
      expect(prompts.length).toBeGreaterThan(0)
    })

    test('returns at most 2 prompts', async () => {
      const journalRepo = makeMockJournalRepo()
      const userRepo = makeMockUserRepo()
      userRepo.findById.mockResolvedValue(makeUser({
        examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days out
      }))
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      const prompts = await service.getTodayPrompts('user-1')
      expect(prompts.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getTriggerPatterns()', () => {
    test('delegates to repository with 30 day lookback', async () => {
      const journalRepo = makeMockJournalRepo()
      const userRepo = makeMockUserRepo()
      const crisisService = makeMockCrisisService()
      const service = new JournalService(journalRepo, userRepo, crisisService as unknown as CrisisService)

      await service.getTriggerPatterns('user-1')
      expect(journalRepo.findTriggerPatterns).toHaveBeenCalledWith('user-1', 30)
    })
  })
})
