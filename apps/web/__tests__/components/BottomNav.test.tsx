import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../../components/organisms/BottomNav'

// Mock next/navigation
let mockPathname = '/journal'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

// Mock next/link to render as a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('BottomNav', () => {
  test('renders all 4 nav items', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mood/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mitra/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /insights/i })).toBeInTheDocument()
  })

  test('active route has aria-current="page"', () => {
    mockPathname = '/journal'
    render(<BottomNav />)
    const activeLink = screen.getByRole('link', { name: /navigate to journal/i })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  test('inactive routes do NOT have aria-current', () => {
    mockPathname = '/journal'
    render(<BottomNav />)
    const moodLink = screen.getByRole('link', { name: /navigate to mood/i })
    expect(moodLink).not.toHaveAttribute('aria-current')
  })

  test('aria-current updates when route changes', () => {
    mockPathname = '/chat'
    const { unmount } = render(<BottomNav />)
    const chatLink = screen.getByRole('link', { name: /navigate to mitra/i })
    expect(chatLink).toHaveAttribute('aria-current', 'page')
    unmount()

    mockPathname = '/dashboard'
    render(<BottomNav />)
    const dashLink = screen.getByRole('link', { name: /navigate to insights/i })
    expect(dashLink).toHaveAttribute('aria-current', 'page')
  })

  test('nav has aria-label="Main navigation"', () => {
    render(<BottomNav />)
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
  })

  test('SVG icons pass aria-hidden="true" via className prop', () => {
    // The Icon components receive aria-hidden="true" directly in BottomNav JSX.
    // We verify the prop is present in the rendered output by checking the first svg.
    render(<BottomNav />)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(4)
    // At least the icons rendered by the component should have aria-hidden
    // (all Icon components in BottomNav.tsx include aria-hidden="true")
    const hiddenSvgs = Array.from(svgs).filter((s) => s.getAttribute('aria-hidden') === 'true')
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(4)
  })
})
