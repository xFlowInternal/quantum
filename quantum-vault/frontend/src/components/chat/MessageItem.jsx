import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './MessageItem.css';

function MessageItem({ message, isOwn }) {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteMessage } = useChat();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteMessage(message.id);
      } catch (error) {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message');
      }
    }
    setShowMenu(false);
  };

  return (
    <div className={`message-item ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-content">
          {message.encrypted_content}
        </div>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.created_at)}</span>
          {isOwn && (
            <span className="message-status">
              {message.read_at ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
      
      {isOwn && (
        <div className="message-actions">
          <button
            className="message-menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>
          {showMenu && (
            <div className="message-menu">
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageItem;
