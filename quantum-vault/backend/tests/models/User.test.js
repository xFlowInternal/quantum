/**
 * User Model Tests
 */

const User = require('../../src/models/User');
const db = require('../../src/database/connection');

describe('User Model', () => {
  beforeAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM users WHERE username LIKE $1', ['test_user_%']);
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE username LIKE $1', ['test_user_%']);
    await db.pool.end();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.query('DELETE FROM users WHERE username LIKE $1', ['test_user_%']);
  });

  describe('create', () => {
    test('should create new user with hashed password', async () => {
      const user = await User.create({
        username: 'test_user_1',
        email: 'test1@example.com',
        password: 'Password123!',
      });

      expect(user).toHaveProperty('id');
      expect(user.username).toBe('test_user_1');
      expect(user.email).toBe('test1@example.com');
      expect(user).not.toHaveProperty('password_hash');
      expect(user.created_at).toBeDefined();
    });

    test('should reject duplicate username', async () => {
      await User.create({
        username: 'test_user_2',
        email: 'test2@example.com',
        password: 'Password123!',
      });

      await expect(
        User.create({
          username: 'test_user_2',
          email: 'test3@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow();
    });

    test('should reject duplicate email', async () => {
      await User.create({
        username: 'test_user_3',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      await expect(
        User.create({
          username: 'test_user_4',
          email: 'duplicate@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow();
    });

    test('should hash password securely', async () => {
      const password = 'MySecretPassword123!';
      const user = await User.create({
        username: 'test_user_5',
        email: 'test5@example.com',
        password,
      });

      const dbUser = await User.findById(user.id);
      expect(dbUser.password_hash).toBeDefined();
      expect(dbUser.password_hash).not.toBe(password);
      expect(dbUser.password_hash.length).toBeGreaterThan(50);
    });
  });

  describe('findByUsername', () => {
    beforeEach(async () => {
      await User.create({
        username: 'test_user_find',
        email: 'find@example.com',
        password: 'Password123!',
      });
    });

    test('should find existing user', async () => {
      const user = await User.findByUsername('test_user_find');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('test_user_find');
      expect(user.email).toBe('find@example.com');
      expect(user.is_active).toBe(true);
    });

    test('should return undefined for non-existent user', async () => {
      const user = await User.findByUsername('nonexistent_user');
      expect(user).toBeUndefined();
    });

    test('should not find inactive users', async () => {
      const user = await User.create({
        username: 'test_user_inactive',
        email: 'inactive@example.com',
        password: 'Password123!',
      });

      // Deactivate user
      await db.query('UPDATE users SET is_active = false WHERE id = $1', [user.id]);

      const found = await User.findByUsername('test_user_inactive');
      expect(found).toBeUndefined();
    });
  });

  describe('findById', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'test_user_findid',
        email: 'findid@example.com',
        password: 'Password123!',
      });
    });

    test('should find user by ID', async () => {
      const user = await User.findById(testUser.id);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.username).toBe('test_user_findid');
    });

    test('should return undefined for invalid ID', async () => {
      const user = await User.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeUndefined();
    });
  });

  describe('updateLastLogin', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'test_user_login',
        email: 'login@example.com',
        password: 'Password123!',
      });
    });

    test('should update last_login timestamp', async () => {
      const before = await User.findById(testUser.id);
      expect(before.last_login).toBeNull();

      await User.updateLastLogin(testUser.id);

      const after = await User.findById(testUser.id);
      expect(after.last_login).not.toBeNull();
      expect(new Date(after.last_login)).toBeInstanceOf(Date);
    });
  });

  describe('verifyPassword', () => {
    let testUser;
    const password = 'CorrectPassword123!';

    beforeEach(async () => {
      testUser = await User.create({
        username: 'test_user_verify',
        email: 'verify@example.com',
        password,
      });
      testUser = await User.findById(testUser.id);
    });

    test('should verify correct password', async () => {
      const isValid = await User.verifyPassword(testUser, password);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const isValid = await User.verifyPassword(testUser, 'WrongPassword123!');
      expect(isValid).toBe(false);
    });

    test('should reject empty password', async () => {
      const isValid = await User.verifyPassword(testUser, '');
      expect(isValid).toBe(false);
    });

    test('should be case-sensitive', async () => {
      const isValid = await User.verifyPassword(testUser, password.toLowerCase());
      expect(isValid).toBe(false);
    });
  });

  describe('security', () => {
    test('should use bcrypt with sufficient rounds', async () => {
      const user = await User.create({
        username: 'test_user_security',
        email: 'security@example.com',
        password: 'Password123!',
      });

      const dbUser = await User.findById(user.id);
      
      // Bcrypt hashes start with $2b$ and have cost factor
      expect(dbUser.password_hash).toMatch(/^\$2[aby]\$/);
      
      // Extract cost factor (should be 12 or higher)
      const costMatch = dbUser.password_hash.match(/^\$2[aby]\$(\d+)\$/);
      expect(costMatch).toBeTruthy();
      const cost = parseInt(costMatch[1]);
      expect(cost).toBeGreaterThanOrEqual(12);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'SamePassword123!';
      
      const user1 = await User.create({
        username: 'test_user_hash1',
        email: 'hash1@example.com',
        password,
      });

      const user2 = await User.create({
        username: 'test_user_hash2',
        email: 'hash2@example.com',
        password,
      });

      const dbUser1 = await User.findById(user1.id);
      const dbUser2 = await User.findById(user2.id);

      expect(dbUser1.password_hash).not.toBe(dbUser2.password_hash);
    });
  });

  describe('data validation', () => {
    test('should handle special characters in username', async () => {
      const user = await User.create({
        username: 'test_user_special-123',
        email: 'special@example.com',
        password: 'Password123!',
      });

      expect(user.username).toBe('test_user_special-123');
    });

    test('should handle long usernames', async () => {
      const longUsername = 'test_user_' + 'a'.repeat(240);
      const user = await User.create({
        username: longUsername,
        email: 'long@example.com',
        password: 'Password123!',
      });

      expect(user.username).toBe(longUsername);
    });

    test('should handle international characters in email', async () => {
      const user = await User.create({
        username: 'test_user_intl',
        email: 'tëst@éxample.com',
        password: 'Password123!',
      });

      expect(user.email).toBe('tëst@éxample.com');
    });
  });
});
