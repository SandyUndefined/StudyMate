import type { Page } from '@playwright/test'

export const TEST_USER = {
  name: 'Playwright Tester',
  email: `e2e+${Date.now()}@studymate.test`,
  password: 'TestPass2024!',
  examType: 'JEE',
  examDate: '2025-05-15',
  dateOfBirth: '2003-06-01',
}

/** Registers a fresh user and lands on the dashboard. */
export async function registerAndLogin(page: Page, user = TEST_USER) {
  await page.goto('/auth/register')

  await page.getByLabel(/full name/i).fill(user.name)
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/password/i).first().fill(user.password)
  await page.getByLabel(/exam.*type/i).selectOption(user.examType)
  await page.getByLabel(/exam.*date/i).fill(user.examDate)
  await page.getByLabel(/date.*birth/i).fill(user.dateOfBirth)

  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

/** Logs in with existing credentials. */
export async function login(page: Page, user = TEST_USER) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/password/i).fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}
