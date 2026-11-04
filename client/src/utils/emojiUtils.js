/**
 * Emoji Utilities
 * Helper functions for emoji handling
 */

/**
 * Common emojis for reactions
 */
export const getCommonEmojis = () => {
  return [
    { emoji: "👍", name: "thumbs_up" },
    { emoji: "❤️", name: "heart" },
    { emoji: "😂", name: "laughing" },
    { emoji: "🎉", name: "party" },
    { emoji: "😮", name: "surprised" },
    { emoji: "👏", name: "clap" },
    { emoji: "🔥", name: "fire" },
    { emoji: "✨", name: "sparkles" },
    { emoji: "💯", name: "hundred" },
    { emoji: "🚀", name: "rocket" },
  ];
};

/**
 * Search emojis by name or keyword
 * @param {string} query - Search query
 * @returns {Array} - Filtered emojis
 */
export const searchEmojis = (query) => {
  if (!query) return getCommonEmojis();

  const common = getCommonEmojis();
  const lowerQuery = query.toLowerCase();

  return common.filter(
    (emoji) =>
      emoji.name.toLowerCase().includes(lowerQuery) ||
      emoji.emoji.includes(query)
  );
};

/**
 * Get emoji by name
 * @param {string} name - Emoji name
 * @returns {string|null} - Emoji unicode or null
 */
export const getEmojiUnicode = (name) => {
  const common = getCommonEmojis();
  const found = common.find((e) => e.name === name);
  return found ? found.emoji : null;
};

/**
 * Check if string is an emoji
 * @param {string} str - String to check
 * @returns {boolean} - True if emoji
 */
export const isEmoji = (str) => {
  const emojiRegex =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
  return emojiRegex.test(str);
};

