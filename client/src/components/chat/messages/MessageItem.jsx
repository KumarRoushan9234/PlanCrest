import React from "react";
import { motion } from "framer-motion";
import { formatMessageTime } from "../../../utils/dateFormatter";
import { formatFullMessage } from "../../../utils/messageFormatter";
import { Avatar } from "../shared/index";

/**
 * Message Item Component
 * Single message display
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

  return (
    <motion.div
      className={`flex gap-3 p-3 hover:bg-gray-900/50 rounded-lg transition-colors ${
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
        <div
          className={`text-gray-300 text-sm whitespace-pre-wrap ${
            message.isDeleted ? "italic text-gray-500" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {message.reactions.map((reaction, idx) => (
              <motion.button
                key={idx}
                className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1"
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

