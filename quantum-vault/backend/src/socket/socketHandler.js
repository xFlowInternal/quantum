const JWTService = require('../auth/jwt');
const User = require('../models/User');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');

// Store active connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupConnectionHandler();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify token
        const decoded = JWTService.verifyAccessToken(token);
        
        // Get user
        const user = await User.findById(decoded.userId);
        if (!user || !user.is_active) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  setupConnectionHandler() {
    this.io.on('connection', (socket) => {
      console.log(`✓ User connected: ${socket.username} (${socket.userId})`);
      
      // Store connection
      activeUsers.set(socket.userId, socket.id);
      userSockets.set(socket.id, socket.userId);

      // Emit online status
      this.broadcastUserStatus(socket.userId, 'online');

      // Setup event handlers
      this.setupMessageHandlers(socket);
      this.setupTypingHandlers(socket);
      this.setupReadReceiptHandlers(socket);
      this.setupDisconnectHandler(socket);

      // Send initial data
      this.sendInitialData(socket);
    });
  }

  setupMessageHandlers(socket) {
    // Send message
    socket.on('message:send', async (data, callback) => {
      try {
        const { recipientId, encryptedContent, iv } = data;

        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          return callback({ error: 'Recipient not found' });
        }

        // Save message to database
        const message = await Message.create({
          senderId: socket.userId,
          recipientId,
          encryptedContent,
          iv,
        });

        // Add sender info
        const messageData = {
          ...message,
          sender_username: socket.username,
          recipient_username: recipient.username,
        };

        // Send to recipient if online
        const recipientSocketId = activeUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('message:receive', messageData);
        }

        // Confirm to sender
        callback({ success: true, message: messageData });

        // Log audit
        await AuditLog.create({
          userId: socket.userId,
          action: 'MESSAGE_SENT',
          resource: 'messages',
          details: { recipientId, messageId: message.id },
        });
      } catch (error) {
        console.error('Send message error:', error);
        callback({ error: 'Failed to send message' });
      }
    });

    // Get conversation history
    socket.on('message:history', async (data, callback) => {
      try {
        const { otherUserId, limit = 50, offset = 0 } = data;

        const messages = await Message.findConversation(
          socket.userId,
          otherUserId,
          limit,
          offset
        );

        callback({ success: true, messages });
      } catch (error) {
        console.error('Get history error:', error);
        callback({ error: 'Failed to get message history' });
      }
    });

    // Delete message
    socket.on('message:delete', async (data, callback) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return callback({ error: 'Message not found' });
        }

        // Check if user is sender or recipient
        if (message.sender_id === socket.userId) {
          await Message.deleteForSender(messageId, socket.userId);
        } else if (message.recipient_id === socket.userId) {
          await Message.deleteForRecipient(messageId, socket.userId);
        } else {
          return callback({ error: 'Unauthorized' });
        }

        callback({ success: true });
      } catch (error) {
        console.error('Delete message error:', error);
        callback({ error: 'Failed to delete message' });
      }
    });
  }

  setupTypingHandlers(socket) {
    // Typing start
    socket.on('typing:start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = activeUsers.get(recipientId);
      
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('typing:indicator', {
          userId: socket.userId,
          username: socket.username,
          isTyping: true,
        });
      }
    });

    // Typing stop
    socket.on('typing:stop', (data) => {
      const { recipientId } = data;
      const recipientSocketId = activeUsers.get(recipientId);
      
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('typing:indicator', {
          userId: socket.userId,
          username: socket.username,
          isTyping: false,
        });
      }
    });
  }

  setupReadReceiptHandlers(socket) {
    // Mark message as read
    socket.on('message:read', async (data, callback) => {
      try {
        const { messageId } = data;

        const result = await Message.markAsRead(messageId, socket.userId);
        
        if (result) {
          // Notify sender
          const message = await Message.findById(messageId);
          const senderSocketId = activeUsers.get(message.sender_id);
          
          if (senderSocketId) {
            this.io.to(senderSocketId).emit('message:read-receipt', {
              messageId,
              readAt: result.read_at,
              readBy: socket.userId,
            });
          }

          callback({ success: true });
        } else {
          callback({ error: 'Message not found or already read' });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
        callback({ error: 'Failed to mark message as read' });
      }
    });
  }

  setupDisconnectHandler(socket) {
    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.username} (${socket.userId})`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      userSockets.delete(socket.id);

      // Broadcast offline status
      this.broadcastUserStatus(socket.userId, 'offline');
    });
  }

  async sendInitialData(socket) {
    try {
      // Send unread count
      const unreadCount = await Message.getUnreadCount(socket.userId);
      socket.emit('unread:count', { count: unreadCount });

      // Send conversation list
      const conversations = await Message.getConversationList(socket.userId);
      socket.emit('conversations:list', { conversations });

      // Send online users
      const onlineUserIds = Array.from(activeUsers.keys());
      socket.emit('users:online', { userIds: onlineUserIds });
    } catch (error) {
      console.error('Send initial data error:', error);
    }
  }

  broadcastUserStatus(userId, status) {
    this.io.emit('user:status', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  getOnlineUsers() {
    return Array.from(activeUsers.keys());
  }

  isUserOnline(userId) {
    return activeUsers.has(userId);
  }
}

module.exports = SocketHandler;
