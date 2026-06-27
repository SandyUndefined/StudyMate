import { test, expect } from '@playwright/test'
import { registerAndLogin } from './helpers/test-user'

test.describe('Mood Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/mood')
  })

  test('mood page renders sliders or inputs', async ({ page }) => {
    // Should have interactive controls for mood dimensions
    const inputs = page.getByRole('slider').or(page.getByRole('spinbutton'))
    await expect(inputs.first()).toBeVisible({ timeout: 5_000 })
  })

  test('submit mood check-in navigates or shows confirmation', async ({ page }) => {
    // Fill in at least the first slider
    const sliders = page.getByRole('slider')
    if (await sliders.count() > 0) {
      // Set sliders to mid values
      for (const slider of await sliders.all()) {
        await slider.fill('5')
      }
    }

    await page.getByRole('button', { name: /submit|save|check.?in/i }).click()

    await expect(
      page.getByText(/saved|logged|submitted|thank/i)
        .or(page.locator('[data-testid="mood-success"]'))
    ).toBeVisible({ timeout: 10_000 })
  })
})
