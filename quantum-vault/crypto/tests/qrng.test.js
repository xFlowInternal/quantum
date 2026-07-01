/**
 * QRNG Service Tests
 */

const qrng = require('../qrng/qrngService');

describe('QRNG Service', () => {
  beforeEach(() => {
    qrng.resetMetrics();
    qrng.clearCache();
  });

  describe('getRandomBytes', () => {
    test('should return requested number of bytes', async () => {
      const bytes = await qrng.getRandomBytes(32);
      expect(bytes).toHaveLength(32);
      expect(Array.isArray(bytes)).toBe(true);
    });

    test('should return different values on multiple calls', async () => {
      const bytes1 = await qrng.getRandomBytes(100);
      const bytes2 = await qrng.getRandomBytes(100);
      
      expect(bytes1).not.toEqual(bytes2);
    });

    test('should reject invalid length', async () => {
      await expect(qrng.getRandomBytes(0)).rejects.toThrow();
      await expect(qrng.getRandomBytes(-1)).rejects.toThrow();
      await expect(qrng.getRandomBytes(10001)).rejects.toThrow();
    });

    test('should use cache for subsequent requests', async () => {
      // First request fills cache
      await qrng.getRandomBytes(100);
      
      // Second request should hit cache
      await qrng.getRandomBytes(100);
      
      const metrics = qrng.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    test('should handle large requests', async () => {
      const bytes = await qrng.getRandomBytes(5000);
      expect(bytes).toHaveLength(5000);
    });
  });

  describe('getRandomBuffer', () => {
    test('should return Buffer', async () => {
      const buffer = await qrng.getRandomBuffer(32);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBe(32);
    });
  });

  describe('getRandomUint8Array', () => {
    test('should return Uint8Array', async () => {
      const array = await qrng.getRandomUint8Array(32);
      expect(array).toBeInstanceOf(Uint8Array);
      expect(array.length).toBe(32);
    });
  });

  describe('getRandomHex', () => {
    test('should return hex string', async () => {
      const hex = await qrng.getRandomHex(16);
      expect(typeof hex).toBe('string');
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });

  describe('getRandomBase64', () => {
    test('should return base64 string', async () => {
      const base64 = await qrng.getRandomBase64(32);
      expect(typeof base64).toBe('string');
      expect(base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('metrics', () => {
    test('should track requests', async () => {
      await qrng.getRandomBytes(100);
      await qrng.getRandomBytes(100);
      
      const metrics = qrng.getMetrics();
      expect(metrics.totalRequests).toBe(2);
    });

    test('should calculate cache hit rate', async () => {
      await qrng.getRandomBytes(100);
      await qrng.getRandomBytes(100);
      
      const metrics = qrng.getMetrics();
      expect(metrics.cacheHitRate).toBeDefined();
      expect(typeof metrics.cacheHitRate).toBe('string');
    });

    test('should reset metrics', async () => {
      await qrng.getRandomBytes(100);
      qrng.resetMetrics();
      
      const metrics = qrng.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('cache management', () => {
    test('should clear cache', async () => {
      await qrng.getRandomBytes(100);
      qrng.clearCache();
      
      const metrics = qrng.getMetrics();
      expect(metrics.cacheSize).toBe(0);
    });

    test('should refill cache when low', async () => {
      // Request enough to trigger refill
      await qrng.getRandomBytes(100);
      
      const metrics = qrng.getMetrics();
      expect(metrics.cacheSize).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    test('should return health status', async () => {
      const health = await qrng.healthCheck();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('cacheSize');
      expect(health).toHaveProperty('metrics');
      expect(typeof health.healthy).toBe('boolean');
    }, 10000); // Longer timeout for API call
  });

  describe('randomness quality', () => {
    test('should have good distribution', async () => {
      const bytes = await qrng.getRandomBytes(1000);
      
      // Calculate average (should be around 127.5 for uniform distribution)
      const avg = bytes.reduce((a, b) => a + b, 0) / bytes.length;
      expect(avg).toBeGreaterThan(100);
      expect(avg).toBeLessThan(155);
    });

    test('should not have obvious patterns', async () => {
      const bytes = await qrng.getRandomBytes(100);
      
      // Check for consecutive identical bytes (should be rare)
      let consecutiveCount = 0;
      for (let i = 1; i < bytes.length; i++) {
        if (bytes[i] === bytes[i - 1]) {
          consecutiveCount++;
        }
      }
      
      // Allow some consecutive bytes, but not too many
      expect(consecutiveCount).toBeLessThan(20);
    });

    test('should use all byte values', async () => {
      const bytes = await qrng.getRandomBytes(5000);
      const uniqueValues = new Set(bytes);
      
      // With 5000 bytes, we should see most possible values (0-255)
      expect(uniqueValues.size).toBeGreaterThan(200);
    });
  });

  describe('fallback mechanism', () => {
    test('should use fallback when API fails', async () => {
      // Clear cache to force API call
      qrng.clearCache();
      
      // Mock API failure by setting invalid URL temporarily
      const originalUrl = qrng.apiUrl;
      qrng.apiUrl = 'https://invalid-url-that-does-not-exist.com';
      
      // Should still return random bytes via fallback
      const bytes = await qrng.getRandomBytes(32);
      expect(bytes).toHaveLength(32);
      
      // Restore original URL
      qrng.apiUrl = originalUrl;
      
      const metrics = qrng.getMetrics();
      expect(metrics.fallbackUsed).toBeGreaterThan(0);
    });
  });

  describe('concurrent requests', () => {
    test('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() => 
        qrng.getRandomBytes(100)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(bytes => {
        expect(bytes).toHaveLength(100);
      });
    });
  });

  describe('performance', () => {
    test('cache should be faster than API', async () => {
      // First call (cache miss)
      const start1 = Date.now();
      await qrng.getRandomBytes(100);
      const time1 = Date.now() - start1;
      
      // Second call (cache hit)
      const start2 = Date.now();
      await qrng.getRandomBytes(100);
      const time2 = Date.now() - start2;
      
      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1);
    });
  });
});
