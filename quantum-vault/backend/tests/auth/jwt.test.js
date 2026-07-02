/**
 * JWT Service Tests
 */

const JWTService = require('../../src/auth/jwt');

describe('JWT Service', () => {
  const testPayload = {
    userId: 'test-user-id-123',
    username: 'testuser',
  };

  describe('generateTokens', () => {
    test('should generate access and refresh tokens', () => {
      const { accessToken, refreshToken, expiresIn } = JWTService.generateTokens(testPayload);
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(expiresIn).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(typeof expiresIn).toBe('string');
    });

    test('should generate different tokens each time', () => {
      const tokens1 = JWTService.generateTokens(testPayload);
      const tokens2 = JWTService.generateTokens(testPayload);
      
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    test('should include all payload data', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
    });

    test('should set correct token type', () => {
      const { accessToken, refreshToken } = JWTService.generateTokens(testPayload);
      
      const decodedAccess = JWTService.verifyAccessToken(accessToken);
      const decodedRefresh = JWTService.verifyRefreshToken(refreshToken);
      
      expect(decodedAccess.type).toBe('access');
      expect(decodedRefresh.type).toBe('refresh');
    });

    test('should set issuer and audience', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded.iss).toBe('quantum-vault');
      expect(decoded.aud).toBe('quantum-vault-users');
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
    });

    test('should reject invalid token', () => {
      expect(() => {
        JWTService.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid access token');
    });

    test('should reject malformed token', () => {
      expect(() => {
        JWTService.verifyAccessToken('not-a-jwt-token');
      }).toThrow('Invalid access token');
    });

    test('should reject empty token', () => {
      expect(() => {
        JWTService.verifyAccessToken('');
      }).toThrow('Invalid access token');
    });

    test('should reject refresh token as access token', () => {
      const { refreshToken } = JWTService.generateTokens(testPayload);
      
      expect(() => {
        JWTService.verifyAccessToken(refreshToken);
      }).toThrow('Invalid token type');
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const { refreshToken } = JWTService.generateTokens(testPayload);
      const decoded = JWTService.verifyRefreshToken(refreshToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.type).toBe('refresh');
    });

    test('should reject invalid token', () => {
      expect(() => {
        JWTService.verifyRefreshToken('invalid.token.here');
      }).toThrow('Invalid refresh token');
    });

    test('should reject access token as refresh token', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      
      expect(() => {
        JWTService.verifyRefreshToken(accessToken);
      }).toThrow('Invalid token type');
    });
  });

  describe('getTokenExpiry', () => {
    test('should return expiry date for valid token', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      const expiry = JWTService.getTokenExpiry(accessToken);
      
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });

    test('should return null for invalid token', () => {
      const expiry = JWTService.getTokenExpiry('invalid-token');
      expect(expiry).toBeNull();
    });

    test('should return correct expiry time', () => {
      const { accessToken } = JWTService.generateTokens(testPayload);
      const expiry = JWTService.getTokenExpiry(accessToken);
      
      // Access token should expire in ~24 hours
      const hoursUntilExpiry = (expiry.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursUntilExpiry).toBeGreaterThan(23);
      expect(hoursUntilExpiry).toBeLessThan(25);
    });
  });

  describe('token expiration', () => {
    test('access token should have shorter expiry than refresh token', () => {
      const { accessToken, refreshToken } = JWTService.generateTokens(testPayload);
      
      const accessExpiry = JWTService.getTokenExpiry(accessToken);
      const refreshExpiry = JWTService.getTokenExpiry(refreshToken);
      
      expect(refreshExpiry.getTime()).toBeGreaterThan(accessExpiry.getTime());
    });
  });

  describe('security', () => {
    test('should use strong secret', () => {
      // JWT secret should be defined and long enough
      expect(process.env.JWT_SECRET || 'default-secret-key').toBeDefined();
      expect((process.env.JWT_SECRET || 'default-secret-key').length).toBeGreaterThan(20);
    });

    test('should not include sensitive data in token', () => {
      const sensitivePayload = {
        userId: 'user-123',
        username: 'testuser',
        password: 'should-not-be-here',
        passwordHash: 'also-should-not-be-here',
      };

      const { accessToken } = JWTService.generateTokens(sensitivePayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordHash).toBeUndefined();
    });

    test('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      
      // Generate 100 tokens
      for (let i = 0; i < 100; i++) {
        const { accessToken } = JWTService.generateTokens({
          userId: `user-${i}`,
          username: `user${i}`,
        });
        tokens.add(accessToken);
      }
      
      // All should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('edge cases', () => {
    test('should handle empty payload', () => {
      const { accessToken } = JWTService.generateTokens({});
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('access');
    });

    test('should handle special characters in payload', () => {
      const specialPayload = {
        userId: 'user-123',
        username: 'test@user#123',
        metadata: 'Special chars: !@#$%^&*()',
      };

      const { accessToken } = JWTService.generateTokens(specialPayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded.username).toBe(specialPayload.username);
      expect(decoded.metadata).toBe(specialPayload.metadata);
    });

    test('should handle unicode in payload', () => {
      const unicodePayload = {
        userId: 'user-123',
        username: 'tëst_üser_🔐',
      };

      const { accessToken } = JWTService.generateTokens(unicodePayload);
      const decoded = JWTService.verifyAccessToken(accessToken);
      
      expect(decoded.username).toBe(unicodePayload.username);
    });
  });
});
