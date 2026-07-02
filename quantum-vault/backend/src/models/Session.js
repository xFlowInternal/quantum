const db = require('../database/connection');
const crypto = require('crypto');

class Session {
  static async create({ userId, token, refreshToken, expiresAt, deviceInfo, ipAddress }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const refreshTokenHash = refreshToken 
      ? crypto.createHash('sha256').update(refreshToken).digest('hex')
      : null;

    const result = await db.query(
      `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, expires_at, created_at`,
      [userId, tokenHash, refreshTokenHash, expiresAt, JSON.stringify(deviceInfo), ipAddress]
    );
    
    return result.rows[0];
  }

  static async findByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const result = await db.query(
      `SELECT * FROM sessions 
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT id, user_id, expires_at, device_info, ip_address, created_at
       FROM sessions 
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  static async delete(sessionId) {
    await db.query(
      'DELETE FROM sessions WHERE id = $1',
      [sessionId]
    );
  }

  static async deleteByUserId(userId) {
    await db.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [userId]
    );
  }

  static async deleteExpired() {
    const result = await db.query(
      'DELETE FROM sessions WHERE expires_at < NOW() RETURNING id'
    );
    
    return result.rowCount;
  }

  static async updateRefreshToken(sessionId, newRefreshToken) {
    const refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    
    await db.query(
      'UPDATE sessions SET refresh_token_hash = $1 WHERE id = $2',
      [refreshTokenHash, sessionId]
    );
  }
}

module.exports = Session;
