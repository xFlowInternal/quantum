/**
 * ML-DSA-65 (Dilithium-3) Post-Quantum Digital Signature Algorithm
 * NIST-approved quantum-resistant signature scheme (FIPS 204)
 */

const { ml_dsa } = require('pqc');

class DilithiumCrypto {
  constructor() {
    this.variant = 65; // ML-DSA-65 (formerly Dilithium-3, NIST Level 3)
    this.publicKeySize = 1952;
    this.privateKeySize = 4032; // Actual size from pqc library
    this.signatureSize = 3309; // Actual size from pqc library
  }

  /**
   * Generate ML-DSA-65 key pair
   * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
   */
  async generateKeyPair() {
    try {
      const keyPair = ml_dsa.ml_dsa65.keygen();
      
      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.secretKey,
      };
    } catch (error) {
      console.error('ML-DSA key generation error:', error);
      throw new Error('Failed to generate ML-DSA key pair');
    }
  }

  /**
   * Sign a message
   * @param {Uint8Array|string} message - Message to sign
   * @param {Uint8Array} privateKey - Signer's private key
   * @returns {Promise<Uint8Array>} Signature
   */
  async sign(message, privateKey) {
    try {
      // Convert string to Uint8Array if needed
      const messageBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

      if (!(messageBytes instanceof Uint8Array)) {
        throw new Error('Message must be string or Uint8Array');
      }

      if (!(privateKey instanceof Uint8Array)) {
        throw new Error('Private key must be Uint8Array');
      }

      if (privateKey.length !== this.privateKeySize) {
        throw new Error(`Invalid private key size: expected ${this.privateKeySize}, got ${privateKey.length}`);
      }

      const signature = ml_dsa.ml_dsa65.sign(privateKey, messageBytes);
      
      return signature;
    } catch (error) {
      console.error('ML-DSA signing error:', error);
      throw new Error('Failed to sign with ML-DSA');
    }
  }

  /**
   * Verify a signature
   * @param {Uint8Array} signature - Signature to verify
   * @param {Uint8Array|string} message - Original message
   * @param {Uint8Array} publicKey - Signer's public key
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verify(signature, message, publicKey) {
    try {
      // Convert string to Uint8Array if needed
      const messageBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

      if (!(signature instanceof Uint8Array) || !(messageBytes instanceof Uint8Array)) {
        throw new Error('Signature and message must be Uint8Array');
      }

      if (!(publicKey instanceof Uint8Array)) {
        throw new Error('Public key must be Uint8Array');
      }

      if (publicKey.length !== this.publicKeySize) {
        throw new Error(`Invalid public key size: expected ${this.publicKeySize}, got ${publicKey.length}`);
      }

      const isValid = ml_dsa.ml_dsa65.verify(publicKey, messageBytes, signature);
      
      return isValid;
    } catch (error) {
      console.error('ML-DSA verification error:', error);
      return false;
    }
  }

  /**
   * Export public key to base64
   * @param {Uint8Array} publicKey
   * @returns {string}
   */
  exportPublicKey(publicKey) {
    return Buffer.from(publicKey).toString('base64');
  }

  /**
   * Import public key from base64
   * @param {string} base64Key
   * @returns {Uint8Array}
   */
  importPublicKey(base64Key) {
    const buffer = Buffer.from(base64Key, 'base64');
    return new Uint8Array(buffer);
  }

  /**
   * Export private key to base64
   * @param {Uint8Array} privateKey
   * @returns {string}
   */
  exportPrivateKey(privateKey) {
    return Buffer.from(privateKey).toString('base64');
  }

  /**
   * Import private key from base64
   * @param {string} base64Key
   * @returns {Uint8Array}
   */
  importPrivateKey(base64Key) {
    const buffer = Buffer.from(base64Key, 'base64');
    return new Uint8Array(buffer);
  }

  /**
   * Get algorithm information
   * @returns {Object}
   */
  getInfo() {
    return {
      algorithm: 'ML-DSA-65 (Dilithium-3)',
      standard: 'FIPS 204',
      securityLevel: 'NIST Level 3',
      quantumResistant: true,
      publicKeySize: this.publicKeySize,
      privateKeySize: this.privateKeySize,
      signatureSize: this.signatureSize,
    };
  }
}

module.exports = new DilithiumCrypto();
