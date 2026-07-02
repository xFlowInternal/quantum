import { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';

/**
 * Custom hook for managing typing indicators
 * @param {string} recipientId - ID of the recipient
 * @returns {Function} - Function to call when user is typing
 */
export function useTypingIndicator(recipientId) {
  const { sendTypingIndicator } = useChat();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!recipientId) return;

    // Send typing start if not already typing
    if (!isTypingRef.current) {
      sendTypingIndicator(recipientId, true);
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(recipientId, false);
      isTypingRef.current = false;
    }, 2000);
  }, [recipientId, sendTypingIndicator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && recipientId) {
        sendTypingIndicator(recipientId, false);
      }
    };
  }, [recipientId, sendTypingIndicator]);

  return handleTyping;
}
