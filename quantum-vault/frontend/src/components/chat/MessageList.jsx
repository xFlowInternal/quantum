import { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageItem from './MessageItem';
import './MessageList.css';

function MessageList() {
  const { messages, markAsRead } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.recipient_id === user?.id && !msg.read_at) {
        markAsRead(msg.id);
      }
    });
  }, [messages, user, markAsRead]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((message, index) => {
        const isOwn = message.sender_id === user?.id;
        const showDate = index === 0 || 
          new Date(messages[index - 1].created_at).toDateString() !== 
          new Date(message.created_at).toDateString();

        return (
          <div key={message.id}>
            {showDate && (
              <div className="message-date-divider">
                {new Date(message.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
            <MessageItem message={message} isOwn={isOwn} />
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
