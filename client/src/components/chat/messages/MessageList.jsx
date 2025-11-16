import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageItem from "./MessageItem";
import { EmptyState, LoadingState } from "../shared/index";
import { formatDateSeparator, isSameDay } from "../../../utils/dateFormatter";

/**
 * Message List Component
 * Container for messages with auto-scroll
 */
const MessageList = ({
  messages = [],
  currentUserId,
  loading = false,
  onEdit,
  onDelete,
  onReact,
}) => {
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  if (loading && messages.length === 0) {
    return <LoadingState type="skeleton" count={5} />;
  }

  if (messages.length === 0) {
    return <EmptyState title="No messages yet" description="Start the conversation below" />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      <AnimatePresence>
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator =
            !prevMessage ||
            !isSameDay(message.createdAt, prevMessage.createdAt);
          const showAvatar =
            !prevMessage ||
            !prevMessage.sender ||
            !message.sender ||
            prevMessage.sender._id !== message.sender._id ||
            new Date(message.createdAt) - new Date(prevMessage.createdAt) >
              300000; // 5 minutes

          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && (
                <motion.div
                  className="flex items-center justify-center my-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </motion.div>
              )}
              <MessageItem
                message={message}
                isOwn={message.sender?._id?.toString() === currentUserId?.toString()}
                showAvatar={showAvatar}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
              />
            </React.Fragment>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

