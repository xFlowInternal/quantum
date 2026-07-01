/**
 * QRNG Client - Frontend Quantum Random Number Generation
 * Uses ANU QRNG API with caching and fallback
 */

class QRNGClient {
  constructor() {
    this.apiUrl = 'https://qrng.anu.edu.au/API/jsonI.php';
    this.cache = new Uint8Array(0);
    this.cacheSize = 5000;
    this.minCacheSize = 500;
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
   * @returns {Promise<Uint8Array>} Random bytes
   */
  async getRandomBytes(length) {
    this.metrics.totalRequests++;

    // Validate input
    if (length <= 0 || length > 5000) {
      throw new Error('Length must be between 1 and 5000');
    }

    // Check cache
    if (this.cache.length >= length) {
      this.metrics.cacheHits++;
      const result = this.cache.slice(0, length);
      this.cache = this.cache.slice(length);
      
      // Trigger background refill if low
      if (this.cache.length < this.minCacheSize && !this.refilling) {
        this.refillCache().catch(err =>
          console.warn('Background QRNG refill failed:', err.message)
        );
      }
      
      return result;
    }

    // Cache miss - refill needed
    this.metrics.cacheMisses++;
    await this.refillCache();
    
    // Try again after refill
    if (this.cache.length >= length) {
      const result = this.cache.slice(0, length);
      this.cache = this.cache.slice(length);
      return result;
    }

    // Fallback if still insufficient
    console.warn('QRNG unavailable, using Web Crypto fallback');
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
      
      const response = await fetch(
        `${this.apiUrl}?length=${this.cacheSize}&type=uint8`,
        { timeout: 5000 }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        this.cache = new Uint8Array(data.data);
        console.log(`QRNG cache refilled: ${this.cache.length} bytes`);
      } else {
        throw new Error('Invalid QRNG response');
      }
    } catch (error) {
      this.metrics.apiFailures++;
      console.warn('QRNG API error:', error.message);
      
      // Use fallback to fill cache
      this.cache = this.fallbackRandom(this.cacheSize);
      this.metrics.fallbackUsed++;
    } finally {
      this.refilling = false;
    }
  }

  /**
   * Fallback to Web Crypto API
   * @private
   * @param {number} length - Number of bytes needed
   * @returns {Uint8Array} Random bytes
   */
  fallbackRandom(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Get random bytes as hex string
   * @param {number} length - Number of bytes needed
   * @returns {Promise<string>} Hex string
   */
  async getRandomHex(length) {
    const bytes = await this.getRandomBytes(length);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get random bytes as base64 string
   * @param {number} length - Number of bytes needed
   * @returns {Promise<string>} Base64 string
   */
  async getRandomBase64(length) {
    const bytes = await this.getRandomBytes(length);
    return btoa(String.fromCharCode(...bytes));
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
    this.cache = new Uint8Array(0);
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const response = await fetch(
        `${this.apiUrl}?length=10&type=uint8`,
        { timeout: 3000 }
      );
      const latency = Date.now() - startTime;
      
      const data = await response.json();
      
      return {
        healthy: data.success === true,
        latency: `${latency}ms`,
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
export default new QRNGClient();
