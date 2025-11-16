import React from "react";
import { motion } from "framer-motion";
import { formatMessageTime } from "../../../utils/dateFormatter";
import { formatFullMessage } from "../../../utils/messageFormatter";
import { Avatar } from "../shared/index";
import { Image, File, Download, ExternalLink } from "lucide-react";

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
}) => {
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

  return (
    <motion.div
      className={`flex gap-3 p-3 hover:bg-gray-900/30 rounded-lg transition-colors ${
        isOwn ? "flex-row-reverse" : ""
      }`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
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
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
          <span className="font-semibold text-white text-sm">
            {message.sender?.name || "Unknown"}
          </span>
          <span className="text-xs text-gray-500">{formattedTime}</span>
          {message.isEdited && (
            <span className="text-xs text-gray-500">(edited)</span>
          )}
        </div>
        
        {/* Message Content */}
        {formattedContent && (
          <div
            className={`text-gray-300 text-sm break-words leading-relaxed ${
              message.isDeleted ? "italic text-gray-500" : ""
            }`}
            style={{ 
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word"
            }}
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
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
                  className={`inline-block ${
                    isImage ? "max-w-md" : ""
                  }`}
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
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex gap-1 mt-2 flex-wrap ${isOwn ? "justify-end" : ""}`}>
            {message.reactions.map((reaction, idx) => (
              <motion.button
                key={idx}
                className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded-full text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReact && onReact(message._id, reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageItem;
