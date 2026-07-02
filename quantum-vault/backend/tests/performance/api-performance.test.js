/**
 * API Performance Tests
 * Tests response times and throughput
 */

const request = require('supertest');
const { app, initializeApp } = require('../../src/app');
const db = require('../../src/database/connection');
const redis = require('../../src/database/redis');

describe('API Performance Tests', () => {
  let accessToken;
  let testUser;

  beforeAll(async () => {
    await initializeApp();

    // Create test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'perf_test_user',
        email: 'perf@example.com',
        password: 'TestPassword123!',
      });

    accessToken = registerResponse.body.tokens.accessToken;
    testUser = registerResponse.body.user;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE username = $1', ['perf_test_user']);
    await redis.client.quit();
    await db.pool.end();
  });

  describe('Response Time Benchmarks', () => {
    test('health check should respond in <50ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    test('authentication should respond in <500ms', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'perf_test_user',
          password: 'TestPassword123!',
        })
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('protected route should respond in <100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    test('QRNG health check should respond in <2000ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/qrng/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    }, 5000);
  });

  describe('Throughput Tests', () => {
    test('should handle 50 concurrent health checks', async () => {
      const promises = Array(50).fill(null).map(() =>
        request(app).get('/api/health')
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000);
      
      console.log(`50 concurrent requests completed in ${duration}ms`);
      console.log(`Average: ${(duration / 50).toFixed(2)}ms per request`);
    });

    test('should handle 20 concurrent authenticated requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete in reasonable time
      expect(duration).toBeLessThan(3000);
      
      console.log(`20 concurrent auth requests completed in ${duration}ms`);
    });
  });

  describe('Database Performance', () => {
    test('user lookup should be fast', async () => {
      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await db.query('SELECT * FROM users WHERE id = $1', [testUser.id]);
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(10); // <10ms per query
      console.log(`Average user lookup: ${avgTime.toFixed(2)}ms`);
    });

    test('should handle connection pool efficiently', async () => {
      const promises = Array(20).fill(null).map(() =>
        db.query('SELECT NOW()')
      );

      const start = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      console.log(`20 concurrent DB queries: ${duration}ms`);
    });
  });

  describe('Redis Performance', () => {
    test('cache operations should be fast', async () => {
      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await redis.setCache(`perf_test_${i}`, { data: 'test' }, 60);
        await redis.getCache(`perf_test_${i}`);
      }

      const duration = Date.now() - start;
      const avgTime = duration / (iterations * 2); // 2 operations per iteration

      expect(avgTime).toBeLessThan(5); // <5ms per operation
      console.log(`Average Redis operation: ${avgTime.toFixed(2)}ms`);

      // Cleanup
      for (let i = 0; i < iterations; i++) {
        await redis.client.del(`cache:perf_test_${i}`);
      }
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase after 100 requests: ${memoryIncrease.toFixed(2)}MB`);
      
      // Should not increase by more than 10MB
      expect(memoryIncrease).toBeLessThan(10);
    });
  });

  describe('Payload Size', () => {
    test('should handle large payloads efficiently', async () => {
      const largePayload = {
        username: 'perf_test_large',
        email: 'large@example.com',
        password: 'TestPassword123!',
        metadata: 'x'.repeat(1000), // 1KB of data
      };

      const start = Date.now();
      
      await request(app)
        .post('/api/auth/register')
        .send(largePayload);
      
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      
      // Cleanup
      await db.query('DELETE FROM users WHERE username = $1', ['perf_test_large']);
    });
  });
});
