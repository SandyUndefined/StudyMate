import { test, expect } from '@playwright/test'
import { registerAndLogin, login, TEST_USER } from './helpers/test-user'

test.describe('Authentication', () => {
  test('register → redirects to dashboard', async ({ page }) => {
    await registerAndLogin(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login with valid credentials → dashboard', async ({ page }) => {
    // Register first, then log in fresh
    await registerAndLogin(page)
    await page.goto('/auth/login')
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login with wrong password → shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('nobody@test.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should stay on login and show an error
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
  })

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/journal')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5_000 })
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    await registerAndLogin(page)
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5_000 })
  })
})
