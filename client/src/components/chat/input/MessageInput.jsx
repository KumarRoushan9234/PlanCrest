import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import axios from "axios";
import EmojiPicker from "./EmojiPicker";
import MentionAutocomplete from "./MentionAutocomplete";
import { useWorkspace } from "../../../contexts/WorkspaceContext";

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
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(null);
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSend(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
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

  // Handle mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setMessage(value);

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

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Handle image paste
          handleFileSelect({ target: { files: [file] } });
        }
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Upload files and add to attachments
    const uploadPromises = files.map(uploadToCloudinary);
    try {
      const results = await Promise.all(uploadPromises);
      const newAttachments = results.filter(Boolean);
      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "plancrest_chat"
      );
      formData.append("folder", "chat_attachments");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name"
        }/image/upload`,
        formData
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        thumbnailUrl: response.data.secure_url,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return null;
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
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words"
            style={{ minHeight: "44px" }}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <EmojiPicker onSelect={handleEmojiSelect} position="top" />
            <motion.button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept =
                  "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip";
                input.onchange = handleFileSelect;
                input.click();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>
          </div>
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
          disabled={(!message.trim() && attachments.length === 0) || disabled}
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
