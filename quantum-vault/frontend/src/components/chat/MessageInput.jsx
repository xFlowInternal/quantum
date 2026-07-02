import { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import './MessageInput.css';

function MessageInput({ recipientId }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { sendMessage } = useChat();
  const handleTyping = useTypingIndicator(recipientId);

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      // For now, send as plain text (encryption will be added in Week 7-9)
      // In production, this would be encrypted
      await sendMessage(recipientId, message, 'temp-iv');
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <div className="message-input-container">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          rows={1}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="send-button"
        >
          {sending ? '⏳' : '📤'}
        </button>
      </div>
      <small className="encryption-note">
        🔐 End-to-end encryption coming in Week 7-9
      </small>
    </form>
  );
}

export default MessageInput;
