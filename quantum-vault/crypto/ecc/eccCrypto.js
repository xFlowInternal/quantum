/**
 * ECC Cryptography Module using Web Crypto API with QRNG
 * Industry Standard: ECDH (Elliptic Curve Diffie-Hellman) for key exchange
 * Industry Standard: AES-GCM for symmetric encryption
 * Curve: P-256 (NIST standard)
 * Enhanced with Quantum Random Number Generation
 */

const qrng = require('../qrng/qrngService');

class ECCCrypto {
  constructor() {
    this.algorithm = {
      name: 'ECDH',
      namedCurve: 'P-256', // NIST P-256 curve (industry standard)
    };
    this.derivedKeyAlgorithm = {
      name: 'AES-GCM',
      length: 256,
    };
  }

  /**
   * Generate ECC key pair
   * @returns {Promise<CryptoKeyPair>} Public and private key pair
   */
  async generateKeyPair() {
    try {
      const keyPair = await crypto.subtle.generateKey(
        this.algorithm,
        true, // extractable
        ['deriveKey', 'deriveBits']
      );
      
      return keyPair;
    } catch (error) {
      console.error('Key generation error:', error);
      throw new Error('Failed to generate ECC key pair');
    }
  }

  /**
   * Export public key to base64 string
   * @param {CryptoKey} publicKey - Public key to export
   * @returns {Promise<string>} Base64 encoded public key
   */
  async exportPublicKey(publicKey) {
    try {
      const exported = await crypto.subtle.exportKey('spki', publicKey);
      const exportedAsBase64 = btoa(
        String.fromCharCode(...new Uint8Array(exported))
      );
      return exportedAsBase64;
    } catch (error) {
      console.error('Public key export error:', error);
      throw new Error('Failed to export public key');
    }
  }

  /**
   * Import public key from base64 string
   * @param {string} base64Key - Base64 encoded public key
   * @returns {Promise<CryptoKey>} Imported public key
   */
  async importPublicKey(base64Key) {
    try {
      const binaryString = atob(base64Key);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const publicKey = await crypto.subtle.importKey(
        'spki',
        bytes,
        this.algorithm,
        true,
        []
      );

      return publicKey;
    } catch (error) {
      console.error('Public key import error:', error);
      throw new Error('Failed to import public key');
    }
  }

  /**
   * Export private key to base64 string (for storage)
   * @param {CryptoKey} privateKey - Private key to export
   * @returns {Promise<string>} Base64 encoded private key
   */
  async exportPrivateKey(privateKey) {
    try {
      const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
      const exportedAsBase64 = btoa(
        String.fromCharCode(...new Uint8Array(exported))
      );
      return exportedAsBase64;
    } catch (error) {
      console.error('Private key export error:', error);
      throw new Error('Failed to export private key');
    }
  }

  /**
   * Import private key from base64 string
   * @param {string} base64Key - Base64 encoded private key
   * @returns {Promise<CryptoKey>} Imported private key
   */
  async importPrivateKey(base64Key) {
    try {
      const binaryString = atob(base64Key);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        bytes,
        this.algorithm,
        true,
        ['deriveKey', 'deriveBits']
      );

      return privateKey;
    } catch (error) {
      console.error('Private key import error:', error);
      throw new Error('Failed to import private key');
    }
  }

  /**
   * Derive shared secret using ECDH
   * @param {CryptoKey} privateKey - Own private key
   * @param {CryptoKey} publicKey - Other party's public key
   * @returns {Promise<CryptoKey>} Derived AES key
   */
  async deriveSharedKey(privateKey, publicKey) {
    try {
      const sharedKey = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: publicKey,
        },
        privateKey,
        this.derivedKeyAlgorithm,
        false, // not extractable for security
        ['encrypt', 'decrypt']
      );

      return sharedKey;
    } catch (error) {
      console.error('Key derivation error:', error);
      throw new Error('Failed to derive shared key');
    }
  }

  /**
   * Encrypt message using AES-GCM with QRNG IV
   * @param {string} message - Plain text message
   * @param {CryptoKey} key - AES encryption key
   * @returns {Promise<{ciphertext: string, iv: string}>} Encrypted data
   */
  async encrypt(message, key) {
    try {
      // Generate quantum random IV (Initialization Vector)
      const ivArray = await qrng.getRandomBytes(12);
      const iv = new Uint8Array(ivArray);

      // Encode message
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data
      );

      // Convert to base64
      const ciphertextBase64 = btoa(
        String.fromCharCode(...new Uint8Array(ciphertext))
      );
      const ivBase64 = btoa(String.fromCharCode(...iv));

      return {
        ciphertext: ciphertextBase64,
        iv: ivBase64,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message using AES-GCM
   * @param {string} ciphertextBase64 - Base64 encoded ciphertext
   * @param {string} ivBase64 - Base64 encoded IV
   * @param {CryptoKey} key - AES decryption key
   * @returns {Promise<string>} Decrypted plain text
   */
  async decrypt(ciphertextBase64, ivBase64, key) {
    try {
      // Decode from base64
      const ciphertext = Uint8Array.from(atob(ciphertextBase64), c =>
        c.charCodeAt(0)
      );
      const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext
      );

      // Decode message
      const decoder = new TextDecoder();
      const message = decoder.decode(decrypted);

      return message;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ECCCrypto;
} else if (typeof window !== 'undefined') {
  window.ECCCrypto = ECCCrypto;
}
