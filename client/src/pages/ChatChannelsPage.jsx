import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useProject } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import chatService from "../services/chatService";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { useChannelList } from "../hooks/useChannelList";
import { useChannelUnread } from "../hooks/useChannelUnread";
import { useMessageActions } from "../hooks/useMessageActions";
import ChatLayout from "../components/chat/layout/ChatLayout";
import ChannelSidebar from "../components/chat/layout/ChannelSidebar";
import ChatArea from "../components/chat/layout/ChatArea";
import ChannelList from "../components/chat/channels/ChannelList";
import ChannelSearch from "../components/chat/channels/ChannelSearch";
import MessageList from "../components/chat/messages/MessageList";
import MessageInput from "../components/chat/input/MessageInput";
import TypingIndicator from "../components/chat/indicators/TypingIndicator";
import {
  EmptyState,
  LoadingState,
  ErrorState,
  Avatar,
} from "../components/chat/shared/index";
import {
  CreateChannelModal,
  SearchModal,
  DirectMessageModal,
} from "../components/chat/modals";
import {
  Hash,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  MoreVertical,
  FolderKanban,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/common-afterauth/Navbar";
import Sidebar from "../components/common-afterauth/Sidebar";

const ChatChannelsPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentProject } = useProject();
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChannelMenu, setShowChannelMenu] = useState(null);

  const {
    selectedChannel,
    searchQuery: channelSearchQuery,
    setSearchQuery: setChannelSearchQuery,
    filteredChannels,
    selectChannel,
  } = useChannelList(channels);

  const { unreadCounts, markAsRead, incrementUnread, totalUnread } =
    useChannelUnread(channels);
  const { setTotalUnread } = useChat();
  const {
    editMessage,
    deleteMessage,
    pinMessage,
    editingMessage,
    editContent,
    setEditContent,
    startEditing,
    cancelEditing,
  } = useMessageActions();

  // Sync total unread count to ChatContext
  useEffect(() => {
    setTotalUnread(totalUnread);
  }, [totalUnread, setTotalUnread]);

  // Real-time updates
  const handleNewMessage = (data) => {
    if (data.type === "new_message" && data.message) {
      const channelId =
        data.channelId || data.message.channel?._id || data.message.channel;
      const selectedChannelId = selectedChannel?._id?.toString();
      const incomingChannelId = channelId?.toString();
      const messageId = data.message._id?.toString();

      // Deduplicate messages by ID
      if (incomingChannelId === selectedChannelId) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m._id?.toString() === messageId);
          if (exists) return prev;
          return [...prev, data.message];
        });
        chatService.markAsRead(channelId).catch(console.error);
      } else if (channelId) {
        incrementUnread(channelId);
      }
      fetchChannels();
    }
  };

  useChatRealtime(handleNewMessage, null, null);

  // Fetch projects
  const fetchProjects = async () => {
    if (!currentWorkspace?._id) return;
    try {
      const { projectService } = await import("../services/projectService");
      const response = await projectService.getWorkspaceProjects(
        currentWorkspace._id
      );
      setProjects(response.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  // Fetch channels
  const fetchChannels = async () => {
    if (!currentWorkspace?._id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getWorkspaceChannels(
        currentWorkspace._id
      );
      const channelsData = response.data?.data || response.data || [];

      // Filter by project if selected
      let filtered = channelsData;
      if (selectedProject) {
        filtered = channelsData.filter(
          (ch) =>
            ch.project?._id?.toString() === selectedProject._id?.toString()
        );
      }

      // Filter by top search query (searches channels, projects, members)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((ch) => {
          const nameMatch = ch.name?.toLowerCase().includes(query);
          const descMatch = ch.description?.toLowerCase().includes(query);
          const projectMatch = ch.project?.name?.toLowerCase().includes(query);
          const memberMatch = ch.members?.some(
            (m) =>
              m.name?.toLowerCase().includes(query) ||
              m.email?.toLowerCase().includes(query)
          );
          return nameMatch || descMatch || projectMatch || memberMatch;
        });
      }

      // Sort by lastMessageAt (most recent first) - backend already sorts, but ensure frontend maintains it
      filtered.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) {
          return bTime - aTime; // Descending order (newest first)
        }
        // If no messages, sort by creation date
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      });

      setChannels(filtered);
    } catch (err) {
      console.error("Error fetching channels:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load channels";
      setError(errorMessage);
      if (err.response?.status !== 404) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async (channelId) => {
    try {
      setMessagesLoading(true);
      const response = await chatService.getChannelMessages(channelId);
      setMessages(response.data || []);
      await chatService.markAsRead(channelId);
      markAsRead(channelId);
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (content, attachments = []) => {
    if (!selectedChannel || (!content.trim() && attachments.length === 0))
      return;

    try {
      setSending(true);
      const response = await chatService.sendMessage(selectedChannel._id, {
        content,
        contentFormat: "markdown",
        attachments,
      });
      setMessages((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle channel selection
  const handleSelectChannel = async (channel) => {
    selectChannel(channel);
    fetchMessages(channel._id);

    // Update last selected channel
    try {
      await chatService.updateLastSelectedChannel(channel._id);
    } catch (err) {
      console.error("Error updating last selected channel:", err);
      // Don't show error to user, this is a background operation
    }
  };

  // Delete channel
  const handleDeleteChannel = async (channelId) => {
    if (
      !confirm(
        "Are you sure you want to delete this channel? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await chatService.deleteChannel(channelId);
      toast.success("Channel deleted successfully");
      setChannels((prev) => prev.filter((ch) => ch._id !== channelId));
      if (selectedChannel?._id === channelId) {
        selectChannel(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error deleting channel:", err);
      toast.error("Failed to delete channel");
    }
  };

  // Handle message actions
  const handleStartEdit = (message) => {
    startEditing(message);
  };

  const handleSaveEdit = async (messageId, newContent) => {
    try {
      await editMessage(messageId, newContent);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                content: newContent,
                isEdited: true,
                editedAt: new Date(),
              }
            : msg
        )
      );
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleCancelEdit = () => {
    cancelEditing();
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: "[Message deleted]", isDeleted: true }
            : msg
        )
      );
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await chatService.addReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const existingReaction = msg.reactions?.find(
              (r) => r.emoji === emoji
            );
            if (existingReaction) {
              existingReaction.count += 1;
            } else {
              msg.reactions = [...(msg.reactions || []), { emoji, count: 1 }];
            }
          }
          return msg;
        })
      );
    } catch (err) {
      toast.error("Failed to add reaction");
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchProjects();
  }, [currentWorkspace?._id, selectedProject?._id, searchQuery]);

  // Restore last selected channel on load
  useEffect(() => {
    const restoreLastSelectedChannel = async () => {
      if (
        !currentWorkspace?._id ||
        !user?._id ||
        channels.length === 0 ||
        selectedChannel
      )
        return;

      try {
        // Get user's last selected channel from user data
        const lastSelectedChannelId = user?.lastSelected?.channel?.id;
        if (lastSelectedChannelId && lastSelectedChannelId.toString()) {
          // Check if the last selected channel is in the current workspace
          const lastSelectedWorkspaceId =
            user?.lastSelected?.channel?.workspaceId;
          if (
            lastSelectedWorkspaceId?.toString() ===
            currentWorkspace._id.toString()
          ) {
            // Find the channel in the loaded channels
            const lastChannel = channels.find(
              (ch) => ch._id?.toString() === lastSelectedChannelId.toString()
            );

            if (lastChannel) {
              // Only restore if no channel is currently selected
              selectChannel(lastChannel);
              fetchMessages(lastChannel._id);
            }
          }
        }
      } catch (err) {
        console.error("Error restoring last selected channel:", err);
        // Continue with normal flow if restoration fails
      }
    };

    restoreLastSelectedChannel();
  }, [currentWorkspace?._id, user?._id, channels.length]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel._id);
    } else {
      setMessages([]);
    }
  }, [selectedChannel?._id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#171819" }}>
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="flex pt-14" style={{ height: "calc(100vh - 56px)" }}>
          <Sidebar
            isMobileSidebarOpen={true}
            setIsMobileSidebarOpen={() => {}}
          />
          <div
            className="flex-1 flex items-center justify-center"
            style={{ marginLeft: 0 }}
          >
            <LoadingState type="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#171819" }}>
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="flex pt-14" style={{ height: "calc(100vh - 56px)" }}>
        {/* Sidebar - Fixed */}
        <Sidebar isMobileSidebarOpen={true} setIsMobileSidebarOpen={() => {}} />

        {/* Main Content - Full space, starts immediately after sidebar */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minHeight: "calc(100vh - 56px)", marginLeft: 55 }}
        >
          {/* Top Bar - Search and Menu - Fixed */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-[#0f1011] flex-shrink-0">
            {/* Search Bar - Left Side */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search channels, members, projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* 3-Dot Menu - Right Side */}
            <div className="relative">
              <motion.button
                onClick={() =>
                  setShowChannelMenu(
                    showChannelMenu === "main-menu" ? null : "main-menu"
                  )
                }
                className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="More Options"
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>

              {showChannelMenu === "main-menu" && (
                <motion.div
                  className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 min-w-[200px]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={() => {
                      setShowSearchModal(true);
                      setShowChannelMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    View All Channels
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Open settings
                      setShowChannelMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                  >
                    <Hash className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      setShowChannelMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Channel
                  </button>
                  <button
                    onClick={() => {
                      setShowDirectMessageModal(true);
                      setShowChannelMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Direct Messages
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <ChatLayout>
            {/* Channel Sidebar */}
            <ChannelSidebar>
              <div className="p-4 border-b border-gray-800/50">
                {/* Project Filter */}
                <div className="mb-4 relative">
                  <motion.button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-gray-300 hover:bg-gray-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4" />
                      <span>
                        {selectedProject
                          ? selectedProject.name
                          : "All Projects"}
                      </span>
                    </div>
                    <Hash className="w-4 h-4" />
                  </motion.button>

                  {showProjectDropdown && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <button
                        onClick={() => {
                          setSelectedProject(null);
                          setShowProjectDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        All Projects
                      </button>
                      {projects.map((project) => (
                        <button
                          key={project._id}
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                          <FolderKanban className="w-4 h-4" />
                          {project.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Channels</h2>
                  <motion.button
                    onClick={() => setShowCreateModal(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    title="Create Channel"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                <ChannelSearch
                  value={channelSearchQuery}
                  onChange={setChannelSearchQuery}
                  onClear={() => setChannelSearchQuery("")}
                />
              </div>
              <ChannelList
                channels={filteredChannels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleSelectChannel}
                unreadCounts={unreadCounts}
                searchQuery={channelSearchQuery}
                onDeleteChannel={handleDeleteChannel}
                showChannelMenu={showChannelMenu}
                setShowChannelMenu={setShowChannelMenu}
              />
            </ChannelSidebar>

            {/* Chat Area */}
            <ChatArea>
              {selectedChannel ? (
                <>
                  {/* Header - Fixed */}
                  <div className="p-4 border-b border-gray-800/50 bg-[#0f1011] flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Show DM user avatar in header if it's a DM */}
                        {selectedChannel.category === "direct" &&
                          selectedChannel.participants?.find(
                            (p) => p._id?.toString() !== user?._id?.toString()
                          ) && (
                            <Avatar
                              user={selectedChannel.participants.find(
                                (p) =>
                                  p._id?.toString() !== user?._id?.toString()
                              )}
                              size="md"
                              showStatus={true}
                              status={
                                selectedChannel.participants.find(
                                  (p) =>
                                    p._id?.toString() !== user?._id?.toString()
                                )?.status || "offline"
                              }
                            />
                          )}
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {selectedChannel.category === "direct" &&
                            selectedChannel.participants?.find(
                              (p) => p._id?.toString() !== user?._id?.toString()
                            )
                              ? selectedChannel.participants.find(
                                  (p) =>
                                    p._id?.toString() !== user?._id?.toString()
                                ).name
                              : selectedChannel.name}
                          </h3>
                          {selectedChannel.description && (
                            <p className="text-sm text-gray-400">
                              {selectedChannel.description}
                            </p>
                          )}
                        </div>
                        <motion.button
                          onClick={() =>
                            setShowChannelMenu(
                              showChannelMenu === selectedChannel._id
                                ? null
                                : selectedChannel._id
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </motion.button>
                        {showChannelMenu === selectedChannel._id && (
                          <motion.div
                            className="absolute top-16 left-64 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 p-1"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <button
                              onClick={() => {
                                handleDeleteChannel(selectedChannel._id);
                                setShowChannelMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Channel
                            </button>
                          </motion.div>
                        )}
                      </div>
                      <motion.button
                        onClick={() => setShowSearchModal(true)}
                        className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Search Messages"
                      >
                        <Search className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Messages - Scrollable */}
                  <div
                    className="flex-1 overflow-y-auto"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <style>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <MessageList
                      messages={messages}
                      currentUserId={user?._id}
                      loading={messagesLoading}
                      onEdit={handleStartEdit}
                      onDelete={handleDeleteMessage}
                      onReact={handleReact}
                      onPin={handlePin}
                      editingMessageId={editingMessage}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                    />
                  </div>

                  {/* Typing Indicator */}
                  <TypingIndicator users={[]} />

                  {/* Input - Fixed at bottom */}
                  <div className="border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
                    <MessageInput
                      onSend={handleSendMessage}
                      placeholder={`Message ${selectedChannel.name}...`}
                      disabled={sending}
                      channelId={selectedChannel._id}
                      channelMembers={selectedChannel.members || []}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select a channel"
                    description="Choose a channel from the sidebar to start chatting"
                  />
                </div>
              )}
            </ChatArea>
          </ChatLayout>
        </main>
      </div>

      {/* Modals */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newChannel) => {
          setChannels((prev) => [...prev, newChannel]);
          selectChannel(newChannel);
        }}
        selectedProject={selectedProject}
      />
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <DirectMessageModal
        isOpen={showDirectMessageModal}
        onClose={() => setShowDirectMessageModal(false)}
        onSuccess={(channel) => {
          setChannels((prev) => {
            const exists = prev.find((ch) => ch._id === channel._id);
            return exists ? prev : [...prev, channel];
          });
          selectChannel(channel);
        }}
      />
    </div>
  );
};

export default ChatChannelsPage;
