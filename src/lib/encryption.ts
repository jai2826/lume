import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";

/**
 * SECURITY: Derives a cryptographic key from password using PBKDF2
 * @param password - The encryption key from environment
 * @returns 32-byte key suitable for AES-256
 */
function deriveKey(password: string): Buffer {
  // Use a constant salt (or derive from password itself for additional security)
  const salt = Buffer.from("lume-oauth-encryption-salt", "utf-8");
  return pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

/**
 * Encrypt a value using AES-256-GCM encryption (authenticated encryption)
 * SECURITY: Includes IV and auth tag for tamper detection
 * @param value - The value to encrypt (OAuth tokens)
 * @param key - The encryption key from environment (will be derived)
 * @returns JSON string containing IV, encrypted data, and auth tag (all base64)
 */
export function encryptToken(value: string, key: string): string {
  try {
    const derivedKey = deriveKey(key);
    
    // Generate a random 16-byte IV (initialization vector)
    const iv = randomBytes(16);
    
    // Create cipher with AES-256-GCM
    const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(value, "utf-8", "hex");
    encrypted += cipher.final("hex");
    
    // Get the authentication tag (prevents tampering)
    const authTag = cipher.getAuthTag();
    
    // Return IV, encrypted data, and auth tag as JSON (all base64)
    const payload = {
      iv: iv.toString("base64"),
      data: encrypted,
      tag: authTag.toString("base64"),
    };
    
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a value using AES-256-GCM decryption
 * SECURITY: Verifies auth tag to detect tampering
 * @param encryptedValue - The encrypted value (base64 JSON with IV, data, tag)
 * @param key - The encryption key from environment (will be derived)
 * @returns Decrypted plaintext string
 */
export function decryptToken(encryptedValue: string, key: string): string {
  try {
    const derivedKey = deriveKey(key);
    
    // Parse the encrypted payload
    const payload = JSON.parse(
      Buffer.from(encryptedValue, "base64").toString("utf-8")
    ) as {
      iv: string;
      data: string;
      tag: string;
    };
    
    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.tag, "base64");
    
    // Create decipher with AES-256-GCM
    const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv);
    
    // Set the authentication tag (must be set before decrypting)
    decipher.setAuthTag(authTag);
    
    // Decrypt the token
    let decrypted = decipher.update(payload.data, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Generate a cryptographically secure CSRF state token
 * SECURITY: Uses randomBytes instead of Math.random()
 * @returns 32-byte hex string (64 characters)
 */
export function generateStateToken(): string {
  return randomBytes(32).toString("hex");
}
