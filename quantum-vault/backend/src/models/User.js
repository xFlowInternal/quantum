const db = require('../database/connection');
const bcrypt = require('bcrypt');

class User {
  static async create({ username, email, password }) {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );
    
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async updatePublicKeys(id, eccKey, pqcKey) {
    const result = await db.query(
      `UPDATE users 
       SET public_key_ecc = $1, public_key_pqc = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, public_key_ecc, public_key_pqc`,
      [eccKey, pqcKey, id]
    );
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
  }

  static async deactivate(id) {
    await db.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async list(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT id, username, email, created_at, last_login, is_verified
       FROM users 
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}

module.exports = User;
