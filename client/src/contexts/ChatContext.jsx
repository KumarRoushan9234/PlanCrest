import React, { createContext, useContext, useState, useCallback } from "react";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});

  const updateUnreadCount = useCallback((channelId, count) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev, [channelId]: count };
      const total = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      setTotalUnreadCount(total);
      return newCounts;
    });
  }, []);

  const incrementUnread = useCallback((channelId) => {
    setUnreadCounts((prev) => {
      const current = prev[channelId] || 0;
      const newCount = current + 1;
      const newCounts = { ...prev, [channelId]: newCount };
      const total = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      setTotalUnreadCount(total);
      return newCounts;
    });
  }, []);

  const markAsRead = useCallback((channelId) => {
    updateUnreadCount(channelId, 0);
  }, [updateUnreadCount]);

  const setTotalUnread = useCallback((count) => {
    setTotalUnreadCount(count);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        totalUnreadCount,
        unreadCounts,
        updateUnreadCount,
        incrementUnread,
        markAsRead,
        setTotalUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

