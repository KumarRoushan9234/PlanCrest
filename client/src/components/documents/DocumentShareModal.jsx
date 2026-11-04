import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Share2,
  Send,
  Mail,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import chatService from "../../services/chatService";

const DocumentShareModal = ({
  document,
  isOpen,
  onClose,
  workspaceId,
}) => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sharingToChat, setSharingToChat] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchChannels();
    }
  }, [isOpen, workspaceId]);

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const response = await chatService.getWorkspaceChannels(workspaceId);
      setChannels(response.data || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
      toast.error("Failed to load channels");
    } finally {
      setLoadingChannels(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(document.url);
    toast.success("Link copied");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Shared document");
    const body = encodeURIComponent(
      `Hi,\n\nHere's the document you might need:\n${document.url}\n\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareViaNavigator = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.originalName || "Document",
          text: "Check out this document",
          url: document.url,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      copyLink();
    }
  };

  const shareToChat = async () => {
    if (!selectedChannel) {
      toast.error("Select a channel");
      return;
    }
    setSharingToChat(true);
    try {
      await chatService.sendMessage(selectedChannel, {
        content: "",
        attachments: [
          {
            url: document.url,
            filename: document.originalName || document.filename,
            originalName: document.originalName || document.filename,
            mimeType: document.mimeType,
            size: document.size,
            bytes: document.bytes,
            publicId: document.publicId,
            resourceType: document.resourceType,
            folder: document.folder,
            thumbnailUrl: document.thumbnailUrl || document.url,
          },
        ],
      });
      toast.success("Shared to channel");
      onClose();
    } catch (error) {
      console.error("Share to chat failed:", error);
      toast.error("Failed to share to channel");
    } finally {
      setSharingToChat(false);
    }
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                  Share Document
                </p>
                <h3 className="text-lg font-semibold text-white">
                  {document.originalName || document.filename}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  External
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center gap-3 px-3 py-2 border border-gray-800 rounded-lg text-gray-200 hover:bg-gray-900 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy link
                  </button>
                  <button
                    onClick={shareViaEmail}
                    className="w-full flex items-center gap-3 px-3 py-2 border border-gray-800 rounded-lg text-gray-200 hover:bg-gray-900 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Share via email
                  </button>
                  <button
                    onClick={shareViaNavigator}
                    className="w-full flex items-center gap-3 px-3 py-2 border border-gray-800 rounded-lg text-gray-200 hover:bg-gray-900 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share using system dialog
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Share to Chat
                </h4>
                <div className="space-y-3">
                  <label className="text-xs text-gray-400">
                    Select channel
                  </label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose channel</option>
                    {channels.map((channel) => (
                      <option key={channel._id} value={channel._id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={sharingToChat || loadingChannels}
                    onClick={shareToChat}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sharingToChat ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Share to channel
                  </button>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    File will appear inside the selected chat channel.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentShareModal;

