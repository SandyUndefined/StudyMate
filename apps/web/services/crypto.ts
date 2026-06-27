/**
 * Client-side AES-256-GCM encryption for journal entries.
 *
 * Security model:
 * - Encryption key derived from user password via PBKDF2 (310,000 iterations, SHA-256)
 * - Each entry encrypted with a fresh 12-byte random IV
 * - Ciphertext format: base64(salt[16] || iv[12] || ciphertext)
 * - Server stores only the ciphertext blob — never the plaintext or key
 * - Key is held in memory only; never serialised to localStorage or cookies
 *
 * The salt is derived from the user's ID (stable per user, not secret).
 * This means the same password always produces the same key for a given user,
 * which is required for entries to survive page refreshes.
 */

const PBKDF2_ITERATIONS = 310_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt']

/** Derives a CryptoKey from the user's password and a stable salt (userId). */
export async function deriveKey(password: string, userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder()

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Salt: deterministic from userId so the same key is always produced
  const salt = enc.encode(userId.slice(0, SALT_LENGTH).padEnd(SALT_LENGTH, '0'))

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    KEY_USAGE
  )
}

/** Encrypts plaintext and returns a base64 string safe for API transmission. */
export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )

  // Prepend IV to ciphertext for storage (IV is not secret, only unique)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), IV_LENGTH)

  return btoa(String.fromCharCode(...combined))
}

/** Decrypts a base64 ciphertext blob produced by encryptText. */
export async function decryptText(ciphertextB64: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0))

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)

  return new TextDecoder().decode(plaintext)
}

/** In-memory key store — cleared on tab close, never persisted. */
let _sessionKey: CryptoKey | null = null

export function setSessionKey(key: CryptoKey): void {
  _sessionKey = key
}

export function getSessionKey(): CryptoKey | null {
  return _sessionKey
}

export function clearSessionKey(): void {
  _sessionKey = null
}
