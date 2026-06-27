process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-32-characters-long'

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "I'm here with you." } }],
        }),
      },
    },
  })),
}))

import request from 'supertest'
import { createTestApp, makeTestToken } from '../helpers/test-app'
import {
  makeMockMitraRepo,
  makeMockUserRepo,
  makeMockSummaryRepo,
  makeMitraMessage,
  makeMitraSession,
} from '../helpers/mock-factories'
import { MitraService } from '../../services/mitra.service'
import type { CrisisService } from '../../services/crisis.service'

function makeMitraServiceMock() {
  return {
    sendMessage: jest.fn().mockResolvedValue({
      message: makeMitraMessage({ content: "I'm here with you." }),
      crisisAction: 'none',
      suggestedIntervention: null,
      sessionId: 'session-1',
    }),
    getSession: jest.fn().mockResolvedValue(makeMitraSession()),
    recordInterventionFeedback: jest.fn().mockResolvedValue(undefined),
  }
}

describe('POST /api/mitra/chat', () => {
  test('returns 401 without auth', async () => {
    const app = createTestApp({ mitra: makeMitraServiceMock() })
    const res = await request(app).post('/api/mitra/chat').send({ content: 'Hello Mitra' })
    expect(res.status).toBe(401)
  })

  test('returns 400 for empty content', async () => {
    const app = createTestApp({ mitra: makeMitraServiceMock() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/mitra/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' })
    expect(res.status).toBe(400)
  })

  test('returns 400 for missing content', async () => {
    const app = createTestApp({ mitra: makeMitraServiceMock() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/mitra/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
  })

  test('returns Mitra response for valid request', async () => {
    const app = createTestApp({ mitra: makeMitraServiceMock() })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/mitra/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'I feel stressed about my exam' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
    expect(res.body.sessionId).toBe('session-1')
    expect(res.body.crisisAction).toBe('none')
  })

  test('crisis response includes escalation action', async () => {
    const crisisMitra = {
      ...makeMitraServiceMock(),
      sendMessage: jest.fn().mockResolvedValue({
        message: makeMitraMessage({ content: 'Please reach out to iCall: 9152987821' }),
        crisisAction: 'escalate_helpline',
        suggestedIntervention: null,
        sessionId: 'session-1',
      }),
    }
    const app = createTestApp({ mitra: crisisMitra })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/mitra/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'I want to end my life' })

    expect(res.status).toBe(200)
    expect(res.body.crisisAction).toBe('escalate_helpline')
    expect(res.body.message.content).toContain('iCall')
  })

  test('service error returns 500 without stack trace', async () => {
    const failMitra = {
      ...makeMitraServiceMock(),
      sendMessage: jest.fn().mockRejectedValue(new Error('AI quota exceeded')),
    }
    const app = createTestApp({ mitra: failMitra })
    const token = makeTestToken('user-1')
    const res = await request(app)
      .post('/api/mitra/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello' })

    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('AI quota exceeded')
    expect(res.body).not.toHaveProperty('stack')
  })
})
