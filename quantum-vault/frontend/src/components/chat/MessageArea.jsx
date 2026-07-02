import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './MessageArea.css';

function MessageArea() {
  const { activeConversation, conversations, onlineUsers, typingUsers, setActiveConversation } = useChat();
  const { user } = useAuth();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!activeConversation) {
    return (
      <div className="message-area-empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  const conversation = conversations.find(c => c.userId === activeConversation);
  const isOnline = onlineUsers.has(activeConversation);
  const isTyping = typingUsers[activeConversation];

  const handleBack = () => {
    setActiveConversation(null);
  };

  return (
    <div className="message-area">
      <div className="message-header">
        {isMobileView && (
          <button onClick={handleBack} className="back-button">
            ← Back
          </button>
        )}
        <div className="header-user-info">
          <div className="header-avatar">
            {conversation?.username?.charAt(0).toUpperCase()}
            {isOnline && <span className="online-dot"></span>}
          </div>
          <div className="header-details">
            <h3>{conversation?.username}</h3>
            <span className="header-status">
              {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <MessageList />
      <MessageInput recipientId={activeConversation} />
    </div>
  );
}

export default MessageArea;
