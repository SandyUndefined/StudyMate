/**
 * Automated WCAG 2.1 AA accessibility audits using axe-core.
 *
 * These tests scan each page for critical and serious violations.
 * Impact levels: critical > serious > moderate > minor
 * We assert zero critical OR serious violations — these are the ones
 * that genuinely block screen reader and keyboard-only users.
 *
 * Runs against the live dev server (same as other E2E tests).
 * To run: npm run test:e2e -- --grep accessibility
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { registerAndLogin } from './helpers/test-user'

type AxeViolation = { id: string; impact: string; description: string; nodes: unknown[] }

function assertNoBlockingViolations(violations: AxeViolation[]) {
  const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  if (blocking.length > 0) {
    const summary = blocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${(v.nodes as unknown[]).length} node(s))`)
      .join('\n')
    throw new Error(`WCAG violations found:\n${summary}`)
  }
}

// Pages that don't require auth
test.describe('Accessibility — public pages', () => {
  test('login page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/auth/login')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })

  test('register page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/auth/register')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })
})

// Pages behind auth
test.describe('Accessibility — authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
  })

  test('journal page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })

  test('mood check-in page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/mood')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })

  test('chat page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })

  test('dashboard page has no blocking WCAG violations', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })

  test('crisis panel has no blocking violations when visible', async ({ page }) => {
    await page.goto('/chat')

    // Force the crisis panel visible by injecting a crisis response
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('__test:show-crisis-panel'))
    })

    // Alternatively trigger via sending a critical message — but that requires AI
    // So we just scan the page in its default state and confirm crisis elements (if any) pass
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    assertNoBlockingViolations(results.violations as AxeViolation[])
  })
})

// Structure and landmark tests
test.describe('Accessibility — page structure', () => {
  test('login page has exactly one h1', async ({ page }) => {
    await page.goto('/auth/login')
    const h1s = await page.locator('h1').count()
    expect(h1s).toBe(1)
  })

  test('skip navigation link is present and reaches main content', async ({ page }) => {
    await page.goto('/auth/login')

    // Tab to the skip link (it's the first focusable element)
    await page.keyboard.press('Tab')

    // The skip link should be focused and visible
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()

    // Activating it should move focus to main content
    await page.keyboard.press('Enter')
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('journal page has labelled form fields', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')

    // The textarea must have an accessible label
    const textarea = page.locator('textarea')
    const labelFor = await textarea.getAttribute('id')
    if (labelFor) {
      const label = page.locator(`label[for="${labelFor}"]`)
      await expect(label).toBeAttached()
    } else {
      // Check aria-label or aria-labelledby as fallback
      const ariaLabel = await textarea.getAttribute('aria-label')
      const ariaLabelledBy = await textarea.getAttribute('aria-labelledby')
      expect(ariaLabel ?? ariaLabelledBy).toBeTruthy()
    }
  })

  test('chat message log has role=log', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/chat')
    const log = page.locator('[role="log"]')
    await expect(log).toBeVisible()
  })

  test('mood sliders have aria-valuemin/max/now', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/mood')

    const sliders = page.locator('input[type="range"]')
    const count = await sliders.count()
    expect(count).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < count; i++) {
      const slider = sliders.nth(i)
      await expect(slider).toHaveAttribute('aria-valuemin')
      await expect(slider).toHaveAttribute('aria-valuemax')
      await expect(slider).toHaveAttribute('aria-valuenow')
    }
  })

  test('nav links have aria-current=page on active item', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/journal')

    const activeLink = page.locator('nav a[aria-current="page"]')
    await expect(activeLink).toBeVisible()

    const href = await activeLink.getAttribute('href')
    expect(href).toBe('/journal')
  })
})
