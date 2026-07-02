/**
 * Dilithium-3 Tests
 */

const dilithium = require('../pqc/dilithium');

describe('Dilithium-3 Digital Signatures', () => {
  let keyPair;
  const testMessage = 'Hello, Quantum World!';

  beforeAll(async () => {
    keyPair = await dilithium.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    test('should generate valid key pair', async () => {
      const kp = await dilithium.generateKeyPair();
      
      expect(kp).toHaveProperty('publicKey');
      expect(kp).toHaveProperty('privateKey');
      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.privateKey).toBeInstanceOf(Uint8Array);
    });

    test('should generate correct key sizes', async () => {
      const kp = await dilithium.generateKeyPair();
      
      expect(kp.publicKey.length).toBe(1952); // Dilithium-3 public key size
      expect(kp.privateKey.length).toBe(4000); // Dilithium-3 private key size
    });

    test('should generate different keys each time', async () => {
      const kp1 = await dilithium.generateKeyPair();
      const kp2 = await dilithium.generateKeyPair();
      
      expect(kp1.publicKey).not.toEqual(kp2.publicKey);
      expect(kp1.privateKey).not.toEqual(kp2.privateKey);
    });
  });

  describe('sign', () => {
    test('should sign string message', async () => {
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBeGreaterThan(0);
    });

    test('should sign Uint8Array message', async () => {
      const messageBytes = new TextEncoder().encode(testMessage);
      const signature = await dilithium.sign(messageBytes, keyPair.privateKey);
      
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature.length).toBeGreaterThan(0);
    });

    test('should generate different signatures for different messages', async () => {
      const sig1 = await dilithium.sign('Message 1', keyPair.privateKey);
      const sig2 = await dilithium.sign('Message 2', keyPair.privateKey);
      
      expect(sig1).not.toEqual(sig2);
    });

    test('should reject invalid private key', async () => {
      await expect(
        dilithium.sign(testMessage, new Uint8Array(100))
      ).rejects.toThrow();
    });
  });

  describe('verify', () => {
    test('should verify valid signature', async () => {
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      const isValid = await dilithium.verify(signature, testMessage, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });

    test('should verify Uint8Array message', async () => {
      const messageBytes = new TextEncoder().encode(testMessage);
      const signature = await dilithium.sign(messageBytes, keyPair.privateKey);
      const isValid = await dilithium.verify(signature, messageBytes, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });

    test('should reject invalid signature', async () => {
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      
      // Modify signature
      signature[0] ^= 1;
      
      const isValid = await dilithium.verify(signature, testMessage, keyPair.publicKey);
      
      expect(isValid).toBe(false);
    });

    test('should reject wrong message', async () => {
      const signature = await dilithium.sign('Original message', keyPair.privateKey);
      const isValid = await dilithium.verify(signature, 'Different message', keyPair.publicKey);
      
      expect(isValid).toBe(false);
    });

    test('should reject wrong public key', async () => {
      const otherKeyPair = await dilithium.generateKeyPair();
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      const isValid = await dilithium.verify(signature, testMessage, otherKeyPair.publicKey);
      
      expect(isValid).toBe(false);
    });

    test('should reject invalid public key', async () => {
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      const isValid = await dilithium.verify(signature, testMessage, new Uint8Array(100));
      
      expect(isValid).toBe(false);
    });
  });

  describe('key export/import', () => {
    test('should export and import public key', () => {
      const exported = dilithium.exportPublicKey(keyPair.publicKey);
      const imported = dilithium.importPublicKey(exported);
      
      expect(typeof exported).toBe('string');
      expect(imported).toEqual(keyPair.publicKey);
    });

    test('should export and import private key', () => {
      const exported = dilithium.exportPrivateKey(keyPair.privateKey);
      const imported = dilithium.importPrivateKey(exported);
      
      expect(typeof exported).toBe('string');
      expect(imported).toEqual(keyPair.privateKey);
    });

    test('should work with exported/imported keys', async () => {
      // Export and import keys
      const exportedPriv = dilithium.exportPrivateKey(keyPair.privateKey);
      const exportedPub = dilithium.exportPublicKey(keyPair.publicKey);
      const importedPriv = dilithium.importPrivateKey(exportedPriv);
      const importedPub = dilithium.importPublicKey(exportedPub);
      
      // Sign with imported private key
      const signature = await dilithium.sign(testMessage, importedPriv);
      
      // Verify with imported public key
      const isValid = await dilithium.verify(signature, testMessage, importedPub);
      
      expect(isValid).toBe(true);
    });
  });

  describe('getInfo', () => {
    test('should return algorithm information', () => {
      const info = dilithium.getInfo();
      
      expect(info.algorithm).toBe('Dilithium-3');
      expect(info.securityLevel).toBe('NIST Level 3');
      expect(info.quantumResistant).toBe(true);
      expect(info.publicKeySize).toBe(1952);
      expect(info.privateKeySize).toBe(4000);
      expect(info.signatureSize).toBe(3293);
    });
  });

  describe('end-to-end signing', () => {
    test('should perform complete sign/verify flow', async () => {
      // Alice generates key pair
      const aliceKeys = await dilithium.generateKeyPair();
      
      // Alice signs a message
      const message = 'Important message from Alice';
      const signature = await dilithium.sign(message, aliceKeys.privateKey);
      
      // Bob verifies with Alice's public key
      const isValid = await dilithium.verify(signature, message, aliceKeys.publicKey);
      
      expect(isValid).toBe(true);
    });

    test('should detect message tampering', async () => {
      const aliceKeys = await dilithium.generateKeyPair();
      const message = 'Transfer $100';
      const signature = await dilithium.sign(message, aliceKeys.privateKey);
      
      // Attacker modifies message
      const tamperedMessage = 'Transfer $1000';
      const isValid = await dilithium.verify(signature, tamperedMessage, aliceKeys.publicKey);
      
      expect(isValid).toBe(false);
    });
  });

  describe('performance', () => {
    test('key generation should be reasonably fast', async () => {
      const start = Date.now();
      await dilithium.generateKeyPair();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500); // Should be < 500ms
    });

    test('signing should be reasonably fast', async () => {
      const start = Date.now();
      await dilithium.sign(testMessage, keyPair.privateKey);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200); // Should be < 200ms
    });

    test('verification should be fast', async () => {
      const signature = await dilithium.sign(testMessage, keyPair.privateKey);
      
      const start = Date.now();
      await dilithium.verify(signature, testMessage, keyPair.publicKey);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100); // Should be < 100ms
    });
  });

  describe('multiple signatures', () => {
    test('should handle multiple signatures correctly', async () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      const signatures = [];
      
      // Sign all messages
      for (const msg of messages) {
        const sig = await dilithium.sign(msg, keyPair.privateKey);
        signatures.push(sig);
      }
      
      // Verify all signatures
      for (let i = 0; i < messages.length; i++) {
        const isValid = await dilithium.verify(
          signatures[i],
          messages[i],
          keyPair.publicKey
        );
        expect(isValid).toBe(true);
      }
      
      // Cross-verify should fail
      const crossValid = await dilithium.verify(
        signatures[0],
        messages[1],
        keyPair.publicKey
      );
      expect(crossValid).toBe(false);
    });
  });
});
