import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Hook for managing typing indicators
 */
export const useTypingIndicator = (channelId, onTypingStart, onTypingStop) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Clear typing indicator after 3 seconds of inactivity
  const clearTyping = useCallback(() => {
    setIsTyping(false);
    setTypingUsers([]);
    if (onTypingStop) {
      onTypingStop(channelId);
    }
  }, [channelId, onTypingStop]);

  // Start typing
  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      if (onTypingStart) {
        onTypingStart(channelId);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      clearTyping();
    }, 3000);
  }, [isTyping, channelId, onTypingStart, clearTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    clearTyping();
  }, [clearTyping]);

  // Handle incoming typing events
  const handleTypingEvent = useCallback((data) => {
    if (data.channelId === channelId && data.userId) {
      setTypingUsers((prev) => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });

      // Clear after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }, 3000);
    }
  }, [channelId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
    handleTypingEvent,
  };
};

