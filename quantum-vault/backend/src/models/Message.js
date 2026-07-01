const db = require('../database/connection');

class Message {
  static async create({ senderId, recipientId, encryptedContent, iv }) {
    const result = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, encrypted_content, iv)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, recipient_id, encrypted_content, iv, created_at`,
      [senderId, recipientId, encryptedContent, iv]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT m.*, 
              u1.username as sender_username,
              u2.username as recipient_username
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.recipient_id = u2.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findConversation(userId1, userId2, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT m.*,
              u1.username as sender_username,
              u2.username as recipient_username
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.recipient_id = u2.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId1, userId2, limit, offset]
    );
    
    return result.rows.reverse(); // Return in chronological order
  }

  static async findUserMessages(userId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT m.*,
              u1.username as sender_username,
              u2.username as recipient_username
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.recipient_id = u2.id
       WHERE m.sender_id = $1 OR m.recipient_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }

  static async markAsRead(messageId, userId) {
    const result = await db.query(
      `UPDATE messages 
       SET read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL
       RETURNING id, read_at`,
      [messageId, userId]
    );
    
    return result.rows[0];
  }

  static async deleteForSender(messageId, senderId) {
    await db.query(
      `UPDATE messages 
       SET deleted_by_sender = true
       WHERE id = $1 AND sender_id = $2`,
      [messageId, senderId]
    );
  }

  static async deleteForRecipient(messageId, recipientId) {
    await db.query(
      `UPDATE messages 
       SET deleted_by_recipient = true
       WHERE id = $1 AND recipient_id = $2`,
      [messageId, recipientId]
    );
  }

  static async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM messages
       WHERE recipient_id = $1 AND read_at IS NULL`,
      [userId]
    );
    
    return parseInt(result.rows[0].count);
  }

  static async getConversationList(userId) {
    const result = await db.query(
      `SELECT DISTINCT ON (other_user_id)
              other_user_id,
              other_username,
              last_message,
              last_message_time,
              unread_count
       FROM (
         SELECT 
           CASE 
             WHEN m.sender_id = $1 THEN m.recipient_id
             ELSE m.sender_id
           END as other_user_id,
           CASE 
             WHEN m.sender_id = $1 THEN u2.username
             ELSE u1.username
           END as other_username,
           m.encrypted_content as last_message,
           m.created_at as last_message_time,
           (SELECT COUNT(*) 
            FROM messages 
            WHERE recipient_id = $1 
              AND sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
              AND read_at IS NULL) as unread_count
         FROM messages m
         JOIN users u1 ON m.sender_id = u1.id
         JOIN users u2 ON m.recipient_id = u2.id
         WHERE m.sender_id = $1 OR m.recipient_id = $1
         ORDER BY m.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC`,
      [userId]
    );
    
    return result.rows;
  }
}

module.exports = Message;
