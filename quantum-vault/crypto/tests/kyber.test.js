/**
 * Kyber-768 Tests
 */

const kyber = require('../pqc/kyber');

describe('Kyber-768 Cryptography', () => {
  let keyPair1, keyPair2;

  beforeAll(async () => {
    // Generate test key pairs
    keyPair1 = await kyber.generateKeyPair();
    keyPair2 = await kyber.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    test('should generate valid key pair', async () => {
      const keyPair = await kyber.generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
    });

    test('should generate correct key sizes', async () => {
      const keyPair = await kyber.generateKeyPair();
      
      expect(keyPair.publicKey.length).toBe(1184); // Kyber-768 public key size
      expect(keyPair.privateKey.length).toBe(2400); // Kyber-768 private key size
    });

    test('should generate different keys each time', async () => {
      const kp1 = await kyber.generateKeyPair();
      const kp2 = await kyber.generateKeyPair();
      
      expect(kp1.publicKey).not.toEqual(kp2.publicKey);
      expect(kp1.privateKey).not.toEqual(kp2.privateKey);
    });
  });

  describe('encapsulate', () => {
    test('should encapsulate successfully', async () => {
      const result = await kyber.encapsulate(keyPair1.publicKey);
      
      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('sharedSecret');
      expect(result.ciphertext).toBeInstanceOf(Uint8Array);
      expect(result.sharedSecret).toBeInstanceOf(Uint8Array);
    });

    test('should generate correct sizes', async () => {
      const result = await kyber.encapsulate(keyPair1.publicKey);
      
      expect(result.ciphertext.length).toBe(1088); // Kyber-768 ciphertext size
      expect(result.sharedSecret.length).toBe(32); // 256-bit shared secret
    });

    test('should generate different shared secrets', async () => {
      const result1 = await kyber.encapsulate(keyPair1.publicKey);
      const result2 = await kyber.encapsulate(keyPair1.publicKey);
      
      expect(result1.sharedSecret).not.toEqual(result2.sharedSecret);
      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
    });

    test('should reject invalid public key', async () => {
      await expect(
        kyber.encapsulate(new Uint8Array(100))
      ).rejects.toThrow();
    });
  });

  describe('decapsulate', () => {
    test('should decapsulate successfully', async () => {
      const { ciphertext, sharedSecret: originalSecret } = await kyber.encapsulate(
        keyPair1.publicKey
      );
      
      const recoveredSecret = await kyber.decapsulate(
        ciphertext,
        keyPair1.privateKey
      );
      
      expect(recoveredSecret).toEqual(originalSecret);
    });

    test('should fail with wrong private key', async () => {
      const { ciphertext, sharedSecret: originalSecret } = await kyber.encapsulate(
        keyPair1.publicKey
      );
      
      const recoveredSecret = await kyber.decapsulate(
        ciphertext,
        keyPair2.privateKey
      );
      
      // Should not match with wrong key
      expect(recoveredSecret).not.toEqual(originalSecret);
    });

    test('should reject invalid ciphertext', async () => {
      await expect(
        kyber.decapsulate(new Uint8Array(100), keyPair1.privateKey)
      ).rejects.toThrow();
    });

    test('should reject invalid private key', async () => {
      const { ciphertext } = await kyber.encapsulate(keyPair1.publicKey);
      
      await expect(
        kyber.decapsulate(ciphertext, new Uint8Array(100))
      ).rejects.toThrow();
    });
  });

  describe('key export/import', () => {
    test('should export and import public key', () => {
      const exported = kyber.exportPublicKey(keyPair1.publicKey);
      const imported = kyber.importPublicKey(exported);
      
      expect(typeof exported).toBe('string');
      expect(imported).toEqual(keyPair1.publicKey);
    });

    test('should export and import private key', () => {
      const exported = kyber.exportPrivateKey(keyPair1.privateKey);
      const imported = kyber.importPrivateKey(exported);
      
      expect(typeof exported).toBe('string');
      expect(imported).toEqual(keyPair1.privateKey);
    });

    test('should work with exported/imported keys', async () => {
      // Export and import public key
      const exportedPub = kyber.exportPublicKey(keyPair1.publicKey);
      const importedPub = kyber.importPublicKey(exportedPub);
      
      // Encapsulate with imported key
      const { ciphertext, sharedSecret } = await kyber.encapsulate(importedPub);
      
      // Decapsulate with original private key
      const recovered = await kyber.decapsulate(ciphertext, keyPair1.privateKey);
      
      expect(recovered).toEqual(sharedSecret);
    });
  });

  describe('getInfo', () => {
    test('should return algorithm information', () => {
      const info = kyber.getInfo();
      
      expect(info.algorithm).toBe('Kyber-768');
      expect(info.securityLevel).toBe('NIST Level 3');
      expect(info.quantumResistant).toBe(true);
      expect(info.publicKeySize).toBe(1184);
      expect(info.privateKeySize).toBe(2400);
      expect(info.ciphertextSize).toBe(1088);
      expect(info.sharedSecretSize).toBe(32);
    });
  });

  describe('end-to-end key exchange', () => {
    test('should perform complete key exchange', async () => {
      // Alice generates key pair
      const aliceKeys = await kyber.generateKeyPair();
      
      // Bob generates key pair
      const bobKeys = await kyber.generateKeyPair();
      
      // Alice encapsulates with Bob's public key
      const aliceResult = await kyber.encapsulate(bobKeys.publicKey);
      
      // Bob decapsulates with his private key
      const bobSecret = await kyber.decapsulate(
        aliceResult.ciphertext,
        bobKeys.privateKey
      );
      
      // Secrets should match
      expect(bobSecret).toEqual(aliceResult.sharedSecret);
    });
  });

  describe('performance', () => {
    test('key generation should be fast', async () => {
      const start = Date.now();
      await kyber.generateKeyPair();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100); // Should be < 100ms
    });

    test('encapsulation should be fast', async () => {
      const start = Date.now();
      await kyber.encapsulate(keyPair1.publicKey);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50); // Should be < 50ms
    });

    test('decapsulation should be fast', async () => {
      const { ciphertext } = await kyber.encapsulate(keyPair1.publicKey);
      
      const start = Date.now();
      await kyber.decapsulate(ciphertext, keyPair1.privateKey);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50); // Should be < 50ms
    });
  });
});
