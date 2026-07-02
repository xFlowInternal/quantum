/**
 * QRNG Routes Tests
 */

const request = require('supertest');
const { app, initializeApp } = require('../../src/app');
const JWTService = require('../../src/auth/jwt');
const redis = require('../../src/database/redis');

describe('QRNG Routes', () => {
  let accessToken;
  let testUser;

  beforeAll(async () => {
    // Initialize app (connect Redis)
    await initializeApp();
    
    // Create test user
    const User = require('../../src/models/User');
    const db = require('../../src/database/connection');
    
    // Clean up any existing test user
    await db.query('DELETE FROM users WHERE username = $1', ['qrng_test_user']);
    
    // Create new test user
    testUser = await User.create({
      username: 'qrng_test_user',
      email: 'qrng_test@example.com',
      password: 'TestPass123!',
    });
    
    // Generate test token
    const tokens = JWTService.generateTokens({
      userId: testUser.id,
      username: testUser.username,
    });
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    const db = require('../../src/database/connection');
    await db.query('DELETE FROM users WHERE username = $1', ['qrng_test_user']);
    await redis.client.quit();
    await db.pool.end();
  });

  describe('GET /api/qrng/health', () => {
    test('should return health status without auth', async () => {
      const response = await request(app)
        .get('/api/qrng/health')
        .expect(200);

      expect(response.body).toHaveProperty('healthy');
      expect(response.body).toHaveProperty('cacheSize');
      expect(typeof response.body.healthy).toBe('boolean');
    });

    test('should include metrics in health response', async () => {
      const response = await request(app)
        .get('/api/qrng/health')
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('totalRequests');
      expect(response.body.metrics).toHaveProperty('cacheHitRate');
    });
  });

  describe('GET /api/qrng/metrics', () => {
    test('should require authentication', async () => {
      await request(app)
        .get('/api/qrng/metrics')
        .expect(401);
    });

    test('should return metrics with valid token', async () => {
      const response = await request(app)
        .get('/api/qrng/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('cacheHits');
      expect(response.body).toHaveProperty('cacheMisses');
      expect(response.body).toHaveProperty('cacheHitRate');
      expect(response.body).toHaveProperty('apiSuccessRate');
    });
  });

  describe('POST /api/qrng/random', () => {
    test('should require authentication', async () => {
      await request(app)
        .post('/api/qrng/random')
        .send({ length: 32 })
        .expect(401);
    });

    test('should generate random hex by default', async () => {
      const response = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.format).toBe('hex');
      expect(typeof response.body.data).toBe('string');
      expect(response.body.data).toMatch(/^[0-9a-f]+$/);
    });

    test('should generate random base64', async () => {
      const response = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32, format: 'base64' })
        .expect(200);

      expect(response.body.format).toBe('base64');
      expect(typeof response.body.data).toBe('string');
      expect(response.body.data).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test('should generate random array', async () => {
      const response = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32, format: 'array' })
        .expect(200);

      expect(response.body.format).toBe('array');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(32);
    });

    test('should reject invalid length', async () => {
      await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 0 })
        .expect(400);

      await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 2000 })
        .expect(400);
    });

    test('should reject invalid format', async () => {
      const response = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32, format: 'invalid' })
        .expect(400);

      expect(response.body.error).toContain('Invalid format');
    });

    test('should generate different values on multiple calls', async () => {
      const response1 = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32, format: 'hex' });

      const response2 = await request(app)
        .post('/api/qrng/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: 32, format: 'hex' });

      expect(response1.body.data).not.toBe(response2.body.data);
    });
  });

  describe('POST /api/qrng/reset-metrics', () => {
    test('should require authentication', async () => {
      await request(app)
        .post('/api/qrng/reset-metrics')
        .expect(401);
    });

    test('should reset metrics with valid token', async () => {
      const response = await request(app)
        .post('/api/qrng/reset-metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Metrics reset successfully');

      // Verify metrics are reset
      const metricsResponse = await request(app)
        .get('/api/qrng/metrics')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(metricsResponse.body.totalRequests).toBe(0);
    });
  });

  describe('POST /api/qrng/clear-cache', () => {
    test('should require authentication', async () => {
      await request(app)
        .post('/api/qrng/clear-cache')
        .expect(401);
    });

    test('should clear cache with valid token', async () => {
      const response = await request(app)
        .post('/api/qrng/clear-cache')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Cache cleared successfully');
    });
  });

  describe('Integration', () => {
    test('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/qrng/random')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ length: 32 })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data).toBeDefined();
      });

      // All responses should be different
      const values = responses.map(r => r.body.data);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(5);
    });
  });
});
