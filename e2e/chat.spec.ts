import { test, expect } from '@playwright/test'
import { registerAndLogin } from './helpers/test-user'

test.describe('Mitra Chat', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/chat')
  })

  test('welcome message is shown on first visit', async ({ page }) => {
    await expect(page.getByText(/mitra/i).first()).toBeVisible()
    await expect(page.getByText(/here to listen/i)).toBeVisible()
  })

  test('send a message and receive a reply', async ({ page }) => {
    const input = page.getByPlaceholder(/tell mitra/i)
    await input.fill("I'm feeling a bit stressed about my upcoming mock test")
    await page.getByRole('button', { name: /send/i }).click()

    // User message should appear
    await expect(page.getByText(/stressed about my upcoming mock test/i)).toBeVisible()

    // Mitra's response should appear within timeout (AI call)
    await expect(
      page.locator('[data-role="assistant"]').last()
        .or(page.getByTestId('mitra-message').last())
    ).toBeVisible({ timeout: 20_000 })
  })

  test('crisis phrase shows helpline panel', async ({ page }) => {
    const input = page.getByPlaceholder(/tell mitra/i)
    await input.fill('I want to end it all and kill myself')
    await page.getByRole('button', { name: /send/i }).click()

    // Crisis panel with helpline numbers should appear
    await expect(
      page.getByText(/9152987821/i)
        .or(page.getByText(/iCall/i))
        .or(page.getByTestId('crisis-panel'))
    ).toBeVisible({ timeout: 20_000 })
  })

  test('sending empty message is blocked', async ({ page }) => {
    const sendBtn = page.getByRole('button', { name: /send/i })
    await expect(sendBtn).toBeDisabled()
  })
})
