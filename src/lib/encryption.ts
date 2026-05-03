import CryptoJS from "crypto-js";

/**
 * Encrypt a value using AES encryption
 * @param value - The value to encrypt
 * @param key - The encryption key (should be 32-byte base64 encoded)
 * @returns Base64 encoded encrypted string
 */
export function encryptToken(value: string, key: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(value, key).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a value using AES decryption
 * @param encryptedValue - The encrypted value (base64 encoded)
 * @param key - The encryption key (should be 32-byte base64 encoded)
 * @returns Decrypted plaintext string
 */
export function decryptToken(encryptedValue: string, key: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, key).toString(
      CryptoJS.enc.Utf8
    );
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Generate a random CSRF state token for OAuth
 * @returns Random 32-character hex string
 */
export function generateStateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
