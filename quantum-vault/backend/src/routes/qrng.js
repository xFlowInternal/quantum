/**
 * QRNG API Routes
 * Endpoints for quantum random number generation
 */

const express = require('express');
const router = express.Router();
const qrng = require('../../../crypto/qrng/qrngService');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/v1/qrng/health
 * Check QRNG service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await qrng.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('QRNG health check error:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      healthy: false 
    });
  }
});

/**
 * GET /api/v1/qrng/metrics
 * Get QRNG service metrics
 */
router.get('/metrics', authenticateToken, (req, res) => {
  try {
    const metrics = qrng.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('QRNG metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * POST /api/v1/qrng/random
 * Get random bytes (for testing/debugging)
 */
router.post('/random', authenticateToken, async (req, res) => {
  try {
    const { length = 32, format = 'hex' } = req.body;

    // Validate length
    if (length < 1 || length > 1024) {
      return res.status(400).json({ 
        error: 'Length must be between 1 and 1024' 
      });
    }

    let result;
    switch (format) {
      case 'hex':
        result = await qrng.getRandomHex(length);
        break;
      case 'base64':
        result = await qrng.getRandomBase64(length);
        break;
      case 'array':
        result = await qrng.getRandomBytes(length);
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid format. Use: hex, base64, or array' 
        });
    }

    res.json({
      length,
      format,
      data: result,
    });
  } catch (error) {
    console.error('QRNG random generation error:', error);
    res.status(500).json({ error: 'Failed to generate random data' });
  }
});

/**
 * POST /api/v1/qrng/reset-metrics
 * Reset QRNG metrics (admin only)
 */
router.post('/reset-metrics', authenticateToken, (req, res) => {
  try {
    qrng.resetMetrics();
    res.json({ message: 'Metrics reset successfully' });
  } catch (error) {
    console.error('QRNG reset metrics error:', error);
    res.status(500).json({ error: 'Failed to reset metrics' });
  }
});

/**
 * POST /api/v1/qrng/clear-cache
 * Clear QRNG cache (admin only)
 */
router.post('/clear-cache', authenticateToken, (req, res) => {
  try {
    qrng.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('QRNG clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
