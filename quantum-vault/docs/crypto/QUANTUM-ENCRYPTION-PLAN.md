# Quantum Encryption Implementation Plan

**Project:** Quantum Vault - Hybrid Quantum-Classical Encryption  
**Status:** Planning Phase  
**Target:** Weeks 8-9

---

## 🎯 Overview

This document outlines the strategy for implementing quantum-resistant encryption in Quantum Vault, combining:
1. **QRNG (Quantum Random Number Generation)** - Week 8
2. **PQC (Post-Quantum Cryptography)** - Week 9
3. **Hybrid Encryption** - Combining ECC + PQC

---

## 🔬 What is Quantum Encryption?

### Current State (Week 7)
- ✅ **ECC (Elliptic Curve Cryptography)** - Classical encryption
- ✅ **AES-GCM** - Symmetric encryption
- ✅ **ECDH** - Key exchange

### Problem
- **Quantum computers** (when mature) can break ECC using Shor's algorithm
- Current encryption will be vulnerable in 10-15 years
- Need **quantum-resistant** algorithms NOW

### Solution: Hybrid Approach
```
Classical ECC + Post-Quantum Cryptography = Quantum-Safe
```

---

## 📋 Three-Layer Strategy

### Layer 1: QRNG (Week 8)
**Purpose:** Generate truly random numbers using quantum mechanics

**Why?**
- Classical RNG is pseudo-random (predictable with enough data)
- Quantum RNG uses quantum phenomena (truly random)
- Critical for cryptographic key generation

**Implementation:**
- Use **ANU QRNG API** (Australian National University)
- Fallback to Web Crypto API if QRNG unavailable
- Cache quantum random numbers for performance

### Layer 2: PQC Algorithms (Week 9)
**Purpose:** Quantum-resistant encryption algorithms

**NIST-Approved Algorithms:**
1. **Kyber-768** - Key Encapsulation Mechanism (KEM)
2. **Dilithium-3** - Digital Signatures

**Why These?**
- NIST standardized (2024)
- Industry adoption starting
- Proven quantum-resistant

### Layer 3: Hybrid Encryption (Week 9)
**Purpose:** Combine classical + quantum-resistant

**Formula:**
```
Final Key = ECDH_SharedSecret ⊕ Kyber_SharedSecret
```

**Benefits:**
- Secure against classical attacks (ECC)
- Secure against quantum attacks (Kyber)
- If one breaks, the other protects

---

## 🏗️ Architecture Design

### Current Architecture (Week 7)
```
User A                          User B
  │                               │
  ├─ Generate ECC Keys            ├─ Generate ECC Keys
  │                               │
  ├──── Exchange Public Keys ────>│
  │<──── Exchange Public Keys ────┤
  │                               │
  ├─ ECDH → Shared Secret         ├─ ECDH → Shared Secret
  │                               │
  └─ AES-GCM Encrypt ─────────────┘
```

### Target Architecture (Week 9)
```
User A                                    User B
  │                                         │
  ├─ Generate ECC Keys (P-256)              ├─ Generate ECC Keys
  ├─ Generate Kyber Keys (768)              ├─ Generate Kyber Keys
  ├─ Use QRNG for randomness                ├─ Use QRNG for randomness
  │                                         │
  ├──── Exchange ECC Public Key ──────────>│
  ├──── Exchange Kyber Public Key ─────────>│
  │<──── Exchange ECC Public Key ───────────┤
  │<──── Exchange Kyber Public Key ──────────┤
  │                                         │
  ├─ ECDH → Secret1                         ├─ ECDH → Secret1
  ├─ Kyber Decapsulate → Secret2            ├─ Kyber Encapsulate → Secret2
  ├─ Combine: Secret1 ⊕ Secret2 → Final    ├─ Combine: Secret1 ⊕ Secret2
  │                                         │
  └─ AES-GCM Encrypt with Final Key ────────┘
```

---

## 📦 Implementation Components

### Week 8: QRNG Integration

