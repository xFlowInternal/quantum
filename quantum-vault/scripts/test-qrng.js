#!/usr/bin/env node
/**
 * QRNG Demo Script
 * Demonstrates quantum random number generation
 */

const qrng = require('../crypto/qrng/qrngService');

async function demo() {
  console.log('🔬 Quantum Random Number Generation Demo\n');
  console.log('=' .repeat(60));
  
  // Test 1: Basic random bytes
  console.log('\n📊 Test 1: Generate 32 random bytes');
  const bytes = await qrng.getRandomBytes(32);
  console.log('Bytes:', bytes.slice(0, 16), '...');
  console.log('Length:', bytes.length);
  
  // Test 2: Hex format
  console.log('\n📊 Test 2: Generate random hex string');
  const hex = await qrng.getRandomHex(32);
  console.log('Hex:', hex);
  console.log('Length:', hex.length, 'characters');
  
  // Test 3: Base64 format
  console.log('\n📊 Test 3: Generate random base64 string');
  const base64 = await qrng.getRandomBase64(32);
  console.log('Base64:', base64);
  
  // Test 4: Multiple requests (cache test)
  console.log('\n📊 Test 4: Multiple requests (testing cache)');
  const start = Date.now();
  for (let i = 0; i < 10; i++) {
    await qrng.getRandomBytes(100);
  }
  const duration = Date.now() - start;
  console.log(`Generated 1000 bytes in ${duration}ms`);
  console.log(`Average: ${(duration / 10).toFixed(2)}ms per request`);
  
  // Test 5: Metrics
  console.log('\n📊 Test 5: Performance Metrics');
  const metrics = qrng.getMetrics();
  console.log('Total Requests:', metrics.totalRequests);
  console.log('Cache Hits:', metrics.cacheHits);
  console.log('Cache Misses:', metrics.cacheMisses);
  console.log('Cache Hit Rate:', metrics.cacheHitRate);
  console.log('API Calls:', metrics.apiCalls);
  console.log('API Success Rate:', metrics.apiSuccessRate);
  console.log('Fallback Used:', metrics.fallbackUsed);
  console.log('Current Cache Size:', metrics.cacheSize, 'bytes');
  
  // Test 6: Health check
  console.log('\n📊 Test 6: Health Check');
  const health = await qrng.healthCheck();
  console.log('Service Healthy:', health.healthy ? '✅ Yes' : '❌ No');
  console.log('API Latency:', health.latency);
  console.log('Cache Size:', health.cacheSize, 'bytes');
  
  // Test 7: Randomness quality
  console.log('\n📊 Test 7: Randomness Quality Check');
  const testBytes = await qrng.getRandomBytes(1000);
  const avg = testBytes.reduce((a, b) => a + b, 0) / testBytes.length;
  const uniqueValues = new Set(testBytes).size;
  console.log('Average value:', avg.toFixed(2), '(expected ~127.5)');
  console.log('Unique values:', uniqueValues, '/ 256 possible');
  console.log('Distribution:', avg > 100 && avg < 155 ? '✅ Good' : '⚠️  Check needed');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo complete!\n');
  
  // Summary
  console.log('💡 Key Takeaways:');
  console.log('  • QRNG provides true quantum randomness');
  console.log('  • Cache ensures fast performance (<1ms)');
  console.log('  • Automatic fallback ensures reliability');
  console.log('  • Suitable for cryptographic operations');
  console.log('  • Cache hit rate >90% is optimal\n');
}

// Run demo
demo().catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
