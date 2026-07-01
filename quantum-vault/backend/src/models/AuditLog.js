const db = require('../database/connection');

class AuditLog {
  static async create({ userId, action, resource, details, ipAddress, userAgent }) {
    const result = await db.query(
      `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, action, resource, JSON.stringify(details), ipAddress, userAgent]
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }

  static async findByAction(action, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT * FROM audit_logs 
       WHERE action = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );
    
    return result.rows;
  }

  static async findRecent(limit = 100) {
    const result = await db.query(
      `SELECT * FROM audit_logs 
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  static async deleteOld(daysToKeep = 90) {
    const result = await db.query(
      `DELETE FROM audit_logs 
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`
    );
    
    return result.rowCount;
  }
}

module.exports = AuditLog;