**Files to Create:**
```
crypto/qrng/
├── qrngService.js          # QRNG API client
├── qrngCache.js            # Cache quantum random numbers
└── qrngFallback.js         # Fallback to crypto.getRandomValues()

backend/src/services/
└── qrngService.js          # Backend QRNG service

frontend/src/utils/
└── qrng.js                 # Frontend QRNG utility
```

**API Integration:**
- **ANU QRNG API:** https://qrng.anu.edu.au/API/jsonI.php
- **Parameters:** 
  - `length`: Number of random numbers
  - `type`: uint8, uint16, hex16
  - `size`: Array size

**Example Request:**
```javascript
GET https://qrng.anu.edu.au/API/jsonI.php?length=1024&type=uint8
```

**Example Response:**
```json
{
  "type": "uint8",
  "length": 1024,
  "data": [142, 231, 45, ...],
  "success": true
}
```

### Week 9: PQC Integration

**Files to Create:**
```
crypto/pqc/
├── kyber.js                # Kyber-768 implementation
├── dilithium.js            # Dilithium-3 implementation
└── hybrid.js               # Hybrid key derivation

frontend/src/utils/
├── pqcCrypto.js            # PQC wrapper
└── hybridCrypto.js         # Hybrid encryption service
```

**Libraries to Use:**
- **pqc-kyber** (npm package)
- **dilithium-crystals** (npm package)
- Or **liboqs-js** (comprehensive PQC library)

---

## 🔄 Migration Strategy

### Phase 1: QRNG (Week 8)
**Goal:** Replace pseudo-random with quantum random

**Changes:**
1. Replace `crypto.getRandomValues()` with QRNG
2. Use QRNG for:
   - IV generation
   - Salt generation
   - Key generation seeds
3. Implement caching for performance
4. Add fallback mechanism

**Backward Compatible:** ✅ Yes

### Phase 2: PQC Keys (Week 9 - Part 1)
**Goal:** Generate PQC keys alongside ECC

**Changes:**
1. Generate Kyber-768 key pairs
2. Store PQC public keys in database
3. Exchange PQC keys during handshake
4. Keep ECC keys active

**Backward Compatible:** ✅ Yes (dual-key system)

### Phase 3: Hybrid Encryption (Week 9 - Part 2)
**Goal:** Use both ECC and PQC for encryption

**Changes:**
1. Derive two shared secrets (ECC + Kyber)
2. Combine using XOR or KDF
3. Use combined key for AES-GCM
4. Add version flag to messages

**Backward Compatible:** ⚠️ Requires coordination

---

## 🔐 Security Considerations

### Key Storage
```javascript
// Current (Week 7)
localStorage: {
  "userId_publicKey_ecc": "base64...",
  "userId_privateKey_ecc": "base64..."
}

// Future (Week 9)
localStorage: {
  "userId_publicKey_ecc": "base64...",
  "userId_privateKey_ecc": "base64...",
  "userId_publicKey_kyber": "base64...",
  "userId_privateKey_kyber": "base64...",
  "userId_keyVersion": "hybrid-v1"
}
```

### Database Schema Updates
```sql
-- Add PQC columns to users table
ALTER TABLE users ADD COLUMN public_key_kyber TEXT;
ALTER TABLE users ADD COLUMN public_key_dilithium TEXT;
ALTER TABLE users ADD COLUMN crypto_version VARCHAR(20) DEFAULT 'ecc-only';

-- Add to messages table
ALTER TABLE messages ADD COLUMN encryption_version VARCHAR(20) DEFAULT 'ecc-v1';
```

### Message Format
```javascript
// Current
{
  encrypted_content: "base64...",
  iv: "base64..."
}

// Future
{
  encrypted_content: "base64...",
  iv: "base64...",
  encryption_version: "hybrid-v1",
  kyber_ciphertext: "base64..." // Encapsulated key
}
```

---

## 📊 Performance Impact

