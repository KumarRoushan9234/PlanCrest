import { useState, useMemo, useCallback } from "react";

/**
 * Hook for managing channel list state
 */
export const useChannelList = (channels = []) => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Group channels by category
  const groupedChannels = useMemo(() => {
    const groups = {
      project: [],
      feature: [],
      team: [],
      direct: [],
      group: [],
      workspace: [],
    };

    channels.forEach((channel) => {
      if (groups[channel.category]) {
        groups[channel.category].push(channel);
      }
    });

    return groups;
  }, [channels]);

  // Filter channels by search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;

    const query = searchQuery.toLowerCase();
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(query) ||
        channel.description?.toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  // Select channel
  const selectChannel = useCallback((channel) => {
    setSelectedChannel(channel);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedChannel(null);
  }, []);

  return {
    selectedChannel,
    searchQuery,
    setSearchQuery,
    groupedChannels,
    filteredChannels,
    selectChannel,
    clearSelection,
  };
};

