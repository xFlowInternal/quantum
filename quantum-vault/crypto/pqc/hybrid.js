/**
 * Hybrid Cryptography - Combining ECC and PQC
 * Provides quantum-resistant encryption by combining classical and post-quantum algorithms
 */

const crypto = require('crypto');
const kyber = require('./kyber');
const eccCrypto = require('../ecc/eccCrypto');

class HybridCrypto {
  constructor() {
    this.version = 'hybrid-v1';
  }

  /**
   * Generate hybrid key pair (ECC + Kyber)
   * @returns {Promise<Object>} Combined key pair
   */
  async generateKeyPair() {
    try {
      // Generate ECC key pair
      const eccKeyPair = await eccCrypto.generateKeyPair();
      
      // Generate Kyber key pair
      const kyberKeyPair = await kyber.generateKeyPair();
      
      return {
        ecc: eccKeyPair,
        kyber: kyberKeyPair,
        version: this.version,
      };
    } catch (error) {
      console.error('Hybrid key generation error:', error);
      throw new Error('Failed to generate hybrid key pair');
    }
  }

  /**
   * Derive hybrid shared secret
   * Combines ECC ECDH and Kyber KEM
   * @param {Object} ownKeys - Own private keys {ecc, kyber}
   * @param {Object} peerKeys - Peer public keys {ecc, kyber}
   * @returns {Promise<Buffer>} Combined shared secret
   */
  async deriveSharedSecret(ownKeys, peerKeys) {
    try {
      // Derive ECC shared secret using ECDH
      const eccSharedKey = await eccCrypto.deriveSharedKey(
        ownKeys.ecc.privateKey,
        peerKeys.ecc.publicKey
      );

      // Export ECC shared key to raw bytes
      const eccSharedBytes = await crypto.subtle.exportKey('raw', eccSharedKey);
      
      // Encapsulate with Kyber (generates shared secret + ciphertext)
      const kyberResult = await kyber.encapsulate(peerKeys.kyber.publicKey);
      
      // Combine both secrets using XOR
      const combinedSecret = this.combineSecrets(
        new Uint8Array(eccSharedBytes),
        kyberResult.sharedSecret
      );
      
      return {
        sharedSecret: combinedSecret,
        kyberCiphertext: kyberResult.ciphertext,
      };
    } catch (error) {
      console.error('Hybrid shared secret derivation error:', error);
      throw new Error('Failed to derive hybrid shared secret');
    }
  }

  /**
   * Recover hybrid shared secret (recipient side)
   * @param {Object} ownKeys - Own private keys {ecc, kyber}
   * @param {Object} peerKeys - Peer public keys {ecc}
   * @param {Uint8Array} kyberCiphertext - Kyber ciphertext from sender
   * @returns {Promise<Buffer>} Combined shared secret
   */
  async recoverSharedSecret(ownKeys, peerKeys, kyberCiphertext) {
    try {
      // Derive ECC shared secret using ECDH
      const eccSharedKey = await eccCrypto.deriveSharedKey(
        ownKeys.ecc.privateKey,
        peerKeys.ecc.publicKey
      );

      // Export ECC shared key to raw bytes
      const eccSharedBytes = await crypto.subtle.exportKey('raw', eccSharedKey);
      
      // Decapsulate Kyber ciphertext
      const kyberSharedSecret = await kyber.decapsulate(
        kyberCiphertext,
        ownKeys.kyber.privateKey
      );
      
      // Combine both secrets using XOR (same as sender)
      const combinedSecret = this.combineSecrets(
        new Uint8Array(eccSharedBytes),
        kyberSharedSecret
      );
      
      return combinedSecret;
    } catch (error) {
      console.error('Hybrid shared secret recovery error:', error);
      throw new Error('Failed to recover hybrid shared secret');
    }
  }

  /**
   * Combine two secrets using XOR and HKDF
   * @param {Uint8Array} secret1 - First secret (ECC)
   * @param {Uint8Array} secret2 - Second secret (Kyber)
   * @returns {Buffer} Combined secret
   */
  combineSecrets(secret1, secret2) {
    try {
      // Ensure both secrets are 32 bytes
      const s1 = this.normalizeSecret(secret1);
      const s2 = this.normalizeSecret(secret2);
      
      // XOR the secrets
      const xored = Buffer.alloc(32);
      for (let i = 0; i < 32; i++) {
        xored[i] = s1[i] ^ s2[i];
      }
      
      // Apply HKDF for additional mixing
      const hkdf = crypto.createHmac('sha256', Buffer.from('quantum-vault-hybrid-v1'));
      hkdf.update(xored);
      const combined = hkdf.digest();
      
      return combined;
    } catch (error) {
      console.error('Secret combination error:', error);
      throw new Error('Failed to combine secrets');
    }
  }

