# QRNG Implementation Guide - Week 8

**Quantum Random Number Generation Integration**

---

## 🎯 Objective

Replace pseudo-random number generation with true quantum random numbers from ANU QRNG API.

---

## 🔬 What is QRNG?

### Classical RNG (Current)
```javascript
// Pseudo-random (deterministic with seed)
crypto.getRandomValues(new Uint8Array(32));
```
- **Algorithm-based** (e.g., Fortuna, ChaCha20)
- **Deterministic** (same seed = same output)
- **Predictable** (with enough computational power)

### Quantum RNG (Target)
```javascript
// True random (quantum phenomena)
await qrngService.getRandomBytes(32);
```
- **Physics-based** (quantum vacuum fluctuations)
- **Non-deterministic** (truly random)
- **Unpredictable** (even with infinite computational power)

---

## 🏗️ Architecture

### Component Structure
```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Key Generation, IV, Salts)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         QRNG Service                    │
│  - Request quantum random numbers       │
│  - Cache management                     │
│  - Fallback logic                       │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐  ┌──▼────────────┐
│  ANU QRNG    │  │  Fallback     │
│  API         │  │  (Web Crypto) │
└──────────────┘  └───────────────┘
```

---

## 📦 Implementation Plan

### Step 1: QRNG Service (Backend)

**File:** `backend/src/services/qrngService.js`

```javascript
const axios = require('axios');

class QRNGService {
  constructor() {
    this.apiUrl = 'https://qrng.anu.edu.au/API/jsonI.php';
    this.cache = [];
    this.cacheSize = 10000; // Cache 10,000 bytes
    this.minCacheSize = 1000; // Refill threshold
  }

  async getRandomBytes(length) {
    // Check cache first
    if (this.cache.length >= length) {
      return this.cache.splice(0, length);
    }

    // Refill cache
    await this.refillCache();

    // Return from cache or fallback
    if (this.cache.length >= length) {
      return this.cache.splice(0, length);
    } else {
      return this.fallbackRandom(length);
    }
  }

  async refillCache() {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          length: this.cacheSize,
          type: 'uint8',
        },
        timeout: 5000,
      });

      if (response.data.success) {
        this.cache = response.data.data;
      }
    } catch (error) {
      console.error('QRNG API error:', error.message);
      // Fallback will be used
    }
  }

  fallbackRandom(length) {
    // Use crypto.randomBytes as fallback
    return Array.from(crypto.randomBytes(length));
  }
}

module.exports = new QRNGService();
```

### Step 2: QRNG Client (Frontend)

**File:** `frontend/src/utils/qrng.js`

```javascript
class QRNGClient {
  constructor() {
    this.cache = new Uint8Array(0);
    this.cacheSize = 5000;
    this.minCacheSize = 500;
    this.refilling = false;
  }

  async getRandomBytes(length) {
    // Check cache
    if (this.cache.length >= length) {
      const result = this.cache.slice(0, length);
      this.cache = this.cache.slice(length);
      
      // Refill if low
      if (this.cache.length < this.minCacheSize && !this.refilling) {
        this.refillCache();
      }
      
      return result;
    }

    // Wait for refill or use fallback
    await this.refillCache();
    
    if (this.cache.length >= length) {
      const result = this.cache.slice(0, length);
      this.cache = this.cache.slice(length);
      return result;
    }

    // Fallback
    return crypto.getRandomValues(new Uint8Array(length));
  }

  async refillCache() {
    if (this.refilling) return;
    
    this.refilling = true;
    try {
      const response = await fetch(
        `https://qrng.anu.edu.au/API/jsonI.php?length=${this.cacheSize}&type=uint8`
      );
      const data = await response.json();
      
      if (data.success) {
        this.cache = new Uint8Array(data.data);
      }
    } catch (error) {
      console.warn('QRNG unavailable, using fallback');
    } finally {
      this.refilling = false;
    }
  }
}

export default new QRNGClient();
```

### Step 3: Integration with Crypto Service

**Update:** `frontend/src/utils/crypto.js`

```javascript
import qrng from './qrng';

class CryptoService {
  // ... existing code ...

