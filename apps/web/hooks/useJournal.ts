'use client'

import { useState, useCallback } from 'react'
import { api, ApiError } from '../services/api-client'
import { encryptText, getSessionKey } from '../services/crypto'
import type { CreateJournalEntryInput } from '@studymate/shared'

interface SubmitOptions {
  content: string
  language?: 'en' | 'hi' | 'hinglish'
}

type SubmitStatus = 'idle' | 'encrypting' | 'saving' | 'saved' | 'error'

interface UseJournalReturn {
  status: SubmitStatus
  error: string | null
  submitEntry: (opts: SubmitOptions) => Promise<void>
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function useJournal(): UseJournalReturn {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const submitEntry = useCallback(async ({ content, language = 'en' }: SubmitOptions) => {
    setError(null)
    const key = getSessionKey()

    if (!key) {
      setError('Your session has expired. Please log in again.')
      return
    }

    try {
      setStatus('encrypting')
      // Encrypt before any network call — server never receives plaintext
      const encryptedContent = await encryptText(content, key)
      const wordCount = countWords(content)

      setStatus('saving')
      const body: CreateJournalEntryInput = { encryptedContent, wordCount, language }
      await api.post('/journal', body)

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      if (err instanceof ApiError) {
        setError(err.status === 429 ? 'Too many entries. Please wait a while.' : err.message)
      } else {
        setError('Failed to save entry. It will sync when you reconnect.')
      }
    }
  }, [])

  return { status, error, submitEntry }
}
