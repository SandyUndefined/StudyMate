import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJournal } from '../../hooks/useJournal'

// Mock api-client and crypto modules
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

vi.mock('../../services/crypto', () => ({
  getSessionKey: vi.fn(),
  encryptText: vi.fn(),
}))

import { api } from '../../services/api-client'
import { getSessionKey, encryptText } from '../../services/crypto'

const mockPost = vi.mocked(api.post)
const mockGetSessionKey = vi.mocked(getSessionKey)
const mockEncryptText = vi.mocked(encryptText)

const FAKE_KEY = {} as CryptoKey

describe('useJournal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionKey.mockReturnValue(FAKE_KEY)
    mockEncryptText.mockResolvedValue('encrypted-base64-content')
    mockPost.mockResolvedValue({ entry: { id: 'new-entry' } })
  })

  test('starts in idle state', () => {
    const { result } = renderHook(() => useJournal())
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  test('ends in saved state on success', async () => {
    const { result } = renderHook(() => useJournal())

    await act(async () => {
      await result.current.submitEntry({ content: 'Today I studied for 8 hours.' })
    })

    expect(result.current.status).toBe('saved')
    expect(result.current.error).toBeNull()
  })

  test('sets error when session key is missing', async () => {
    mockGetSessionKey.mockReturnValue(null)
    const { result } = renderHook(() => useJournal())

    await act(async () => {
      await result.current.submitEntry({ content: 'some content' })
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toMatch(/session has expired/i)
    expect(mockEncryptText).not.toHaveBeenCalled()
  })

  test('shows rate-limit message on 429', async () => {
    const { ApiError } = await import('../../services/api-client')
    mockPost.mockRejectedValue(new ApiError(429, 'Too Many Requests'))

    const { result } = renderHook(() => useJournal())
    await act(async () => {
      await result.current.submitEntry({ content: 'entry text' })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/too many/i)
  })

  test('shows offline fallback message on network error', async () => {
    mockPost.mockRejectedValue(new Error('Failed to fetch'))

    const { result } = renderHook(() => useJournal())
    await act(async () => {
      await result.current.submitEntry({ content: 'network failure test' })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/reconnect/i)
  })

  test('sends encrypted content to API, not plaintext', async () => {
    mockEncryptText.mockResolvedValue('ENCRYPTED_BLOB_XYZ')

    const { result } = renderHook(() => useJournal())
    await act(async () => {
      await result.current.submitEntry({ content: 'my private thoughts', language: 'en' })
    })

    const postCall = mockPost.mock.calls[0]
    expect(postCall?.[0]).toBe('/journal')
    const body = postCall?.[1] as Record<string, unknown>
    expect(body['encryptedContent']).toBe('ENCRYPTED_BLOB_XYZ')
    expect(JSON.stringify(body)).not.toContain('my private thoughts')
  })

  test('defaults language to en when not specified', async () => {
    const { result } = renderHook(() => useJournal())
    await act(async () => {
      await result.current.submitEntry({ content: 'no language specified' })
    })

    const body = mockPost.mock.calls[0]?.[1] as Record<string, unknown>
    expect(body['language']).toBe('en')
  })
})
