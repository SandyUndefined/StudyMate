/**
 * Tests the Field component inside register/page.tsx:
 * - label[for] must match input[id]
 * - aria-describedby links to error paragraph
 * - aria-invalid set on error
 * WCAG 1.3.1 (Info and Relationships), 4.1.3 (Status Messages)
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../../app/auth/register/page'

// Minimal mocks for the page's dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Path relative from THIS test file → the store
vi.mock('../../store/auth.store', () => ({
  useAuth: () => ({ register: vi.fn() }),
}))

vi.mock('../../services/api-client', () => ({
  ApiError: class ApiError extends Error {},
}))

vi.mock('@studymate/shared', () => ({
  EXAM_TYPES: ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'CUET'],
}))

describe('Register page — Field component accessibility', () => {
  test('every label is linked to its input via htmlFor/id', () => {
    render(<RegisterPage />)

    const labels = document.querySelectorAll('label')
    labels.forEach((label) => {
      const forAttr = label.getAttribute('for')
      if (!forAttr) return // skip labels without for (e.g. radio groups)
      const input = document.getElementById(forAttr)
      expect(input).not.toBeNull()
    })
  })

  test('name input gets aria-invalid on validation failure', async () => {
    render(<RegisterPage />)

    // Submit without filling anything — triggers validation
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      // Find the name input by its label
      const nameInput = screen.getByLabelText(/full name/i)
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  test('aria-describedby on error input points to visible error text', async () => {
    render(<RegisterPage />)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/full name/i)
      const describedBy = nameInput.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()

      // The id should correspond to an error paragraph
      const errorEl = document.getElementById(describedBy!)
      expect(errorEl).not.toBeNull()
      expect(errorEl?.textContent).toMatch(/required/i)
    })
  })

  test('inputs without errors have no aria-invalid', async () => {
    render(<RegisterPage />)

    // Fill in just the name — it should not have aria-invalid
    const nameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(nameInput, { target: { value: 'Sandy' } })

    // Submit to trigger validation on other fields
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      // Name is now filled — should not have aria-invalid
      expect(nameInput).not.toHaveAttribute('aria-invalid', 'true')
    })
  })

  test('form has accessible label', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('form', { name: /registration form/i })).toBeInTheDocument()
  })
})
