import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChannelItem from "./ChannelItem";
import { EmptyState } from "../shared/index";
import { Hash } from "lucide-react";

/**
 * Channel List Component
 * Container for all channels
 */
const ChannelList = ({
  channels = [],
  selectedChannel,
  onSelectChannel,
  unreadCounts = {},
  searchQuery = "",
  onDeleteChannel,
  showChannelMenu,
  setShowChannelMenu,
}) => {
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

    filteredChannels.forEach((channel) => {
      if (groups[channel.category]) {
        groups[channel.category].push(channel);
      }
    });

    return groups;
  }, [filteredChannels]);

  if (filteredChannels.length === 0) {
    return (
      <EmptyState
        icon={Hash}
        title="No channels found"
        description={
          searchQuery
            ? "Try a different search term"
            : "Create a channel to get started"
        }
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <AnimatePresence>
        {Object.entries(groupedChannels).map(([category, categoryChannels]) => {
          if (categoryChannels.length === 0) return null;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {categoryChannels.map((channel, index) => (
                <motion.div
                  key={channel._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ChannelItem
                    channel={channel}
                    isSelected={selectedChannel?._id === channel._id}
                    onClick={() => {
                      setShowChannelMenu(null);
                      onSelectChannel(channel);
                    }}
                    unreadCount={unreadCounts[channel._id] || 0}
                    onDelete={onDeleteChannel}
                    showMenu={showChannelMenu === channel._id}
                    onMenuClick={setShowChannelMenu}
                  />
                </motion.div>
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ChannelList;
