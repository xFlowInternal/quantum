/**
 * Hybrid Cryptography Tests
 * Testing ECC + Kyber combination
 */

const hybrid = require('../pqc/hybrid');

describe('Hybrid Cryptography', () => {
  let aliceKeys, bobKeys;

  beforeAll(async () => {
    // Generate key pairs for Alice and Bob
    aliceKeys = await hybrid.generateKeyPair();
    bobKeys = await hybrid.generateKeyPair();
  }, 30000); // Longer timeout for key generation

  describe('generateKeyPair', () => {
    test('should generate hybrid key pair', async () => {
      const keyPair = await hybrid.generateKeyPair();
      
      expect(keyPair).toHaveProperty('ecc');
      expect(keyPair).toHaveProperty('kyber');
      expect(keyPair).toHaveProperty('version');
      expect(keyPair.version).toBe('hybrid-v1');
    }, 15000);

    test('should have ECC keys', async () => {
      const keyPair = await hybrid.generateKeyPair();
      
      expect(keyPair.ecc).toHaveProperty('publicKey');
      expect(keyPair.ecc).toHaveProperty('privateKey');
    }, 15000);

    test('should have Kyber keys', async () => {
      const keyPair = await hybrid.generateKeyPair();
      
      expect(keyPair.kyber).toHaveProperty('publicKey');
      expect(keyPair.kyber).toHaveProperty('privateKey');
      expect(keyPair.kyber.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.privateKey).toBeInstanceOf(Uint8Array);
    }, 15000);
  });

  describe('deriveSharedSecret', () => {
    test('should derive hybrid shared secret', async () => {
      const result = await hybrid.deriveSharedSecret(
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      expect(result).toHaveProperty('sharedSecret');
      expect(result).toHaveProperty('kyberCiphertext');
      expect(result.sharedSecret).toBeInstanceOf(Buffer);
      expect(result.sharedSecret.length).toBe(32);
    }, 10000);

    test('should generate different secrets each time', async () => {
      const result1 = await hybrid.deriveSharedSecret(
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      const result2 = await hybrid.deriveSharedSecret(
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      // Kyber is probabilistic, so secrets should differ
      expect(result1.sharedSecret).not.toEqual(result2.sharedSecret);
    }, 10000);
  });

  describe('recoverSharedSecret', () => {
    test('should recover the same shared secret', async () => {
      // Alice derives shared secret
      const aliceResult = await hybrid.deriveSharedSecret(
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      // Bob recovers shared secret
      const bobSecret = await hybrid.recoverSharedSecret(
        bobKeys,
        {
          ecc: { publicKey: aliceKeys.ecc.publicKey },
        },
        aliceResult.kyberCiphertext
      );
      
      expect(bobSecret).toEqual(aliceResult.sharedSecret);
    }, 10000);
  });

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt message', async () => {
      const message = 'Hello, Quantum World!';
      
      // Alice encrypts for Bob
      const encrypted = await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('kyberCiphertext');
      expect(encrypted).toHaveProperty('version');
      expect(encrypted.version).toBe('hybrid-v1');
      
      // Bob decrypts
      const decrypted = await hybrid.decrypt(
        encrypted,
        bobKeys,
        {
          ecc: { publicKey: aliceKeys.ecc.publicKey },
        }
      );
      
      expect(decrypted).toBe(message);
    }, 15000);

    test('should handle long messages', async () => {
      const message = 'A'.repeat(10000);
      
      const encrypted = await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      const decrypted = await hybrid.decrypt(
        encrypted,
        bobKeys,
        {
          ecc: { publicKey: aliceKeys.ecc.publicKey },
        }
      );
      
      expect(decrypted).toBe(message);
    }, 15000);

    test('should handle special characters', async () => {
      const message = '🔐 Quantum Vault 🚀 with émojis and spëcial çhars!';
      
      const encrypted = await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      const decrypted = await hybrid.decrypt(
        encrypted,
        bobKeys,
        {
          ecc: { publicKey: aliceKeys.ecc.publicKey },
        }
      );
      
      expect(decrypted).toBe(message);
    }, 15000);

    test('should fail with wrong keys', async () => {
      const message = 'Secret message';
      const eveKeys = await hybrid.generateKeyPair();
      
      const encrypted = await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      // Eve tries to decrypt with her keys
      await expect(
        hybrid.decrypt(
          encrypted,
          eveKeys,
          {
            ecc: { publicKey: aliceKeys.ecc.publicKey },
          }
        )
      ).rejects.toThrow();
    }, 20000);
  });

  describe('combineSecrets', () => {
    test('should combine two secrets', () => {
      const secret1 = new Uint8Array(32).fill(1);
      const secret2 = new Uint8Array(32).fill(2);
      
      const combined = hybrid.combineSecrets(secret1, secret2);
      
      expect(combined).toBeInstanceOf(Buffer);
      expect(combined.length).toBe(32);
    });

    test('should produce same result with same inputs', () => {
      const secret1 = new Uint8Array(32).fill(1);
      const secret2 = new Uint8Array(32).fill(2);
      
      const combined1 = hybrid.combineSecrets(secret1, secret2);
      const combined2 = hybrid.combineSecrets(secret1, secret2);
      
      expect(combined1).toEqual(combined2);
    });

    test('should produce different result with different inputs', () => {
      const secret1 = new Uint8Array(32).fill(1);
      const secret2 = new Uint8Array(32).fill(2);
      const secret3 = new Uint8Array(32).fill(3);
      
      const combined1 = hybrid.combineSecrets(secret1, secret2);
      const combined2 = hybrid.combineSecrets(secret1, secret3);
      
      expect(combined1).not.toEqual(combined2);
    });

    test('should handle different sized secrets', () => {
      const secret1 = new Uint8Array(16).fill(1);
      const secret2 = new Uint8Array(64).fill(2);
      
      const combined = hybrid.combineSecrets(secret1, secret2);
      
      expect(combined.length).toBe(32); // Normalized to 32 bytes
    });
  });

  describe('exportKeyPair and importKeyPair', () => {
    test('should export key pair', async () => {
      const exported = await hybrid.exportKeyPair(aliceKeys);
      
      expect(exported).toHaveProperty('ecc');
      expect(exported).toHaveProperty('kyber');
      expect(exported).toHaveProperty('version');
      expect(typeof exported.ecc.publicKey).toBe('string');
      expect(typeof exported.ecc.privateKey).toBe('string');
      expect(typeof exported.kyber.publicKey).toBe('string');
      expect(typeof exported.kyber.privateKey).toBe('string');
    });

    test('should import key pair', async () => {
      const exported = await hybrid.exportKeyPair(aliceKeys);
      const imported = await hybrid.importKeyPair(exported);
      
      expect(imported).toHaveProperty('ecc');
      expect(imported).toHaveProperty('kyber');
      expect(imported).toHaveProperty('version');
      expect(imported.version).toBe(exported.version);
    });

    test('should work with exported/imported keys', async () => {
      const message = 'Test with exported keys';
      
      // Export and import Alice's keys
      const exportedAlice = await hybrid.exportKeyPair(aliceKeys);
      const importedAlice = await hybrid.importKeyPair(exportedAlice);
      
      // Export and import Bob's keys
      const exportedBob = await hybrid.exportKeyPair(bobKeys);
      const importedBob = await hybrid.importKeyPair(exportedBob);
      
      // Encrypt with imported keys
      const encrypted = await hybrid.encrypt(
        message,
        importedAlice,
        {
          ecc: { publicKey: importedBob.ecc.publicKey },
          kyber: { publicKey: importedBob.kyber.publicKey },
        }
      );
      
      // Decrypt with imported keys
      const decrypted = await hybrid.decrypt(
        encrypted,
        importedBob,
        {
          ecc: { publicKey: importedAlice.ecc.publicKey },
        }
      );
      
      expect(decrypted).toBe(message);
    }, 20000);
  });

  describe('getInfo', () => {
    test('should return algorithm information', () => {
      const info = hybrid.getInfo();
      
      expect(info.version).toBe('hybrid-v1');
      expect(info.algorithms).toHaveProperty('classical');
      expect(info.algorithms).toHaveProperty('postQuantum');
      expect(info.algorithms).toHaveProperty('randomness');
      expect(info.securityLevel).toBe('NIST Level 3');
      expect(info.quantumResistant).toBe(true);
    });
  });

  describe('performance', () => {
    test('key generation should complete in reasonable time', async () => {
      const start = Date.now();
      await hybrid.generateKeyPair();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000); // Should be < 5 seconds
    }, 10000);

    test('encryption should be reasonably fast', async () => {
      const message = 'Performance test message';
      
      const start = Date.now();
      await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should be < 1 second
    }, 5000);

    test('decryption should be reasonably fast', async () => {
      const message = 'Performance test message';
      
      const encrypted = await hybrid.encrypt(
        message,
        aliceKeys,
        {
          ecc: { publicKey: bobKeys.ecc.publicKey },
          kyber: { publicKey: bobKeys.kyber.publicKey },
        }
      );
      
      const start = Date.now();
      await hybrid.decrypt(
        encrypted,
        bobKeys,
        {
          ecc: { publicKey: aliceKeys.ecc.publicKey },
        }
      );
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should be < 1 second
    }, 5000);
  });
});
