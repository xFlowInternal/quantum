import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import './ConversationList.css';

function ConversationList() {
  const { conversations, activeConversation, loadConversation, onlineUsers, unreadCount } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = async (userId) => {
    try {
      await loadConversation(userId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h2>Messages</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      <div className="conversation-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversation-items">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <small>Start chatting with other users!</small>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.userId}
              className={`conversation-item ${activeConversation === conv.userId ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conv.userId)}
            >
              <div className="conversation-avatar">
                <div className="avatar-circle">
                  {conv.username.charAt(0).toUpperCase()}
                </div>
                {onlineUsers.has(conv.userId) && (
                  <span className="online-indicator"></span>
                )}
              </div>

              <div className="conversation-info">
                <div className="conversation-top">
                  <span className="conversation-name">{conv.username}</span>
                  <span className="conversation-time">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="conversation-bottom">
                  <span className="conversation-preview">
                    {conv.lastMessage?.substring(0, 30)}...
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="conversation-unread">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;
