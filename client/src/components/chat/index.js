/**
 * Chat Components Index
 * Exports all chat-related components
 */

// Shared components
export { default as Avatar } from "./shared/Avatar";
export { default as EmptyState } from "./shared/EmptyState";
export { default as LoadingState } from "./shared/LoadingState";
export { default as ErrorState } from "./shared/ErrorState";

// Layout components
export { ChatLayout, ChannelSidebar, ChatArea } from "./layout";

// Channel components
export { ChannelList, ChannelItem, ChannelSearch } from "./channels";

// Message components
export { MessageList, MessageItem } from "./messages";

// Input components
export { MessageInput } from "./input";

// Indicator components
export { TypingIndicator } from "./indicators";
// export { default as UserStatus } from "./indicators/UserStatus";

// Modal components
export { CreateChannelModal, SearchModal, ReactionPicker } from "./modals";

