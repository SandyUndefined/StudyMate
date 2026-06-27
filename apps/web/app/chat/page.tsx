'use client'

import { useRef, useEffect } from 'react'
import { useMitra, CRISIS_HELPLINES } from '../../hooks/useMitra'

export default function ChatPage() {
  const { messages, isThinking, showCrisisPanel, sendMessage, dismissCrisisPanel } = useMitra()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const textarea = inputRef.current
    if (!textarea) return
    const content = textarea.value.trim()
    if (!content || isThinking) return
    textarea.value = ''
    textarea.style.height = 'auto'
    await sendMessage(content)
    textarea.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg"
          aria-hidden="true"
        >
          M
        </div>
        <div>
          <h1 className="font-semibold text-slate-800">Mitra</h1>
          <p className="text-xs text-slate-400">AI companion · Always available</p>
        </div>
      </header>

      {/* Crisis helpline panel — shown when crisis detected */}
      {showCrisisPanel && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border-b border-red-100 px-4 py-4"
        >
          <p className="font-semibold text-red-800 mb-2 text-sm">
            If you need to talk to someone right now:
          </p>
          <ul className="space-y-1">
            {CRISIS_HELPLINES.map((h) => (
              <li key={h.name} className="text-sm text-red-700">
                <strong>{h.name}:</strong>{' '}
                <a
                  href={`tel:${h.number}`}
                  className="underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                >
                  {h.number}
                </a>{' '}
                ({h.hours})
              </li>
            ))}
          </ul>
          <button
            onClick={dismissCrisisPanel}
            className="mt-2 text-xs text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
            aria-label="Dismiss crisis support panel"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        role="log"
        aria-label="Conversation with Mitra"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm shadow-sm'
              } ${msg.crisisFlag === 'high' || msg.crisisFlag === 'critical' ? 'border-red-200' : ''}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start" aria-label="Mitra is thinking">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1" aria-hidden="true">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* AI disclosure */}
      <p className="text-center text-xs text-slate-400 px-4 pb-1">
        Mitra is an AI — not a therapist. For emergencies: iCall 9152987821
      </p>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-slate-100 px-4 py-3 flex gap-3 items-end"
        aria-label="Send message to Mitra"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message to Mitra
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          onKeyDown={handleKeyDown}
          placeholder="Tell Mitra what's on your mind..."
          rows={1}
          maxLength={2000}
          disabled={isThinking}
          className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 placeholder:text-slate-300 max-h-32"
          aria-describedby="chat-hint"
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${el.scrollHeight}px`
          }}
        />
        <button
          type="submit"
          disabled={isThinking}
          aria-label="Send message to Mitra"
          className="w-12 h-12 flex-shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M22 2L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <span id="chat-hint" className="sr-only">
        Press Enter to send, Shift+Enter for a new line
      </span>
    </div>
  )
}
