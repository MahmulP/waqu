import CryptoJS from 'crypto-js';

/**
 * Encryption service for sensitive data like API keys
 * Uses AES-256 encryption
 */
export class EncryptionService {
  private static getEncryptionKey(): string {
    // Get encryption key from environment variable
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    return key;
  }

  /**
   * Encrypt sensitive data (like API keys)
   */
  static encrypt(plainText: string): string {
    try {
      const key = this.getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      const plainText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plainText) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return plainText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a secure random encryption key
   * Use this once to generate your ENCRYPTION_KEY
   */
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}
