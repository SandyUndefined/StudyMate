'use client'

import { useState, useRef } from 'react'
import { useJournal } from '../../hooks/useJournal'

const MIN_WORD_COUNT = 20

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const SAMPLE_PROMPTS = [
  "How are you feeling right now? Not about the exam — just you, as a person.",
  "What's one thing that felt heavy today? You don't have to fix it — just name it.",
]

export default function JournalPage() {
  const [content, setContent] = useState('')
  const { status, error, submitEntry } = useJournal()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wordCount = countWords(content)
  const canSubmit = wordCount >= MIN_WORD_COUNT && status !== 'encrypting' && status !== 'saving'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    await submitEntry({ content })
    if (status !== 'error') setContent('')
  }

  const buttonLabel =
    status === 'encrypting'
      ? 'Encrypting...'
      : status === 'saving'
        ? 'Saving...'
        : status === 'saved'
          ? 'Saved!'
          : 'Save Entry'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-800">Today&apos;s Journal</h1>
        <p className="text-sm text-slate-400 mt-0.5">Private · Encrypted · Only you can read this</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section aria-labelledby="prompts-heading">
          <h2
            id="prompts-heading"
            className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3"
          >
            Today&apos;s Prompt
          </h2>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-slate-700 text-base leading-relaxed">{SAMPLE_PROMPTS[0]}</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} aria-label="Journal entry form">
          <label htmlFor="journal-entry" className="sr-only">
            Journal entry
          </label>
          <textarea
            id="journal-entry"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely — this is your private space. No one else can read this."
            className="w-full min-h-[280px] p-4 bg-white border border-slate-200 rounded-xl text-slate-800 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
            aria-describedby="word-count-hint"
            disabled={status === 'encrypting' || status === 'saving'}
          />

          <div
            id="word-count-hint"
            className="flex items-center justify-between mt-2 px-1"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-sm text-slate-400">
              {wordCount < MIN_WORD_COUNT && wordCount > 0
                ? `${MIN_WORD_COUNT - wordCount} more words to save`
                : `${wordCount} words`}
            </span>
            {status === 'saved' && (
              <span className="text-sm text-green-600 font-medium" role="status" data-testid="save-success">
                <span aria-hidden="true">✓</span> Entry saved
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            aria-busy={status === 'encrypting' || status === 'saving'}
            className="mt-4 w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {buttonLabel}
          </button>
        </form>

        <section aria-label="Additional reflection prompt">
          <p className="text-sm text-slate-400 mb-2">Another prompt if you need it:</p>
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-slate-600 text-sm leading-relaxed">{SAMPLE_PROMPTS[1]}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
