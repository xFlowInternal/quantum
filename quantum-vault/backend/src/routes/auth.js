const express = require('express');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const JWTService = require('../auth/jwt');
const redis = require('../database/redis');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter, registerLimiter, strictLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  passwordUpdateValidation,
  validate,
} = require('../middleware/validator');

const router = express.Router();

// Register endpoint
router.post('/register', registerLimiter, registerValidation, validate, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ username, email, password });

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens({
      userId: user.id,
      username: user.username,
    });

    // Store session
    const expiresAt = JWTService.getTokenExpiry(accessToken);
    await Session.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      deviceInfo: { userAgent: req.headers['user-agent'] },
      ipAddress: req.ip,
    });

    // Store refresh token in Redis
    await redis.setSession(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

    // Log audit
    await AuditLog.create({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'auth',
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: expiresAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', loginLimiter, loginValidation, validate, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);
    if (!isValidPassword) {
      // Log failed attempt
      await AuditLog.create({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { reason: 'invalid_password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokens({
      userId: user.id,
      username: user.username,
    });

    // Store session
    const expiresAt = JWTService.getTokenExpiry(accessToken);
    await Session.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      deviceInfo: { userAgent: req.headers['user-agent'] },
      ipAddress: req.ip,
    });

    // Store refresh token in Redis
    await redis.setSession(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Update last login
    await User.updateLastLogin(user.id);

    // Log successful login
    await AuditLog.create({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        last_login: new Date(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', refreshTokenValidation, validate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await redis.getSession(`refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      username: user.username,
    });

    // Update session
    const expiresAt = JWTService.getTokenExpiry(tokens.accessToken);
    await Session.create({
      userId: user.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      deviceInfo: { userAgent: req.headers['user-agent'] },
      ipAddress: req.ip,
    });

    // Update refresh token in Redis
    await redis.setSession(`refresh:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: expiresAt,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { user, token } = req;

    // Blacklist current token
    const expiry = JWTService.getTokenExpiry(token);
    const ttl = Math.floor((expiry - new Date()) / 1000);
    if (ttl > 0) {
      await redis.setCache(`blacklist:${token}`, 'true', ttl);
    }

    // Delete refresh token
    await redis.deleteSession(`refresh:${user.id}`);

    // Delete sessions
    await Session.deleteByUserId(user.id);

    // Log audit
    await AuditLog.create({
      userId: user.id,
      action: 'LOGOUT',
      resource: 'auth',
      details: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        public_key_ecc: user.public_key_ecc,
        public_key_pqc: user.public_key_pqc,
        created_at: user.created_at,
        last_login: user.last_login,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update password
router.put('/password', authenticateToken, strictLimiter, passwordUpdateValidation, validate, async (req, res) => {
  try {
    const { user } = req;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValid = await User.verifyPassword(user, currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await User.updatePassword(user.id, newPassword);

    // Invalidate all sessions
    await Session.deleteByUserId(user.id);
    await redis.deleteSession(`refresh:${user.id}`);

    // Log audit
    await AuditLog.create({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      resource: 'auth',
      details: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password updated successfully. Please login again.' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    const sessions = await Session.findByUserId(user.id);

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        device_info: s.device_info,
        ip_address: s.ip_address,
        created_at: s.created_at,
        expires_at: s.expires_at,
      })),
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete specific session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;

    await Session.delete(sessionId);

    // Log audit
    await AuditLog.create({
      userId: user.id,
      action: 'SESSION_DELETED',
      resource: 'auth',
      details: { sessionId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
