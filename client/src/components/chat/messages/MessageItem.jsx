import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatMessageTime } from "../../../utils/dateFormatter";
import { formatFullMessage } from "../../../utils/messageFormatter";
import { Avatar } from "../shared/index";
import {
  Image,
  File,
  Download,
  ExternalLink,
  Smile,
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
} from "lucide-react";
import ReactionPicker from "../modals/ReactionPicker";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Message Item Component
 * Single message display with attachments
 */
const MessageItem = ({
  message,
  isOwn = false,
  showAvatar = true,
  onEdit,
  onDelete,
  onReact,
  onPin,
  editingMessageId,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
}) => {
  const { user: currentUser } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reactionPosition, setReactionPosition] = useState({ x: 0, y: 0 });
  const isEditing = editingMessageId === message._id;

  const formattedTime = formatMessageTime(message.createdAt);
  const formattedContent = message.isDeleted
    ? "[Message deleted]"
    : formatFullMessage(
        message.content || "",
        message.contentFormat || "plain",
        message.mentions || [],
        message.taskMentions || []
      );

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) return Image;
    return File;
  };

  const handleReactionClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setReactionPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setShowReactionPicker(true);
  };

  const handleReactionSelect = (emoji) => {
    onReact?.(message._id, emoji);
    setShowReactionPicker(false);
  };

  const hasUserReacted = (emoji) => {
    const reaction = message.reactions?.find((r) => r.emoji === emoji);
    return reaction?.users?.some(
      (u) => u._id?.toString() === currentUser?._id?.toString()
    );
  };

  return (
    <motion.div
      className={`group relative flex gap-3 p-3 hover:bg-gray-900/30 rounded-lg transition-colors ${
        isOwn ? "flex-row-reverse" : ""
      }`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onMouseLeave={() => setShowMenu(false)}
    >
      {showAvatar && (
        <Avatar
          user={message.sender}
          size="md"
          showStatus={true}
          status={message.sender?.status || "offline"}
        />
      )}
      <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
        <div
          className={`flex items-center gap-2 mb-1 ${
            isOwn ? "justify-end" : ""
          }`}
        >
          {message.isPinned && <Pin className="w-3 h-3 text-blue-500" />}
          <span className="font-semibold text-white text-sm">
            {message.sender?.name || "Unknown"}
          </span>
          <span className="text-xs text-gray-500">{formattedTime}</span>
          {message.isEdited && (
            <span className="text-xs text-gray-500">(edited)</span>
          )}
          {/* Message Actions Menu */}
          {!message.isDeleted && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-800/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </motion.button>
              {showMenu && (
                <motion.div
                  className={`absolute ${
                    isOwn ? "right-0" : "left-0"
                  } top-full mt-1 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl z-50 min-w-[150px]`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          onEdit?.(message);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete?.(message._id);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      onPin?.(message._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center gap-2"
                  >
                    <Pin className="w-4 h-4" />
                    {message.isPinned ? "Unpin" : "Pin"}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Message Content - Edit Mode */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-sm text-white resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(message._id, editContent)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          formattedContent && (
            <div
              className={`text-gray-300 text-sm break-words leading-relaxed ${
                message.isDeleted ? "italic text-gray-500" : ""
              }`}
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                maxWidth: "65ch", // Limit to ~65 characters per line
                marginLeft: isOwn ? "auto" : "0",
                marginRight: isOwn ? "0" : "auto",
              }}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          )
        )}

        {/* Read Receipt */}
        {isOwn && message.readBy && message.readBy.length > 0 && (
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className="text-xs text-gray-500">Seen</span>
            <div className="flex -space-x-1">
              {message.readBy.slice(0, 3).map((reader, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full bg-blue-500 border border-gray-800"
                  title={reader.name || "Read"}
                />
              ))}
              {message.readBy.length > 3 && (
                <div className="w-4 h-4 rounded-full bg-gray-600 border border-gray-800 flex items-center justify-center text-xs text-white">
                  +{message.readBy.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
        {isOwn && (!message.readBy || message.readBy.length === 0) && (
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className="text-xs text-gray-500">Sent</span>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, idx) => {
              const Icon = getFileIcon(attachment.mimeType);
              const isImage = attachment.mimeType?.startsWith("image/");

              return (
                <motion.div
                  key={idx}
                  className={`inline-block ${isImage ? "max-w-md" : ""}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {isImage ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-gray-800/50 hover:border-gray-700 transition-colors"
                    >
                      <img
                        src={attachment.thumbnailUrl || attachment.url}
                        alt={attachment.filename || "Attachment"}
                        className="max-w-full h-auto cursor-pointer"
                      />
                    </a>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 truncate max-w-[200px]">
                        {attachment.filename || "File"}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reactions */}
        <div
          className={`flex items-center gap-2 mt-2 flex-wrap ${
            isOwn ? "justify-end" : ""
          }`}
        >
          {message.reactions && message.reactions.length > 0 && (
            <>
              {message.reactions.map((reaction, idx) => {
                const userReacted = hasUserReacted(reaction.emoji);
                return (
                  <motion.button
                    key={idx}
                    className={`px-2 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${
                      userReacted
                        ? "bg-blue-600/30 border border-blue-500/50 text-blue-300"
                        : "bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-800"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      onReact && onReact(message._id, reaction.emoji)
                    }
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </motion.button>
                );
              })}
            </>
          )}
          {!message.isDeleted && (
            <motion.button
              onClick={handleReactionClick}
              className="p-1.5 rounded-full hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
      {/* Reaction Picker */}
      <ReactionPicker
        isOpen={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelect={handleReactionSelect}
        position={reactionPosition}
      />
    </motion.div>
  );
};

export default MessageItem;
