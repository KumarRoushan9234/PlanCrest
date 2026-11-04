import { motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import MentionAutocomplete from "./MentionAutocomplete";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import chatService from "../../../services/chatService";
import { uploadService } from "../../../services";

/**
 * Message Input Component
 * Enhanced input field for sending messages with emoji and file support
 */
const MessageInput = ({
  onSend,
  placeholder = "Type your message...",
  disabled = false,
  channelId,
  channelMembers = [],
}) => {
  const { currentWorkspace } = useWorkspace();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(null);
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled && !uploading) {
      onSend(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    // Don't submit if mention dropdown is open
    if (mentionPosition !== null) {
      if (e.key === "Enter" || e.key === "Escape") {
        return; // Let MentionAutocomplete handle these
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Send typing indicator (throttled to once per 2 seconds)
  const sendTypingIndicator = () => {
    if (!channelId) return;

    const now = Date.now();
    // Only send if at least 2 seconds have passed since last typing indicator
    if (now - lastTypingSentRef.current < 2000) {
      return;
    }

    lastTypingSentRef.current = now;
    chatService.sendTypingIndicator(channelId).catch(console.error);
  };

  // Handle mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setMessage(value);

    // Send typing indicator when user types
    if (value.trim() && channelId) {
      sendTypingIndicator();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Check for @mention (match word characters, stop at whitespace)
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      // Calculate position for dropdown
      if (textareaRef.current && inputContainerRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const containerRect = inputContainerRef.current.getBoundingClientRect();
        setMentionPosition({
          left: 0,
          top: rect.top - containerRect.top,
        });
      }
    } else {
      setMentionQuery("");
      setMentionPosition(null);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user) => {
    if (!textareaRef.current || mentionPosition === null) return;

    const textBeforeCursor = message.substring(0, mentionPosition);
    const textAfterCursor = message.substring(
      mentionPosition + mentionQuery.length + 1
    );
    const newMessage = `${textBeforeCursor}@${user.name} ${textAfterCursor}`;

    setMessage(newMessage);
    setMentionQuery("");
    setMentionPosition(null);

    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = textBeforeCursor.length + `@${user.name} `.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    if (!currentWorkspace?._id) {
      toast.error("Select a workspace to upload attachments");
      return;
    }

    setUploading(true);
    try {
      const responses = await Promise.all(
        files.map((file) =>
          uploadService
            .uploadChatAttachment({
              file,
              workspaceId: currentWorkspace._id,
            })
            .then((res) => res?.data)
        )
      );
      const newAttachments = responses.filter(Boolean);
      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload files";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          {attachments.map((file, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="text-gray-300 truncate max-w-[150px]">
                {file.filename}
              </span>
              <button
                onClick={() =>
                  setAttachments(attachments.filter((_, i) => i !== index))
                }
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mb-2 text-xs text-blue-400 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Uploading attachments...
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div ref={inputContainerRef} className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none max-h-[120px] whitespace-pre-wrap break-words"
            style={{
              minHeight: "44px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowY: "auto",
            }}
          />
          <style>{`
            textarea::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="absolute right-2 bottom-2 flex gap-1">
            <EmojiPicker onSelect={handleEmojiSelect} position="top" />
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={uploading}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          />
          {/* Mention Autocomplete */}
          <MentionAutocomplete
            query={mentionQuery}
            position={mentionPosition}
            onSelect={handleMentionSelect}
            onClose={() => {
              setMentionQuery("");
              setMentionPosition(null);
            }}
            channelMembers={channelMembers}
          />
        </div>
        <motion.button
          type="submit"
          disabled={
            uploading ||
            (!message.trim() && attachments.length === 0) ||
            disabled
          }
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
};

export default MessageInput;
