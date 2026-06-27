// Must be set before the auth middleware module is loaded
process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-32-characters-long'

jest.mock('../../jobs/journal-analysis.job', () => ({
  runJournalAnalysis: jest.fn().mockResolvedValue(undefined),
}))

import request from 'supertest'
import { createTestApp, makeTestToken } from '../helpers/test-app'
import {
  makeMockJournalRepo,
  makeMockUserRepo,
  makeJournalEntry,
} from '../helpers/mock-factories'
import { JournalService } from '../../services/journal.service'
import type { CrisisService } from '../../services/crisis.service'

function makeJournalService(overrides: Partial<InstanceType<typeof JournalService>> = {}) {
  const journalRepo = makeMockJournalRepo()
  const userRepo = makeMockUserRepo()
  const mockCrisis = { logEvent: jest.fn().mockResolvedValue(undefined) } as unknown as CrisisService
  const svc = new JournalService(journalRepo, userRepo, mockCrisis)
  return Object.assign(svc, overrides)
}

describe('POST /api/journal', () => {
  test('returns 401 without auth token', async () => {
    const app = createTestApp({ journal: makeJournalService() })
    const res = await request(app).post('/api/journal').send({ encryptedContent: 'enc', wordCount: 50, language: 'en' })
    expect(res.status).toBe(401)
  })

  test('returns 400 for missing required fields', async () => {
    const app = createTestApp({ journal: makeJournalService() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordCount: 50 }) // missing encryptedContent and language

    expect(res.status).toBe(400)
  })

  test('returns 400 for invalid language enum', async () => {
    const app = createTestApp({ journal: makeJournalService() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ encryptedContent: 'enc', wordCount: 50, language: 'fr' })

    expect(res.status).toBe(400)
  })

  test('returns 201 with entry on valid request', async () => {
    const entry = makeJournalEntry({ id: 'new-entry-id' })
    const journalService = makeJournalService({
      createEntry: jest.fn().mockResolvedValue(entry),
    })
    const app = createTestApp({ journal: journalService })
    const token = makeTestToken('user-1')

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ encryptedContent: 'encrypted-content', wordCount: 120, language: 'en' })

    expect(res.status).toBe(201)
    expect(res.body.entry.id).toBe('new-entry-id')
  })

  test('response does not leak internal error details', async () => {
    const journalService = makeJournalService({
      createEntry: jest.fn().mockRejectedValue(new Error('DB connection lost')),
    })
    const app = createTestApp({ journal: journalService })
    const token = makeTestToken('user-1')

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ encryptedContent: 'enc', wordCount: 50, language: 'en' })

    expect(res.status).toBe(500)
    expect(res.body).not.toHaveProperty('stack')
    expect(JSON.stringify(res.body)).not.toContain('DB connection lost')
  })
})

describe('GET /api/journal/prompts', () => {
  test('returns 401 without auth', async () => {
    const app = createTestApp({ journal: makeJournalService() })
    const res = await request(app).get('/api/journal/prompts')
    expect(res.status).toBe(401)
  })

  test('returns prompts array for authenticated user', async () => {
    const app = createTestApp({ journal: makeJournalService() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .get('/api/journal/prompts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.prompts)).toBe(true)
  })
})

describe('GET /api/journal', () => {
  test('returns entries list for authenticated user', async () => {
    const entry = makeJournalEntry()
    const journalService = makeJournalService({
      getEntries: jest.fn().mockResolvedValue([entry]),
    })
    const app = createTestApp({ journal: journalService })
    const token = makeTestToken('user-1')

    const res = await request(app)
      .get('/api/journal?limit=10&offset=0')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(1)
    // Encrypted content should be present but no plaintext
    expect(res.body.entries[0].encryptedContent).toBe('encrypted-base64-content')
  })
})
