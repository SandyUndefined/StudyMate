'use client'

import { useState, useCallback } from 'react'
import { api, ApiError } from '../services/api-client'
import { CRISIS_HELPLINES } from '@studymate/shared'
import type { MitraResponse } from '@studymate/shared'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  crisisFlag: 'none' | 'moderate' | 'high' | 'critical'
  createdAt: Date
}

interface UseMitraReturn {
  messages: ChatMessage[]
  isThinking: boolean
  showCrisisPanel: boolean
  sessionId: string | null
  sendMessage: (content: string) => Promise<void>
  dismissCrisisPanel: () => void
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm Mitra — your study companion. I'm here to listen, not to judge. What's on your mind today?",
  crisisFlag: 'none',
  createdAt: new Date(),
}

export function useMitra(): UseMitraReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isThinking, setIsThinking] = useState(false)
  const [showCrisisPanel, setShowCrisisPanel] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        crisisFlag: 'none',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsThinking(true)

      try {
        const data = await api.post<MitraResponse>('/mitra/chat', {
          content,
          sessionId: sessionId ?? undefined,
        })

        // Persist session ID for conversation continuity
        if (!sessionId) setSessionId(data.sessionId)

        const assistantMsg: ChatMessage = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          crisisFlag: data.message.crisisFlag,
          createdAt: new Date(data.message.createdAt),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // Show crisis panel if helplines were triggered
        if (data.crisisAction === 'escalate_helpline') {
          setShowCrisisPanel(true)
        }
      } catch (err) {
        const errorContent =
          err instanceof ApiError && err.status === 429
            ? "You've been chatting a lot — take a short break and come back."
            : "I'm having trouble connecting right now. Please try again in a moment."

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: errorContent,
            crisisFlag: 'none',
            createdAt: new Date(),
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [sessionId]
  )

  return {
    messages,
    isThinking,
    showCrisisPanel,
    sessionId,
    sendMessage,
    dismissCrisisPanel: () => setShowCrisisPanel(false),
  }
}

export { CRISIS_HELPLINES }
