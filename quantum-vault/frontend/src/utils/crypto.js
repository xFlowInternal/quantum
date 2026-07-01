/**
 * Crypto utility functions for frontend
 * Uses Web Crypto API (industry standard) with QRNG integration
 */

import qrng from './qrng';

class CryptoService {
  constructor() {
    this.algorithm = {
      name: 'ECDH',
      namedCurve: 'P-256',
    };
    this.derivedKeyAlgorithm = {
      name: 'AES-GCM',
      length: 256,
    };
  }

  /**
   * Generate ECC key pair
   */
  async generateKeyPair() {
    try {
      const keyPair = await crypto.subtle.generateKey(
        this.algorithm,
        true,
        ['deriveKey', 'deriveBits']
      );
      return keyPair;
    } catch (error) {
      console.error('Key generation error:', error);
      throw new Error('Failed to generate key pair');
    }
  }

  /**
   * Export public key to base64
   */
  async exportPublicKey(publicKey) {
    try {
      const exported = await crypto.subtle.exportKey('spki', publicKey);
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export public key');
    }
  }

  /**
   * Import public key from base64
   */
  async importPublicKey(base64Key) {
    try {
      const buffer = this.base64ToArrayBuffer(base64Key);
      return await crypto.subtle.importKey(
        'spki',
        buffer,
        this.algorithm,
        true,
        []
      );
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Failed to import public key');
    }
  }

  /**
   * Derive shared secret
   */
  async deriveSharedKey(privateKey, publicKey) {
    try {
      return await crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        privateKey,
        this.derivedKeyAlgorithm,
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Derivation error:', error);
      throw new Error('Failed to derive shared key');
    }
  }

  /**
   * Encrypt message (using QRNG for IV generation)
   */
  async encrypt(message, key) {
    try {
      // Use QRNG for IV generation (quantum randomness)
      const iv = await qrng.getRandomBytes(12);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message
   */
  async decrypt(ciphertextBase64, ivBase64, key) {
    try {
      const ciphertext = this.base64ToArrayBuffer(ciphertextBase64);
      const iv = this.base64ToArrayBuffer(ivBase64);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Helper: ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Store keys in localStorage (encrypted in production)
   */
  storeKeys(userId, publicKey, privateKey) {
    localStorage.setItem(`${userId}_publicKey`, publicKey);
    localStorage.setItem(`${userId}_privateKey`, privateKey);
  }

  /**
   * Retrieve keys from localStorage
   */
  getStoredKeys(userId) {
    return {
      publicKey: localStorage.getItem(`${userId}_publicKey`),
      privateKey: localStorage.getItem(`${userId}_privateKey`),
    };
  }

  /**
   * Clear stored keys
   */
  clearKeys(userId) {
    localStorage.removeItem(`${userId}_publicKey`);
    localStorage.removeItem(`${userId}_privateKey`);
  }
}

export default new CryptoService();