  async encrypt(message, key) {
    try {
      // Use QRNG for IV generation
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
}
```

---

## 🧪 Testing Plan

### Test 1: API Connectivity
```javascript
test('QRNG API is accessible', async () => {
  const response = await fetch(
    'https://qrng.anu.edu.au/API/jsonI.php?length=10&type=uint8'
  );
  const data = await response.json();
  
  expect(data.success).toBe(true);
  expect(data.data).toHaveLength(10);
});
```

### Test 2: Randomness Quality
```javascript
test('QRNG produces random data', async () => {
  const bytes1 = await qrng.getRandomBytes(100);
  const bytes2 = await qrng.getRandomBytes(100);
  
  // Should not be identical
  expect(bytes1).not.toEqual(bytes2);
  
  // Should have good distribution
  const avg = bytes1.reduce((a, b) => a + b) / bytes1.length;
  expect(avg).toBeGreaterThan(100);
  expect(avg).toBeLessThan(155);
});
```

### Test 3: Fallback Mechanism
```javascript
test('Falls back to Web Crypto when QRNG unavailable', async () => {
  // Mock API failure
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
  
  const bytes = await qrng.getRandomBytes(32);
  
  expect(bytes).toHaveLength(32);
  expect(bytes).toBeInstanceOf(Uint8Array);
});
```

### Test 4: Cache Performance
```javascript
test('Cache improves performance', async () => {
  // First call (cache miss)
  const start1 = Date.now();
  await qrng.getRandomBytes(100);
  const time1 = Date.now() - start1;
  
  // Second call (cache hit)
  const start2 = Date.now();
  await qrng.getRandomBytes(100);
  const time2 = Date.now() - start2;
  
  // Cache should be faster
  expect(time2).toBeLessThan(time1);
});
```

---

## 📊 Performance Metrics

### Expected Performance
- **API Latency:** 200-500ms
- **Cache Hit:** <1ms
- **Fallback:** <1ms
- **Cache Refill:** Background (non-blocking)

### Monitoring
```javascript
// Add metrics
const metrics = {
  qrngRequests: 0,
  qrngFailures: 0,
  cacheHits: 0,
  cacheMisses: 0,
  fallbackUsed: 0,
};
```

---

## 🔒 Security Considerations

### 1. API Trust
- **ANU QRNG** is a reputable source (Australian National University)
- **Peer-reviewed** quantum random number generation
- **Publicly audited** and verified

### 2. Fallback Security
- Web Crypto API is cryptographically secure
- Not quantum-random, but still secure for current threats
- Clearly log when fallback is used

### 3. Cache Security
- Store in memory only (not localStorage)
- Clear cache on logout
- Limit cache size to prevent memory issues

### 4. Network Security
- Use HTTPS for API calls
- Validate response format
- Handle timeouts gracefully

---

## 🚀 Deployment Checklist

- [ ] QRNG service implemented
- [ ] Cache system working
- [ ] Fallback mechanism tested
- [ ] All tests passing
- [ ] Performance metrics added
- [ ] Error logging configured
- [ ] Documentation updated
- [ ] User notification (optional)

---

## 📈 Success Criteria

### Week 8 Goals
1. ✅ QRNG API integration complete
2. ✅ Cache system operational (>90% hit rate)
3. ✅ Fallback mechanism tested
4. ✅ No performance degradation (<5% overhead)
5. ✅ All tests passing (>95% coverage)

---

## 🔄 Migration Path

### Phase 1: Parallel Running
- Keep existing crypto.getRandomValues()
- Add QRNG alongside
- Compare outputs (testing)

### Phase 2: Gradual Rollout
- Use QRNG for new keys
- Keep existing keys unchanged
- Monitor for issues

### Phase 3: Full Migration
- All random generation uses QRNG
- Remove old code
- Update documentation

---

## 📚 Resources

- **ANU QRNG API:** https://qrng.anu.edu.au/
- **API Documentation:** https://qrng.anu.edu.au/API/api-demo.php
- **Research Paper:** https://arxiv.org/abs/1905.08443
- **NIST Randomness Tests:** https://csrc.nist.gov/projects/random-bit-generation

---

**Status:** ✅ Ready for Implementation  
**Estimated Time:** 3-4 days  
**Risk Level:** Low (fallback available)  
**Dependencies:** None

---

**Next:** After Week 8 completion, proceed to PQC Implementation (Week 9)
