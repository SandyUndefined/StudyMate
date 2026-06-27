/**
 * Crypto service tests — run in jsdom which provides Web Crypto API.
 *
 * These tests verify the full encrypt/decrypt roundtrip and that the
 * in-memory key store never leaks state between operations.
 */
import { describe, test, expect, beforeEach } from 'vitest'
import {
  deriveKey,
  encryptText,
  decryptText,
  setSessionKey,
  getSessionKey,
  clearSessionKey,
} from '../../services/crypto'

const TEST_PASSWORD = 'JEE2025@Pressure!'
const TEST_USER_ID = 'user-abc-12345678'

describe('deriveKey()', () => {
  test('returns a CryptoKey object', async () => {
    const key = await deriveKey(TEST_PASSWORD, TEST_USER_ID)
    expect(key).toBeDefined()
    expect(key.type).toBe('secret')
    expect(key.algorithm.name).toBe('AES-GCM')
  })

  test('same password + userId always produces a functionally equivalent key', async () => {
    const key1 = await deriveKey(TEST_PASSWORD, TEST_USER_ID)
    const key2 = await deriveKey(TEST_PASSWORD, TEST_USER_ID)

    // Verify equivalence by cross-decryption: text encrypted with key1 decryptable by key2
    const ciphertext = await encryptText('test determinism', key1)
    const plaintext = await decryptText(ciphertext, key2)
    expect(plaintext).toBe('test determinism')
  })

  test('different passwords produce different keys', async () => {
    const key1 = await deriveKey('password-one', TEST_USER_ID)
    const key2 = await deriveKey('password-two', TEST_USER_ID)

    const ciphertext = await encryptText('sensitive text', key1)
    await expect(decryptText(ciphertext, key2)).rejects.toThrow()
  })
})

describe('encryptText() + decryptText() roundtrip', () => {
  let key: CryptoKey

  beforeEach(async () => {
    key = await deriveKey(TEST_PASSWORD, TEST_USER_ID)
  })

  test('roundtrip preserves plaintext', async () => {
    const original = 'Today I felt really overwhelmed by the mock test results.'
    const encrypted = await encryptText(original, key)
    const decrypted = await decryptText(encrypted, key)
    expect(decrypted).toBe(original)
  })

  test('roundtrip works with Hindi text', async () => {
    const original = 'आज मेरा मॉक टेस्ट बहुत खराब रहा। मुझे बहुत बुरा लग रहा है।'
    const encrypted = await encryptText(original, key)
    const decrypted = await decryptText(encrypted, key)
    expect(decrypted).toBe(original)
  })

  test('each encryption produces different ciphertext (fresh IV)', async () => {
    const plaintext = 'same text encrypted twice'
    const enc1 = await encryptText(plaintext, key)
    const enc2 = await encryptText(plaintext, key)
    // Different IVs means different ciphertexts
    expect(enc1).not.toBe(enc2)
    // Both should decrypt correctly
    expect(await decryptText(enc1, key)).toBe(plaintext)
    expect(await decryptText(enc2, key)).toBe(plaintext)
  })

  test('encrypted output is base64 (no binary characters)', async () => {
    const encrypted = await encryptText('test journal entry', key)
    expect(() => atob(encrypted)).not.toThrow()
  })

  test('decryption fails for tampered ciphertext', async () => {
    const encrypted = await encryptText('private thoughts', key)
    const tampered = encrypted.slice(0, -4) + 'AAAA'
    await expect(decryptText(tampered, key)).rejects.toThrow()
  })
})

describe('Session key store', () => {
  beforeEach(() => {
    clearSessionKey()
  })

  test('getSessionKey returns null initially', () => {
    expect(getSessionKey()).toBeNull()
  })

  test('setSessionKey then getSessionKey returns the same key', async () => {
    const key = await deriveKey(TEST_PASSWORD, TEST_USER_ID)
    setSessionKey(key)
    expect(getSessionKey()).toBe(key)
  })

  test('clearSessionKey nullifies the stored key', async () => {
    const key = await deriveKey(TEST_PASSWORD, TEST_USER_ID)
    setSessionKey(key)
    clearSessionKey()
    expect(getSessionKey()).toBeNull()
  })
})