  /**
   * Normalize secret to 32 bytes using SHA-256
   * @param {Uint8Array} secret
   * @returns {Buffer}
   */
  normalizeSecret(secret) {
    if (secret.length === 32) {
      return Buffer.from(secret);
    }
    
    // Hash to 32 bytes if different size
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(secret));
    return hash.digest();
  }

  /**
   * Encrypt message with hybrid encryption
   * @param {string} message - Plain text message
   * @param {Object} ownKeys - Own private keys
   * @param {Object} peerKeys - Peer public keys
   * @returns {Promise<Object>} Encrypted data
   */
  async encrypt(message, ownKeys, peerKeys) {
    try {
      // Derive hybrid shared secret
      const { sharedSecret, kyberCiphertext } = await this.deriveSharedSecret(
        ownKeys,
        peerKeys
      );
      
      // Import shared secret as AES key
      const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Encrypt with ECC crypto (uses QRNG for IV)
      const encrypted = await eccCrypto.encrypt(message, aesKey);
      
      return {
        ...encrypted,
        kyberCiphertext: kyber.exportPublicKey(kyberCiphertext),
        version: this.version,
      };
    } catch (error) {
      console.error('Hybrid encryption error:', error);
      throw new Error('Failed to encrypt with hybrid crypto');
    }
  }

  /**
   * Decrypt message with hybrid encryption
   * @param {Object} encryptedData - Encrypted data
   * @param {Object} ownKeys - Own private keys
   * @param {Object} peerKeys - Peer public keys
   * @returns {Promise<string>} Decrypted message
   */
  async decrypt(encryptedData, ownKeys, peerKeys) {
    try {
      // Import Kyber ciphertext
      const kyberCiphertext = kyber.importPublicKey(encryptedData.kyberCiphertext);
      
      // Recover hybrid shared secret
      const sharedSecret = await this.recoverSharedSecret(
        ownKeys,
        peerKeys,
        kyberCiphertext
      );
      
      // Import shared secret as AES key
      const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt with ECC crypto
      const decrypted = await eccCrypto.decrypt(
        encryptedData.ciphertext,
        encryptedData.iv,
        aesKey
      );
      
      return decrypted;
    } catch (error) {
      console.error('Hybrid decryption error:', error);
      throw new Error('Failed to decrypt with hybrid crypto');
    }
  }

  /**
   * Export hybrid key pair
   * @param {Object} keyPair - Hybrid key pair
   * @returns {Promise<Object>} Exported keys
   */
  async exportKeyPair(keyPair) {
    try {
      return {
        ecc: {
          publicKey: await eccCrypto.exportPublicKey(keyPair.ecc.publicKey),
          privateKey: await eccCrypto.exportPrivateKey(keyPair.ecc.privateKey),
        },
        kyber: {
          publicKey: kyber.exportPublicKey(keyPair.kyber.publicKey),
          privateKey: kyber.exportPrivateKey(keyPair.kyber.privateKey),
        },
        version: keyPair.version,
      };
    } catch (error) {
      console.error('Key export error:', error);
      throw new Error('Failed to export hybrid key pair');
    }
  }

  /**
   * Import hybrid key pair
   * @param {Object} exportedKeys - Exported keys
   * @returns {Promise<Object>} Imported key pair
   */
  async importKeyPair(exportedKeys) {
    try {
      return {
        ecc: {
          publicKey: await eccCrypto.importPublicKey(exportedKeys.ecc.publicKey),
          privateKey: await eccCrypto.importPrivateKey(exportedKeys.ecc.privateKey),
        },
        kyber: {
          publicKey: kyber.importPublicKey(exportedKeys.kyber.publicKey),
          privateKey: kyber.importPrivateKey(exportedKeys.kyber.privateKey),
        },
        version: exportedKeys.version,
      };
    } catch (error) {
      console.error('Key import error:', error);
      throw new Error('Failed to import hybrid key pair');
    }
  }

  /**
   * Get algorithm information
   * @returns {Object}
   */
  getInfo() {
    return {
      version: this.version,
      algorithms: {
        classical: 'ECC P-256 + AES-GCM-256',
        postQuantum: 'Kyber-768',
        randomness: 'QRNG (ANU)',
      },
      securityLevel: 'NIST Level 3',
      quantumResistant: true,
      description: 'Hybrid encryption combining classical ECC and post-quantum Kyber',
    };
  }
}

module.exports = new HybridCrypto();
