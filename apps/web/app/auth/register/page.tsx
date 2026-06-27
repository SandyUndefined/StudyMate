'use client'

import { useState, useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../store/auth.store'
import { ApiError } from '../../../services/api-client'
import { EXAM_TYPES } from '@studymate/shared'

// Users under 18 require parental consent — computed from DOB
function computeIsMinor(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false
  const dob = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - dob.getFullYear()
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  return (hadBirthday ? age : age - 1) < 18
}

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    examType: '',
    examDate: '',
    dateOfBirth: '',
    language: 'en' as 'en' | 'hi' | 'hinglish',
  })
  const [parentalConsent, setParentalConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const errorId = useId()
  const isMinor = computeIsMinor(form.dateOfBirth)
  const today = new Date().toISOString().split('T')[0]!

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors['name'] = 'Name is required'
    if (!form.email.trim()) errors['email'] = 'Email is required'
    if (form.password.length < 8) errors['password'] = 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(form.password)) errors['password'] = 'Password needs an uppercase letter'
    if (!/[0-9]/.test(form.password)) errors['password'] = 'Password needs a number'
    if (!form.examType) errors['examType'] = 'Please select your exam'
    if (!form.examDate) errors['examDate'] = 'Exam date is required'
    if (!form.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required'
    if (isMinor && !parentalConsent)
      errors['parentalConsent'] = 'Parental consent is required for users under 18'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)
    if (!validate()) return
    setIsLoading(true)
    try {
      await register(form)
      router.push('/onboarding')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          const mapped: Record<string, string> = {}
          for (const [k, v] of Object.entries(err.fields)) {
            mapped[k] = Array.isArray(v) ? (v[0] ?? '') : String(v)
          }
          setFieldErrors(mapped)
        } else {
          setGlobalError(err.message)
        }
      } else {
        setGlobalError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">StudyMate</h1>
          <p className="text-slate-500 mt-1">Create your private account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4"
          aria-label="Registration form"
          noValidate
        >
          {globalError && (
            <div
              id={errorId}
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm"
            >
              {globalError}
            </div>
          )}

          <Field label="Full name" error={fieldErrors['name']}>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['name'])}
            />
          </Field>

          <Field label="Email" error={fieldErrors['email']}>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['email'])}
            />
          </Field>

          <Field
            label="Password"
            error={fieldErrors['password']}
            hint="8+ characters, one uppercase, one number"
          >
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['password'])}
            />
          </Field>

          <Field label="Which exam?" error={fieldErrors['examType']}>
            <select
              value={form.examType}
              onChange={update('examType')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['examType'])}
            >
              <option value="">Select exam...</option>
              {EXAM_TYPES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Exam date" error={fieldErrors['examDate']}>
            <input
              type="date"
              value={form.examDate}
              min={today}
              onChange={update('examDate')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['examDate'])}
            />
          </Field>

          <Field label="Date of birth" error={fieldErrors['dateOfBirth']}>
            <input
              type="date"
              value={form.dateOfBirth}
              max={today}
              onChange={update('dateOfBirth')}
              required
              disabled={isLoading}
              className={inputClass(!!fieldErrors['dateOfBirth'])}
            />
          </Field>

          {/* Parental consent — shown only when user is detected as under 18 */}
          {isMinor && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3"
            >
              <p className="text-sm text-amber-800 font-medium">
                Parental consent required (under 18)
              </p>
              <p className="text-xs text-amber-700">
                Under DPDPA 2023, users under 18 need a parent or guardian to consent to account
                creation and data processing.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentalConsent}
                  onChange={(e) => setParentalConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  aria-required="true"
                />
                <span className="text-xs text-amber-800">
                  I confirm that a parent or guardian has reviewed and consented to this account
                  being created on my behalf.
                </span>
              </label>
              {fieldErrors['parentalConsent'] && (
                <p className="text-xs text-red-600" role="alert">
                  {fieldErrors['parentalConsent']}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Your data is encrypted and private. No parent, institute, or coach can access your
            entries without your explicit consent.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-busy={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-indigo-600 font-medium hover:text-indigo-700 focus:outline-none focus:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Tiny local helpers ────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-200'
  }`
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  const id = useId()
  const hintId = useId()
  const errorId = useId()

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {/* Clone child to inject id and aria-describedby */}
      <div>
        {children}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
