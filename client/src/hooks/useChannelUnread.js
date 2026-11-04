import { useState, useCallback, useEffect } from "react";

/**
 * Hook for managing channel unread counts
 */
export const useChannelUnread = (channels = []) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  // Initialize unread counts from channels
  useEffect(() => {
    const counts = {};
    let total = 0;

    channels.forEach((channel) => {
      const count = channel.unreadCount || 0;
      counts[channel._id] = count;
      total += count;
    });

    setUnreadCounts(counts);
    setTotalUnread(total);
  }, [channels]);

  // Update unread count for a channel
  const updateUnreadCount = useCallback((channelId, count) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev, [channelId]: count };
      const newTotal = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      setTotalUnread(newTotal);
      return newCounts;
    });
  }, []);

  // Mark channel as read
  const markAsRead = useCallback((channelId) => {
    updateUnreadCount(channelId, 0);
  }, [updateUnreadCount]);

  // Increment unread count
  const incrementUnread = useCallback((channelId) => {
    setUnreadCounts((prev) => {
      const current = prev[channelId] || 0;
      const newCount = current + 1;
      const newCounts = { ...prev, [channelId]: newCount };
      const newTotal = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      setTotalUnread(newTotal);
      return newCounts;
    });
  }, []);

  // Get unread count for a channel
  const getUnreadCount = useCallback(
    (channelId) => {
      return unreadCounts[channelId] || 0;
    },
    [unreadCounts]
  );

  return {
    unreadCounts,
    totalUnread,
    updateUnreadCount,
    markAsRead,
    incrementUnread,
    getUnreadCount,
  };
};

