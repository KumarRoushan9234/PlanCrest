/**
 * Message Formatter Utilities
 * Format message content for display
 */

import DOMPurify from "dompurify";
import { parseMarkdown } from "./markdownParser.js";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Format message content based on format type
 * @param {string} content - Message content
 * @param {string} format - Content format (plain, markdown, html)
 * @returns {string} - Formatted content
 */
export const formatMessage = (content, format = "plain") => {
  if (!content) return "";

  switch (format) {
    case "markdown":
      return parseMarkdown(content);
    case "plain":
    default:
      // Escape HTML (raw HTML is never trusted) and preserve line breaks
      return escapeHtml(content)
        .replace(/\n\n/g, "<br><br>") // Double line breaks for paragraphs
        .replace(/\n/g, "<br>") // Single line breaks
        .replace(/ {2}/g, "&nbsp;&nbsp;"); // Preserve double spaces
  }
};

/**
 * Highlight @mentions in content
 * @param {string} content - Message content
 * @param {Array} mentions - Array of user objects
 * @returns {string} - Content with highlighted mentions
 */
export const highlightMentions = (content, mentions = []) => {
  if (!content) return "";
  if (!mentions || !mentions.length) return content;

  let formatted = content;

  mentions.forEach((user) => {
    if (user && (user.name || user.email)) {
      const username = user.name || user.email;
      const regex = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "gi");
      formatted = formatted.replace(
        regex,
        `<span class="mention bg-blue-500/20 text-blue-400 px-1 rounded">@${escapeHtml(username)}</span>`
      );
    }
  });

  return formatted;
};

/**
 * Highlight #task mentions in content
 * @param {string} content - Message content
 * @param {Array} tasks - Array of task objects
 * @returns {string} - Content with highlighted task mentions
 */
export const highlightTaskMentions = (content, tasks = []) => {
  if (!content) return "";
  if (!tasks || !tasks.length) return content;

  let formatted = content;

  tasks.forEach((task) => {
    if (task) {
      const taskKey = task.taskKey || task.key;
      if (taskKey) {
        const regex = new RegExp(`#${taskKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "gi");
        formatted = formatted.replace(
          regex,
          `<a href="/task/${task._id || task.id}" class="task-mention bg-purple-500/20 text-purple-400 px-1 rounded hover:underline">#${taskKey}</a>`
        );
      }
    }
  });

  return formatted;
};

/**
 * Format full message with all highlights
 * @param {string} content - Message content
 * @param {string} format - Content format
 * @param {Array} mentions - User mentions
 * @param {Array} taskMentions - Task mentions
 * @returns {string} - Fully formatted content
 */
export const formatFullMessage = (
  content,
  format = "plain",
  mentions = [],
  taskMentions = []
) => {
  let formatted = formatMessage(content, format);
  formatted = highlightMentions(formatted, mentions);
  formatted = highlightTaskMentions(formatted, taskMentions);
  // Final defence: the result is rendered with dangerouslySetInnerHTML
  return DOMPurify.sanitize(formatted, { ADD_ATTR: ["target"] });
};

