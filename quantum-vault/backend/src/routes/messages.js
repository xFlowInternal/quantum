const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get conversation list
router.get('/conversations', apiLimiter, async (req, res) => {
  try {
    const conversations = await Message.getConversationList(req.user.id);
    
    res.json({
      conversations: conversations.map(c => ({
        userId: c.other_user_id,
        username: c.other_username,
        lastMessage: c.last_message,
        lastMessageTime: c.last_message_time,
        unreadCount: parseInt(c.unread_count),
      })),
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation with specific user
router.get('/conversation/:userId', apiLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messages = await Message.findConversation(
      req.user.id,
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      messages,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message (REST endpoint, WebSocket is preferred)
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { recipientId, encryptedContent, iv } = req.body;

    if (!recipientId || !encryptedContent || !iv) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      encryptedContent,
      iv,
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread/count', apiLimiter, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.put('/:messageId/read', apiLimiter, async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await Message.markAsRead(messageId, req.user.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Message not found or already read' });
    }

    res.json({
      message: 'Message marked as read',
      readAt: result.read_at,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete message
router.delete('/:messageId', apiLimiter, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender_id === req.user.id) {
      await Message.deleteForSender(messageId, req.user.id);
    } else if (message.recipient_id === req.user.id) {
      await Message.deleteForRecipient(messageId, req.user.id);
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
