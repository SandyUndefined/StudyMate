'use client'

import { useState } from 'react'
import { MOOD_MIN, MOOD_MAX } from '@studymate/shared'

type MoodAxis = 'energy' | 'anxiety' | 'motivation'

interface MoodScores {
  energy: number
  anxiety: number
  motivation: number
}

const AXIS_CONFIG: Record<MoodAxis, { label: string; labelHi: string; lowLabel: string; highLabel: string; color: string }> = {
  energy: {
    label: 'Energy',
    labelHi: 'ऊर्जा',
    lowLabel: 'Drained',
    highLabel: 'Energised',
    color: 'indigo',
  },
  anxiety: {
    label: 'Anxiety',
    labelHi: 'चिंता',
    lowLabel: 'Calm',
    highLabel: 'Anxious',
    color: 'amber',
  },
  motivation: {
    label: 'Motivation',
    labelHi: 'प्रेरणा',
    lowLabel: 'Low',
    highLabel: 'Driven',
    color: 'emerald',
  },
}

export default function MoodPage() {
  const [scores, setScores] = useState<MoodScores>({ energy: 5, anxiety: 5, motivation: 5 })
  const [microPrompt, setMicroPrompt] = useState('')
  const [checkInTime, setCheckInTime] = useState<'morning' | 'evening'>('morning')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  function handleSliderChange(axis: MoodAxis, value: number) {
    setScores((prev) => ({ ...prev, [axis]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    // API call wired in Phase 2
    await new Promise((r) => setTimeout(r, 600))
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 3000)
  }

  const compositeScore =
    Math.round(((scores.energy + scores.motivation + (MOOD_MAX - scores.anxiety + MOOD_MIN)) / 3) * 10) / 10

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-800">Mood Check-In</h1>
        <p className="text-sm text-slate-400 mt-0.5">Three dimensions, 60 seconds</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6" aria-label="Mood check-in form">
        {/* Morning / Evening toggle */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
            Check-in time
          </legend>
          <div className="flex gap-3" role="group">
            {(['morning', 'evening'] as const).map((time) => (
              <label
                key={time}
                className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer font-medium capitalize transition-all ${
                  checkInTime === time
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="checkInTime"
                  value={time}
                  checked={checkInTime === time}
                  onChange={() => setCheckInTime(time)}
                  className="sr-only"
                />
                {time === 'morning' ? '🌅 Morning' : '🌙 Evening'}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Composite score preview */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600 text-sm font-medium">Overall wellbeing</span>
          <span
            className="text-2xl font-bold text-indigo-600"
            aria-label={`Overall wellbeing score: ${compositeScore} out of 10`}
          >
            {compositeScore}/10
          </span>
        </div>

        {/* Three sliders */}
        <div className="space-y-6">
          {(Object.keys(AXIS_CONFIG) as MoodAxis[]).map((axis) => {
            const config = AXIS_CONFIG[axis]!
            return (
              <div key={axis} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor={`slider-${axis}`}
                    className="font-semibold text-slate-700"
                  >
                    {config.label}
                    <span className="ml-2 text-sm text-slate-400 font-normal">{config.labelHi}</span>
                  </label>
                  <span
                    className="text-2xl font-bold text-slate-800"
                    aria-hidden="true"
                  >
                    {scores[axis]}
                  </span>
                </div>

                <input
                  id={`slider-${axis}`}
                  type="range"
                  min={MOOD_MIN}
                  max={MOOD_MAX}
                  value={scores[axis]}
                  onChange={(e) => handleSliderChange(axis, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                  aria-label={`${config.label} level, ${scores[axis]} out of ${MOOD_MAX}`}
                  aria-valuemin={MOOD_MIN}
                  aria-valuemax={MOOD_MAX}
                  aria-valuenow={scores[axis]}
                />

                <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                  <span>{config.lowLabel}</span>
                  <span>{config.highLabel}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Micro prompt */}
        <div>
          <label htmlFor="micro-prompt" className="block text-sm font-medium text-slate-600 mb-2">
            One word for today (optional)
          </label>
          <input
            id="micro-prompt"
            type="text"
            value={microPrompt}
            onChange={(e) => setMicroPrompt(e.target.value)}
            placeholder="e.g. heavy, focused, okay, tired"
            maxLength={50}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-300"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          aria-label="Log mood check-in"
        >
          {status === 'saving' ? 'Logging...' : status === 'saved' ? 'Logged!' : 'Log Mood'}
        </button>
      </form>
    </div>
  )
}
