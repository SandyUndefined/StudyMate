import { test, expect } from '@playwright/test'
import { registerAndLogin } from './helpers/test-user'

test.describe('Journal', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
  })

  test('navigate to journal page from dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /journal/i }).first().click()
    await expect(page).toHaveURL(/\/journal/)
    await expect(page.getByRole('textbox')).toBeVisible()
  })

  test('write and save a journal entry', async ({ page }) => {
    await page.goto('/journal')

    const textarea = page.getByPlaceholder(/write freely/i)
    await textarea.fill('Today I studied for 6 hours. Mock test went well — scored 78%. Feeling cautiously optimistic about JEE preparation.')

    await page.getByRole('button', { name: /save|submit/i }).first().click()

    // Should show a success state — saved or checkmark
    await expect(
      page.getByText(/saved|success|✓/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('empty journal entry cannot be submitted', async ({ page }) => {
    await page.goto('/journal')
    const submitBtn = page.getByRole('button', { name: /save|submit/i }).first()
    await expect(submitBtn).toBeDisabled()
  })

  test('journal prompts are displayed', async ({ page }) => {
    await page.goto('/journal')
    // At least one reflective prompt should be visible
    await expect(
      page.locator('[data-testid="journal-prompt"]').first()
        .or(page.getByText(/how are you feeling/i).first())
        .or(page.getByText(/what/i).first())
    ).toBeVisible({ timeout: 5_000 })
  })
})
