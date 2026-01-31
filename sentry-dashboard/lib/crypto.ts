/**
 * Crypto Utilities for SSH Credential Encryption
 * Uses AES-256-GCM for secure encryption/decryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * Falls back to a derived key if not set (for development only!)
 */
function getEncryptionKey(): Buffer {
    const envKey = process.env.SSH_ENCRYPTION_KEY;

    if (envKey) {
        // If key is provided, derive a proper 32-byte key using SHA256
        return crypto.createHash('sha256').update(envKey).digest();
    }

    // Development fallback - NOT SECURE FOR PRODUCTION
    console.warn('⚠️ SSH_ENCRYPTION_KEY not set! Using insecure fallback key.');
    return crypto.createHash('sha256').update('dev-fallback-key-change-in-production').digest();
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns base64 encoded string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 * Expects base64 encoded string in format: iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid IV length');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
        throw new Error('Invalid auth tag length');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Generate a random encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Test if encryption/decryption is working
 */
export function testEncryption(): boolean {
    try {
        const testData = 'test-encryption-' + Date.now();
        const encrypted = encrypt(testData);
        const decrypted = decrypt(encrypted);
        return decrypted === testData;
    } catch {
        return false;
    }
}
