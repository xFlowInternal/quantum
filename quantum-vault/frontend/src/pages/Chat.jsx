import { useState, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import ConversationList from '../components/chat/ConversationList';
import MessageArea from '../components/chat/MessageArea';
import './Chat.css';

function Chat() {
  const { connected, activeConversation } = useChat();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showConversationList = !isMobileView || !activeConversation;
  const showMessageArea = !isMobileView || activeConversation;

  return (
    <div className="chat-container">
      <div className="chat-wrapper">
        {!connected && (
          <div className="chat-connection-status">
            <span className="status-indicator offline"></span>
            Connecting to chat server...
          </div>
        )}
        
        <div className="chat-layout">
          {showConversationList && (
            <div className={`chat-sidebar ${isMobileView && activeConversation ? 'hidden' : ''}`}>
              <ConversationList />
            </div>
          )}
          
          {showMessageArea && (
            <div className={`chat-main ${isMobileView && !activeConversation ? 'hidden' : ''}`}>
              <MessageArea />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
