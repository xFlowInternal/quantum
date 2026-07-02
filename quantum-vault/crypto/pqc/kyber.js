/**
 * ML-KEM-768 (Kyber-768) Post-Quantum Key Encapsulation Mechanism
 * NIST-approved quantum-resistant algorithm (FIPS 203)
 */

const { ml_kem } = require('pqc');

class KyberCrypto {
  constructor() {
    this.variant = 768; // ML-KEM-768 (formerly Kyber-768, NIST Level 3)
    this.publicKeySize = 1184;
    this.privateKeySize = 2400;
    this.ciphertextSize = 1088;
    this.sharedSecretSize = 32;
  }

  /**
   * Generate ML-KEM-768 key pair
   * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
   */
  async generateKeyPair() {
    try {
      const keyPair = ml_kem.ml_kem768.keygen();
      
      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.secretKey,
      };
    } catch (error) {
      console.error('ML-KEM key generation error:', error);
      throw new Error('Failed to generate ML-KEM key pair');
    }
  }

  /**
   * Encapsulate: Generate shared secret and ciphertext
   * @param {Uint8Array} publicKey - Recipient's public key
   * @returns {Promise<{ciphertext: Uint8Array, sharedSecret: Uint8Array}>}
   */
  async encapsulate(publicKey) {
    try {
      if (!(publicKey instanceof Uint8Array)) {
        throw new Error('Public key must be Uint8Array');
      }

      if (publicKey.length !== this.publicKeySize) {
        throw new Error(`Invalid public key size: expected ${this.publicKeySize}, got ${publicKey.length}`);
      }

      const result = ml_kem.ml_kem768.encapsulate(publicKey);
      
      return {
        ciphertext: result.cipherText,
        sharedSecret: result.sharedSecret,
      };
    } catch (error) {
      console.error('ML-KEM encapsulation error:', error);
      throw new Error('Failed to encapsulate with ML-KEM');
    }
  }

  /**
   * Decapsulate: Recover shared secret from ciphertext
   * @param {Uint8Array} ciphertext - Encapsulated ciphertext
   * @param {Uint8Array} privateKey - Own private key
   * @returns {Promise<Uint8Array>} Shared secret
   */
  async decapsulate(ciphertext, privateKey) {
    try {
      if (!(ciphertext instanceof Uint8Array) || !(privateKey instanceof Uint8Array)) {
        throw new Error('Ciphertext and private key must be Uint8Array');
      }

      if (ciphertext.length !== this.ciphertextSize) {
        throw new Error(`Invalid ciphertext size: expected ${this.ciphertextSize}, got ${ciphertext.length}`);
      }

      if (privateKey.length !== this.privateKeySize) {
        throw new Error(`Invalid private key size: expected ${this.privateKeySize}, got ${privateKey.length}`);
      }

      const sharedSecret = ml_kem.ml_kem768.decapsulate(ciphertext, privateKey);
      
      return sharedSecret;
    } catch (error) {
      console.error('ML-KEM decapsulation error:', error);
      throw new Error('Failed to decapsulate with ML-KEM');
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
      algorithm: 'ML-KEM-768 (Kyber-768)',
      standard: 'FIPS 203',
      securityLevel: 'NIST Level 3',
      quantumResistant: true,
      publicKeySize: this.publicKeySize,
      privateKeySize: this.privateKeySize,
      ciphertextSize: this.ciphertextSize,
      sharedSecretSize: this.sharedSecretSize,
    };
  }
}

module.exports = new KyberCrypto();
