import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const typingTimeoutRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✓ Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Listen for initial data
    newSocket.on('unread:count', (data) => {
      setUnreadCount(data.count);
    });

    newSocket.on('conversations:list', (data) => {
      setConversations(data.conversations);
    });

    newSocket.on('users:online', (data) => {
      setOnlineUsers(new Set(data.userIds));
    });

    // Listen for new messages
    newSocket.on('message:receive', (message) => {
      handleNewMessage(message);
    });

    // Listen for read receipts
    newSocket.on('message:read-receipt', (data) => {
      handleReadReceipt(data);
    });

    // Listen for typing indicators
    newSocket.on('typing:indicator', (data) => {
      handleTypingIndicator(data);
    });

    // Listen for user status
    newSocket.on('user:status', (data) => {
      handleUserStatus(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user]);

  // Handle new message
  const handleNewMessage = useCallback((message) => {
    const conversationKey = message.sender_id === user?.id 
      ? message.recipient_id 
      : message.sender_id;

    setMessages(prev => ({
      ...prev,
      [conversationKey]: [...(prev[conversationKey] || []), message],
    }));

    // Update conversation list
    setConversations(prev => {
      const updated = prev.filter(c => c.userId !== conversationKey);
      return [{
        userId: conversationKey,
        username: message.sender_id === user?.id ? message.recipient_username : message.sender_username,
        lastMessage: message.encrypted_content,
        lastMessageTime: message.created_at,
        unreadCount: message.sender_id === user?.id ? 0 : 1,
      }, ...updated];
    });

    // Update unread count if not from current user
    if (message.sender_id !== user?.id) {
      setUnreadCount(prev => prev + 1);
    }
  }, [user]);

  // Handle read receipt
  const handleReadReceipt = useCallback((data) => {
    const { messageId, readAt } = data;
    
    setMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = updated[key].map(msg =>
          msg.id === messageId ? { ...msg, read_at: readAt } : msg
        );
      });
      return updated;
    });
  }, []);

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data) => {
    const { userId, isTyping } = data;
    
    setTypingUsers(prev => {
      const updated = { ...prev };
      if (isTyping) {
        updated[userId] = true;
        // Clear after 3 seconds
        if (typingTimeoutRef.current[userId]) {
          clearTimeout(typingTimeoutRef.current[userId]);
        }
        typingTimeoutRef.current[userId] = setTimeout(() => {
          setTypingUsers(p => {
            const u = { ...p };
            delete u[userId];
            return u;
          });
        }, 3000);
      } else {
        delete updated[userId];
        if (typingTimeoutRef.current[userId]) {
          clearTimeout(typingTimeoutRef.current[userId]);
        }
      }
      return updated;
    });
  }, []);

  // Handle user status
  const handleUserStatus = useCallback((data) => {
    const { userId, status } = data;
    
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      if (status === 'online') {
        updated.add(userId);
      } else {
        updated.delete(userId);
      }
      return updated;
    });
  }, []);

  // Send message
  const sendMessage = useCallback((recipientId, encryptedContent, iv) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('message:send', {
        recipientId,
        encryptedContent,
        iv,
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          handleNewMessage(response.message);
          resolve(response.message);
        }
      });
    });
  }, [socket, connected, handleNewMessage]);

  // Load conversation history
  const loadConversation = useCallback((otherUserId) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('message:history', {
        otherUserId,
        limit: 50,
        offset: 0,
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          setMessages(prev => ({
            ...prev,
            [otherUserId]: response.messages,
          }));
          setActiveConversation(otherUserId);
          resolve(response.messages);
        }
      });
    });
  }, [socket, connected]);

  // Mark message as read
  const markAsRead = useCallback((messageId) => {
    if (!socket || !connected) return;

    socket.emit('message:read', { messageId }, (response) => {
      if (!response.error) {
        handleReadReceipt({ messageId, readAt: new Date() });
      }
    });
  }, [socket, connected, handleReadReceipt]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((recipientId, isTyping) => {
    if (!socket || !connected) return;

    const event = isTyping ? 'typing:start' : 'typing:stop';
    socket.emit(event, { recipientId });
  }, [socket, connected]);

  // Delete message
  const deleteMessage = useCallback((messageId) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Not connected'));
        return;
      }

      socket.emit('message:delete', { messageId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          // Remove from local state
          setMessages(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              updated[key] = updated[key].filter(msg => msg.id !== messageId);
            });
            return updated;
          });
          resolve();
        }
      });
    });
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    conversations,
    activeConversation,
    messages: messages[activeConversation] || [],
    allMessages: messages,
    onlineUsers,
    typingUsers,
    unreadCount,
    sendMessage,
    loadConversation,
    markAsRead,
    sendTypingIndicator,
    deleteMessage,
    setActiveConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
