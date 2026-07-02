const express = require('express');
const db = require('../database/connection');
const redis = require('../database/redis');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const redisHealth = await redis.healthCheck();

    const isHealthy = dbHealth.healthy && redisHealth.healthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.healthy ? 'up' : 'down',
          timestamp: dbHealth.timestamp,
        },
        redis: {
          status: redisHealth.healthy ? 'up' : 'down',
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

module.exports = router;
