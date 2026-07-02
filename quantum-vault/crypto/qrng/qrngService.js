/**
 * QRNG Service - Quantum Random Number Generation
 * Uses ANU QRNG API for true quantum randomness
 * Implements caching and fallback mechanisms
 */

const axios = require('axios');
const crypto = require('crypto');

class QRNGService {
  constructor() {
    this.apiUrl = 'https://qrng.anu.edu.au/API/jsonI.php';
    this.cache = [];
    this.cacheSize = 10000; // Cache 10,000 bytes
    this.minCacheSize = 1000; // Refill threshold
    this.refilling = false;
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      apiFailures: 0,
      fallbackUsed: 0,
    };
  }

  /**
   * Get random bytes from QRNG
   * @param {number} length - Number of bytes needed
   * @returns {Promise<Array<number>>} Array of random bytes
   */
  async getRandomBytes(length) {
    this.metrics.totalRequests++;

    // Validate input
    if (length <= 0 || length > 10000) {
      throw new Error('Length must be between 1 and 10000');
    }

    // Check cache first
    if (this.cache.length >= length) {
      this.metrics.cacheHits++;
      const result = this.cache.splice(0, length);
      
      // Trigger background refill if cache is low
      if (this.cache.length < this.minCacheSize && !this.refilling) {
        this.refillCache().catch(err => 
          console.error('Background cache refill failed:', err.message)
        );
      }
      
      return result;
    }

    // Cache miss - need to refill
    this.metrics.cacheMisses++;
    await this.refillCache();

    // Try cache again after refill
    if (this.cache.length >= length) {
      return this.cache.splice(0, length);
    }

    // Fallback if cache still insufficient
    console.warn('QRNG cache insufficient, using fallback');
    return this.fallbackRandom(length);
  }

  /**
   * Refill cache from ANU QRNG API
   * @private
   */
  async refillCache() {
    if (this.refilling) {
      // Wait for ongoing refill
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    this.refilling = true;
    try {
      this.metrics.apiCalls++;
      
      const response = await axios.get(this.apiUrl, {
        params: {
          length: this.cacheSize,
          type: 'uint8',
        },
        timeout: 5000,
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        this.cache = response.data.data;
        console.log(`QRNG cache refilled: ${this.cache.length} bytes`);
      } else {
        throw new Error('Invalid QRNG API response');
      }
    } catch (error) {
      this.metrics.apiFailures++;
      console.error('QRNG API error:', error.message);
      
      // Use fallback to fill cache
      this.cache = this.fallbackRandom(this.cacheSize);
      this.metrics.fallbackUsed++;
    } finally {
      this.refilling = false;
    }
  }

  /**
   * Fallback to crypto.randomBytes when QRNG unavailable
   * @private
   * @param {number} length - Number of bytes needed
   * @returns {Array<number>} Array of random bytes
   */
  fallbackRandom(length) {
    return Array.from(crypto.randomBytes(length));
  }

  /**
   * Get random bytes as Buffer
   * @param {number} length - Number of bytes needed
   * @returns {Promise<Buffer>} Buffer of random bytes
   */
  async getRandomBuffer(length) {
    const bytes = await this.getRandomBytes(length);
    return Buffer.from(bytes);
  }

  /**
   * Get random bytes as Uint8Array
   * @param {number} length - Number of bytes needed
   * @returns {Promise<Uint8Array>} Uint8Array of random bytes
   */
  async getRandomUint8Array(length) {
    const bytes = await this.getRandomBytes(length);
    return new Uint8Array(bytes);
  }

  /**
   * Get random bytes as hex string
   * @param {number} length - Number of bytes needed
   * @returns {Promise<string>} Hex string
   */
  async getRandomHex(length) {
    const bytes = await this.getRandomBytes(length);
    return Buffer.from(bytes).toString('hex');
  }

  /**
   * Get random bytes as base64 string
   * @param {number} length - Number of bytes needed
   * @returns {Promise<string>} Base64 string
   */
  async getRandomBase64(length) {
    const bytes = await this.getRandomBytes(length);
    return Buffer.from(bytes).toString('base64');
  }

  /**
   * Get service metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.length,
      cacheHitRate: this.metrics.totalRequests > 0
        ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      apiSuccessRate: this.metrics.apiCalls > 0
        ? ((this.metrics.apiCalls - this.metrics.apiFailures) / this.metrics.apiCalls * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      apiFailures: 0,
      fallbackUsed: 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = [];
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          length: 10,
          type: 'uint8',
        },
        timeout: 3000,
      });

      return {
        healthy: response.data.success === true,
        latency: response.headers['x-response-time'] || 'unknown',
        cacheSize: this.cache.length,
        metrics: this.getMetrics(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        cacheSize: this.cache.length,
        metrics: this.getMetrics(),
      };
    }
  }
}

// Export singleton instance
module.exports = new QRNGService();
