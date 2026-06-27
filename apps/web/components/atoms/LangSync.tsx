'use client'

import { useEffect } from 'react'
import { useAuth } from '../../store/auth.store'

/**
 * Syncs the HTML root element's lang attribute with the authenticated user's
 * language preference. WCAG 3.1.1 (Language of Page) requires this so screen
 * readers use the correct pronunciation rules.
 *
 * Maps:
 *   'hi'      → lang="hi"   (Devanagari, Hindi pronunciation)
 *   'en'      → lang="en"
 *   'hinglish'→ lang="hi"   (mixed script; favour Hindi for screen readers)
 *   (logged out) → lang="en" (default)
 */
export function LangSync() {
  const { user } = useAuth()

  useEffect(() => {
    const lang = !user
      ? 'en'
      : user.language === 'hi' || user.language === 'hinglish'
        ? 'hi'
        : 'en'

    document.documentElement.lang = lang
  }, [user])

  return null
}
