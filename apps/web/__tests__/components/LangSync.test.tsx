import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { LangSync } from '../../components/atoms/LangSync'

let mockUser: { language?: string } | null = null

vi.mock('../../store/auth.store', () => ({
  useAuth: () => ({ user: mockUser }),
}))

function renderLangSync() {
  render(<LangSync />)
}

describe('LangSync', () => {
  beforeEach(() => {
    document.documentElement.lang = ''
    mockUser = null
  })

  test('sets lang="en" when no user', () => {
    renderLangSync()
    expect(document.documentElement.lang).toBe('en')
  })

  test('sets lang="hi" for Hindi user', () => {
    mockUser = { language: 'hi' }
    renderLangSync()
    expect(document.documentElement.lang).toBe('hi')
  })

  test('sets lang="hi" for Hinglish user (Devanagari script)', () => {
    mockUser = { language: 'hinglish' }
    renderLangSync()
    expect(document.documentElement.lang).toBe('hi')
  })

  test('sets lang="en" for English user', () => {
    mockUser = { language: 'en' }
    renderLangSync()
    expect(document.documentElement.lang).toBe('en')
  })

  test('renders nothing visible (null output)', () => {
    const { container } = render(<LangSync />)
    expect(container.firstChild).toBeNull()
  })
})
