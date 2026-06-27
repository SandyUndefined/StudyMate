'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EXAM_TYPES } from '@studymate/shared'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [examType, setExamType] = useState('')
  const [examDate, setExamDate] = useState('')

  const today = new Date().toISOString().split('T')[0]!

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as Step)
    else router.push('/journal')
  }

  const canProceedStep1 = examType !== ''
  const canProceedStep2 = examDate !== ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Onboarding step ${step} of 3`}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Step {step} of 3</p>
      </div>

      <div className="flex-1 px-6 pb-8">
        {/* Step 1 — Exam selection */}
        {step === 1 && (
          <section aria-labelledby="step1-heading">
            <h1 id="step1-heading" className="text-2xl font-bold text-slate-800 mb-2">
              Which exam are you preparing for?
            </h1>
            <p className="text-slate-500 mb-6">
              Mitra will tailor support to your specific journey.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EXAM_TYPES.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setExamType(exam)}
                  className={`py-4 px-3 rounded-xl border-2 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    examType === exam
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                  aria-pressed={examType === exam}
                >
                  {exam}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2 — Exam date */}
        {step === 2 && (
          <section aria-labelledby="step2-heading">
            <h1 id="step2-heading" className="text-2xl font-bold text-slate-800 mb-2">
              When is your {examType} exam?
            </h1>
            <p className="text-slate-500 mb-6">
              Mitra adjusts its support based on how close you are to exam day.
            </p>
            <div>
              <label htmlFor="exam-date" className="block text-sm font-medium text-slate-600 mb-2">
                Exam date
              </label>
              <input
                id="exam-date"
                type="date"
                value={examDate}
                min={today}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              />
            </div>
          </section>
        )}

        {/* Step 3 — Meet Mitra */}
        {step === 3 && (
          <section aria-labelledby="step3-heading" className="text-center pt-8">
            <div
              className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
              aria-hidden="true"
            >
              🤝
            </div>
            <h1 id="step3-heading" className="text-2xl font-bold text-slate-800 mb-3">
              Meet Mitra
            </h1>
            <p className="text-slate-600 leading-relaxed mb-6">
              Mitra is your AI companion — available anytime, completely private, here to listen
              without judgement.
            </p>
            <div className="bg-white rounded-xl p-5 border border-slate-100 text-left space-y-3 mb-6">
              {[
                '100% private — no parent or institute access',
                'Available at 2 AM before a tough exam',
                'Understands the pressure of JEE, NEET, UPSC & more',
                'Always an AI — honest, not pretending to be human',
              ].map((point) => (
                <div key={point} className="flex gap-3 items-start">
                  <span className="text-indigo-500 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                  <p className="text-slate-600 text-sm">{point}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          type="button"
          onClick={handleNext}
          disabled={step === 1 ? !canProceedStep1 : step === 2 ? !canProceedStep2 : false}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {step === 3 ? "Let's begin" : 'Continue'}
        </button>
      </div>
    </div>
  )
}
