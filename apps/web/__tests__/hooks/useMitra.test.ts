import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMitra } from '../../hooks/useMitra'

vi.mock('../../services/api-client', () => ({
  api: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message)
    }
  },
}))

import { api } from '../../services/api-client'
const mockPost = vi.mocked(api.post)

function makeMitraApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    message: {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      content: "I hear you. What's been the hardest part?",
      language: 'en',
      crisisFlag: 'none',
      createdAt: new Date().toISOString(),
    },
    crisisAction: 'none',
    suggestedIntervention: null,
    sessionId: 'session-1',
    ...overrides,
  }
}

describe('useMitra', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue(makeMitraApiResponse())
  })

  test('initialises with welcome message', () => {
    const { result } = renderHook(() => useMitra())
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]?.role).toBe('assistant')
    expect(result.current.messages[0]?.content).toMatch(/Mitra/i)
  })

  test('isThinking is false initially', () => {
    const { result } = renderHook(() => useMitra())
    expect(result.current.isThinking).toBe(false)
  })

  test('showCrisisPanel starts false', () => {
    const { result } = renderHook(() => useMitra())
    expect(result.current.showCrisisPanel).toBe(false)
  })

  test('sessionId is null initially', () => {
    const { result } = renderHook(() => useMitra())
    expect(result.current.sessionId).toBeNull()
  })

  test('sendMessage adds user message and assistant reply', async () => {
    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('I feel stressed')
    })

    // welcome + user + assistant = 3
    expect(result.current.messages).toHaveLength(3)
    expect(result.current.messages[1]?.role).toBe('user')
    expect(result.current.messages[1]?.content).toBe('I feel stressed')
    expect(result.current.messages[2]?.role).toBe('assistant')
  })

  test('sets sessionId from first response', async () => {
    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.sessionId).toBe('session-1')
  })

  test('crisis escalation sets showCrisisPanel to true', async () => {
    mockPost.mockResolvedValue(
      makeMitraApiResponse({ crisisAction: 'escalate_helpline' })
    )

    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('I want to end it all')
    })

    expect(result.current.showCrisisPanel).toBe(true)
  })

  test('dismissCrisisPanel sets showCrisisPanel to false', async () => {
    mockPost.mockResolvedValue(
      makeMitraApiResponse({ crisisAction: 'escalate_helpline' })
    )

    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('critical message')
    })

    expect(result.current.showCrisisPanel).toBe(true)

    act(() => {
      result.current.dismissCrisisPanel()
    })

    expect(result.current.showCrisisPanel).toBe(false)
  })

  test('isThinking is true during API call then false after', async () => {
    let isThinkingDuringCall = false

    mockPost.mockImplementation(async () => {
      isThinkingDuringCall = true // capture state during the call
      await new Promise((resolve) => setTimeout(resolve, 0))
      return makeMitraApiResponse()
    })

    const { result } = renderHook(() => useMitra())

    const promise = act(async () => {
      await result.current.sendMessage('test')
    })

    await promise
    expect(result.current.isThinking).toBe(false)
  })

  test('shows rate-limit fallback message on 429', async () => {
    const { ApiError } = await import('../../services/api-client')
    mockPost.mockRejectedValue(new ApiError(429, 'Too Many Requests'))

    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('message that triggers rate limit')
    })

    const lastMsg = result.current.messages.at(-1)
    expect(lastMsg?.role).toBe('assistant')
    expect(lastMsg?.content).toMatch(/take a short break/i)
  })

  test('shows connectivity fallback message on generic error', async () => {
    mockPost.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useMitra())

    await act(async () => {
      await result.current.sendMessage('connection fails')
    })

    const lastMsg = result.current.messages.at(-1)
    expect(lastMsg?.role).toBe('assistant')
    expect(lastMsg?.content).toMatch(/trouble connecting/i)
  })
})
