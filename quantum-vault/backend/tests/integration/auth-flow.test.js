/**
 * Authentication Flow Integration Tests
 * Tests complete user authentication workflows
 */

const request = require('supertest');
const { app, initializeApp } = require('../../src/app');
const db = require('../../src/database/connection');
const redis = require('../../src/database/redis');

describe('Authentication Flow Integration', () => {
  beforeAll(async () => {
    await initializeApp();
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE username LIKE $1', ['integration_test_%']);
    await redis.client.quit();
    await db.pool.end();
  });

  beforeEach(async () => {
    await db.query('DELETE FROM users WHERE username LIKE $1', ['integration_test_%']);
  });

  describe('Complete Registration Flow', () => {
    test('should register, login, and access protected route', async () => {
      const userData = {
        username: 'integration_test_user1',
        email: 'integration1@example.com',
        password: 'TestPassword123!',
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).toBe('User registered successfully');
      expect(registerResponse.body.user.username).toBe(userData.username);
      expect(registerResponse.body.tokens).toHaveProperty('accessToken');
      expect(registerResponse.body.tokens).toHaveProperty('refreshToken');

      const { accessToken } = registerResponse.body.tokens;

      // Step 2: Access protected route
      const profileResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.user.username).toBe(userData.username);
      expect(profileResponse.body.user.email).toBe(userData.email);

      // Step 3: Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Step 4: Try to access protected route after logout (should fail)
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    test('should handle login after registration', async () => {
      const userData = {
        username: 'integration_test_user2',
        email: 'integration2@example.com',
        password: 'TestPassword123!',
      };

      // Register
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.tokens).toHaveProperty('accessToken');
    });
  });

  describe('Token Refresh Flow', () => {
    test('should refresh access token using refresh token', async () => {
      const userData = {
        username: 'integration_test_user3',
        email: 'integration3@example.com',
        password: 'TestPassword123!',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const { refreshToken } = registerResponse.body.tokens;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
      expect(refreshResponse.body.tokens.accessToken).not.toBe(registerResponse.body.tokens.accessToken);
    });

    test('should invalidate old refresh token after use', async () => {
      const userData = {
        username: 'integration_test_user4',
        email: 'integration4@example.com',
        password: 'TestPassword123!',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const { refreshToken } = registerResponse.body.tokens;

      // Use refresh token
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Try to use same refresh token again (should fail)
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Session Management', () => {
    test('should track multiple sessions', async () => {
      const userData = {
        username: 'integration_test_user5',
        email: 'integration5@example.com',
        password: 'TestPassword123!',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login again (second session)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(200);

      // Both tokens should be different
      expect(registerResponse.body.tokens.accessToken).not.toBe(loginResponse.body.tokens.accessToken);

      // Both should work
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${registerResponse.body.tokens.accessToken}`)
        .expect(200);

      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginResponse.body.tokens.accessToken}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid credentials gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should handle duplicate registration', async () => {
      const userData = {
        username: 'integration_test_user6',
        email: 'integration6@example.com',
        password: 'TestPassword123!',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Username already exists');
    });

    test('should handle weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'integration_test_user7',
          email: 'integration7@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Security', () => {
    test('should not expose password in responses', async () => {
      const userData = {
        username: 'integration_test_user8',
        email: 'integration8@example.com',
        password: 'TestPassword123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.user.password).toBeUndefined();
      expect(registerResponse.body.user.password_hash).toBeUndefined();

      const profileResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${registerResponse.body.tokens.accessToken}`)
        .expect(200);

      expect(profileResponse.body.user.password).toBeUndefined();
      expect(profileResponse.body.user.password_hash).toBeUndefined();
    });

    test('should enforce rate limiting on login', async () => {
      const userData = {
        username: 'integration_test_user9',
        email: 'integration9@example.com',
        password: 'TestPassword123!',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Make multiple failed login attempts
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: userData.username,
              password: 'WrongPassword123!',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Last response should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
    }, 10000);
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent logins', async () => {
      const userData = {
        username: 'integration_test_user10',
        email: 'integration10@example.com',
        password: 'TestPassword123!',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Concurrent logins
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            password: userData.password,
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.tokens).toHaveProperty('accessToken');
      });

      // All tokens should be different
      const tokens = responses.map(r => r.body.tokens.accessToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });
  });
});