### QRNG Performance
- **API Latency:** ~200-500ms per request
- **Solution:** Cache 10,000 random bytes locally
- **Refresh:** Background task every 5 minutes

### PQC Performance
- **Kyber-768:**
  - Key generation: ~0.1ms
  - Encapsulation: ~0.15ms
  - Decapsulation: ~0.2ms
- **Dilithium-3:**
  - Key generation: ~2ms
  - Sign: ~5ms
  - Verify: ~2ms

### Hybrid Encryption
- **Additional Overhead:** ~0.5ms per message
- **Acceptable:** ✅ Yes (< 1% of total latency)

---

## 🧪 Testing Strategy

### QRNG Tests
1. API connectivity test
2. Randomness quality test (Chi-square)
3. Fallback mechanism test
4. Cache performance test

### PQC Tests
1. Key generation test
2. Encapsulation/Decapsulation test
3. Signature generation/verification test
4. Interoperability test

### Hybrid Tests
1. Key combination test
2. End-to-end encryption test
3. Backward compatibility test
4. Performance benchmark test

---

## 📈 Success Metrics

### Week 8 (QRNG)
- ✅ QRNG API integration working
- ✅ Cache system operational
- ✅ Fallback mechanism tested
- ✅ No performance degradation

### Week 9 (PQC)
- ✅ Kyber-768 key exchange working
- ✅ Dilithium-3 signatures working
- ✅ Hybrid encryption functional
- ✅ All tests passing

---

## 🚀 Rollout Plan

### Development (Week 8-9)
1. Implement QRNG
2. Implement PQC
3. Test thoroughly
4. Document everything

### Deployment (Week 11)
1. Deploy with feature flag
2. Enable for test users
3. Monitor performance
4. Gradual rollout

### Migration (Post-Launch)
1. Notify users to regenerate keys
2. Support both ECC and Hybrid
3. Deprecate ECC-only after 6 months
4. Full quantum-resistant by Year 2

---

## 📚 References

### Standards
- **NIST PQC:** https://csrc.nist.gov/projects/post-quantum-cryptography
- **Kyber Specification:** https://pq-crystals.org/kyber/
- **Dilithium Specification:** https://pq-crystals.org/dilithium/

### APIs
- **ANU QRNG:** https://qrng.anu.edu.au/
- **NIST Randomness Beacon:** https://beacon.nist.gov/

### Libraries
- **liboqs:** https://github.com/open-quantum-safe/liboqs
- **pqc-kyber:** https://www.npmjs.com/package/pqc-kyber
- **dilithium-crystals:** https://www.npmjs.com/package/dilithium-crystals

---

## ⚠️ Risks & Mitigation

### Risk 1: QRNG API Unavailable
**Mitigation:** Fallback to Web Crypto API + warning to user

### Risk 2: PQC Library Bugs
**Mitigation:** Use well-tested libraries (liboqs), extensive testing

### Risk 3: Performance Issues
**Mitigation:** Caching, background processing, optimization

### Risk 4: Key Storage Security
**Mitigation:** Consider IndexedDB with encryption, hardware security modules (future)

### Risk 5: Backward Compatibility
**Mitigation:** Version flags, dual-key support, gradual migration

---

## 🎓 Learning Resources

### For Team
1. **Quantum Computing Basics:** IBM Quantum Learning
2. **PQC Overview:** NIST PQC Project
3. **Cryptography Best Practices:** OWASP Crypto Guidelines

### For Users
1. **Why Quantum-Resistant?** Blog post explaining threat
2. **How It Works:** Simple diagram and explanation
3. **FAQ:** Common questions about quantum encryption

---

**Status:** ✅ Planning Complete  
**Next Step:** Review and approve plan before Week 8 implementation  
**Estimated Effort:** 2 weeks (Week 8 + Week 9)  
**Risk Level:** Medium (new technology, but well-documented)

---

**Prepared by:** Kiro AI  
**Date:** December 1, 2025  
**Version:** 1.0
